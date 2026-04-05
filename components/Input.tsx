import React from 'react';

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`bg-vigil-bgSec border border-vigil-borderSubtle rounded-sm text-vigil-textPri text-[15px] px-4 h-[52px] focus:outline-none focus:border-vigil-borderActive transition-colors duration-200 placeholder:text-vigil-textTer ${className}`}
      {...props} 
    />
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea 
      className={`bg-vigil-bgSec border border-vigil-borderSubtle rounded-sm text-vigil-textPri text-[15px] p-4 min-h-[52px] focus:outline-none focus:border-vigil-borderActive transition-colors duration-200 placeholder:text-vigil-textTer ${className}`}
      {...props} 
    />
  );
}
