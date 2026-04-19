import { create } from 'zustand';

import { bootstrapDatabase } from '@/data/bootstrap';
import { TransactionDraft, TransactionRecord, TransactionSource } from '@/domain/types';

interface ComposerState {
  visible: boolean;
  transactionId?: string;
  initialDraft?: Partial<TransactionDraft>;
  source?: TransactionSource;
  sourceRefId?: string | null;
  recurringOccurrenceId?: string;
}

interface OpenCreateComposerOptions {
  draft?: Partial<TransactionDraft>;
  source?: TransactionSource;
  sourceRefId?: string | null;
  recurringOccurrenceId?: string;
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
  openCreateComposer: (options?: OpenCreateComposerOptions) => void;
  openEditComposer: (transactionId: string) => void;
  closeComposer: () => void;
  setUndoCandidate: (transaction?: TransactionRecord) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  initializing: false,
  refreshKey: 0,
  composer: { visible: false, source: 'manual' },
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
  openCreateComposer(options) {
    set({
      composer: {
        visible: true,
        source: options?.source ?? 'manual',
        sourceRefId: options?.sourceRefId ?? null,
        recurringOccurrenceId: options?.recurringOccurrenceId,
        initialDraft: options?.draft,
      },
    });
  },
  openEditComposer(transactionId) {
    set({ composer: { visible: true, transactionId, source: 'manual' } });
  },
  closeComposer() {
    set({ composer: { visible: false, transactionId: undefined, source: 'manual' } });
  },
  setUndoCandidate(transaction) {
    set({ undoCandidate: transaction });
  },
}));
