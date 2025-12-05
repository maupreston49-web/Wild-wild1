import React from 'react';

export const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-6 py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-t border-white/10",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50",
    outline: "border-2 border-emerald-600/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};