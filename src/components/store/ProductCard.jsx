import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingBag, Star, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const badgeStyles = {
  new: 'bg-green-500 text-white',
  hot: 'bg-orange-500 text-white',
  limited: 'bg-purple-500 text-white',
  tiktok: 'bg-gradient-to-r from-pink-500 to-cyan-400 text-white',
  bestseller: 'bg-yellow-500 text-black',
};

const badgeLabels = {
  new: '✨ New',
  hot: '🔥 Hot',
  limited: '⚡ Limited',
  tiktok: '📱 TikTok Fave',
  bestseller: '⭐ Bestseller',
};

export default function ProductCard({ product, variants = [], onAddToCart }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(variants.find(v => v.is_default) || variants[0]);
  
  const displayImage = selectedVariant?.image_url || product.main_image_url;
  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  const inStock = variants.length > 0 ? totalStock > 0 : true;

  const handleCardClick = () => {
    navigate(`${createPageUrl('Product')}?slug=${product.slug}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (onAddToCart && inStock) {
      const variantToAdd = selectedVariant || variants[0];
      onAddToCart(product, variantToAdd);
    }
  };

  const handleVariantClick = (e, variant) => {
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="product-card group h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-pink-500/30 transition-all flex flex-col h-full">
        
        {/* Image */}
        <div className="relative aspect-square overflow-hidden flex-shrink-0">
          <img
            src={displayImage || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3">
              <span className={`badge-pulse px-3 py-1 rounded-full text-xs font-bold ${badgeStyles[product.badge]}`}>
                {badgeLabels[product.badge]}
              </span>
            </div>
          )}

          {/* Sold Out Flag */}
          {!inStock && (
            <div className="absolute top-0 right-0 bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl z-10">
              SOLD OUT
            </div>
          )}

          {/* Quick Add + Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            className="absolute bottom-3 left-3 right-3 flex gap-2"
          >
            <Button 
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-semibold btn-shine"
              onClick={handleQuickAdd}
              disabled={!inStock}
            >
              <ShoppingBag className="w-4 h-4 mr-2 text-white" />
              {inStock ? 'Quick Add' : 'Sold Out'}
            </Button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-xl bg-zinc-900/80 flex items-center justify-center text-zinc-300 hover:text-pink-400 hover:bg-zinc-900 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.origin + `${createPageUrl('Product')}?slug=${product.slug}`); }}
              className="w-10 h-10 rounded-xl bg-zinc-900/80 flex items-center justify-center text-zinc-300 hover:text-pink-400 hover:bg-zinc-900 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Out of Stock Overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-medium">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Variant Swatches */}
          <div className="min-h-[24px] mb-3">
            {variants.length > 1 && (
              <div className="flex gap-1.5">
                {variants.slice(0, 5).map(variant => (
                  <button
                    key={variant.id}
                    onClick={(e) => handleVariantClick(e, variant)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selectedVariant?.id === variant.id 
                        ? 'border-pink-500 scale-110' 
                        : 'border-transparent hover:border-white/50'
                    }`}
                    style={{ backgroundColor: variant.color_hex || '#888' }}
                    title={variant.name}
                  />
                ))}
                {variants.length > 5 && (
                  <span className="text-xs text-zinc-500 self-center ml-1">+{variants.length - 5}</span>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-white font-medium mb-1 line-clamp-2 group-hover:text-pink-400 transition-colors">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < (product.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">({product.review_count || 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-lg font-bold text-white">
              ${(product.base_price + (selectedVariant?.price_adjustment || 0)).toFixed(2)}
            </span>
            {product.compare_price && product.compare_price > product.base_price && (
              <span className="text-sm text-zinc-500 line-through">
                ${product.compare_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}