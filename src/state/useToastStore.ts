import { create } from 'zustand';

interface ToastMessage {
  message: string;
  variant?: 'default' | 'success' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toast?: ToastMessage;
  showToast: (toast: ToastMessage) => void;
  hideToast: () => void;
}

const VISIBLE_MS = 5000;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  toast: undefined,
  showToast: (toast) => {
    clearTimeout(hideTimer);
    set({ toast });
    hideTimer = setTimeout(() => set({ toast: undefined }), VISIBLE_MS);
  },
  hideToast: () => {
    clearTimeout(hideTimer);
    set({ toast: undefined });
  },
}));
