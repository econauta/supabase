import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../types';
import { useProjects } from '../hooks/useProjects';
import { useTags } from '../hooks/useTags';
import { useAllProjectsHealth } from '../hooks/useProjectHealth';
import { useToast, ToastContainer } from '../components/ui/Toast';
import Header from '../components/layout/Header';
import StatsPanel from '../components/dashboard/StatsPanel';
import ProjectCard from '../components/dashboard/ProjectCard';
import ProjectForm, { ProjectFormData } from '../components/dashboard/ProjectForm';
import EmptyState from '../components/dashboard/EmptyState';
import HelpSection from '../components/dashboard/HelpSection';
import LogsModal from '../components/dashboard/LogsModal';
import DeleteConfirmModal from '../components/dashboard/DeleteConfirmModal';
import ProjectDetailsModal from '../components/dashboard/ProjectDetailsModal';
import TagBadge from '../components/ui/TagBadge';
import Button from '../components/ui/Button';
import { wakeProject, logWakeAttempt } from '../lib/wakeService';
import { Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function Dashboard() {
  const { t } = useTranslation();
  const { projects, loading, fetchProjects, createProject, updateProject, deleteProject, updateProjectOrder } = useProjects();
  const { tags, createTag } = useTags();
  const { toasts, addToast, removeToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const prevIdsRef = useRef<string>('');
  const projectIds = useMemo(() => {
    const ids = projects.map(p => p.id);
    const serialized = JSON.stringify(ids);
    if (serialized === prevIdsRef.current) {
      return JSON.parse(prevIdsRef.current) as string[];
    }
    prevIdsRef.current = serialized;
    return ids;
  }, [projects]);
  const { healthMap, loading: healthLoading, refresh: refreshHealth } = useAllProjectsHealth(projectIds);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [logsProject, setLogsProject] = useState<Project | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [deleteProject_, setDeleteProject] = useState<Project | null>(null);
  const [wakingAll, setWakingAll] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);

  const filteredProjects = useMemo(() => {
    if (activeTagFilters.length === 0) return projects;
    return projects.filter((p) =>
      activeTagFilters.every((tag) => (p.tags || []).includes(tag))
    );
  }, [projects, activeTagFilters]);

  const toggleTagFilter = (tagName: string) => {
    setActiveTagFilters((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, data);
        addToast('success', t('dashboard.projectUpdated'));
      } else {
        await createProject(data);
        addToast('success', t('dashboard.projectAdded'));
      }
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('dashboard.projectSaveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteProject_) return;
    try {
      await deleteProject(deleteProject_.id);
      addToast('success', t('dashboard.projectDeleted'));
      setDeleteProject(null);
    } catch (error) {
      addToast('error', t('dashboard.projectDeleteFailed'));
    }
  };

  const handleWakeAll = async () => {
    const activeProjects = projects.filter((p) => p.is_active);
    if (activeProjects.length === 0) {
      addToast('warning', t('dashboard.noActiveProjects'));
      return;
    }

    setWakingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const project of activeProjects) {
      const result = await wakeProject(project);
      await logWakeAttempt(project.id, result);
      if (result.success) successCount++;
      else failCount++;
    }

    await fetchProjects();
    await refreshHealth();

    if (failCount === 0) {
      addToast('success', t('dashboard.allProjectsWoke', { count: successCount }));
    } else {
      addToast('warning', t('dashboard.partialWake', { successCount, failCount }));
    }

    setWakingAll(false);
  };

  const handleWakeComplete = async () => {
    await fetchProjects();
    await refreshHealth();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);

      const newProjects = arrayMove(projects, oldIndex, newIndex);

      try {
        await updateProjectOrder(newProjects);
      } catch (error) {
        addToast('error', t('dashboard.reorderFailed'));
        await fetchProjects();
      }
    }
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const openAddForm = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const tagsInUse = useMemo(() => {
    const usedNames = new Set(projects.flatMap((p) => p.tags || []));
    return tags.filter((t) => usedNames.has(t.name));
  }, [projects, tags]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xs font-mono text-gray-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-gray-500">loading projects</span>
          <span className="animate-blink text-accent">_</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />

      <main className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          <StatsPanel projects={filteredProjects} healthMap={healthMap} activeTagFilters={activeTagFilters} allTags={tags} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-accent">#</span>
              <span className="text-gray-500">{t('dashboard.title')}</span>
              <span className="text-gray-600">
                ({activeTagFilters.length > 0 ? `${filteredProjects.length}/${projects.length}` : projects.length})
              </span>
            </div>
            <div className="flex gap-2">
              {projects.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleWakeAll} loading={wakingAll}>
                  {t('dashboard.wakeAll')}
                </Button>
              )}
              <Button size="sm" onClick={openAddForm}>
                + {t('dashboard.addProject')}
              </Button>
            </div>
          </div>

          {tagsInUse.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-mono text-gray-600 mr-1">{t('dashboard.filterByTag')}:</span>
              {tagsInUse.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onClick={() => toggleTagFilter(tag.name)}
                  active={activeTagFilters.includes(tag.name)}
                  size="xs"
                />
              ))}
              {activeTagFilters.length > 0 && (
                <button
                  onClick={() => setActiveTagFilters([])}
                  className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors ml-1"
                >
                  [limpar]
                </button>
              )}
            </div>
          )}

          <HelpSection />

          {projects.length === 0 ? (
            <EmptyState onAddProject={openAddForm} />
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-gray-600">
              {t('dashboard.noProjectsWithTag')}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredProjects.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      health={healthMap[project.id] || null}
                      healthLoading={healthLoading}
                      availableTags={tags}
                      onEdit={openEditForm}
                      onViewLogs={setLogsProject}
                      onViewDetails={setDetailsProject}
                      onWakeComplete={handleWakeComplete}
                      onToast={addToast}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'ease',
              }}>
                {activeId ? (
                  <div className="opacity-100">
                    <ProjectCard
                      project={projects.find((p) => p.id === activeId)!}
                      health={healthMap[activeId] || null}
                      healthLoading={healthLoading}
                      availableTags={tags}
                      onEdit={() => {}}
                      onViewLogs={() => {}}
                      onViewDetails={() => {}}
                      onWakeComplete={() => Promise.resolve()}
                      onToast={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
      </main>

      <ProjectForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={setDeleteProject}
        project={editingProject}
        availableTags={tags}
        onCreateTag={createTag}
      />

      <LogsModal
        isOpen={!!logsProject}
        onClose={() => setLogsProject(null)}
        project={logsProject}
      />

      <ProjectDetailsModal
        isOpen={!!detailsProject}
        onClose={() => setDetailsProject(null)}
        project={detailsProject}
      />

      <DeleteConfirmModal
        isOpen={!!deleteProject_}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDelete}
        project={deleteProject_}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
