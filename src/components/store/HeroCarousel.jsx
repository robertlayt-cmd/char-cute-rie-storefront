import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroCarousel({ products = [], categories = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [products.length]);

  if (!products.length) return null;

  const currentProduct = products[currentIndex];

  const getCategoryLabel = (product) => {
    if (!categories.length || !product.category_id) return null;
    const cat = categories.find(c => c.id === product.category_id);
    if (!cat) return null;
    if (cat.parent_id) {
      const parent = categories.find(c => c.id === cat.parent_id);
      return parent ? `${parent.name} — ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const navigate = (dir) => {
    setDirection(dir);
    setCurrentIndex((prev) => {
      if (dir === 1) return (prev + 1) % products.length;
      return (prev - 1 + products.length) % products.length;
    });
  };

  return (
    <div className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={{
            enter: { opacity: 0 },
            center: { opacity: 1 },
            exit: { opacity: 0 }
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${currentProduct.main_image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200'})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full pt-20">
          {/* Text Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {currentProduct.title}
              </h1>

              {(() => {
                const label = getCategoryLabel(currentProduct);
                const cat = categories.find(c => c.id === currentProduct.category_id);
                if (!label || !cat) return null;
                return (
                  <Link
                    to={`${createPageUrl('Shop')}?category=${cat.slug}`}
                    className="inline-block px-4 py-1.5 bg-pink-500/20 border border-pink-500/30 text-pink-400 text-sm font-medium rounded-full mb-6 hover:bg-pink-500/30 hover:border-pink-500/50 transition-all"
                  >
                    {label}
                  </Link>
                );
              })()}
              
              <div className="flex items-center gap-4 justify-center lg:justify-start mb-8">
                <span className="text-3xl font-bold text-white">
                  ${currentProduct.base_price?.toFixed(2)}
                </span>
                {currentProduct.compare_price > currentProduct.base_price && (
                  <span className="text-xl text-zinc-500 line-through">
                    ${currentProduct.compare_price?.toFixed(2)}
                  </span>
                )}
              </div>

              <Link to={`${createPageUrl('Product')}?slug=${currentProduct.slug}`}>
                <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white px-8 btn-shine animate-glow">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Shop Now
                </Button>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Product Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-3xl blur-2xl" />
                <div className="relative glass rounded-3xl p-4 animate-float">
                  <img
                    src={currentProduct.main_image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'}
                    alt={currentProduct.title}
                    className="w-full aspect-square object-cover rounded-2xl"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 bottom-20 lg:bottom-4 lg:right-20 lg:left-auto z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="absolute right-4 bottom-20 lg:bottom-4 lg:right-4 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {products.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-pink-500' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}