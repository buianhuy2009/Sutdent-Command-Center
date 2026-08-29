import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { ConfirmationModalState } from '../types';

interface ConfirmationModalProps {
  modal: ConfirmationModalState;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ modal, onClose }) => {
  if (!modal.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      id="confirmation-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="confirmation-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              modal.isDestructive
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {modal.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              {modal.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            id="modal-cancel-button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {modal.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            id="modal-confirm-button"
            onClick={async () => {
              await modal.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm flex items-center gap-1.5 transition-all ${
              modal.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            {modal.confirmLabel || 'Confirm Action'}
          </button>
        </div>
      </div>
    </div>
  );
};
