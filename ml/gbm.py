"""
gbm.py — histogram gradient-boosted trees in pure numpy.

scikit-learn, LightGBM and XGBoost are all unavailable in this environment (the package
proxy refuses connections), so the boosting machinery is implemented here. That turned out
to be an advantage: because the tree structure is ours, the browser export is a direct
serialisation with no sklearn→JSON conversion layer to drift out of sync.

Three objectives, all used by the platform:

    logistic    exploitation probability (with isotonic calibration in train.py)
    l2          conditional mean of log10 loss
    quantile    loss interval bounds, so the UI can show a range instead of a false point

Design notes that matter for correctness:

  * Features are pre-binned into at most `max_bins` quantile buckets. Split gain is then a
    prefix-sum scan over per-bin gradient/hessian histograms — O(bins) per feature per
    node rather than O(rows log rows).
  * A split stores the bin threshold, but `to_dict()` converts it back to the real-valued
    bin edge. Because binning uses searchsorted(side="left"), `bin <= t` is exactly
    equivalent to `x <= edges[t]`, so browser inference is bit-comparable, not approximate.
  * Leaf values for the quantile objective are the empirical residual quantile in the leaf,
    not the Newton step. The Newton step is undefined for a non-smooth loss and using it
    silently biases the interval toward the median.
"""
from __future__ import annotations

from typing import Any

import numpy as np

def sigmoid(z: np.ndarray) -> np.ndarray:
    """Numerically stable logistic. Split by sign so exp never overflows."""
    out = np.empty_like(z, dtype=np.float64)
    pos = z >= 0
    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))
    ez = np.exp(z[~pos])
    out[~pos] = ez / (1.0 + ez)
    return out


class HistBinner:
    """Quantile binning. Fitted on the training matrix only."""

    def __init__(self, max_bins: int = 64):
        if not 2 <= max_bins <= 255:
            raise ValueError("max_bins must be in [2, 255] to fit in uint8")
        self.max_bins = max_bins
        self.edges: list[np.ndarray] = []

    def fit(self, x: np.ndarray) -> "HistBinner":
        if np.isnan(x).any():
            raise ValueError("NaN in feature matrix; the pipeline must impute explicitly")
        self.edges = []
        qs = np.linspace(0.0, 1.0, self.max_bins + 1)[1:-1]
        for j in range(x.shape[1]):
            col = x[:, j]
            cand = np.unique(np.quantile(col, qs))
            # An edge only partitions the column if something is above it. Dropping edges
            # at or above the maximum means a constant column produces zero edges — one
            # bin, never splittable — instead of a bin boundary nothing can cross.
            cand = cand[cand < col.max()]
            self.edges.append(cand.astype(np.float64))
        return self


    def transform(self, x: np.ndarray) -> np.ndarray:
        out = np.empty(x.shape, dtype=np.uint8)
        for j, e in enumerate(self.edges):
            out[:, j] = (np.searchsorted(e, x[:, j], side="left").astype(np.uint8)
                         if e.size else 0)
        return out

    def n_bins(self, j: int) -> int:
        return int(self.edges[j].size) + 1


class Tree:
    """
    A single regression tree in flat array form.

    Node i is a leaf when `feature[i] < 0`; otherwise rows with `binned <= threshold[i]`
    go to `left[i]` and the rest to `right[i]`.
    """

    __slots__ = ("feature", "threshold", "left", "right", "value", "count")

    def __init__(self, capacity: int):
        self.feature = np.full(capacity, -1, dtype=np.int32)
        self.threshold = np.zeros(capacity, dtype=np.int32)
        self.left = np.full(capacity, -1, dtype=np.int32)
        self.right = np.full(capacity, -1, dtype=np.int32)
        self.value = np.zeros(capacity, dtype=np.float64)
        self.count = np.zeros(capacity, dtype=np.int64)

    def predict(self, binned: np.ndarray) -> np.ndarray:
        """Vectorised traversal: walk every row down one level at a time."""
        node = np.zeros(binned.shape[0], dtype=np.int32)
        active = self.feature[node] >= 0
        while active.any():
            idx = np.flatnonzero(active)
            cur = node[idx]
            go_left = binned[idx, self.feature[cur]] <= self.threshold[cur]
            node[idx] = np.where(go_left, self.left[cur], self.right[cur])
            active = self.feature[node] >= 0
        return self.value[node]

    def predict_raw_features(self, x: np.ndarray, edges: list[np.ndarray]) -> np.ndarray:
        """Traverse using real feature values and bin edges — the parity reference."""
        node = np.zeros(x.shape[0], dtype=np.int32)
        active = self.feature[node] >= 0
        while active.any():
            idx = np.flatnonzero(active)
            cur = node[idx]
            feats = self.feature[cur]
            thresholds = np.array([edges[f][t] for f, t in zip(feats, self.threshold[cur])])
            go_left = x[idx, feats] <= thresholds
            node[idx] = np.where(go_left, self.left[cur], self.right[cur])
            active = self.feature[node] >= 0
        return self.value[node]


