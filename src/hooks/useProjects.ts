import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Project, WakeLog } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_wake_at' | 'display_order' | 'tags'> & { tags?: string[] }) => {
    if (!user) throw new Error('Not authenticated');

    const maxOrder = projects.reduce((max, p) => Math.max(max, p.display_order), 0);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...project,
        user_id: user.id,
        display_order: maxOrder + 1,
        tags: project.tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    setProjects((prev) => [...prev, data]);
    return data;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const refreshProject = async (id: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    }
    return data;
  };

  const updateProjectOrder = async (updatedProjects: Project[]) => {
    const updates = updatedProjects.map((project, index) => ({
      id: project.id,
      display_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('projects')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (error) throw error;
    }

    setProjects(updatedProjects);
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    refreshProject,
    updateProjectOrder,
  };
}

export function useProjectLogs(projectId: string | null) {
  const [logs, setLogs] = useState<WakeLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wake_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, fetchLogs };
}
