import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      button: 'bg-[#ec5b13] hover:bg-[#ec5b13]/90 shadow-[#ec5b13]/20'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
    }
  };

  const activeColor = colors[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl animate-fade-in-scale border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`w-16 h-16 rounded-2xl ${activeColor.bg} flex items-center justify-center ${activeColor.icon} border border-white mb-2`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 active:scale-95 transition-all"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 px-4 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg ${activeColor.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
