import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'px-4 py-2 rounded-lg font-medium transition-all duration-200',
          {
            'bg-purple-600 hover:bg-purple-700 text-white': variant === 'primary',
            'bg-gray-800 hover:bg-gray-700 text-white': variant === 'secondary',
            'border-2 border-purple-600 text-purple-600 hover:bg-purple-50':
              variant === 'outline',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);