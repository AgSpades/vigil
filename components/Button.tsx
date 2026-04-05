import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger-ghost' 
}) {
  const baseClasses = "flex items-center justify-center font-medium uppercase tracking-[0.12em] transition-colors duration-200 rounded-sm";
  let variantClasses = "";
  
  if (variant === 'primary') {
    variantClasses = "bg-vigil-accentPri text-vigil-textPri hover:bg-vigil-accentSec text-[13px] h-[52px] px-8 disabled:bg-vigil-bgTer disabled:text-vigil-textTer disabled:cursor-not-allowed";
  } else if (variant === 'secondary') {
    variantClasses = "bg-transparent border border-vigil-borderSubtle text-vigil-textSec hover:border-vigil-borderActive hover:text-vigil-textPri text-[12px] h-[44px] px-6";
  } else if (variant === 'danger-ghost') {
    variantClasses = "bg-transparent border border-vigil-statusDownBorder text-vigil-statusDown hover:border-vigil-statusDown text-[12px] h-[44px] px-6";
  }
  
  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
