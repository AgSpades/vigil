import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dashed';
  onClick?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  interactive = false,
  padding = 'md',
  variant = 'default',
  onClick
}: CardProps) {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-8 md:p-[80px]'
  };

  const variantMap = {
    default: 'bg-vigil-bgSec border border-vigil-borderSubtle',
    dashed: 'bg-vigil-bgPri border border-dashed border-vigil-borderSubtle text-vigil-textSec'
  };

  return (
    <div 
      onClick={onClick}
      className={`
        ${variantMap[variant]} 
        rounded-[4px] 
        ${paddingMap[padding]} 
        ${interactive ? 'hover:border-vigil-accentPri transition-colors duration-200 cursor-pointer' : ''} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
