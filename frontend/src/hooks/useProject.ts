import { useState, useEffect, useCallback, useRef } from "react";
import { getProject, getStatus, Project, StatusResponse } from "../api/client";

const ACTIVE_STATUSES = ["training_lora", "scanning", "generating", "labeling"];

export function useProject(projectId: string, pollInterval = 3000) {
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const [proj, stat] = await Promise.all([
        getProject(projectId),
        getStatus(projectId),
      ]);
      setProject(proj);
      setStatus(stat);
      setError(null);
      return proj;
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load project");
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Poll while project is active
  useEffect(() => {
    const isActive = ACTIVE_STATUSES.includes(project?.status || "");
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(fetchProject, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [project?.status, fetchProject, pollInterval]);

  return { project, status, loading, error, refetch: fetchProject };
}

export function useProjects(pollInterval = 5000) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const { listProjects } = await import("../api/client");
      const data = await listProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const iv = setInterval(fetchProjects, pollInterval);
    return () => clearInterval(iv);
  }, [fetchProjects, pollInterval]);

  return { projects, loading, refetch: fetchProjects };
}
