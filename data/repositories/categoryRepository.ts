import * as SQLite from 'expo-sqlite';

import { getDatabase } from '@/data/db';
import { Category, CategoryType } from '@/domain/types';

interface CategoryRow {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  sort_order: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sort_order,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveDb(db?: SQLite.SQLiteDatabase) {
  return db ?? getDatabase();
}

export const categoryRepository = {
  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories;');
    return row?.count ?? 0;
  },

  async listAll(): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY sort_order ASC, name ASC;');
    return rows.map(mapCategory);
  },

  async getById(id: string): Promise<Category | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ? LIMIT 1;', [id]);
    return row ? mapCategory(row) : null;
  },

  async create(category: Category, db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync(
      `INSERT INTO categories (
        id, name, type, color, icon, sort_order, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        category.id,
        category.name,
        category.type,
        category.color,
        category.icon,
        category.sortOrder,
        category.isDefault ? 1 : 0,
        category.createdAt,
        category.updatedAt,
      ]
    );
  },

  async createMany(categories: Category[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    for (const category of categories) {
      await this.create(category, database);
    }
  },

  async clearAll(db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await database.runAsync('DELETE FROM categories;');
  },

  async replaceAll(categories: Category[], db?: SQLite.SQLiteDatabase): Promise<void> {
    const database = await resolveDb(db);
    await this.clearAll(database);
    await this.createMany(categories, database);
  },

  async reconcileDefaults(categories: Category[]): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories WHERE is_default = 1 ORDER BY type ASC, sort_order ASC, created_at ASC;'
    );

    for (const category of categories) {
      const aliases = existing.filter(
        (row) => row.is_default === 1 && row.type === category.type && row.sort_order === category.sortOrder
      );
      const canonicalCreatedAt = aliases[0]?.created_at ?? category.createdAt;

      await db.runAsync(
        `INSERT INTO categories (
          id, name, type, color, icon, sort_order, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          type = excluded.type,
          color = excluded.color,
          icon = excluded.icon,
          sort_order = excluded.sort_order,
          is_default = excluded.is_default,
          updated_at = excluded.updated_at;`,
        [
          category.id,
          category.name,
          category.type,
          category.color,
          category.icon,
          category.sortOrder,
          category.isDefault ? 1 : 0,
          canonicalCreatedAt,
          category.updatedAt,
        ]
      );

      for (const alias of aliases) {
        if (alias.id === category.id) {
          continue;
        }

        await db.runAsync('UPDATE transactions SET category_id = ? WHERE category_id = ?;', [
          category.id,
          alias.id,
        ]);
        await db.runAsync('UPDATE summary_snapshots SET top_category_id = ? WHERE top_category_id = ?;', [
          category.id,
          alias.id,
        ]);
        await db.runAsync('DELETE FROM categories WHERE id = ?;', [alias.id]);
      }
    }
  },
};
