import React from 'react';

export const Card = ({ children, className = '', noPadding = false, onClick = undefined }: any) => (
  <div 
    onClick={onClick}
    className={`bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl overflow-hidden ${onClick ? 'cursor-pointer hover:bg-slate-800/60 transition-colors' : ''} ${noPadding ? '' : 'p-5'} ${className}`}
  >
    {children}
  </div>
);