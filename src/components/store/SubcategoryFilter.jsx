import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function SubcategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  const categoryTree = useMemo(() => {
    const parents = categories.filter(c => !c.parent_id);
    return parents.map(parent => ({
      ...parent,
      children: categories.filter(c => c.parent_id === parent.id)
    }));
  }, [categories]);

  const selectedCat = categories.find(c => c.slug === selectedCategory);
  const selectedParent = selectedCat?.parent_id 
    ? categories.find(c => c.id === selectedCat.parent_id)
    : selectedCat && !selectedCat.parent_id ? selectedCat : null;

  const children = selectedParent 
    ? categories.filter(c => c.parent_id === selectedParent.id)
    : [];

  if (selectedCategory === 'all' || !selectedParent || children.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 pt-4 border-t border-zinc-800"
    >
      <h3 className="text-zinc-300 font-medium mb-3">{selectedParent.name}</h3>
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => onSelectCategory(selectedParent.slug)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedCategory === selectedParent.slug
              ? 'bg-pink-500 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          All {selectedParent.name}
        </motion.button>

        {children
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((child) => (
            <motion.button
              key={child.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => onSelectCategory(child.slug)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === child.slug
                  ? 'bg-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {child.name}
            </motion.button>
          ))}
      </div>
    </motion.div>
  );
}