class _Grower:
    """Builds one tree by depth-wise best-gain splitting."""

    def __init__(self, binned, grad, hess, params, rng, n_bins, residual=None, alpha=0.5):
        self.binned, self.grad, self.hess = binned, grad, hess
        self.p, self.rng, self.n_bins = params, rng, n_bins
        self.residual, self.alpha = residual, alpha
        max_nodes = 2 ** (params["max_depth"] + 1)
        self.tree = Tree(max_nodes)
        self.next_free = 1

    def _leaf_value(self, rows: np.ndarray) -> float:
        if self.p["objective"] == "quantile" and self.residual is not None:
            return float(np.quantile(self.residual[rows], self.alpha))
        g, h = self.grad[rows].sum(), self.hess[rows].sum()
        raw = -g / (h + self.p["l2_reg"])
        cap = self.p["max_leaf_step"]
        return float(np.clip(raw, -cap, cap))

    def _best_split(self, rows: np.ndarray) -> tuple[int, int, float] | None:
        n_feat = self.binned.shape[1]
        k = max(1, int(round(n_feat * self.p["colsample"])))
        cols = self.rng.choice(n_feat, size=k, replace=False) if k < n_feat \
            else np.arange(n_feat)

        g_tot, h_tot = self.grad[rows].sum(), self.hess[rows].sum()
        lam, gamma = self.p["l2_reg"], self.p["min_split_gain"]
        parent = (g_tot * g_tot) / (h_tot + lam)
        best: tuple[int, int, float] | None = None

        for j in cols:
            nb = self.n_bins[j]
            if nb < 2:
                continue
            bins = self.binned[rows, j]
            gh = np.bincount(bins, weights=self.grad[rows], minlength=nb)
            hh = np.bincount(bins, weights=self.hess[rows], minlength=nb)
            ch = np.bincount(bins, minlength=nb)
            gl, hl, cl = np.cumsum(gh)[:-1], np.cumsum(hh)[:-1], np.cumsum(ch)[:-1]
            gr, hr, cr = g_tot - gl, h_tot - hl, rows.size - cl

            ok = ((cl >= self.p["min_samples_leaf"]) & (cr >= self.p["min_samples_leaf"])
                  & (hl >= self.p["min_child_weight"]) & (hr >= self.p["min_child_weight"]))
            if not ok.any():
                continue
            gain = np.where(ok, (gl * gl) / (hl + lam) + (gr * gr) / (hr + lam) - parent,
                            -np.inf)
            t = int(np.argmax(gain))
            if gain[t] > gamma and (best is None or gain[t] > best[2]):
                best = (int(j), t, float(gain[t]))
        return best


    def grow(self, rows: np.ndarray) -> Tree:
        frontier = [(0, rows, 0)]
        while frontier:
            node, node_rows, depth = frontier.pop()
            self.tree.count[node] = node_rows.size
            split = None
            if depth < self.p["max_depth"] and \
                    node_rows.size >= 2 * self.p["min_samples_leaf"]:
                split = self._best_split(node_rows)
            if split is None or self.next_free + 1 >= self.tree.value.size:
                self.tree.value[node] = self._leaf_value(node_rows)
                continue

            j, t, _ = split
            mask = self.binned[node_rows, j] <= t
            left, right = self.next_free, self.next_free + 1
            self.next_free += 2
            self.tree.feature[node] = j
            self.tree.threshold[node] = t
            self.tree.left[node] = left
            self.tree.right[node] = right
            frontier.append((left, node_rows[mask], depth + 1))
            frontier.append((right, node_rows[~mask], depth + 1))
        return self.tree


DEFAULTS = {
    "objective": "logistic",
    "n_estimators": 300,
    "learning_rate": 0.06,
    "max_depth": 5,
    "min_samples_leaf": 25,
    "min_child_weight": 1e-3,
    "l2_reg": 1.0,
    "min_split_gain": 1e-6,
    "max_bins": 64,
    "subsample": 0.8,
    "colsample": 0.8,
    "max_leaf_step": 4.0,
    "alpha": 0.5,
    "random_state": 20260901,
}


