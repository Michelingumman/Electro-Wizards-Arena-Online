import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-2 rounded-lg bg-gray-800 border-2 border-gray-700',
          'text-white placeholder-gray-400',
          'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20',
          'transition-all duration-200',
          className
        )}
        {...props}
      />
    );
  }
);