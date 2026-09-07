#!/usr/bin/env python3
"""
train.py — fit, calibrate and evaluate the platform's two models, then export for the
browser.

    python3 ml/build_dataset.py        # must run first; needs data/raw/
    python3 ml/train.py

What gets fitted:

  exploitation   logistic gradient boosting on the KEV label, then isotonic calibration.
                 Ranking is what prioritisation needs; calibration is what expected-loss
                 arithmetic needs. Uncalibrated boosting scores are good at the first and
                 useless at the second, so both steps are mandatory.

  severity       three boosted models on log10(recorded USD loss): the conditional mean
                 plus the 10th and 90th percentiles, so the UI can present a loss range.
                 A single point estimate of a cyber loss is a fiction and reviewers
                 reasonably distrust it.

Evaluation is on the forward-in-time test anchor only. Every metric printed and exported
comes from data the model never saw and, more importantly, from a period after the one it
was fitted on. Nothing here is computed on training rows.

Outputs: public/model/risk-model.json, public/model/parity-fixture.json,
         data/processed/metrics.json
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
PROCESSED = REPO_ROOT / "data" / "processed"
MODEL_DIR = REPO_ROOT / "public" / "model"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gbm import GradientBooster, parity_ok, sigmoid  # noqa: E402

# --------------------------------------------------------------------------- #
# metrics
# --------------------------------------------------------------------------- #
def roc_auc(y: np.ndarray, score: np.ndarray) -> float:
    """Rank-based AUC with tie averaging, so a constant predictor scores exactly 0.5."""
    order = np.argsort(score, kind="mergesort")
    ranks = np.empty(y.size, dtype=np.float64)
    ranks[order] = np.arange(1, y.size + 1, dtype=np.float64)
    sorted_scores = score[order]
    start = 0
    while start < y.size:
        stop = start
        while stop + 1 < y.size and sorted_scores[stop + 1] == sorted_scores[start]:
            stop += 1
        if stop > start:
            ranks[order[start:stop + 1]] = (start + stop + 2) / 2.0
        start = stop + 1
    pos = float(y.sum())
    neg = float(y.size - pos)
    if pos == 0 or neg == 0:
        return float("nan")
    return float((ranks[y == 1].sum() - pos * (pos + 1) / 2.0) / (pos * neg))


def average_precision(y: np.ndarray, score: np.ndarray) -> float:
    """Area under precision-recall, summed over distinct score thresholds.

    The metric that matters when the positive class is a fraction of a percent, because AUC
    flatters rare-event models. Thresholds are grouped by distinct score rather than by row:
    one-hot features make exact ties common, and a row-wise sum would let the arbitrary
    input order of tied CVEs move the number. Grouping also makes a constant predictor score
    exactly the base rate, which is the property that lets `ap_lift_over_base` mean anything.
    """
    total_pos = float(y.sum())
    if total_pos == 0:
        return float("nan")
    order = np.argsort(-score, kind="mergesort")
    y_sorted, s_sorted = y[order], score[order]
    ends = np.append(np.flatnonzero(np.diff(s_sorted)), y.size - 1)
    tp = np.cumsum(y_sorted)[ends]
    precision = tp / (ends + 1)
    recall = tp / total_pos
    return float(np.sum(np.diff(np.append(0.0, recall)) * precision))



def brier(y: np.ndarray, p: np.ndarray) -> float:
    return float(np.mean((p - y) ** 2))


def log_loss(y: np.ndarray, p: np.ndarray) -> float:
    q = np.clip(p, 1e-12, 1 - 1e-12)
    return float(-np.mean(y * np.log(q) + (1 - y) * np.log(1 - q)))


def lift_at_k(y: np.ndarray, score: np.ndarray, k_pct: float) -> dict:
    """How many of the eventual exploitations sit in the top k% of the ranking. This is the
    number a security team actually feels, since they patch a queue, not a probability."""
    n = max(1, int(round(y.size * k_pct / 100.0)))
    top = np.argsort(-score, kind="mergesort")[:n]
    captured = float(y[top].sum())
    total = float(y.sum())
    base = total / y.size if y.size else 0.0
    precision = captured / n
    return {
        "k_pct": k_pct, "n_reviewed": n,
        "captured": int(captured),
        "recall": round(captured / total, 4) if total else None,
        "precision": round(precision, 6),
        "lift_vs_random": round(precision / base, 2) if base else None,
    }


def calibration_curve(y: np.ndarray, p: np.ndarray, n_bins: int = 10) -> list[dict]:
    """Predicted vs observed rate in equal-count bins. Equal-count rather than equal-width,
    because with a rare label almost every equal-width bin would be empty above 0.2."""
    order = np.argsort(p, kind="mergesort")
    rows = []
    for chunk in np.array_split(order, min(n_bins, max(1, y.size))):
        if chunk.size == 0:
            continue
        rows.append({
            "n": int(chunk.size),
            "predicted": round(float(p[chunk].mean()), 6),
            "observed": round(float(y[chunk].mean()), 6),
        })
    return rows


def expected_calibration_error(curve: list[dict]) -> float:
    """Sample-weighted mean gap between predicted and observed rate across the bins."""
    total = sum(b["n"] for b in curve)
    if not total:
        return float("nan")
    return float(sum(b["n"] * abs(b["predicted"] - b["observed"]) for b in curve) / total)


# --------------------------------------------------------------------------- #
# calibration
# --------------------------------------------------------------------------- #
class IsotonicCalibrator:
    """
    Monotone probability calibration by pool-adjacent-violators.

    Boosting optimises ranking, not probability. A ranking score is fine for ordering a
    patch queue and wrong the moment it is multiplied by an asset value to produce an
    expected loss in rupees — which is exactly what this platform does with it. Isotonic
    regression is the right corrector because it assumes only that a higher score means a
    higher probability, the single property the ranking metrics already establish. Platt
    scaling would impose a sigmoid shape the KEV label does not actually follow.

    Fitted on a slice withheld from both tree fitting and early stopping, so the map is
    not learned from scores the trees have already memorised.
    """

    __slots__ = ("x", "y", "n_fit")

    def __init__(self) -> None:
        self.x = np.array([0.0, 1.0])
        self.y = np.array([0.0, 1.0])
        self.n_fit = 0

    def fit(self, score: np.ndarray, target: np.ndarray) -> "IsotonicCalibrator":
        score = np.asarray(score, dtype=np.float64).ravel()
        target = np.asarray(target, dtype=np.float64).ravel()
        if score.size != target.size:
            raise ValueError("score and target must be the same length")
        if score.size < 2:
            raise ValueError("isotonic calibration needs at least two points")

        order = np.argsort(score, kind="mergesort")
        s, t = score[order], target[order]

        # Collapse exact ties before pooling: two findings the model cannot tell apart must
        # not receive different probabilities.
        uniq, first = np.unique(s, return_index=True)
        sums = np.add.reduceat(t, first)
        counts = np.diff(np.append(first, s.size)).astype(np.float64)

        # Pool adjacent violators. Each stack entry is (weighted sum, weight, unique-score
        # span). The pops are written out longhand on purpose: `v[-2] += v.pop()` resolves
        # the store index *after* the pop and silently writes to the wrong slot.
        v_sum: list[float] = []
        v_w: list[float] = []
        v_span: list[int] = []
        for total, weight in zip(sums, counts):
            v_sum.append(float(total))
            v_w.append(float(weight))
            v_span.append(1)
            while len(v_sum) > 1 and v_sum[-2] / v_w[-2] > v_sum[-1] / v_w[-1]:
                s_last, w_last, n_last = v_sum.pop(), v_w.pop(), v_span.pop()
                v_sum[-1] += s_last
                v_w[-1] += w_last
                v_span[-1] += n_last

        # Expand the block means back onto the unique scores, then drop interior points of
        # each flat run. Keeping only the first and last point of a run reproduces the
        # piecewise-linear interpolant exactly while keeping the exported map small.
        block_mean = np.array([sm / w for sm, w in zip(v_sum, v_w)], dtype=np.float64)
        block_len = np.array(v_span, dtype=np.int64)
        fitted = np.repeat(block_mean, block_len)

        keep = np.ones(uniq.size, dtype=bool)
        if uniq.size > 2:
            interior = np.arange(1, uniq.size - 1)
            flat = (fitted[interior - 1] == fitted[interior]) & \
                   (fitted[interior] == fitted[interior + 1])
            keep[interior[flat]] = False
        self.x = uniq[keep]
        self.y = np.clip(fitted[keep], 0.0, 1.0)
        self.n_fit = int(score.size)
        return self

    def transform(self, score: np.ndarray) -> np.ndarray:
        """Linear interpolation between knots, clipped at both ends.

        `np.interp` clamps outside the fitted range, which is the behaviour we want: a test
        score below anything seen during calibration gets the lowest calibrated probability
        rather than an extrapolated negative one. The TypeScript side reimplements exactly
        this — a binary search plus one lerp — so the two agree to floating point.
        """
        return np.asarray(np.interp(np.asarray(score, dtype=np.float64), self.x, self.y))

    def to_dict(self) -> dict:
        return {
            "method": "isotonic",
            "n_fit": self.n_fit,
            "n_knots": int(self.x.size),
            "x": [float(v) for v in self.x],
            "y": [float(v) for v in self.y],
        }


def _check_calibrator() -> None:
    """Guard the PAV implementation. Runs on every training run: a silently wrong
    calibrator would corrupt every rupee figure downstream while leaving AUC untouched."""
    rng = np.random.default_rng(4)
    s = rng.uniform(size=4000)
    y = (rng.uniform(size=4000) < s ** 2).astype(np.float64)
    cal = IsotonicCalibrator().fit(s, y)
    out = cal.transform(s)
    if np.any(np.diff(cal.y) < -1e-12):
        raise AssertionError("isotonic fit is not monotone")
    if out.min() < 0.0 or out.max() > 1.0:
        raise AssertionError("calibrated probability left [0, 1]")
    if abs(out.mean() - y.mean()) > 0.02:
        raise AssertionError(f"calibrated mean {out.mean():.4f} vs observed {y.mean():.4f}")
    # A perfectly ordered but badly scaled score must come back well calibrated.
    if expected_calibration_error(calibration_curve(y, out, 10)) > 0.03:
        raise AssertionError("calibration error too high on the self-check generator")


def select_calibrator(p_cal: np.ndarray, y_cal: np.ndarray,
                      p_sel: np.ndarray, y_sel: np.ndarray) -> tuple[IsotonicCalibrator, dict]:
    """Fit the isotonic map, then decide on a third slice whether to use it at all.

    Isotonic regression on a slice this size adds variance, and on a model that is already
    close to calibrated it can cost more than it recovers. The decision is made on the
    early-stopping slice, which never touched the calibrator; deciding on the test anchor
    would be choosing a model by its own report card. When the map loses, an identity
    calibrator is exported so the browser still applies exactly what was evaluated here.
    """
    iso = IsotonicCalibrator().fit(p_cal, y_cal)
    brier_identity = brier(y_sel, p_sel)
    brier_isotonic = brier(y_sel, iso.transform(p_sel))
    applied = bool(brier_isotonic <= brier_identity)
    info = {
        "method": "isotonic" if applied else "identity",
        "applied": applied,
        "n_calibration_rows": int(p_cal.size),
        "selection_slice": "early-stopping slice inside the training anchor",
        "brier_identity_selection": round(float(brier_identity), 6),
        "brier_isotonic_selection": round(float(brier_isotonic), 6),
    }
    return (iso if applied else IsotonicCalibrator()), info


# --------------------------------------------------------------------------- #
# inputs
# --------------------------------------------------------------------------- #
class MissingDataset(RuntimeError):
    """Raised when the processed matrices are absent. Never caught to substitute anything."""


_REMEDIATION = """
data/processed/ does not contain the real modelling matrices, so there is nothing
legitimate to train on.

  1. python3 ml/fetch_real_data.py --all     (needs egress to cisa.gov, first.org,
                                              services.nvd.nist.gov, github.com)
  2. python3 ml/build_dataset.py

