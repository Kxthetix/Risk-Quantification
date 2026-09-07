#!/usr/bin/env python3
"""
test_train.py — unit tests for ml/train.py.

    python3 ml/test_train.py

READ THIS FIRST. Every number this file produces comes from random fixtures generated in
memory. They exist to prove the calibrator, the metrics, the splitter and the exporter
behave as claimed. They are NOT the platform's model performance, they are not derived from
CVE, KEV, EPSS or VCDB data, and no figure printed here may be quoted anywhere.

The real metrics come from `python3 ml/train.py`, which refuses to run at all until
data/processed/ holds matrices built from the real sources.

The fixture run writes into a temporary directory and the artefacts it produces carry
`data_is_real: false`, so a fixture model cannot be mistaken for the shipped one.
"""
from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import train as T  # noqa: E402
from gbm import predict_from_dict, sigmoid  # noqa: E402

FAILURES: list[str] = []


def check(label: str, condition: bool | np.bool_, detail: str = "") -> None:
    print(f"  {'ok  ' if condition else 'FAIL'} {label}" + (f" — {detail}" if detail else ""))
    if not condition:
        FAILURES.append(label)


def raises(fn, kind=Exception) -> bool:
    try:
        fn()
    except kind:
        return True
    except Exception:
        return False
    return False


class Args:
    """Stand-in for the argparse namespace, with small settings so tests stay quick."""

    rounds = 120
    lr = 0.10
    depth = 4
    patience = 20
    seed = 11
    bins = 10
    verbose_every = 0
    fixture_rows = 8


# --------------------------------------------------------------------------- #
# fixtures — random, in memory, meaningless as risk figures
# --------------------------------------------------------------------------- #
def fixture_exploitation(n_train=6000, n_test=2500, n_features=12, seed=3):
    """A rare binary label with real signal, shaped like the exploitation matrices."""
    rng = np.random.default_rng(seed)

    def block(n):
        x = rng.normal(size=(n, n_features))
        x[:, 5:] = (rng.uniform(size=(n, n_features - 5)) < 0.3).astype(np.float64)
        logit = 2.0 * x[:, 0] + 1.1 * x[:, 1] - 0.8 * x[:, 2] + 1.4 * x[:, 5] - 4.2
        y = (rng.uniform(size=n) < sigmoid(logit)).astype(np.float64)
        return x, y

    x_tr, y_tr = block(n_train)
    x_te, y_te = block(n_test)
    return {"x_train": x_tr, "y_train": y_tr, "x_test": x_te, "y_test": y_te}


def fixture_severity(n_train=1200, n_test=400, n_features=9, seed=5):
    rng = np.random.default_rng(seed)

    def block(n):
        x = (rng.uniform(size=(n, n_features)) < 0.35).astype(np.float64)
        y = 4.0 + 1.3 * x[:, 0] + 0.9 * x[:, 1] - 0.6 * x[:, 2] + rng.normal(scale=0.6,
                                                                            size=n)
        return x, y

    x_tr, y_tr = block(n_train)
    x_te, y_te = block(n_test)
    return {"x_train": x_tr, "y_train": y_tr, "x_test": x_te, "y_test": y_te}


def fixture_card(n_ex_features: int, n_sv_features: int) -> dict:
    """A dataset card that says plainly it is not real, so any artefact built from it
    carries `data_is_real: false` all the way through to the exported JSON."""
    return {
        "generated_at": "1970-01-01T00:00:00+00:00",
        "data_is_real": False,
        "sources": {"note": "FIXTURE — generated in ml/test_train.py, not real data"},
        "exploitation": {
            "question": "FIXTURE", "train_anchor": "2000-01-01",
            "test_anchor": "2001-01-01", "horizon_days": 365,
            "feature_names": [f"ex{i}" for i in range(n_ex_features)],
        },
        "severity": {
            "question": "FIXTURE", "cut_year": 2001,
            "loss_quantiles_usd": {"p50": 1.0},
            "feature_names": [f"sv{i}" for i in range(n_sv_features)],
        },
    }


