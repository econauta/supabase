import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
            <span className="text-accent">#</span> {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-accent text-xs select-none">&gt;</span>
          <input
            ref={ref}
            id={id}
            className={"w-full pl-8 pr-3 py-2 bg-dark-900 border text-light-100 placeholder-gray-600 text-sm transition-colors duration-150 focus:outline-none focus:border-accent " + (
              error ? "border-red-500/70" : "border-dark-700 hover:border-gray-600"
            ) + " " + className}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
