/**
 * Inference for the exported gradient-boosted trees, in the browser, with no dependencies.
 *
 * This is a line-for-line counterpart of `predict_from_dict` in ml/gbm.py. That function
 * exists in Python purely so the training run can assert the serialised model agrees with
 * the fitted one; this file is the version that actually runs in front of a user. The two
 * must not drift, which is why `public/model/parity-fixture.json` ships alongside the
 * model and `verifyParity()` in engine.ts refuses to trust a model that fails it.
 *
 * Arithmetic note: JavaScript numbers are IEEE 754 doubles, the same as numpy float64, and
 * `JSON.parse` round-trips them exactly. The operations here are the same additions and
 * multiplications in the same order as the Python, so agreement is exact rather than
 * approximate — the fixture tolerance is 1e-9 only to leave room for a future change.
 */
import type { GbmModel, IsotonicMap } from './types';

export function sigmoid(z: number): number {
  // Branch on the sign to keep exp() away from overflow. Both branches are the same
  // function; the guard matters because a raw score of -800 would otherwise produce Infinity
  // in the denominator and then NaN rather than 0.
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

/**
 * Sum of the ensemble at full precision. `row` must already be in the model's feature
 * order — pass it through `buildExploitationRow` / `buildSeverityRow`, never by hand.
 */
export function predictRaw(model: GbmModel, row: number[]): number {
  if (row.length !== model.n_features) {
    throw new Error(
      `feature count mismatch: model expects ${model.n_features}, got ${row.length}. ` +
        'The browser feature builder and ml/build_dataset.py have diverged.'
    );
  }
  let out = model.base_score;
  const lr = model.learning_rate;
  for (const tree of model.trees) {
    let node = 0;
    // Bounded by the tree depth in practice; the counter is a guard against a malformed
    // export producing a cycle and hanging the tab rather than reporting a bad model.
    let hops = 0;
    while (tree.feature[node] >= 0) {
      node = row[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
      if (++hops > tree.feature.length) {
        throw new Error('malformed tree: traversal did not reach a leaf');
      }
    }
    out += lr * tree.value[node];
  }
  return out;
}

export function predictRawBatch(model: GbmModel, rows: number[][]): number[] {
  return rows.map((row) => predictRaw(model, row));
}

/**
 * Apply the isotonic map. Equivalent to `numpy.interp`: clamped to the end knots outside
 * the fitted range, linear between knots. A declined calibrator exports as [0,1] -> [0,1],
 * for which this is the identity, so callers apply it unconditionally.
 */
export function applyCalibration(cal: IsotonicMap, p: number): number {
  const { x, y } = cal;
  const n = x.length;
  if (n === 0) return p;
  if (n === 1 || p <= x[0]) return y[0];
  if (p >= x[n - 1]) return y[n - 1];

  // Binary search for the last knot at or below p. x is strictly increasing: fit()
  // collapses exact ties before pooling, so there is no zero-width segment to divide by.
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (x[mid] <= p) lo = mid;
    else hi = mid;
  }
  const span = x[hi] - x[lo];
  if (span === 0) return y[lo];
  return y[lo] + ((p - x[lo]) * (y[hi] - y[lo])) / span;
}

/** Split count weighted by node sample size is unavailable in the export; count splits. */
export function splitCounts(model: GbmModel): number[] {
  const counts = new Array<number>(model.n_features).fill(0);
  for (const tree of model.trees) {
    for (const f of tree.feature) {
      if (f >= 0) counts[f] += 1;
    }
  }
  return counts;
}

/**
 * Features the ensemble actually splits on, most-used first. Useful for the explainability
 * panel: it answers "what does this model look at", which is a weaker but honest claim
 * than a per-finding attribution, and does not require SHAP in the browser.
 */
export function topFeatures(model: GbmModel, limit = 8): { name: string; splits: number; share: number }[] {
  const counts = splitCounts(model);
  const total = counts.reduce((a, b) => a + b, 0);
  return counts
    .map((splits, i) => ({ name: model.feature_names[i] ?? `f${i}`, splits, share: total ? splits / total : 0 }))
    .filter((f) => f.splits > 0)
    .sort((a, b) => b.splits - a.splits)
    .slice(0, limit);
}