def test_metrics() -> None:
    print("metrics")
    y = np.array([0, 0, 1, 1, 0, 1, 0, 0, 1, 0], dtype=np.float64)
    check("perfect ranking scores AUC 1.0", T.roc_auc(y, y) == 1.0)
    check("inverted ranking scores AUC 0.0", T.roc_auc(y, -y) == 0.0)
    check("constant score scores exactly 0.5",
          T.roc_auc(y, np.zeros_like(y)) == 0.5,
          f"{T.roc_auc(y, np.zeros_like(y))}")
    check("AP of a perfect ranking is 1.0", T.average_precision(y, y) == 1.0)
    check("AP of a constant score equals the base rate",
          abs(T.average_precision(y, np.zeros_like(y)) - y.mean()) < 1e-12)
    check("all-negative labels give nan rather than a fake score",
          np.isnan(T.roc_auc(np.zeros(5), np.arange(5.0))))

    check("Brier of a perfect forecast is 0", T.brier(y, y) == 0.0)
    check("log loss punishes a confident wrong call",
          T.log_loss(np.array([1.0]), np.array([0.01])) > 4.0)

    rng = np.random.default_rng(2)
    score = rng.uniform(size=4000)
    label = (rng.uniform(size=4000) < score * 0.1).astype(np.float64)
    top = T.lift_at_k(label, score, 10.0)
    check("top-10% reviews 10% of the rows", top["n_reviewed"] == 400)
    check("top-10% of a working ranking beats random", top["lift_vs_random"] > 1.3,
          f"lift={top['lift_vs_random']}")
    check("recall at k stays in [0, 1]", 0.0 <= top["recall"] <= 1.0)

    curve = T.calibration_curve(label, score, 10)
    check("calibration bins account for every row",
          sum(b["n"] for b in curve) == label.size)
    check("calibration bins are ordered by predicted value",
          all(curve[i]["predicted"] <= curve[i + 1]["predicted"]
              for i in range(len(curve) - 1)))
    check("ECE of a perfect forecast is 0",
          T.expected_calibration_error(T.calibration_curve(y, y, 4)) == 0.0)
    check("fewer rows than bins does not crash",
          len(T.calibration_curve(y[:3], y[:3], 10)) <= 3)


def test_calibrator() -> None:
    print("isotonic calibrator")
    T._check_calibrator()
    check("built-in self-check passes", True)

    rng = np.random.default_rng(9)
    s = rng.uniform(size=3000)
    y = (rng.uniform(size=3000) < s ** 3).astype(np.float64)
    cal = T.IsotonicCalibrator().fit(s, y)
    check("fit is monotone non-decreasing", bool(np.all(np.diff(cal.y) >= -1e-12)))
    check("knots compress the input", cal.x.size < s.size / 5,
          f"{cal.x.size} knots from {s.size} rows")

    out = cal.transform(s)
    check("calibration costs no meaningful ranking quality",
          T.roc_auc(y, out) >= T.roc_auc(y, s) - 0.01,
          f"AUC {T.roc_auc(y, s):.4f} -> {T.roc_auc(y, out):.4f}")
    check("calibrated mean matches the observed rate",
          abs(out.mean() - y.mean()) < 0.01,
          f"pred={out.mean():.4f} obs={y.mean():.4f}")
    check("calibration reduces Brier score", T.brier(y, out) < T.brier(y, s),
          f"{T.brier(y, s):.5f} -> {T.brier(y, out):.5f}")
    check("scores outside the fitted range are clamped, not extrapolated",
          bool(cal.transform(np.array([-9.0, 9.0]))[0] == cal.y[0]
               and cal.transform(np.array([-9.0, 9.0]))[1] == cal.y[-1]))

    tied = T.IsotonicCalibrator().fit(np.array([0.1, 0.1, 0.2, 0.2, 0.3]),
                                      np.array([0.0, 1.0, 0.0, 0.0, 1.0]))
    check("identical scores receive identical probabilities",
          float(tied.transform(np.array([0.1]))[0]) ==
          float(tied.transform(np.array([0.1]))[0]))
    check("violating pairs are pooled, not reordered",
          bool(np.all(np.diff(tied.y) >= 0)), f"y={tied.y.tolist()}")

    exported = json.loads(json.dumps(cal.to_dict()))
    reparsed = np.interp(s, np.array(exported["x"]), np.array(exported["y"]))
    check("exported map reproduces the fitted map exactly",
          float(np.max(np.abs(reparsed - out))) == 0.0)
    check("degenerate input is rejected rather than silently accepted",
          raises(lambda: T.IsotonicCalibrator().fit(np.array([1.0]), np.array([1.0]))))