If this machine cannot reach those hosts, run both steps somewhere that can and copy
data/raw/ across. This script will not fabricate a substitute: a model fitted on invented
data would still produce confident-looking rupee figures, and nothing downstream would
reveal that they mean nothing.
""".strip()


def _rel(path: Path) -> str:
    """Path for humans. Falls back to the absolute form when the path sits outside the repo,
    so a refusal message never turns into a ValueError from relative_to()."""
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def _load(name: str) -> dict:
    path = PROCESSED / name
    if not path.exists():
        raise MissingDataset(f"missing {_rel(path)}\n\n{_REMEDIATION}")
    with np.load(path, allow_pickle=False) as data:
        return {k: data[k] for k in data.files}


def load_inputs() -> tuple[dict, dict, dict]:
    card_path = PROCESSED / "dataset_card.json"
    if not card_path.exists():
        raise MissingDataset(f"missing {_rel(card_path)}\n\n{_REMEDIATION}")

    card = json.loads(card_path.read_text())
    if not card.get("data_is_real"):
        raise MissingDataset(
            "dataset_card.json does not assert data_is_real, so whatever produced it was "
            f"not the real-data pipeline. Refusing to train and publish metrics from it.\n\n"
            f"{_REMEDIATION}")

    return _load("exploitation.npz"), _load("severity.npz"), card


def three_way_split(y: np.ndarray, seed: int, val_frac: float = 0.15,
                    cal_frac: float = 0.20) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Split the *training anchor* into fit / early-stopping / calibration slices.

    All three sit strictly before the test anchor, so this is a random split inside one
    time period rather than a shortcut around the forward-in-time design. The calibration
    slice must be disjoint from both others: fitting the isotonic map on rows the trees
    have already seen produces a map that looks excellent in-sample and understates risk
    on everything new.

    Stratified when the label is binary. With a base rate around a percent, an unstratified
    20% calibration slice can land with almost no positives, and an isotonic map fitted on
    almost no positives is worse than no calibration at all.
    """
    rng = np.random.default_rng(seed)
    classes = np.unique(y)
    groups = [np.flatnonzero(y == c) for c in classes] if classes.size == 2 \
        else [np.arange(y.size)]
    fit_i, val_i, cal_i = [], [], []
    for group in groups:
        perm = group[rng.permutation(group.size)]
        n_val = int(round(perm.size * val_frac))
        n_cal = int(round(perm.size * cal_frac))
        val_i.append(perm[:n_val])
        cal_i.append(perm[n_val:n_val + n_cal])
        fit_i.append(perm[n_val + n_cal:])
    out = tuple(rng.permutation(np.concatenate(part)) for part in (fit_i, val_i, cal_i))
    return out  # type: ignore[return-value]



