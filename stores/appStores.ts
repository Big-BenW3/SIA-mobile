import { create } from 'zustand';
import { sessionApi } from '@/services/session.service';
import type { AppNotification } from '@/types';
import { ApiError } from '@/services/api';

interface NotificationState {
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  /** Server notification list (loaded per login). */
  list: AppNotification[];
  status: 'idle' | 'loading' | 'error';
  unread: number;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  list: [],
  status: 'idle',
  unread: 0,

  load: async () => {
    set({ status: 'loading' });
    try {
      const rows = await sessionApi.notifications();
      const list: AppNotification[] = (rows as unknown as {
        id: string; title: string; body: string; referenceId: string; isRead: boolean; sentAt: string;
      }[]).map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        postId: r.referenceId,
        read: r.isRead,
        createdAt: r.sentAt,
      }));
      set({ list, unread: list.filter((n) => !n.read).length, status: 'idle' });
    } catch {
      set({ status: 'error' });
    }
  },

  markRead: async (id) => {
    set((s) => ({
      list: s.list.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unread: Math.max(0, s.unread - (s.list.find((n) => n.id === id && !n.read) ? 1 : 0)),
    }));
    try {
      await sessionApi.markNotificationRead(id);
    } catch {
      // Row already flipped locally; server sync retries next load.
    }
  },

  markAllRead: async () => {
    const ids = get().list.filter((n) => !n.read).map((n) => n.id);
    set((s) => ({ list: s.list.map((n) => ({ ...n, read: true })), unread: 0 }));
    for (const id of ids) {
      try {
        await sessionApi.markNotificationRead(id);
      } catch {
        break;
      }
    }
  },
}));
