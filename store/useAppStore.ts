import { create } from 'zustand';

import { bootstrapDatabase } from '@/data/bootstrap';
import { TransactionRecord } from '@/domain/types';

interface ComposerState {
  visible: boolean;
  transactionId?: string;
}

interface AppState {
  ready: boolean;
  initializing: boolean;
  error?: string;
  refreshKey: number;
  composer: ComposerState;
  undoCandidate?: TransactionRecord;
  initialize: () => Promise<void>;
  bumpRefresh: () => void;
  openCreateComposer: () => void;
  openEditComposer: (transactionId: string) => void;
  closeComposer: () => void;
  setUndoCandidate: (transaction?: TransactionRecord) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  initializing: false,
  refreshKey: 0,
  composer: { visible: false },
  async initialize() {
    if (get().ready || get().initializing) return;
    set({ initializing: true, error: undefined });
    try {
      await bootstrapDatabase();
      set({ ready: true, initializing: false, refreshKey: get().refreshKey + 1 });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '\u521d\u59cb\u5316\u5931\u8d25', initializing: false });
    }
  },
  bumpRefresh() {
    set((state) => ({ refreshKey: state.refreshKey + 1 }));
  },
  openCreateComposer() {
    set({ composer: { visible: true } });
  },
  openEditComposer(transactionId) {
    set({ composer: { visible: true, transactionId } });
  },
  closeComposer() {
    set({ composer: { visible: false, transactionId: undefined } });
  },
  setUndoCandidate(transaction) {
    set({ undoCandidate: transaction });
  },
}));
