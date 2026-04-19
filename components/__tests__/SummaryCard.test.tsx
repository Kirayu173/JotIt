import { render } from '@testing-library/react-native';

import { SummaryCard } from '@/components/SummaryCard';

describe('SummaryCard', () => {
  it('renders insight rows', () => {
    const { getByText } = render(<SummaryCard insights={[{ id: '1', text: '\u652f\u51fa\u8f83\u4e0a\u4e00\u5468\u671f\u589e\u52a0 12%\u3002' }]} />);
    expect(getByText('\u81ea\u52a8\u603b\u7ed3')).toBeTruthy();
    expect(getByText('\u652f\u51fa\u8f83\u4e0a\u4e00\u5468\u671f\u589e\u52a0 12%\u3002')).toBeTruthy();
  });
});
