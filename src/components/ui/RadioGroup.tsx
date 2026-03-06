import { SelectHTMLAttributes, forwardRef } from 'react';

interface RadioGroupProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

export default function RadioGroup({ label, options, value, onChange, name }: RadioGroupProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
          <span className="text-accent">#</span> {label}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-colors ${
              value === option.value
                ? 'border-accent/60 text-accent bg-accent/10'
                : 'border-dark-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className={`w-2 h-2 border ${value === option.value ? 'bg-accent border-accent' : 'border-gray-600'}`} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
