import { useState, useEffect, useCallback, useRef } from "react";
import {
  getEvaluation, getStatus, listEvaluations,
  Evaluation, ACTIVE_STATUSES
} from "../api/client";

// ─── Single evaluation hook with auto-polling ─────────────────────────────────

export function useEvaluation(evaluationId: string, pollInterval = 2500) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const intervalRef                 = useRef<NodeJS.Timeout | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getEvaluation(evaluationId);
      setEvaluation(data);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load evaluation");
      return null;
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const isActive = ACTIVE_STATUSES.includes(evaluation?.status as any);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isActive) return;
    intervalRef.current = setInterval(fetch, pollInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [evaluation?.status, fetch, pollInterval]);

  return { evaluation, loading, error, refetch: fetch };
}

// ─── Legacy alias so old imports still compile ────────────────────────────────
export const useProject = useEvaluation;

// ─── Evaluations list hook ────────────────────────────────────────────────────

export function useEvaluations(pollInterval = 8000) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading]         = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await listEvaluations();
      setEvaluations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const iv = setInterval(fetch, pollInterval);
    return () => clearInterval(iv);
  }, [fetch, pollInterval]);

  return { evaluations, loading, refetch: fetch };
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────
export const useProjects = useEvaluations;