# --------------------------------------------------------------------------- #
# stage 1 — exploitation probability
# --------------------------------------------------------------------------- #
def train_exploitation(data: dict, card: dict, args) -> dict:
    x_tr, y_tr = data["x_train"].astype(np.float64), data["y_train"].astype(np.float64)
    x_te, y_te = data["x_test"].astype(np.float64), data["y_test"].astype(np.float64)
    names = list(card["exploitation"]["feature_names"])
    if x_tr.shape[1] != len(names):
        raise ValueError(f"feature count {x_tr.shape[1]} != {len(names)} names in the card")
    if y_tr.sum() < 25 or y_te.sum() < 10:
        raise ValueError(
            f"too few positives to fit or evaluate honestly "
            f"(train={int(y_tr.sum())}, test={int(y_te.sum())}). Widen the horizon in "
            f"build_dataset.py rather than reporting metrics from a handful of events.")

    fit_i, val_i, cal_i = three_way_split(y_tr, args.seed)
    print(f"  train {x_tr.shape[0]:>7} rows  ({int(y_tr.sum())} positive, "
          f"{y_tr.mean() * 100:.3f}%)")
    print(f"  split fit={fit_i.size} early-stop={val_i.size} calibration={cal_i.size}")

    model = GradientBooster(
        objective="logistic", n_estimators=args.rounds, learning_rate=args.lr,
        max_depth=args.depth, min_samples_leaf=40, l2_reg=1.0, subsample=0.8,
        colsample=0.8, max_bins=64, random_state=args.seed)
    model.fit(x_tr[fit_i], y_tr[fit_i], eval_set=(x_tr[val_i], y_tr[val_i]),
              early_stopping_rounds=args.patience, verbose_every=args.verbose_every)
    print(f"  {model.n_trees_used} of {len(model.trees)} trees kept by early stopping")

    cal, cal_info = select_calibrator(
        model.predict_proba(x_tr[cal_i]), y_tr[cal_i],
        model.predict_proba(x_tr[val_i]), y_tr[val_i])
    if cal_info["applied"]:
        print(f"  isotonic map fitted on {cal.n_fit} held-out rows -> {cal.x.size} knots")
    else:
        print(f"  calibration DECLINED: Brier "
              f"{cal_info['brier_identity_selection']:.6f} -> "
              f"{cal_info['brier_isotonic_selection']:.6f} on the selection slice; the "
              f"uncalibrated score is already the better forecast")

    raw_te = model.predict_proba(x_te)
    p_te = cal.transform(raw_te)
    curve_raw = calibration_curve(y_te, raw_te, args.bins)
    curve_cal = calibration_curve(y_te, p_te, args.bins)

    metrics = {
        "n_train": int(x_tr.shape[0]), "n_test": int(x_te.shape[0]),
        "positives_train": int(y_tr.sum()), "positives_test": int(y_te.sum()),
        "base_rate_test": round(float(y_te.mean()), 6),
        "trees_used": int(model.n_trees_used),
        "roc_auc": round(roc_auc(y_te, raw_te), 4),
        "average_precision": round(average_precision(y_te, raw_te), 4),
        "ap_lift_over_base": round(average_precision(y_te, raw_te) / float(y_te.mean()), 2)
        if y_te.mean() else None,
        "brier_uncalibrated": round(brier(y_te, raw_te), 6),
        "brier_calibrated": round(brier(y_te, p_te), 6),
        "log_loss_calibrated": round(log_loss(y_te, p_te), 6),
        "ece_uncalibrated": round(expected_calibration_error(curve_raw), 5),
        "ece_calibrated": round(expected_calibration_error(curve_cal), 5),
        "mean_predicted": round(float(p_te.mean()), 6),
        "calibration": cal_info,
        "calibration_curve": curve_cal,
        "calibration_curve_uncalibrated": curve_raw,
        "top_k": [lift_at_k(y_te, raw_te, k) for k in (1.0, 5.0, 10.0, 20.0)],
        "evaluated_on": "forward-in-time test anchor "
                        f"{card['exploitation']['test_anchor']}, horizon "
                        f"{card['exploitation']['horizon_days']}d",
    }
    importance = model.feature_importance(len(names))
    top = np.argsort(-importance)[:15]
    metrics["top_features"] = [{"name": names[i], "share": round(float(importance[i]), 4)}
                               for i in top if importance[i] > 0]
    return {"model": model, "calibrator": cal, "metrics": metrics,
            "feature_names": names, "x_sample": x_te[:64]}


