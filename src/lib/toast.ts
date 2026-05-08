// ─── Lightweight module-level toast system ────────────────────────────────────
// Works without React context — any component can call toast.success() directly.
// The Toaster component subscribes and renders the queue.

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (items: ToastItem[]) => void;

let _items: ToastItem[] = [];
let _listeners: Listener[] = [];
let _nextId = 1;

function publish() {
  const snapshot = [..._items];
  _listeners.forEach(l => l(snapshot));
}

function add(message: string, type: ToastType, duration = 4000) {
  const id = _nextId++;
  _items = [..._items, { id, message, type }];
  publish();
  setTimeout(() => {
    _items = _items.filter(t => t.id !== id);
    publish();
  }, duration);
}

export const toast = {
  success: (msg: string) => add(msg, 'success'),
  error:   (msg: string) => add(msg, 'error'),
  warning: (msg: string) => add(msg, 'warning'),
  info:    (msg: string) => add(msg, 'info'),
};

export function subscribe(listener: Listener): () => void {
  _listeners = [..._listeners, listener];
  listener([..._items]);
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}

export function dismiss(id: number) {
  _items = _items.filter(t => t.id !== id);
  publish();
}
