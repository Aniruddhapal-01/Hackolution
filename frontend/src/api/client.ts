import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL, timeout: 120000 });

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvaluationStatus =
  | "created" | "analyzing" | "fetching_data"
  | "stress_testing" | "generating_report" | "ready" | "failed";

export type DatasetType = "image" | "tabular" | "sequential" | "time_series" | "vector";
export type RiskLevel   = "low" | "medium" | "high" | "critical";

export interface StressTestResult {
  id: string;
  stressor_key: string;
  stressor_label: string;
  severity: number;
  original_score: number;
  stressed_score: number;
  degradation_pct: number;
  confidence_stability: number;
  sample_count: number;
  passed: boolean;
  notes: string;
}

export interface DatasetRecord {
  id: string;
  source: "kaggle" | "huggingface" | "roboflow" | "synthetic";
  dataset_name: string;
  dataset_url: string;
  size_bytes: number;
  sample_count: number;
  target_stressor: string;
  description: string;
}

export interface EdgeCase {
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  stressor: string;
  description: string;
}

export interface Evaluation {
  id: string;
  name: string;
  description?: string;
  dataset_type?: DatasetType;
  architecture?: string;
  optimizer?: string;
  learning_rate?: number;
  epochs?: number;
  batch_size?: number;
  framework?: string;
  embedding_dim?: number;
  input_size?: string;
  metric_accuracy?: number;
  metric_precision?: number;
  metric_recall?: number;
  metric_f1?: number;
  metric_map?: number;
  metric_roc_auc?: number;
  model_filename?: string;
  model_size_bytes?: number;
  status: EvaluationStatus;
  progress: number;
  current_stage?: string;
  error_message?: string;
  detected_task_type?: string;
  scope_summary?: string;
  edge_case_analysis?: EdgeCase[];
  vulnerability_vector?: Record<string, number>;
  weakness_report?: {
    weaknesses: string[];
    metrics_analysis: any[];
    risk_factors: string[];
  };
  fetched_datasets?: any[];
  total_test_samples: number;
  stress_results?: StressTestResult[];
  augmentation_comparison?: {
    per_stressor: Array<{
      stressor_key: string;
      stressor_label: string;
      before_score: number;
      after_score: number;
      improvement_abs: number;
      improvement_pct: number;
      was_failing: boolean;
      now_passing: boolean;
    }>;
    before_avg_accuracy: number;
    after_avg_accuracy: number;
    accuracy_gain: number;
    before_passing: number;
    after_passing: number;
    tests_recovered: number;
    projected_robustness: number;
    current_robustness: number;
    recommendation: string;
  };
  robustness_score?: number;
  risk_level?: RiskLevel;
  deployment_ready?: boolean;
  report_url?: string;
  stress_test_results: StressTestResult[];
  dataset_records: DatasetRecord[];
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationCreate {
  name: string;
  description?: string;
  dataset_type?: string;
  architecture?: string;
  optimizer?: string;
  learning_rate?: number;
  epochs?: number;
  batch_size?: number;
  framework?: string;
  embedding_dim?: number;
  input_size?: string;
  metric_accuracy?: number;
  metric_precision?: number;
  metric_recall?: number;
  metric_f1?: number;
  metric_map?: number;
  metric_roc_auc?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const createEvaluation = (body: EvaluationCreate) =>
  api.post<Evaluation>("/api/evaluations", body).then(r => r.data);

export const listEvaluations = () =>
  api.get<Evaluation[]>("/api/evaluations").then(r => r.data);

export const getEvaluation = (id: string) =>
  api.get<Evaluation>(`/api/evaluations/${id}`).then(r => r.data);

export const deleteEvaluation = (id: string) =>
  api.delete(`/api/evaluations/${id}`).then(r => r.data);

export const patchEvaluation = (id: string, payload: Partial<EvaluationCreate>) =>
  api.patch(`/api/evaluations/${id}`, payload).then(r => r.data);

export const uploadModel = (id: string, file: File, onProgress?: (pct: number) => void) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/api/evaluations/${id}/upload-model`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: e => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  }).then(r => r.data);
};

export const runEvaluation = (id: string) =>
  api.post(`/api/evaluations/${id}/run`).then(r => r.data);

export const getStatus = (id: string) =>
  api.get(`/api/evaluations/${id}/status`).then(r => r.data);

export const brainstormEdgeCases = (id: string) =>
  api.get(`/api/evaluations/${id}/brainstorm`).then(r => r.data);

// ─── Status helpers ───────────────────────────────────────────────────────────

export const ACTIVE_STATUSES: EvaluationStatus[] = [
  "analyzing", "fetching_data", "stress_testing", "generating_report"
];

export const STATUS_LABELS: Record<EvaluationStatus, string> = {
  created:           "Ready to Run",
  analyzing:         "Analyzing Model",
  fetching_data:     "Fetching Datasets",
  stress_testing:    "Stress Testing",
  generating_report: "Generating Report",
  ready:             "Complete",
  failed:            "Failed",
};

export const STATUS_COLORS: Record<EvaluationStatus, string> = {
  created:           "text-slate-400 bg-slate-900/50 border-slate-700",
  analyzing:         "text-blue-300 bg-blue-950/50 border-blue-700",
  fetching_data:     "text-violet-300 bg-violet-950/50 border-violet-700",
  stress_testing:    "text-amber-300 bg-amber-950/50 border-amber-700",
  generating_report: "text-cyan-300 bg-cyan-950/50 border-cyan-700",
  ready:             "text-emerald-300 bg-emerald-950/50 border-emerald-700",
  failed:            "text-red-300 bg-red-950/50 border-red-700",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low:      "text-emerald-400",
  medium:   "text-amber-400",
  high:     "text-orange-400",
  critical: "text-red-400",
};

export const RISK_BG: Record<RiskLevel, string> = {
  low:      "bg-emerald-500/10 border-emerald-500/30",
  medium:   "bg-amber-500/10 border-amber-500/30",
  high:     "bg-orange-500/10 border-orange-500/30",
  critical: "bg-red-500/10 border-red-500/30",
};
