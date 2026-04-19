import { defaultCategories } from '@/data/defaultCategories';

describe('defaultCategories', () => {
  it('ships the expected Chinese category names', () => {
    expect(defaultCategories.map((item) => item.name)).toEqual([
      '\u9910\u996e',
      '\u4ea4\u901a',
      '\u65e5\u7528',
      '\u8d2d\u7269',
      '\u5a31\u4e50',
      '\u5c45\u4f4f',
      '\u533b\u7597',
      '\u5176\u4ed6',
      '\u5de5\u8d44',
      '\u62a5\u9500',
      '\u5176\u4ed6',
    ]);
  });

  it('uses stable ids so bootstrap can repair duplicates', () => {
    expect(defaultCategories.map((item) => item.id)).toEqual([
      'cat_food',
      'cat_transit',
      'cat_daily',
      'cat_shopping',
      'cat_fun',
      'cat_home',
      'cat_health',
      'cat_other_expense',
      'cat_salary',
      'cat_reimburse',
      'cat_other_income',
    ]);
  });
});
