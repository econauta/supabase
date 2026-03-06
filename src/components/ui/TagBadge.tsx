interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'xs';
}

export default function TagBadge({ name, color, onRemove, onClick, active, size = 'sm' }: TagBadgeProps) {
  const sizeClasses = size === 'xs' ? 'text-[9px] px-1.5 pt-[3px] pb-[1px]' : 'text-[10px] px-2 pt-[3px] pb-[1px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono border transition-colors ${sizeClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${active ? 'border-opacity-80' : 'border-opacity-30 hover:border-opacity-60'}`}
      style={{
        color: active ? color : `${color}cc`,
        borderColor: active ? color : `${color}55`,
        backgroundColor: active ? `${color}22` : `${color}0d`,
      }}
      onClick={onClick}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 -translate-y-px"
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
          style={{ color }}
        >
          ×
        </button>
      )}
    </span>
  );
}
