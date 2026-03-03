import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import ProductCard from '@/components/store/ProductCard';
import MiniCart from '@/components/store/MiniCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Minus, Plus, Star, Heart, Share2, Check, AlertCircle, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function Product() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }),
  });

  const { data: allVariants = [] } = useQuery({
    queryKey: ['variants'],
    queryFn: () => base44.entities.ProductVariant.list(),
  });

  const product = products.find(p => p.slug === slug);
  const variants = allVariants.filter(v => v.product_id === product?.id).sort((a, b) => a.display_order - b.display_order);
  
  useEffect(() => {
    if (variants.length && !selectedVariant) {
      setSelectedVariant(variants.find(v => v.is_default) || variants[0]);
    }
  }, [variants, selectedVariant]);

  const variantsByProduct = allVariants.reduce((acc, v) => {
    if (!acc[v.product_id]) acc[v.product_id] = [];
    acc[v.product_id].push(v);
    return acc;
  }, {});

  const relatedProducts = products
    .filter(p => p.id !== product?.id && p.category_id === product?.category_id)
    .slice(0, 4);

  if (!product) {
    return (
      <div className="dark min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product not found</h1>
          <Link to={createPageUrl('Shop')}>
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = [
    selectedVariant?.image_url || product.main_image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean);

  const currentPrice = product.base_price + (selectedVariant?.price_adjustment || 0);
  const inStock = selectedVariant ? selectedVariant.stock_quantity > 0 : true;
  const stockLevel = selectedVariant?.stock_quantity || 0;

  const handleAddToCart = () => {
    const existingIndex = cartItems.findIndex(
      item => item.product_id === product.id && item.variant_id === selectedVariant?.id
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        variant_id: selectedVariant?.id,
        product_title: product.title,
        variant_name: selectedVariant?.name,
        price: currentPrice,
        quantity,
        image_url: selectedVariant?.image_url || product.main_image_url
      }]);
    }
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    setCartOpen(true);
  };

  const handleUpdateQuantity = (item, newQty) => {
    if (newQty < 1) {
      handleRemoveItem(item);
      return;
    }
    setCartItems(cartItems.map(i => 
      i.product_id === item.product_id && i.variant_id === item.variant_id
        ? { ...i, quantity: newQty }
        : i
    ));
  };

  const handleRemoveItem = (item) => {
    setCartItems(cartItems.filter(i => 
      !(i.product_id === item.product_id && i.variant_id === item.variant_id)
    ));
  };

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header 
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        categories={categories}
      />

      <MiniCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="text-sm mb-8">
            <ol className="flex items-center gap-2 text-zinc-400">
              <li><Link to={createPageUrl('Home')} className="hover:text-white">Home</Link></li>
              <li>/</li>
              <li><Link to={createPageUrl('Shop')} className="hover:text-white">Shop</Link></li>
              <li>/</li>
              <li className="text-white">{product.title}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <motion.div 
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900"
              >
                <img
                  src={images[selectedImage] || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-pink-500 text-white">
                      {product.badge === 'tiktok' ? '📱 TikTok Fave' : `✨ ${product.badge}`}
                    </Badge>
                  </div>
                )}
              </motion.div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === i ? 'border-pink-500' : 'border-transparent hover:border-zinc-600'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{product.title}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < (product.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} 
                    />
                  ))}
                </div>
                <span className="text-zinc-400">({product.review_count || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</span>
                {product.compare_price > product.base_price && (
                  <span className="text-xl text-zinc-500 line-through">${product.compare_price.toFixed(2)}</span>
                )}
                {product.compare_price > product.base_price && (
                  <Badge className="bg-green-500 text-white">
                    Save ${(product.compare_price - product.base_price).toFixed(2)}
                  </Badge>
                )}
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-white font-medium mb-3">
                    Colour: <span className="text-pink-400">{selectedVariant?.name}</span>
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          if (variant.image_url) setSelectedImage(0);
                        }}
                        className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                          selectedVariant?.id === variant.id 
                            ? 'border-pink-500 scale-110' 
                            : 'border-transparent hover:border-zinc-600'
                        } ${variant.stock_quantity === 0 ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: variant.color_hex || '#888' }}
                        title={variant.name}
                      >
                        {selectedVariant?.id === variant.id && (
                          <Check className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-lg" />
                        )}
                        {variant.stock_quantity === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-zinc-400 rotate-45" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  stockLevel <= 5 ? (
                    <span className="text-orange-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Only {stockLevel} left in stock!
                    </span>
                  ) : (
                    <span className="text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      In Stock
                    </span>
                  )
                ) : (
                  <span className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Sold Out
                  </span>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center border border-zinc-700 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!inStock}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center text-white">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(stockLevel || 99, quantity + 1))}
                    disabled={!inStock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  size="lg"
                  className={`flex-1 btn-shine ${addedToCart ? 'bg-green-500' : 'bg-pink-500 hover:bg-pink-600'}`}
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Add to Cart - ${(currentPrice * quantity).toFixed(2)}
                    </>
                  )}
                </Button>

                <Button variant="outline" size="icon" className="border-zinc-700">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="border-zinc-700">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Shipping Info */}
              <div className="bg-zinc-900 rounded-xl p-4 mb-8">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Truck className="w-5 h-5 text-pink-400" />
                  <span>Free shipping on orders over $75 AUD</span>
                </div>
              </div>

              {/* Description Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="bg-zinc-900 w-full">
                  <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                  <TabsTrigger value="materials" className="flex-1">Materials</TabsTrigger>
                  <TabsTrigger value="care" className="flex-1">Care</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="text-zinc-300 mt-4 leading-relaxed">
                  {product.description || 'No description available.'}
                </TabsContent>
                <TabsContent value="materials" className="text-zinc-300 mt-4 leading-relaxed">
                  {product.materials || 'Handcrafted from premium polymer clay with stainless steel findings.'}
                </TabsContent>
                <TabsContent value="care" className="text-zinc-300 mt-4 leading-relaxed">
                  {product.care_instructions || 'Store in a cool, dry place. Avoid contact with water and perfumes. Handle with care.'}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="text-2xl font-bold text-white mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    variants={variantsByProduct[p.id] || []}
                    onAddToCart={(prod, variant) => {
                      const price = prod.base_price + (variant?.price_adjustment || 0);
                      setCartItems([...cartItems, {
                        product_id: prod.id,
                        variant_id: variant?.id,
                        product_title: prod.title,
                        variant_name: variant?.name,
                        price,
                        quantity: 1,
                        image_url: variant?.image_url || prod.main_image_url
                      }]);
                      setCartOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}