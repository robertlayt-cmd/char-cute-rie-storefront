import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import ProductCard from '@/components/store/ProductCard';
import MiniCart from '@/components/store/MiniCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Shop() {
  const urlParams = new URLSearchParams(window.location.search);
  const categorySlug = urlParams.get('category');
  const filterType = urlParams.get('filter');

  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [gridCols, setGridCols] = useState(4);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedBadges, setSelectedBadges] = useState(filterType ? [filterType] : []);

  // Sync category from URL when navigating via header links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedCategory(params.get('category') || 'all');
  }, [window.location.search]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }, 'display_order'),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }),
  });

  const { data: allVariants = [] } = useQuery({
    queryKey: ['variants'],
    queryFn: () => base44.entities.ProductVariant.list(),
  });

  const variantsByProduct = allVariants.reduce((acc, v) => {
    if (!acc[v.product_id]) acc[v.product_id] = [];
    acc[v.product_id].push(v);
    return acc;
  }, {});

  // Filter products
  let filtered = products.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory !== 'all') {
      const cat = categories.find(c => c.slug === selectedCategory);
      if (cat && p.category_id !== cat.id) return false;
    }
    if (p.base_price < priceRange[0] || p.base_price > priceRange[1]) return false;
    if (selectedBadges.length > 0) {
      if (selectedBadges.includes('tiktok') && !p.is_tiktok_featured) return false;
      if (!selectedBadges.includes('tiktok') && !selectedBadges.includes(p.badge)) return false;
    }
    return true;
  });

  // Sort products
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.created_date) - new Date(a.created_date);
      case 'price-low': return a.base_price - b.base_price;
      case 'price-high': return b.base_price - a.base_price;
      case 'name': return a.title.localeCompare(b.title);
      default: return 0;
    }
  });

  const handleAddToCart = (product, variant) => {
    const price = product.base_price + (variant?.price_adjustment || 0);
    const existingIndex = cartItems.findIndex(
      item => item.product_id === product.id && item.variant_id === variant?.id
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        variant_id: variant?.id,
        product_title: product.title,
        variant_name: variant?.name,
        price,
        quantity: 1,
        image_url: variant?.image_url || product.main_image_url
      }]);
    }
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

  const toggleBadge = (badge) => {
    setSelectedBadges(prev => 
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  const currentCategory = categories.find(c => c.slug === selectedCategory);

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

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {currentCategory?.name || 'All Products'}
          </h1>
          <p className="text-zinc-400 text-lg">
            {currentCategory?.description || 'Discover our handcrafted collection of cute polymer clay creations'}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="md:sticky md:top-16 z-30 bg-zinc-900/90 backdrop-blur-lg border-y border-zinc-800 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Category */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden border-zinc-700">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-zinc-900 border-zinc-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">Badges</h4>
                    <div className="space-y-2">
                      {['new', 'hot', 'limited', 'tiktok', 'bestseller'].map(badge => (
                        <div key={badge} className="flex items-center gap-2">
                          <Checkbox
                            id={badge}
                            checked={selectedBadges.includes(badge)}
                            onCheckedChange={() => toggleBadge(badge)}
                          />
                          <label htmlFor={badge} className="text-zinc-300 capitalize">{badge}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Grid Toggle */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className={gridCols === 3 ? 'text-pink-400' : 'text-zinc-400'}
                onClick={() => setGridCols(3)}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={gridCols === 4 ? 'text-pink-400' : 'text-zinc-400'}
                onClick={() => setGridCols(4)}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedBadges.length > 0 || search) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full">
                  Search: {search}
                  <button onClick={() => setSearch('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBadges.map(badge => (
                <span key={badge} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-500/20 text-pink-400 text-sm rounded-full">
                  {badge}
                  <button onClick={() => toggleBadge(badge)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-zinc-400 mb-6">{filtered.length} products</p>

        {isLoading ? (
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridCols} gap-4 md:gap-6`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-zinc-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
            <p className="text-zinc-400 mb-6">Try adjusting your filters or search</p>
            <Button onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedBadges([]); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <motion.div 
            layout
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridCols} gap-4 md:gap-6`}
          >
            <AnimatePresence>
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variantsByProduct[product.id] || []}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}