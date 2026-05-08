import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "created" | "training_lora" | "scanning" | "generating" | "labeling" | "ready" | "failed";
  progress: number;
  current_stage?: string;
  model_endpoint?: string;
  vulnerability_vector?: Record<string, number>;
  dataset_url?: string;
  image_count: number;
  label_count: number;
  seed_images: { id: string; filename: string; url: string }[];
  generated_images: { 
    id: string; 
    stressor: string; 
    storage_key: string; 
    confidence_score: number 
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface StatusResponse {
  project_id: string;
  status: string;
  progress: number;
  current_stage?: string;
  celery_state?: string;
  image_count: number;
  label_count: number;
  error_message?: string;
}

export interface VulnerabilityResponse {
  vulnerability_vector: Record<string, number>;
  blind_spots_found: number;
  stressor_details: Record<string, { label: string; confidence: number }>;
}

export interface DatasetResponse {
  project_id: string;
  download_url: string;
  image_count: number;
  label_count: number;
  vulnerability_vector: Record<string, number>;
  format: string;
  expires_in_seconds?: number;
}

// ─── Project API ─────────────────────────────────────────────────────────────

export const createProject = async (name: string, description?: string) => {
  const response = await api.post("/api/projects", { name, description });
  return response.data as Project;
};

export const listProjects = async () => {
  const response = await api.get("/api/projects");
  return response.data as Project[];
};

export const getProject = async (id: string) => {
  const response = await api.get(`/api/projects/${id}`);
  return response.data as Project;
};

export const deleteProject = async (id: string) => {
  await api.delete(`/api/projects/${id}`);
  return { deleted: true };
};

export const uploadSeedImages = async (projectId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  
  const response = await api.post(`/api/projects/${projectId}/seed-images`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  
  return response.data;
};

export const setModelEndpoint = (projectId: string, endpoint: string) =>
  api.post(`/api/projects/${projectId}/model-endpoint`, { endpoint }).then((r: { data: any }) => r.data);

export const trainLora = (projectId: string) =>
  api.post(`/api/projects/${projectId}/train-lora`).then((r: { data: any }) => r.data);

export const runAdversarialScan = (projectId: string) =>
  api.post<VulnerabilityResponse>(`/api/projects/${projectId}/run-adversarial-scan`).then((r: { data: VulnerabilityResponse }) => r.data);

export const triggerGeneration = (projectId: string) =>
  api.post(`/api/projects/${projectId}/generate`).then((r: { data: any }) => r.data);

export const getStatus = async (projectId: string): Promise<StatusResponse> => {
  const response = await api.get(`/api/projects/${projectId}/status`);
  return response.data;
};

export const getDataset = (projectId: string) =>
  api.get<DatasetResponse>(`/api/projects/${projectId}/dataset`).then((r: { data: DatasetResponse }) => r.data);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  training_lora: "Training LoRA",
  scanning: "Scanning",
  generating: "Generating",
  labeling: "Labeling",
  ready: "Ready",
  failed: "Failed",
};

export const STATUS_COLORS: Record<string, string> = {
  created: "text-gray-400 bg-gray-900 border-gray-700",
  training_lora: "text-blue-300 bg-blue-950 border-blue-700",
  scanning: "text-amber-300 bg-amber-950 border-amber-700",
  generating: "text-purple-300 bg-purple-950 border-purple-700",
  labeling: "text-cyan-300 bg-cyan-950 border-cyan-700",
  ready: "text-emerald-300 bg-emerald-950 border-emerald-700",
  failed: "text-red-300 bg-red-950 border-red-700",
};
