'use client';

import { ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  icon,
  ariaLabel,
  fullWidth = false,
}: ButtonProps) {
  // Base classes
  const baseClasses = 'font-medium transition-all duration-200 ease-in-out focus:outline-none';
  
  // Variant specific classes
  const variantClasses = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 shadow-sm hover:shadow',
    icon: 'bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200 shadow-sm hover:shadow rounded-full',
  };
  
  // Size specific classes
  const sizeClasses = {
    small: 'text-xs px-3 py-1 rounded',
    medium: 'text-sm px-4 py-2 rounded-md',
    large: 'text-base px-6 py-3 rounded-lg',
  };
  
  // Special case for icon buttons
  const iconSizeClasses = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3',
  };
  
  // Disabled classes
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variant === 'icon' ? iconSizeClasses[size] : sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    widthClass,
    className,
  ].join(' ');
  
  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-center gap-2">
        {icon && <span className="button-icon">{icon}</span>}
        {children}
      </div>
    </button>
  );
}
