import { fireEvent, render } from '@testing-library/react-native';

import { TransactionRow } from '@/components/TransactionRow';
import { Category, TransactionRecord } from '@/domain/types';

const category: Category = {
  id: 'food',
  name: 'Food',
  type: 'expense',
  color: '#E27D60',
  icon: 'F',
  sortOrder: 1,
  isDefault: true,
  createdAt: '',
  updatedAt: '',
};

const transaction: TransactionRecord = {
  id: '1',
  type: 'expense',
  amountMinor: 1234,
  currency: 'CNY',
  categoryId: 'food',
  occurredAt: '2026-04-18T08:00:00.000Z',
  note: 'Breakfast',
  source: 'manual',
  createdAt: '',
  updatedAt: '',
};

describe('TransactionRow', () => {
  it('shows category and note, and reacts to press', () => {
    const onPress = jest.fn();
    const { getAllByText, getByText } = render(
      <TransactionRow transaction={transaction} category={category} onPress={onPress} />
    );
    expect(getAllByText('Food').length).toBeGreaterThan(0);
    expect(getByText('Breakfast')).toBeTruthy();
    fireEvent.press(getByText('Breakfast'));
    expect(onPress).toHaveBeenCalled();
  });
});
