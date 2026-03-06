import { useState, useRef, useEffect } from 'react';
import { ProjectTag } from '../../types';
import TagBadge from './TagBadge';
import { Plus } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: ProjectTag[];
  onChange: (tags: string[]) => void;
  onCreateTag: (name: string) => Promise<ProjectTag>;
  label?: string;
}

export default function TagSelector({ selectedTags, availableTags, onChange, onCreateTag, label }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const handleCreate = async () => {
    const name = newTagInput.trim();
    if (!name || creating) return;
    const existing = availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selectedTags.includes(existing.name)) {
        onChange([...selectedTags, existing.name]);
      }
      setNewTagInput('');
      return;
    }
    setCreating(true);
    try {
      const tag = await onCreateTag(name);
      onChange([...selectedTags, tag.name]);
      setNewTagInput('');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const selectedTagObjects = selectedTags
    .map((name) => availableTags.find((t) => t.name === name))
    .filter(Boolean) as ProjectTag[];

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-mono text-gray-500">{label}</label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div
          className="min-h-[36px] bg-dark-900 border border-dark-700 px-2 py-1.5 flex flex-wrap gap-1 items-center cursor-pointer hover:border-gray-600 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          {selectedTagObjects.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => toggleTag(tag.name)}
            />
          ))}
          {selectedTagObjects.length === 0 && (
            <span className="text-[10px] font-mono text-gray-600">selecionar tags...</span>
          )}
        </div>

        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-dark-800 border border-dark-700 shadow-lg">
            <div className="p-2 border-b border-dark-700 flex gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="nova tag..."
                className="flex-1 bg-dark-900 border border-dark-700 px-2 py-1 text-[10px] font-mono text-light-100 placeholder-gray-600 outline-none focus:border-accent/50"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newTagInput.trim() || creating}
                className="px-2 py-1 bg-dark-700 hover:bg-accent/20 border border-dark-700 hover:border-accent/40 text-gray-500 hover:text-accent transition-colors disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {availableTags.length === 0 && (
                <div className="px-3 py-2 text-[10px] font-mono text-gray-600">
                  nenhuma tag criada
                </div>
              )}
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <div
                    key={tag.id}
                    className="px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-dark-700/60 transition-colors"
                    onClick={() => toggleTag(tag.name)}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className={`text-[10px] font-mono flex-1 ${isSelected ? 'text-light-100' : 'text-gray-500'}`}>
                      {tag.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] text-accent font-mono">selecionado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
