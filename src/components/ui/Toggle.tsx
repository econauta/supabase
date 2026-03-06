interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-10 items-center transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-1 focus:ring-offset-dark-900 border ${
          checked ? 'bg-accent/20 border-accent/60' : 'bg-dark-900 border-dark-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-3 w-3 transform border transition-transform duration-150 ${
            checked ? 'translate-x-5 bg-accent border-accent' : 'translate-x-1 bg-gray-600 border-gray-600'
          }`}
        />
      </button>
      {label && (
        <span className="text-xs text-gray-500">{label}</span>
      )}
    </label>
  );
}
