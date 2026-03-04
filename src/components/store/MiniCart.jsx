import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiniCart({ isOpen, onClose, items = [], onUpdateQuantity, onRemoveItem }) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          
          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pink-500" />
                Your Cart ({items.length})
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-10 h-10 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 mb-4">Your cart is empty</p>
                  <Button onClick={onClose} variant="outline">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.product_id}-${item.variant_id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 bg-zinc-800/50 rounded-xl p-3"
                    >
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100'}
                        alt={item.product_title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm line-clamp-1">
                          {item.product_title}
                        </h4>
                        {item.variant_name && (
                          <p className="text-zinc-400 text-xs">{item.variant_name}</p>
                        )}
                        <p className="text-pink-400 font-semibold mt-1">
                          ${item.price.toFixed(2)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-zinc-700 hover:bg-zinc-600"
                              onClick={() => onUpdateQuantity(item, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-zinc-700 hover:bg-zinc-600"
                              onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-red-400"
                            onClick={() => onRemoveItem(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-zinc-800 p-4 space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-zinc-500">Shipping calculated at checkout</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link to={createPageUrl('Cart')} onClick={onClose}>
                    <Button variant="outline" className="w-full border-zinc-600 text-white hover:bg-zinc-700 hover:text-white">
                      View Cart
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Checkout')} onClick={onClose}>
                    <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                      Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}