# --------------------------------------------------------------------------- #
# stage 2 — loss severity, as an interval
# --------------------------------------------------------------------------- #
def train_severity(data: dict, card: dict, args) -> dict:
    x_tr, y_tr = data["x_train"].astype(np.float64), data["y_train"].astype(np.float64)
    x_te, y_te = data["x_test"].astype(np.float64), data["y_test"].astype(np.float64)
    names = list(card["severity"]["feature_names"])
    if x_tr.shape[1] != len(names):
        raise ValueError(f"feature count {x_tr.shape[1]} != {len(names)} names in the card")
    if x_tr.shape[0] < 200 or x_te.shape[0] < 50:
        raise ValueError(
            f"too few incidents with a recorded loss to fit or evaluate "
            f"(train={x_tr.shape[0]}, test={x_te.shape[0]}). VCDB records an amount for a "
            f"minority of incidents; do not report severity metrics from fewer than this.")

    fit_i, val_i, _ = three_way_split(y_tr, args.seed, val_frac=0.20, cal_frac=0.0)
    print(f"  train {x_tr.shape[0]:>7} incidents with a recorded USD amount "
          f"(test cut year {card['severity']['cut_year']})")

    def _fit(objective: str, alpha: float) -> GradientBooster:
        booster = GradientBooster(
            objective=objective, alpha=alpha, n_estimators=args.rounds,
            learning_rate=args.lr, max_depth=min(args.depth, 4), min_samples_leaf=30,
            l2_reg=1.0, subsample=0.85, colsample=0.85, random_state=args.seed)
        booster.fit(x_tr[fit_i], y_tr[fit_i], eval_set=(x_tr[val_i], y_tr[val_i]),
                    early_stopping_rounds=args.patience)
        return booster

    mean_model = _fit("l2", 0.5)
    lo_model = _fit("quantile", 0.10)
    hi_model = _fit("quantile", 0.90)
    print(f"  trees kept: mean={mean_model.n_trees_used} p10={lo_model.n_trees_used} "
          f"p90={hi_model.n_trees_used}")

    pred = mean_model.predict_raw(x_te)
    lo, hi = lo_model.predict_raw(x_te), hi_model.predict_raw(x_te)
    lo, hi = np.minimum(lo, hi), np.maximum(lo, hi)   # order, never silently crossed

    err = np.abs(pred - y_te)
    naive = float(np.median(y_tr))
    naive_err = np.abs(naive - y_te)
    coverage = float(np.mean((y_te >= lo) & (y_te <= hi)))

    metrics = {
        "n_train": int(x_tr.shape[0]), "n_test": int(x_te.shape[0]),
        "cut_year": card["severity"]["cut_year"],
        "target": "log10(recorded USD loss)",
        "mae_log10": round(float(err.mean()), 4),
        "rmse_log10": round(float(np.sqrt(np.mean((pred - y_te) ** 2))), 4),
        "mae_log10_naive_median": round(float(naive_err.mean()), 4),
        # A log10 error of 0.5 means the estimate is out by a factor of ~3.2. Reviewers read
        # a factor far more easily than a log, so both are reported.
        "median_factor_error": round(float(10 ** np.median(err)), 2),
        "p90_factor_error": round(float(10 ** np.quantile(err, 0.90)), 2),
        "interval_coverage_p10_p90": round(coverage, 4),
        "median_interval_width_factor": round(float(10 ** np.median(hi - lo)), 1),
        "interval_ordered_pct": round(float(np.mean(lo <= hi) * 100), 2),
        "loss_quantiles_usd": card["severity"]["loss_quantiles_usd"],
        "evaluated_on": f"incidents from {card['severity']['cut_year']} onward; fitted only "
                        f"on earlier ones",
    }
    importance = mean_model.feature_importance(len(names))
    top = np.argsort(-importance)[:15]
    metrics["top_features"] = [{"name": names[i], "share": round(float(importance[i]), 4)}
                               for i in top if importance[i] > 0]
    return {"mean": mean_model, "p10": lo_model, "p90": hi_model, "metrics": metrics,
            "feature_names": names, "x_sample": x_te[:64]}


