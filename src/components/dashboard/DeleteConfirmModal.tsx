import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  project: Project | null;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  project,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('deleteModal.title')} size="sm">
      <div className="font-mono text-xs space-y-4">
        <div className="bg-dark-900 border border-red-500/30 p-3 space-y-1">
          <div className="flex items-center gap-2 text-red-400">
            <span className="font-bold">[WARN]</span>
            <span>{t('deleteModal.confirm', { projectName: project?.name })}</span>
          </div>
          <div className="text-gray-600 ml-8">{t('deleteModal.warning')}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('deleteModal.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading} className="flex-1">
            {t('deleteModal.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
