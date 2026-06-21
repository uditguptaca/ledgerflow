'use client';

import React from 'react';
import toast, { Toaster as HotToaster } from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/20/solid';

// Toaster setup to be mounted in the App root
export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 5000,
      }}
    />
  );
};

interface ToastMessageProps {
  id: string;
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ id, visible, type, title, description }) => {
  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
    error: <XCircleIcon className="w-5 h-5 text-rose-500" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
  };

  const borders = {
    success: 'border-l-4 border-l-emerald-500',
    error: 'border-l-4 border-l-rose-500',
    warning: 'border-l-4 border-l-amber-500',
    info: 'border-l-4 border-l-blue-500',
  };

  return (
    <div
      className={`${
        visible ? 'animate-fade-in' : 'opacity-0 scale-95'
      } max-w-sm w-full bg-white shadow-soft rounded-xl border border-slate-200/80 p-4 flex gap-3 pointer-events-auto transition-all duration-300 ${borders[type]}`}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => toast.dismiss(id)}
        className="shrink-0 p-0.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export const showToast = {
  success: (title: string, description?: string) => {
    toast.custom((t) => (
      <ToastMessage
        id={t.id}
        visible={t.visible}
        type="success"
        title={title}
        description={description}
      />
    ));
  },
  error: (title: string, description?: string) => {
    toast.custom((t) => (
      <ToastMessage
        id={t.id}
        visible={t.visible}
        type="error"
        title={title}
        description={description}
      />
    ));
  },
  warning: (title: string, description?: string) => {
    toast.custom((t) => (
      <ToastMessage
        id={t.id}
        visible={t.visible}
        type="warning"
        title={title}
        description={description}
      />
    ));
  },
  info: (title: string, description?: string) => {
    toast.custom((t) => (
      <ToastMessage
        id={t.id}
        visible={t.visible}
        type="info"
        title={title}
        description={description}
      />
    ));
  },
};

export { toast };
export default showToast;