# --------------------------------------------------------------------------- #
# export
# --------------------------------------------------------------------------- #
def _parity_or_die(label: str, booster: GradientBooster, exported: dict,
                   x: np.ndarray) -> float:
    """Serialise, re-parse through JSON, and require bit-exact agreement.

    The round trip through `json.dumps`/`json.loads` is the point: it is the same transit
    the browser bundle performs, so anything lost to text encoding shows up here rather
    than as quietly different rupee figures in the UI.
    """
    reparsed = json.loads(json.dumps(exported))
    ok, delta = parity_ok(booster, reparsed, x, tol=0.0)
    if not ok:
        raise AssertionError(f"{label}: export disagrees with the fitted model by {delta:.3e}")
    return delta


def export(exploit: dict, severity: dict, card: dict, args) -> dict:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    ex_gbm = exploit["model"].to_dict(exploit["feature_names"])
    sev = {k: severity[k].to_dict(severity["feature_names"]) for k in ("mean", "p10", "p90")}

    deltas = {
        "exploitation": _parity_or_die("exploitation", exploit["model"], ex_gbm,
                                       exploit["x_sample"]),
        **{f"severity_{k}": _parity_or_die(f"severity {k}", severity[k], sev[k],
                                           severity["x_sample"]) for k in sev},
    }

    model_json = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "generator": "ml/train.py",
        # Copied from the dataset card, never asserted here. load_inputs() refuses a card
        # that does not claim real data, so the real path can only ever write True — and a
        # fixture-driven run writes False, which every consumer can see.
        "data_is_real": bool(card.get("data_is_real")),
        "data_provenance": {
            "dataset_card_generated_at": card.get("generated_at"),
            "sources": card.get("sources"),
            "exploitation_question": card["exploitation"]["question"],
            "severity_question": card["severity"]["question"],
            "train_anchor": card["exploitation"]["train_anchor"],
            "test_anchor": card["exploitation"]["test_anchor"],
        },
        "exploitation": {
            "feature_names": exploit["feature_names"],
            "gbm": ex_gbm,
            "calibration": exploit["calibrator"].to_dict(),
            "metrics": exploit["metrics"],
        },
        "severity": {
            "feature_names": severity["feature_names"],
            "unit": "log10_usd",
            "mean": sev["mean"], "p10": sev["p10"], "p90": sev["p90"],
            "metrics": severity["metrics"],
        },
        "parity_max_abs_delta": deltas,
    }

    model_path = MODEL_DIR / "risk-model.json"
    model_path.write_text(json.dumps(model_json, separators=(",", ":")))

    # Fixture for the TypeScript parity test: rows the browser must reproduce exactly.
    n = min(args.fixture_rows, exploit["x_sample"].shape[0])
    ex_x = exploit["x_sample"][:n]
    sv_x = severity["x_sample"][:min(args.fixture_rows, severity["x_sample"].shape[0])]
    ex_raw = exploit["model"].predict_raw(ex_x)
    fixture = {
        "note": "Generated by ml/train.py from held-out test rows. The browser inference "
                "code must reproduce every expected_* value to within 1e-9.",
        "exploitation": {
            "feature_names": exploit["feature_names"],
            "rows": [[float(v) for v in row] for row in ex_x],
            "expected_raw": [float(v) for v in ex_raw],
            "expected_probability": [float(v) for v in sigmoid(ex_raw)],
            "expected_calibrated": [float(v) for v in
                                    exploit["calibrator"].transform(sigmoid(ex_raw))],
        },
        "severity": {
            "feature_names": severity["feature_names"],
            "rows": [[float(v) for v in row] for row in sv_x],
            "expected_log10_mean": [float(v) for v in severity["mean"].predict_raw(sv_x)],
            "expected_log10_p10": [float(v) for v in severity["p10"].predict_raw(sv_x)],
            "expected_log10_p90": [float(v) for v in severity["p90"].predict_raw(sv_x)],
        },
    }
    fixture_path = MODEL_DIR / "parity-fixture.json"
    fixture_path.write_text(json.dumps(fixture, separators=(",", ":")))

    metrics_json = {
        "generated_at": model_json["generated_at"],
        "data_is_real": bool(card.get("data_is_real")),
        "provenance": model_json["data_provenance"],
        "exploitation": exploit["metrics"],
        "severity": severity["metrics"],
        "parity_max_abs_delta": deltas,
        "note": "All figures are computed on the forward-in-time test split only.",
    }
    (PROCESSED / "metrics.json").write_text(json.dumps(metrics_json, indent=2))

    return {"model_path": model_path, "fixture_path": fixture_path,
            "model_bytes": model_path.stat().st_size,
            "fixture_bytes": fixture_path.stat().st_size, "deltas": deltas}


