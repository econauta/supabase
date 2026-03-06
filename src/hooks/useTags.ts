import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectTag } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TAG_COLOR = '#adb5bd';

export function useTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('project_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw error;
      setTags(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = async (name: string, color?: string): Promise<ProjectTag> => {
    if (!user) throw new Error('Not authenticated');
    const tagColor = color || TAG_COLOR;
    const { data, error } = await supabase
      .from('project_tags')
      .insert({ user_id: user.id, name: name.trim(), color: tagColor })
      .select()
      .single();
    if (error) throw error;
    setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('project_tags').delete().eq('id', id);
    if (error) throw error;
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  return { tags, loading, fetchTags, createTag, deleteTag };
}
