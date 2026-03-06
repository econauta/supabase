import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export default function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  const variants = {
    success: 'text-accent border-accent/50',
    warning: 'text-yellow-400 border-yellow-500/50',
    error: 'text-red-400 border-red-500/50',
    info: 'text-gray-400 border-gray-500/50',
    neutral: 'text-gray-500 border-dark-700',
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium border ${variants[variant]} ${className}`}
      {...props}
    >
      [{children}]
    </span>
  );
}
