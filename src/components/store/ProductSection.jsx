import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

export default function ProductSection({
  title,
  subtitle,
  products = [],
  variants = {},
  onAddToCart,
  showViewAll = true,
  viewAllLink,
  className = '',
  badge,
  badgeColor = 'bg-pink-500'
}) {
  if (!products.length) return null;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            {badge &&
            <span className={`inline-block px-3 py-1 ${badgeColor} text-white text-xs font-bold rounded-full mb-3`}>
                {badge}
              </span>
            }
            <h2 className="text-3xl md:text-4xl font-bold text-white mx-auto">{title}</h2>
            {subtitle &&
            <p className="text-zinc-400 mt-2">{subtitle}</p>
            }
          </div>
          
          {showViewAll && viewAllLink &&
          <Link to={viewAllLink}>
              <Button variant="ghost" className="text-pink-400 hover:text-pink-300 group">
                View All
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          }
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
          {products.map((product, index) =>
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}>

              <ProductCard
              product={product}
              variants={variants[product.id] || []}
              onAddToCart={onAddToCart} />

            </motion.div>
          )}
        </div>
      </div>
    </section>);

}