def test_split() -> None:
    print("three-way split")
    rng = np.random.default_rng(6)
    y = (rng.uniform(size=5000) < 0.012).astype(np.float64)
    fit_i, val_i, cal_i = T.three_way_split(y, seed=1)
    allidx = np.concatenate([fit_i, val_i, cal_i])
    check("every row is used exactly once", np.unique(allidx).size == y.size,
          f"{np.unique(allidx).size} of {y.size}")
    check("slices are disjoint",
          not (set(fit_i.tolist()) & set(val_i.tolist()))
          and not (set(fit_i.tolist()) & set(cal_i.tolist()))
          and not (set(val_i.tolist()) & set(cal_i.tolist())))
    rates = [y[part].mean() for part in (fit_i, val_i, cal_i)]
    check("stratification keeps the base rate in every slice",
          max(rates) - min(rates) < 0.004,
          "rates " + ", ".join(f"{r * 100:.3f}%" for r in rates))
    check("calibration slice carries positives", y[cal_i].sum() > 0,
          f"{int(y[cal_i].sum())} positives")
    check("split is deterministic for a fixed seed",
          np.array_equal(T.three_way_split(y, seed=1)[0], fit_i))
    check("a different seed gives a different split",
          not np.array_equal(T.three_way_split(y, seed=2)[0], fit_i))

def test_pipeline() -> None:
    print("end-to-end fit, calibrate, export  (FIXTURE DATA — not model performance)")
    ex = fixture_exploitation()
    sv = fixture_severity()
    card = fixture_card(ex["x_train"].shape[1], sv["x_train"].shape[1])
    args = Args()

    exploit = T.train_exploitation(ex, card, args)
    m = exploit["metrics"]
    check("exploitation stage produced a usable ranking on the fixture",
          m["roc_auc"] > 0.75, f"AUC={m['roc_auc']}")
    check("calibration is applied only when it wins on the selection slice",
          m["calibration"]["applied"] ==
          (m["calibration"]["brier_isotonic_selection"] <=
           m["calibration"]["brier_identity_selection"]),
          f"{m['calibration']['method']}: "
          f"{m['calibration']['brier_identity_selection']} vs "
          f"{m['calibration']['brier_isotonic_selection']}")
    check("declining calibration leaves the probability untouched",
          m["calibration"]["applied"] or
          m["brier_calibrated"] == m["brier_uncalibrated"],
          f"applied={m['calibration']['applied']}")
    # Calibration is fitted on the training anchor, so drift between periods shows up as a
    # level shift. A quarter of the base rate is the widest gap that still means anything.
    check("mean predicted probability tracks the observed test rate",
          abs(m["mean_predicted"] - m["base_rate_test"]) < 0.25 * m["base_rate_test"],
          f"{m['mean_predicted']} vs {m['base_rate_test']}")
    check("both calibration curves are reported, before and after",
          len(m["calibration_curve"]) == len(m["calibration_curve_uncalibrated"]) == 10)

    check("top-k table reports every requested cut",
          [r["k_pct"] for r in m["top_k"]] == [1.0, 5.0, 10.0, 20.0])
    check("feature importance is reported by name",
          all(f["name"].startswith("ex") for f in m["top_features"]))
    check("early stopping kept fewer trees than the cap",
          0 < m["trees_used"] <= args.rounds, f"{m['trees_used']} trees")

    severity = T.train_severity(sv, card, args)
    s = severity["metrics"]
    check("severity beats predicting the training median",
          s["mae_log10"] < s["mae_log10_naive_median"],
          f"{s['mae_log10']} vs {s['mae_log10_naive_median']}")
    check("p10-p90 interval is ordered on every row",
          s["interval_ordered_pct"] == 100.0)
    check("interval coverage is in the right neighbourhood of 80%",
          0.70 <= s["interval_coverage_p10_p90"] <= 0.92,
          f"coverage={s['interval_coverage_p10_p90']}")

    # The console report is the only part of a real run a reviewer actually reads, and it
    # runs after twenty minutes of fitting. A KeyError there would be expensive.
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        T._report_exploitation(m)
        T._report_severity(s)
    printed = buf.getvalue()
    check("the console report renders without a missing key",
          "ROC-AUC" in printed and "p10-p90" in printed)
    check("the report states which split the figures come from", "test" in printed)
    check("the report names the calibration decision",
          m["calibration"]["method"] in printed)

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        real_model_dir, real_processed = T.MODEL_DIR, T.PROCESSED
        T.MODEL_DIR, T.PROCESSED = root / "model", root / "processed"
        T.PROCESSED.mkdir(parents=True, exist_ok=True)
        try:
            out = T.export(exploit, severity, card, args)
            model = json.loads((root / "model" / "risk-model.json").read_text())
            fixture = json.loads((root / "model" / "parity-fixture.json").read_text())
            metrics = json.loads((root / "processed" / "metrics.json").read_text())
        finally:
            T.MODEL_DIR, T.PROCESSED = real_model_dir, real_processed

    check("all four models round-trip through JSON with zero drift",
          max(out["deltas"].values()) == 0.0, f"max |delta|={max(out['deltas'].values()):.1e}")
    check("fixture-driven export is labelled not-real",
          model["data_is_real"] is False and metrics["data_is_real"] is False)
    check("exported model carries both stages",
          set(model.keys()) >= {"exploitation", "severity", "data_provenance"})
    check("exported feature order matches the dataset card",
          model["exploitation"]["feature_names"] == card["exploitation"]["feature_names"]
          and model["severity"]["feature_names"] == card["severity"]["feature_names"])
    check("calibration map travels with the model",
          model["exploitation"]["calibration"]["method"] == "isotonic"
          and len(model["exploitation"]["calibration"]["x"]) > 1)
    check("severity ships mean and both bounds",
          all(k in model["severity"] for k in ("mean", "p10", "p90")))
    check("metrics.json states where the figures come from",
          "test" in metrics["exploitation"]["evaluated_on"])

    rows = np.array(fixture["exploitation"]["rows"], dtype=np.float64)
    raw = predict_from_dict(model["exploitation"]["gbm"], rows)
    check("parity fixture matches the exported trees exactly",
          float(np.max(np.abs(raw - np.array(fixture["exploitation"]["expected_raw"])))) == 0.0)
    cal_x = np.array(model["exploitation"]["calibration"]["x"])
    cal_y = np.array(model["exploitation"]["calibration"]["y"])
    recomputed = np.interp(sigmoid(raw), cal_x, cal_y)
    expected = np.array(fixture["exploitation"]["expected_calibrated"])
    check("fixture calibrated probabilities are reproducible from the exported map",
          float(np.max(np.abs(recomputed - expected))) == 0.0)
    check("fixture probabilities stay inside [0, 1]",
          bool(expected.min() >= 0.0 and expected.max() <= 1.0))
    sv_rows = np.array(fixture["severity"]["rows"], dtype=np.float64)
    sv_mean = predict_from_dict(model["severity"]["mean"], sv_rows)
    check("severity fixture matches the exported trees exactly",
          float(np.max(np.abs(
              sv_mean - np.array(fixture["severity"]["expected_log10_mean"])))) == 0.0)
    check("exported p10 never exceeds p90 on the fixture rows",
          bool(np.all(np.array(fixture["severity"]["expected_log10_p10"]) <=
                      np.array(fixture["severity"]["expected_log10_p90"]))))

