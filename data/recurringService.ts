import { categoryRepository } from '@/data/repositories/categoryRepository';
import { recurringOccurrenceRepository } from '@/data/repositories/recurringOccurrenceRepository';
import { recurringRuleRepository } from '@/data/repositories/recurringRuleRepository';
import { createId, nowIso, todayDateKey, toDateOnlyIso } from '@/domain/dateRange';
import { advanceRecurringDate } from '@/domain/recurring';
import { Category, RecurringOccurrence, RecurringRule, TransactionDraft } from '@/domain/types';

export interface PendingRecurringItem {
  occurrence: RecurringOccurrence;
  rule: RecurringRule;
  category?: Category;
}

export async function syncDueRecurringOccurrences(referenceDateKey: string = todayDateKey()): Promise<void> {
  const dueRules = await recurringRuleRepository.listActiveDue(referenceDateKey);

  for (const rule of dueRules) {
    let nextDate = rule.nextOccurrenceDate;

    while (nextDate <= referenceDateKey) {
      const existing = await recurringOccurrenceRepository.getByRuleAndDate(rule.id, nextDate);
      if (!existing) {
        const timestamp = nowIso();
        await recurringOccurrenceRepository.create({
          id: createId('occurrence'),
          ruleId: rule.id,
          plannedDate: nextDate,
          status: 'pending',
          confirmedTransactionId: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      nextDate = advanceRecurringDate(nextDate, rule.frequency, rule.intervalCount);
    }

    if (nextDate !== rule.nextOccurrenceDate) {
      await recurringRuleRepository.update({
        ...rule,
        nextOccurrenceDate: nextDate,
        updatedAt: nowIso(),
      });
    }
  }
}

export async function getPendingRecurringItems(): Promise<PendingRecurringItem[]> {
  await syncDueRecurringOccurrences();
  const [occurrences, rules, categories] = await Promise.all([
    recurringOccurrenceRepository.listPending(),
    recurringRuleRepository.listAll(),
    categoryRepository.listAll(),
  ]);

  const rulesById = Object.fromEntries(rules.map((rule) => [rule.id, rule]));
  const categoriesById = Object.fromEntries(categories.map((category) => [category.id, category]));

  const items: PendingRecurringItem[] = [];
  for (const occurrence of occurrences) {
    const rule = rulesById[occurrence.ruleId];
    if (!rule) {
      continue;
    }

    items.push({
      occurrence,
      rule,
      category: categoriesById[rule.categoryId],
    });
  }

  return items;
}

export function buildDraftFromPendingRecurring(item: PendingRecurringItem): TransactionDraft {
  return {
    type: item.rule.type,
    amountInput: (item.rule.amountMinor / 100).toFixed(2),
    categoryId: item.rule.categoryId,
    note: item.rule.note ?? '',
    occurredAt: toDateOnlyIso(item.occurrence.plannedDate),
  };
}

export async function markRecurringOccurrenceSkipped(occurrenceId: string): Promise<void> {
  await recurringOccurrenceRepository.markSkipped(occurrenceId, nowIso());
}