# --------------------------------------------------------------------------- #
# entry point
# --------------------------------------------------------------------------- #
def parse_args(argv: list[str] | None = None):
    ap = argparse.ArgumentParser(
        description="Fit, calibrate, evaluate and export the CyberRisk Optimizer models.")
    ap.add_argument("--rounds", type=int, default=400, help="maximum boosting rounds")
    ap.add_argument("--lr", type=float, default=0.05)
    ap.add_argument("--depth", type=int, default=5)
    ap.add_argument("--patience", type=int, default=40,
                    help="early-stopping rounds without validation improvement")
    ap.add_argument("--seed", type=int, default=20260901)
    ap.add_argument("--bins", type=int, default=10, help="calibration curve bins")
    ap.add_argument("--verbose-every", type=int, default=50)
    ap.add_argument("--fixture-rows", type=int, default=32)
    return ap.parse_args(argv)


def _report_exploitation(m: dict) -> None:
    print("\nEXPLOITATION — held-out forward-in-time test anchor")
    print(f"  {m['evaluated_on']}")
    print(f"  rows {m['n_test']}  positives {m['positives_test']} "
          f"(base rate {m['base_rate_test'] * 100:.3f}%)")
    print(f"  ROC-AUC {m['roc_auc']:.4f}   PR-AUC {m['average_precision']:.4f} "
          f"({m['ap_lift_over_base']}x the base rate)")
    print(f"  Brier {m['brier_uncalibrated']:.6f} -> {m['brier_calibrated']:.6f} "
          f"after calibration;  ECE {m['ece_uncalibrated']:.5f} -> "
          f"{m['ece_calibrated']:.5f}")
    print(f"  calibration map: {m['calibration']['method']} "
          f"(chosen on {m['calibration']['n_calibration_rows']} rows held out from fitting "
          f"and early stopping)")
    print(f"  mean predicted {m['mean_predicted'] * 100:.3f}% against an observed "
          f"{m['base_rate_test'] * 100:.3f}%")
    for row in m["top_k"]:
        print(f"  top {row['k_pct']:>4}% ({row['n_reviewed']:>6} reviewed): "
              f"catches {row['captured']:>4} of {m['positives_test']} "
              f"(recall {row['recall']}, {row['lift_vs_random']}x random)")
    print("  most used features: " + ", ".join(f["name"] for f in m["top_features"][:6]))