class GradientBooster:
    """
    Fit with `fit(x, y, eval_set=(x_val, y_val), early_stopping_rounds=n)`.

    `predict_raw` returns the additive score; for the logistic objective apply `sigmoid`
    (or `predict_proba`). Early stopping keeps the tree count that minimised validation
    loss, so `n_trees_used` can be lower than `n_estimators`.
    """

    def __init__(self, **kwargs):
        unknown = set(kwargs) - set(DEFAULTS)
        if unknown:
            raise TypeError(f"unknown parameters: {sorted(unknown)}")
        self.params: dict[str, Any] = {**DEFAULTS, **kwargs}
        if self.params["objective"] not in ("logistic", "l2", "quantile"):
            raise ValueError(f"unsupported objective {self.params['objective']!r}")
        self.binner = HistBinner(self.params["max_bins"])
        self.trees: list[Tree] = []
        self.base_score = 0.0
        self.history: list[dict] = []
        self.n_trees_used = 0

    # -- loss and gradients ------------------------------------------------- #
    def _init_base(self, y: np.ndarray) -> float:
        obj = self.params["objective"]
        if obj == "logistic":
            p = float(np.clip(y.mean(), 1e-6, 1 - 1e-6))
            return float(np.log(p / (1 - p)))
        if obj == "quantile":
            return float(np.quantile(y, self.params["alpha"]))
        return float(y.mean())

    def _grad_hess(self, y: np.ndarray, raw: np.ndarray):
        obj = self.params["objective"]
        if obj == "logistic":
            p = sigmoid(raw)
            return p - y, np.maximum(p * (1.0 - p), 1e-6)
        if obj == "l2":
            return raw - y, np.ones_like(raw)
        a = self.params["alpha"]
        return np.where(y > raw, -a, 1.0 - a), np.ones_like(raw)

    def loss(self, y: np.ndarray, raw: np.ndarray) -> float:
        obj = self.params["objective"]
        if obj == "logistic":
            p = np.clip(sigmoid(raw), 1e-12, 1 - 1e-12)
            return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))
        if obj == "l2":
            return float(np.mean((y - raw) ** 2))
        a, d = self.params["alpha"], y - raw
        return float(np.mean(np.maximum(a * d, (a - 1.0) * d)))


    # -- fit ---------------------------------------------------------------- #
    def fit(self, x: np.ndarray, y: np.ndarray, eval_set=None,
            early_stopping_rounds: int | None = None, verbose_every: int = 0):
        x = np.asarray(x, dtype=np.float64)
        y = np.asarray(y, dtype=np.float64)
        rng = np.random.default_rng(self.params["random_state"])

        self.binner.fit(x)
        binned = self.binner.transform(x)
        n_bins = [self.binner.n_bins(j) for j in range(x.shape[1])]

        self.base_score = self._init_base(y)
        raw = np.full(y.shape, self.base_score, dtype=np.float64)

        val_binned = val_y = None
        val_raw = None
        if eval_set is not None:
            vx, vy = eval_set
            val_binned = self.binner.transform(np.asarray(vx, dtype=np.float64))
            val_y = np.asarray(vy, dtype=np.float64)
            val_raw = np.full(val_y.shape, self.base_score, dtype=np.float64)

        best_loss, best_round, lr = np.inf, 0, self.params["learning_rate"]
        self.trees = []
        for it in range(self.params["n_estimators"]):
            grad, hess = self._grad_hess(y, raw)
            residual = y - raw if self.params["objective"] == "quantile" else None

            rows = np.arange(y.size)
            if self.params["subsample"] < 1.0:
                take = max(self.params["min_samples_leaf"] * 2,
                           int(round(y.size * self.params["subsample"])))
                rows = rng.choice(y.size, size=min(take, y.size), replace=False)

            grower = _Grower(binned, grad, hess, self.params, rng, n_bins,
                             residual=residual, alpha=self.params["alpha"])
            tree = grower.grow(rows)
            self.trees.append(tree)
            raw += lr * tree.predict(binned)

            if val_raw is not None and val_binned is not None and val_y is not None:
                val_raw += lr * tree.predict(val_binned)
                vloss = self.loss(val_y, val_raw)
                self.history.append({"round": it + 1, "train_loss": self.loss(y, raw),
                                     "val_loss": vloss})
                if vloss < best_loss - 1e-9:
                    best_loss, best_round = vloss, it + 1
                elif early_stopping_rounds and it + 1 - best_round >= early_stopping_rounds:
                    break
            else:
                self.history.append({"round": it + 1, "train_loss": self.loss(y, raw)})
            if verbose_every and (it + 1) % verbose_every == 0:
                tail = self.history[-1]
                print(f"    round {it + 1:>4}  " + "  ".join(
                    f"{k}={v:.5f}" for k, v in tail.items() if k != "round"))

        self.n_trees_used = best_round if (val_raw is not None and best_round) \
            else len(self.trees)
        return self


    # -- predict ------------------------------------------------------------ #
    def predict_raw(self, x: np.ndarray, n_trees: int | None = None) -> np.ndarray:
        x = np.asarray(x, dtype=np.float64)
        binned = self.binner.transform(x)
        limit = n_trees if n_trees is not None else (self.n_trees_used or len(self.trees))
        out = np.full(x.shape[0], self.base_score, dtype=np.float64)
        lr = self.params["learning_rate"]
        for tree in self.trees[:limit]:
            out += lr * tree.predict(binned)
        return out

    def predict_proba(self, x: np.ndarray, n_trees: int | None = None) -> np.ndarray:
        if self.params["objective"] != "logistic":
            raise ValueError("predict_proba requires the logistic objective")
        return sigmoid(self.predict_raw(x, n_trees))

    def feature_importance(self, n_features: int) -> np.ndarray:
        """Split count weighted by node sample size — a usable proxy without SHAP."""
        imp = np.zeros(n_features, dtype=np.float64)
        for tree in self.trees[:self.n_trees_used or len(self.trees)]:
            internal = np.flatnonzero(tree.feature >= 0)
            for node in internal:
                imp[tree.feature[node]] += float(tree.count[node])
        total = imp.sum()
        return imp / total if total else imp

    # -- serialise ---------------------------------------------------------- #
    def to_dict(self, feature_names: list[str]) -> dict:
        """
        Export with real-valued thresholds so a browser needs no binner.

        `bin <= t` is equivalent to `x <= edges[t]` because binning uses
        searchsorted(side="left"); `parity_ok()` asserts that equivalence numerically
        rather than trusting the argument. Leaf values are written at full float64
        precision: Python's repr and JavaScript's JSON.parse both round-trip IEEE 754
        doubles exactly, so parity is exact rather than merely close.
        """
        trees = []
        for tree in self.trees[:self.n_trees_used or len(self.trees)]:
            n_nodes = int(max(1, np.flatnonzero(
                (tree.feature >= 0) | (tree.count > 0)).max() + 1))
            trees.append({
                "feature": tree.feature[:n_nodes].tolist(),
                "threshold": [float(self.binner.edges[f][t]) if f >= 0 else 0.0
                              for f, t in zip(tree.feature[:n_nodes],
                                              tree.threshold[:n_nodes])],
                "left": tree.left[:n_nodes].tolist(),
                "right": tree.right[:n_nodes].tolist(),
                "value": [float(v) for v in tree.value[:n_nodes]],
            })
        return {
            "objective": self.params["objective"],
            "learning_rate": self.params["learning_rate"],
            "base_score": self.base_score,
            "n_features": len(feature_names),
            "feature_names": feature_names,
            "n_trees": len(trees),
            "trees": trees,
        }


