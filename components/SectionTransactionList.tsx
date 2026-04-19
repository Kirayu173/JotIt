import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '@/constants/theme';
import { Category, LedgerSection, TransactionRecord } from '@/domain/types';

import { TransactionRow } from './TransactionRow';

export function SectionTransactionList({
  sections,
  categoriesById,
  loading,
  onPressTransaction,
  ListHeaderComponent,
  onEndReached,
  emptyMessage,
}: {
  sections: LedgerSection[];
  categoriesById: Record<string, Category>;
  loading: boolean;
  onPressTransaction: (transaction: TransactionRecord) => void;
  ListHeaderComponent?: React.ReactElement | null;
  onEndReached?: () => void;
  emptyMessage: string;
}) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.container}
      ListHeaderComponent={ListHeaderComponent}
      onEndReachedThreshold={0.3}
      onEndReached={onEndReached}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TransactionRow transaction={item} category={categoriesById[item.categoryId]} onPress={() => onPressTransaction(item)} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  emptyContainer: { flexGrow: 1, paddingBottom: 120 },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: palette.background,
  },
  sectionTitle: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  separator: { height: spacing.sm, backgroundColor: 'transparent' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: palette.textMuted, fontSize: 14 },
});

