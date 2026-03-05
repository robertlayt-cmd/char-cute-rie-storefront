import React from 'react';
import { motion } from 'framer-motion';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  const parentCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      <motion.button
        key="all"
        whileHover={{ scale: 1.05 }}
        onClick={() => onSelectCategory('all')}
        className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
          selectedCategory === 'all'
            ? 'bg-pink-500 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        All Products
      </motion.button>

      {parentCategories.map((cat) => (
        <motion.button
          key={cat.id}
          whileHover={{ scale: 1.05 }}
          onClick={() => onSelectCategory(cat.slug)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
            selectedCategory === cat.slug
              ? 'bg-pink-500 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {cat.name}
        </motion.button>
      ))}
    </div>
  );
}