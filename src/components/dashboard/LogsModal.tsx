import { useTranslation } from 'react-i18next';
import { Project, WakeLog } from '../../types';
import Modal from '../ui/Modal';
import { useProjectLogs } from '../../hooks/useProjects';
import { Loader2 } from 'lucide-react';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function LogsModal({ isOpen, onClose, project }: LogsModalProps) {
  const { t } = useTranslation();
  const { logs, loading } = useProjectLogs(project?.id || null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? t('logsModal.title', { projectName: project.name }) : 'Logs'}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12 text-xs text-gray-600 gap-2 font-mono">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span>loading logs</span>
          <span className="animate-blink text-accent">_</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 font-mono text-xs text-gray-600 space-y-1">
          <div># tail -f ./logs</div>
          <div className="text-gray-500">{t('logsModal.empty')}</div>
          <div className="text-gray-500">{t('logsModal.emptyHint')}</div>
        </div>
      ) : (
        <div className="space-y-1 font-mono text-xs">
          <div className="text-gray-600 pb-1 border-b border-dark-700/50 flex items-center gap-2">
            <span className="text-accent">#</span>
            <span>tail -n {logs.length} ./wake.log</span>
          </div>
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} formatDate={formatDate} />
          ))}
        </div>
      )}
    </Modal>
  );
}

function LogEntry({ log, formatDate }: { log: WakeLog; formatDate: (d: string) => string }) {
  const { t } = useTranslation();

  return (
    <div className={`flex items-start gap-2 py-1 border-b border-dark-700/20 ${log.success ? '' : 'text-red-400/80'}`}>
      <span className={`shrink-0 font-bold ${log.success ? 'text-accent' : 'text-red-400'}`}>
        {log.success ? '[OK]' : '[ERR]'}
      </span>
      <span className="text-gray-600 shrink-0">{formatDate(log.created_at)}</span>
      {log.error_message && (
        <span className="text-red-400/70 truncate">{log.error_message}</span>
      )}
    </div>
  );
}
