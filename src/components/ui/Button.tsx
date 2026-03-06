import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide';

    const variants = {
      primary: 'bg-accent text-dark-900 hover:bg-accent/85 border border-accent',
      secondary: 'bg-transparent text-gray-400 hover:text-light-100 border border-dark-700 hover:border-gray-600',
      danger: 'bg-transparent text-gray-500 hover:text-red-400 border border-dark-700 hover:border-red-500/50',
      ghost: 'bg-transparent text-gray-500 hover:text-light-100 border border-transparent hover:border-dark-700',
    };

    const sizes = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3.5 py-1.5 text-xs',
      lg: 'px-5 py-2.5 text-sm',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
