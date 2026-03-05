import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function SubcategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  const [expanded, setExpanded] = useState(false);
  
  const selectedCat = categories.find(c => c.slug === selectedCategory);
  const children = selectedCat && !selectedCat.parent_id 
    ? categories.filter(c => c.parent_id === selectedCat.id)
    : [];

  if (selectedCategory === 'all' || !selectedCat || children.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors mb-3"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        <span className="font-medium">Subcategories</span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => onSelectCategory(selectedCategory)}
            className="px-3 py-1.5 rounded-lg text-sm bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
          >
            All in {selectedCat.name}
          </motion.button>

          {children.map((child) => (
            <motion.button
              key={child.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => onSelectCategory(child.slug)}
              className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {child.name}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}