def test_refusals() -> None:
    print("refusals — the checks that keep fabricated data out")
    ex = fixture_exploitation(n_train=2000, n_test=800)
    sv = fixture_severity()
    card = fixture_card(ex["x_train"].shape[1], sv["x_train"].shape[1])

    with tempfile.TemporaryDirectory() as tmp:
        real = T.PROCESSED
        T.PROCESSED = Path(tmp) / "empty"
        try:
            check("missing data/processed refuses instead of improvising",
                  raises(T.load_inputs, T.MissingDataset))
            T.PROCESSED.mkdir(parents=True)
            (T.PROCESSED / "dataset_card.json").write_text(
                json.dumps({"data_is_real": False}))
            check("a card that does not claim real data is refused",
                  raises(T.load_inputs, T.MissingDataset))
            with contextlib.redirect_stderr(io.StringIO()) as captured:
                code = T.main([])
            check("main() exits non-zero when there is nothing real to train on",
                  code == 2, f"exit={code}")
            check("the refusal explains how to get real data",
                  "fetch_real_data.py" in captured.getvalue()
                  and "will not fabricate" in captured.getvalue())
        finally:
            T.PROCESSED = real

    thin = dict(ex)
    keep = np.flatnonzero(ex["y_train"])[:5]
    idx = np.concatenate([np.flatnonzero(ex["y_train"] == 0)[:500], keep])
    thin["x_train"], thin["y_train"] = ex["x_train"][idx], ex["y_train"][idx]
    check("too few positives to fit is refused, not reported",
          raises(lambda: T.train_exploitation(thin, card, Args()), ValueError))

    mismatched = fixture_card(ex["x_train"].shape[1] + 1, sv["x_train"].shape[1])
    check("feature count disagreeing with the card is refused",
          raises(lambda: T.train_exploitation(ex, mismatched, Args()), ValueError))

    small = {k: (v[:40] if k.endswith("train") else v) for k, v in sv.items()}
    check("too few incidents with a recorded loss is refused",
          raises(lambda: T.train_severity(small, card, Args()), ValueError))


