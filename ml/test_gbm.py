#!/usr/bin/env python3
"""
test_gbm.py — unit tests for the numpy boosting implementation in ml/gbm.py.

    python3 ml/test_gbm.py

These exercise the *algorithm* against generators whose answer is known analytically. They
say nothing about the platform's risk model, which is fitted only to the real datasets in
data/raw/. Run this after touching gbm.py; run ml/train.py to get real metrics.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gbm import GradientBooster, HistBinner, parity_ok, predict_from_dict, sigmoid  # noqa: E402

FAILURES: list[str] = []


def check(label: str, condition: bool | np.bool_, detail: str = "") -> None:
    print(f"  {'ok  ' if condition else 'FAIL'} {label}" + (f" — {detail}" if detail else ""))
    if not condition:
        FAILURES.append(label)


def auc(y: np.ndarray, score: np.ndarray) -> float:
    order = np.argsort(score, kind="mergesort")
    ranks = np.empty_like(order, dtype=np.float64)
    ranks[order] = np.arange(1, y.size + 1)
    # average ranks within ties so a constant predictor scores exactly 0.5
    sorted_scores = score[order]
    i = 0
    while i < y.size:
        j = i
        while j + 1 < y.size and sorted_scores[j + 1] == sorted_scores[i]:
            j += 1
        if j > i:
            ranks[order[i:j + 1]] = (i + j + 2) / 2.0
        i = j + 1
    pos, neg = y.sum(), y.size - y.sum()
    if pos == 0 or neg == 0:
        return float("nan")
    return float((ranks[y == 1].sum() - pos * (pos + 1) / 2.0) / (pos * neg))


def test_binner() -> None:
    print("HistBinner")
    rng = np.random.default_rng(1)
    x = rng.normal(size=(2000, 3))
    x[:, 2] = 7.0                                   # constant column
    binner = HistBinner(max_bins=16).fit(x)
    binned = binner.transform(x)
    check("bins stay inside the declared range",
          binned[:, 0].max() < binner.n_bins(0), f"max bin {binned[:, 0].max()}")
    check("constant column yields a single bin", binner.n_bins(2) == 1)
    check("binning is monotone in the feature",
          np.all(np.diff(binned[np.argsort(x[:, 0]), 0].astype(int)) >= 0))
    check("bin <= t is equivalent to x <= edges[t]",
          all(np.array_equal(binned[:, 0] <= t, x[:, 0] <= binner.edges[0][t])
              for t in range(binner.edges[0].size)))
    check("NaN input is rejected",
          _raises(lambda: HistBinner().fit(np.array([[np.nan]]))))


def _raises(fn) -> bool:
    try:
        fn()
    except Exception:
        return True
    return False


def test_logistic() -> None:
    print("logistic objective")
    rng = np.random.default_rng(7)
    n = 6000
    x = rng.normal(size=(n, 8))
    logit = 1.6 * x[:, 0] - 1.2 * x[:, 1] + 0.9 * x[:, 2] * x[:, 3] - 0.4
    y = (rng.uniform(size=n) < sigmoid(logit)).astype(np.float64)
    cut = int(n * 0.7)
    model = GradientBooster(objective="logistic", n_estimators=250, learning_rate=0.08,
                            max_depth=4, min_samples_leaf=20, random_state=3)
    model.fit(x[:cut], y[:cut], eval_set=(x[cut:], y[cut:]), early_stopping_rounds=25)

    proba = model.predict_proba(x[cut:])
    score = auc(y[cut:], proba)
    baseline = auc(y[cut:], x[cut:, 0])
    check("recovers a nonlinear signal (AUC > 0.80)", score > 0.80, f"AUC={score:.4f}")
    check("beats the strongest single feature", score > baseline,
          f"model={score:.4f} vs x0={baseline:.4f}")
    check("probabilities stay in (0, 1)", bool(proba.min() > 0 and proba.max() < 1))
    check("mean predicted rate tracks the observed rate",
          abs(proba.mean() - y[cut:].mean()) < 0.05,
          f"pred={proba.mean():.4f} obs={y[cut:].mean():.4f}")
    check("early stopping trimmed the ensemble",
          0 < model.n_trees_used <= len(model.trees), f"{model.n_trees_used} trees")

    exported = model.to_dict([f"f{i}" for i in range(8)])
    ok, delta = parity_ok(model, exported, x[cut:cut + 500])
    check("serialised model reproduces training-time scores", ok, f"max |delta|={delta:.2e}")


def test_l2_and_quantile() -> None:
    print("l2 and quantile objectives")
    rng = np.random.default_rng(11)
    n = 5000
    x = rng.normal(size=(n, 5))
    truth = 2.0 * x[:, 0] + np.sin(2.0 * x[:, 1]) - 0.5 * x[:, 2]
    y = truth + rng.normal(scale=0.5, size=n)
    cut = int(n * 0.7)

    mean_model = GradientBooster(objective="l2", n_estimators=300, learning_rate=0.08,
                                 max_depth=4, random_state=5)
    mean_model.fit(x[:cut], y[:cut], eval_set=(x[cut:], y[cut:]),
                   early_stopping_rounds=25)
    pred = mean_model.predict_raw(x[cut:])
    mae = float(np.mean(np.abs(pred - y[cut:])))
    naive = float(np.mean(np.abs(y[:cut].mean() - y[cut:])))
    check("l2 beats predicting the training mean", mae < naive * 0.5,
          f"MAE={mae:.4f} vs naive={naive:.4f}")

    lo = GradientBooster(objective="quantile", alpha=0.1, n_estimators=200,
                         learning_rate=0.08, max_depth=4, random_state=5)
    hi = GradientBooster(objective="quantile", alpha=0.9, n_estimators=200,
                         learning_rate=0.08, max_depth=4, random_state=5)
    lo.fit(x[:cut], y[:cut])
    hi.fit(x[:cut], y[:cut])
    lo_pred, hi_pred = lo.predict_raw(x[cut:]), hi.predict_raw(x[cut:])
    coverage = float(np.mean((y[cut:] >= lo_pred) & (y[cut:] <= hi_pred)))
    check("10-90 interval covers roughly 80% of held-out points",
          0.70 <= coverage <= 0.90, f"coverage={coverage:.3f}")
    check("lower bound stays below the upper bound",
          bool(np.mean(lo_pred < hi_pred) > 0.99),
          f"ordered on {np.mean(lo_pred < hi_pred) * 100:.1f}% of rows")

    exported = lo.to_dict([f"f{i}" for i in range(5)])
    reference = predict_from_dict(exported, x[cut:cut + 300])
    check("quantile model also round-trips",
          bool(np.allclose(reference, lo.predict_raw(x[cut:cut + 300]), atol=1e-9)))


def test_guards() -> None:
    print("parameter guards")
    check("unknown parameter rejected", _raises(lambda: GradientBooster(nonsense=1)))
    check("unknown objective rejected",
          _raises(lambda: GradientBooster(objective="poisson")))
    check("predict_proba blocked for regression", _raises(
        lambda: GradientBooster(objective="l2").fit(
            np.zeros((40, 2)), np.zeros(40)).predict_proba(np.zeros((2, 2)))))
    check("max_bins bounded to uint8", _raises(lambda: HistBinner(max_bins=999)))


def main() -> int:
    print("gbm.py unit tests — algorithm checks on known generators.")
    print("These are NOT the platform's risk model metrics.\n")
    test_binner()
    test_logistic()
    test_l2_and_quantile()
    test_guards()
    print(f"\n{len(FAILURES)} failure(s)" if FAILURES else "\nall gbm tests passed")
    for name in FAILURES:
        print(f"  - {name}")
    return 1 if FAILURES else 0


if __name__ == "__main__":
    raise SystemExit(main())
