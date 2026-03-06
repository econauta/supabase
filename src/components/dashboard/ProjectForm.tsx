import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, ProjectTag } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';
import TagSelector from '../ui/TagSelector';
import { testConnection } from '../../lib/wakeService';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onDelete?: (project: Project) => void;
  project?: Project | null;
  availableTags: ProjectTag[];
  onCreateTag: (name: string) => Promise<ProjectTag>;
}

export interface ProjectFormData {
  name: string;
  supabase_url: string;
  anon_key: string;
  interval_hours: number;
  is_active: boolean;
  tags: string[];
}

export default function ProjectForm({ isOpen, onClose, onSubmit, onDelete, project, availableTags, onCreateTag }: ProjectFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setName(project.name);
      setSupabaseUrl(project.supabase_url);
      setAnonKey(project.anon_key);
      setIsActive(project.is_active);
      setSelectedTags(project.tags || []);
    } else {
      setName('');
      setSupabaseUrl('');
      setAnonKey('');
      setIsActive(true);
      setSelectedTags([]);
    }
    setTestResult(null);
    setErrors({});
  }, [project, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = t('projectForm.nameRequired');
    if (!supabaseUrl.trim()) newErrors.supabase_url = t('projectForm.urlRequired');
    else if (!supabaseUrl.includes('supabase.co')) newErrors.supabase_url = t('projectForm.invalidUrl');
    if (!anonKey.trim()) newErrors.anon_key = t('projectForm.anonKeyRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTest = async () => {
    if (!supabaseUrl || !anonKey) {
      setTestResult({ success: false, message: t('projectForm.fillUrlAndKey') });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const result = await testConnection(supabaseUrl, anonKey);
    setTestResult(result);
    setTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        supabase_url: supabaseUrl.trim(),
        anon_key: anonKey.trim(),
        interval_hours: 24,
        is_active: isActive,
        tags: selectedTags,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? t('projectForm.editTitle') : t('projectForm.addTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label={t('projectForm.projectName')}
          placeholder={t('projectForm.projectNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <Input
          id="supabase_url"
          label={t('projectForm.supabaseUrl')}
          placeholder={t('projectForm.supabaseUrlPlaceholder')}
          value={supabaseUrl}
          onChange={(e) => setSupabaseUrl(e.target.value)}
          error={errors.supabase_url}
        />

        <Input
          id="anon_key"
          label={t('projectForm.anonKey')}
          type="password"
          placeholder={t('projectForm.anonKeyPlaceholder')}
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          error={errors.anon_key}
        />

        <TagSelector
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={setSelectedTags}
          onCreateTag={onCreateTag}
          label={t('projectForm.tags')}
        />

        <div className="pt-1">
          <Toggle
            checked={isActive}
            onChange={setIsActive}
            label={t('projectForm.activeToggle')}
          />
        </div>

        <div className="pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTest}
            loading={testing}
            className="w-full"
          >
            {t('projectForm.testConnection')}
          </Button>

          {testResult && (
            <div className={`mt-2 px-3 py-2 border text-xs font-mono flex items-start gap-2 ${
              testResult.success
                ? 'bg-dark-900 border-accent/40 text-accent'
                : 'bg-dark-900 border-red-500/40 text-red-400'
            }`}>
              <span className="font-bold shrink-0">{testResult.success ? '[OK]' : '[ERR]'}</span>
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-dark-700">
          {project && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                onDelete(project);
                onClose();
              }}
            >
              [rm]
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t('projectForm.cancel')}
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {project ? t('projectForm.saveChanges') : t('projectForm.addProject')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