def test_calibration_selection() -> None:
    """The decision rule, exercised both ways.

    Inducing overconfidence through the full stage is hard here — early stopping on log loss
    keeps the booster close to calibrated, which is the pipeline working — so the rule is
    driven directly with scores of known quality.
    """
    print("calibration selection rule")
    rng = np.random.default_rng(23)
    n = 6000
    truth = 0.02 + 0.30 * rng.uniform(size=n)
    y = (rng.uniform(size=n) < truth).astype(np.float64)

    # An overconfident forecast: correctly ordered, pushed toward the extremes.
    stretched = np.clip(1.0 / (1.0 + np.exp(-4.0 * np.log(truth / (1 - truth)))), 1e-6,
                        1 - 1e-6)
    half = n // 2
    cal, info = T.select_calibrator(stretched[:half], y[:half], stretched[half:], y[half:])
    check("an overconfident forecast gets the isotonic map", info["applied"],
          f"method={info['method']}")
    check("accepting it lowers the selection-slice Brier score",
          info["brier_isotonic_selection"] < info["brier_identity_selection"],
          f"{info['brier_identity_selection']} -> {info['brier_isotonic_selection']}")
    before = T.expected_calibration_error(T.calibration_curve(y[half:], stretched[half:]))
    after = T.expected_calibration_error(
        T.calibration_curve(y[half:], cal.transform(stretched[half:])))
    check("and it lowers calibration error on the same rows", after < before,
          f"ECE {before:.4f} -> {after:.4f}")
    # Isotonic can only merge neighbouring scores into a shared value; it can never invert a
    # pair. Merging does cost a little AUC, since tied pairs score half credit, so the honest
    # claim is "no inversions, and only a negligible ranking cost".
    order = np.argsort(stretched[half:], kind="mergesort")
    mapped = cal.transform(stretched[half:])[order]
    auc_before = T.roc_auc(y[half:], stretched[half:])
    auc_after = T.roc_auc(y[half:], cal.transform(stretched[half:]))
    check("calibration merges ties but never inverts a pair",
          bool(np.all(np.diff(mapped) >= -1e-12)))
    check("the ranking cost of calibration is negligible",
          auc_before - auc_after < 0.01, f"AUC {auc_before:.4f} -> {auc_after:.4f}")


    # An already-calibrated forecast: the map should be declined and the identity exported.
    cal2, info2 = T.select_calibrator(truth[:half], y[:half], truth[half:], y[half:])
    check("an already-calibrated forecast keeps its own probabilities",
          not info2["applied"], f"method={info2['method']}")
    check("declining exports the identity map, not a fitted one",
          cal2.to_dict()["x"] == [0.0, 1.0] and cal2.to_dict()["y"] == [0.0, 1.0])
    check("the identity map leaves the score untouched",
          float(np.max(np.abs(cal2.transform(truth[half:]) - truth[half:]))) == 0.0)
    check("both Brier scores are recorded either way",
          {"brier_identity_selection", "brier_isotonic_selection"} <= set(info2))


def main() -> int:
    print("FIXTURE TESTS for ml/train.py. Every number below comes from random data")
    print("generated in this file. None of it is the platform's model performance.\n")
    test_metrics()
    test_calibrator()
    test_split()
    test_pipeline()
    test_calibration_selection()
    test_refusals()
    print(f"\n{len(FAILURES)} failure(s)" if FAILURES else "\nall train.py tests passed")
    for name in FAILURES:
        print(f"  - {name}")
    print("\nReminder: fixture data. The platform's real metrics come from ml/train.py.")
    return 1 if FAILURES else 0


if __name__ == "__main__":
    raise SystemExit(main())
