import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-slide-up border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-white">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all focus:outline-none"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-8 py-8 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