def predict_from_dict(model: dict, x: np.ndarray) -> np.ndarray:
    """
    Reference implementation of the exported format, in the same shape the TypeScript
    inference code uses. train.py asserts this agrees with `predict_raw`, and the browser
    bundle is checked against fixtures generated from it, so a serialisation bug cannot
    reach the UI unnoticed.
    """
    x = np.asarray(x, dtype=np.float64)
    out = np.full(x.shape[0], float(model["base_score"]), dtype=np.float64)
    lr = float(model["learning_rate"])
    for tree in model["trees"]:
        feature = np.asarray(tree["feature"], dtype=np.int64)
        threshold = np.asarray(tree["threshold"], dtype=np.float64)
        left = np.asarray(tree["left"], dtype=np.int64)
        right = np.asarray(tree["right"], dtype=np.int64)
        value = np.asarray(tree["value"], dtype=np.float64)

        node = np.zeros(x.shape[0], dtype=np.int64)
        active = feature[node] >= 0
        while active.any():
            idx = np.flatnonzero(active)
            cur = node[idx]
            go_left = x[idx, feature[cur]] <= threshold[cur]
            node[idx] = np.where(go_left, left[cur], right[cur])
            active = feature[node] >= 0
        out += lr * value[node]
    return out


def parity_ok(booster: GradientBooster, model: dict, x: np.ndarray,
              tol: float = 1e-9) -> tuple[bool, float]:
    """Max absolute disagreement between the fitted model and its serialised form."""
    a = booster.predict_raw(x)
    b = predict_from_dict(model, x)
    delta = float(np.max(np.abs(a - b))) if a.size else 0.0
    return delta <= tol, delta
