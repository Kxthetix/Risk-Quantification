/**
 * TypeScript shapes for the artefacts `ml/train.py` writes into `public/model/`.
 *
 * These declarations are a contract, not documentation: if the Python exporter changes a
 * key, the browser must fail to compile rather than silently read `undefined` and render a
 * plausible-looking rupee figure. Every field below is present in `export()` in
 * ml/train.py; nothing here is optional unless the Python side can genuinely omit it.
 */

/** One decision tree, flat arrays. A node is a leaf iff `feature[i] < 0`. */
export interface GbmTree {
  feature: number[];
  /** Real-valued split point. `x[feature] <= threshold` goes left. */
  threshold: number[];
  left: number[];
  right: number[];
  value: number[];
}

export interface GbmModel {
  objective: 'logistic' | 'l2' | 'quantile';
  learning_rate: number;
  base_score: number;
  n_features: number;
  feature_names: string[];
  n_trees: number;
  trees: GbmTree[];
}

/**
 * Piecewise-linear isotonic map, as knots. `method` is always the string "isotonic"
 * because that is the class that serialises itself; whether the map was *accepted* is
 * recorded separately in `metrics.calibration.applied`. A declined map exports as the
 * identity knots [0,1] -> [0,1], so applying it unconditionally is correct.
 */
export interface IsotonicMap {
  method: string;
  n_fit: number;
  n_knots: number;
  x: number[];
  y: number[];
}

export interface CalibrationInfo {
  method: 'isotonic' | 'identity';
  applied: boolean;
  n_calibration_rows: number;
  selection_slice: string;
  brier_identity_selection: number;
  brier_isotonic_selection: number;
}

export interface ReliabilityBin {
  n: number;
  predicted: number;
  observed: number;
}

export interface TopKLift {
  k_pct: number;
  n_reviewed: number;
  captured: number;
  recall: number | null;
  precision: number;
  lift_vs_random: number | null;
}

export interface ExploitationMetrics {
  n_train: number;
  n_test: number;
  positives_train: number;
  positives_test: number;
  base_rate_test: number;
  trees_used: number;
  roc_auc: number;
  average_precision: number;
  ap_lift_over_base: number | null;
  brier_uncalibrated: number;
  brier_calibrated: number;
  log_loss_calibrated: number;
  ece_uncalibrated: number;
  ece_calibrated: number;
  mean_predicted: number;
  calibration: CalibrationInfo;
  calibration_curve: ReliabilityBin[];
  calibration_curve_uncalibrated: ReliabilityBin[];
  top_k: TopKLift[];
  evaluated_on: string;
}

export interface SeverityMetrics {
  n_train: number;
  n_test: number;
  cut_year: number;
  target: string;
  mae_log10: number;
  rmse_log10: number;
  mae_log10_naive_median: number;
  median_factor_error: number;
  p90_factor_error: number;
  interval_coverage_p10_p90: number;
  median_interval_width_factor: number;
  interval_ordered_pct: number;
  loss_quantiles_usd: Record<string, number>;
  evaluated_on: string;
}

export interface DataProvenance {
  dataset_card_generated_at: string | null;
  sources: unknown;
  exploitation_question: string;
  severity_question: string;
  train_anchor: string;
  test_anchor: string;
}

export interface RiskModelFile {
  schema_version: number;
  generated_at: string;
  generator: string;
  /**
   * Copied by train.py from the dataset card, never asserted there. `false` means the
   * artefact was produced from fixtures and no figure derived from it may be presented as
   * a measurement. The UI is required to surface this.
   */
  data_is_real: boolean;
  data_provenance: DataProvenance;
  exploitation: {
    feature_names: string[];
    gbm: GbmModel;
    calibration: IsotonicMap;
    metrics: ExploitationMetrics;
  };
  severity: {
    feature_names: string[];
    unit: 'log10_usd';
    mean: GbmModel;
    p10: GbmModel;
    p90: GbmModel;
    metrics: SeverityMetrics;
  };
  parity_max_abs_delta: Record<string, number>;
}

/** Held-out rows the browser must reproduce to within 1e-9. See ml/train.py:575. */
export interface ParityFixture {
  note: string;
  exploitation: {
    feature_names: string[];
    rows: number[][];
    expected_raw: number[];
    expected_probability: number[];
    expected_calibrated: number[];
  };
  severity: {
    feature_names: string[];
    rows: number[][];
    expected_log10_mean: number[];
    expected_log10_p10: number[];
    expected_log10_p90: number[];
  };
}
