import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, ProjectHealthSummary, ProjectTag } from '../../types';
import Button from '../ui/Button';
import TagBadge from '../ui/TagBadge';
import { wakeProject, logWakeAttempt } from '../../lib/wakeService';
import { ExternalLink, GripHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import HealthIndicator from './HealthIndicator';

interface ProjectCardProps {
  project: Project;
  health?: ProjectHealthSummary | null;
  healthLoading?: boolean;
  availableTags?: ProjectTag[];
  onEdit: (project: Project) => void;
  onViewLogs: (project: Project) => void;
  onViewDetails: (project: Project) => void;
  onWakeComplete: () => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

function formatLastWake(lastWakeAt: string | null, neverLabel: string): string {
  if (!lastWakeAt) return neverLabel;
  const diff = Date.now() - new Date(lastWakeAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '< 1min';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours > 0) return `${days}d ${remainingHours}h`;
  return `${days}d`;
}

function getLastWakeColor(lastWakeAt: string | null): string {
  if (!lastWakeAt) return 'text-gray-500';
  const diff = Date.now() - new Date(lastWakeAt).getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 5 ? 'text-red-400' : 'text-gray-500';
}

export default function ProjectCard({
  project,
  health,
  healthLoading,
  availableTags = [],
  onEdit,
  onViewLogs,
  onViewDetails,
  onWakeComplete,
  onToast,
}: ProjectCardProps) {
  const { t } = useTranslation();
  const [waking, setWaking] = useState(false);
  const [optimisticClearedIncident, setOptimisticClearedIncident] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    opacity: isDragging ? 0.4 : 1,
  };

  const handleWake = async () => {
    setWaking(true);
    const result = await wakeProject(project);
    await logWakeAttempt(project.id, result);
    onToast(result.success ? 'success' : 'error', result.message);
    if (result.success) {
      setOptimisticClearedIncident(true);
    }
    await onWakeComplete();
    setOptimisticClearedIncident(false);
    setWaking(false);
  };

  const effectiveHealth = health && optimisticClearedIncident
    ? { ...health, activeIncidents: 0 }
    : health;

  const getStatusText = () => {
    if (!project.is_active) return { text: 'INACTIVE', color: 'text-gray-600' };
    if (effectiveHealth?.activeIncidents && effectiveHealth.activeIncidents > 0) return { text: 'INCIDENT', color: 'text-red-400' };
    if (!project.last_wake_at) return { text: 'PENDING', color: 'text-yellow-400' };
    return { text: 'ONLINE', color: 'text-accent' };
  };

  const status = getStatusText();
  const lastWakeLabel = formatLastWake(project.last_wake_at, t('projectCard.never'));
  const urlSlug = project.supabase_url.replace('https://', '').split('.')[0];

  const projectTags = (project.tags || [])
    .map((name) => availableTags.find((t) => t.name === name))
    .filter(Boolean) as ProjectTag[];
  const visibleTags = projectTags.slice(0, 3);
  const extraTagCount = projectTags.length - visibleTags.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="will-change-transform"
    >
      <div className={`bg-dark-800 border ${isDragging ? 'border-accent/60' : 'border-dark-700'} transition-colors duration-150`}>
        <div className="bg-dark-700 px-3 py-1.5 flex items-center justify-between border-b border-dark-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-600 text-xs shrink-0">pid:0x{project.id.slice(0, 4)}</span>
            <span className="text-dark-700 shrink-0">|</span>
            <span className="text-light-100 text-xs font-medium truncate">{project.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-bold ${status.color}`}>{status.text}</span>
            <button
              className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors"
              {...attributes}
              {...listeners}
            >
              <GripHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {visibleTags.length > 0 && (
          <div className="px-3 py-1.5 border-b border-dark-700/60 flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} size="xs" />
            ))}
            {extraTagCount > 0 && (
              <span className="text-[9px] font-mono text-gray-600 self-center">+{extraTagCount}</span>
            )}
          </div>
        )}

        <div className="p-3 space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-16 shrink-0">host</span>
            <a
              href={project.supabase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-accent flex items-center gap-1 transition-colors truncate"
            >
              {urlSlug}.supabase.co
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-16 shrink-0">last_ping</span>
            <span className={getLastWakeColor(project.last_wake_at)}>{lastWakeLabel}</span>
          </div>

          <div className="border-t border-dark-700/60 pt-2 mt-2">
            <HealthIndicator
              health={effectiveHealth || null}
              loading={healthLoading}
              compact
              lastWake={lastWakeLabel}
            />
          </div>
        </div>

        <div className="border-t border-dark-700 px-3 py-2 flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={handleWake}
            loading={waking}
            disabled={!project.is_active}
            className="flex-1 text-xs"
          >
            {t('projectCard.wakeNow')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onViewDetails(project)} title={t('projectCard.viewDetails')}>
            [stats]
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onViewLogs(project)} title={t('projectCard.viewLogs')}>
            [logs]
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(project)} title={t('projectCard.edit')}>
            [edit]
          </Button>
        </div>
      </div>
    </div>
  );
}