def _report_severity(m: dict) -> None:
    print("\nSEVERITY — incidents from the held-out cut year onward")
    print(f"  rows {m['n_test']} (fitted on {m['n_train']} earlier incidents)")
    print(f"  MAE {m['mae_log10']:.4f} log10 USD vs {m['mae_log10_naive_median']:.4f} for "
          f"the training median")
    print(f"  typical estimate is out by a factor of {m['median_factor_error']} "
          f"(p90 {m['p90_factor_error']})")
    print(f"  p10-p90 interval covers {m['interval_coverage_p10_p90'] * 100:.1f}% of "
          f"held-out losses, median width {m['median_interval_width_factor']}x")
    print("  most used features: " + ", ".join(f["name"] for f in m["top_features"][:6]))


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    _check_calibrator()

    try:
        ex_data, sv_data, card = load_inputs()
    except MissingDataset as exc:
        print("REFUSING TO TRAIN — no real data present.\n", file=sys.stderr)
        print(str(exc), file=sys.stderr)
        return 2

    print(f"real data loaded; dataset card generated {card.get('generated_at')}")
    print("\nfitting exploitation model")
    exploit = train_exploitation(ex_data, card, args)
    print("\nfitting severity models")
    severity = train_severity(sv_data, card, args)

    _report_exploitation(exploit["metrics"])
    _report_severity(severity["metrics"])

    out = export(exploit, severity, card, args)
    print("\nEXPORT")
    print(f"  {_rel(out['model_path'])}  ({out['model_bytes']:,} bytes)")
    print(f"  {_rel(out['fixture_path'])}  ({out['fixture_bytes']:,} bytes)")
    print("  data/processed/metrics.json")
    worst = max(out["deltas"].values())
    print(f"  serialisation parity: max |delta| across all four models = {worst:.2e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
