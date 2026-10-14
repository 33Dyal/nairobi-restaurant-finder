import { create } from "zustand";

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push(message, type = "success") {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismiss(id), 5000);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  success: (m) => useToastStore.getState().push(m, "success"),
  error: (m) => useToastStore.getState().push(m, "error"),
};
