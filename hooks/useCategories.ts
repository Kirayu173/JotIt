import { useEffect, useMemo, useState } from 'react';

import { categoryRepository } from '@/data/repositories/categoryRepository';
import { Category } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';

export function useCategories() {
  const ready = useAppStore((state) => state.ready);
  const refreshKey = useAppStore((state) => state.refreshKey);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!ready) return;
      setLoading(true);
      const items = await categoryRepository.listAll();
      if (active) {
        setCategories(items);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [ready, refreshKey]);

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])), [categories]);

  return { categories, categoriesById, loading };
}
