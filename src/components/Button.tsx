
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-focus focus:ring-primary',
    secondary: 'bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-slate-500',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
      {children}
    </button>
  );
};

export default Button;