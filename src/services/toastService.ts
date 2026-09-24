export type ToastType = 'success' | 'edit' | 'delete' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.toasts]));
  }

  public show(type: ToastType, title: string, description: string, duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, type, title, description, duration };
    this.toasts = [newToast, ...this.toasts.slice(0, 4)];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  public remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  public success(title: string, description: string) {
    this.show('success', title, description);
  }

  public edit(title: string, description: string) {
    this.show('edit', title, description);
  }

  public delete(title: string, description: string) {
    this.show('delete', title, description);
  }

  public info(title: string, description: string) {
    this.show('info', title, description);
  }

  public warning(title: string, description: string) {
    this.show('warning', title, description);
  }

  public error(title: string, description: string) {
    this.show('warning', title, description);
  }
}

export const toastService = new ToastManager();
