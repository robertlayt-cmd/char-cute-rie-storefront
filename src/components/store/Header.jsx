import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingBag, Menu, X, User, LogIn, UserPlus, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function Header({ cartCount = 0, onCartClick, categories = [] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setAtTop(window.scrollY < 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const navLinks = [
    { label: 'Home', to: createPageUrl('Home') },
    { label: 'Shop All', to: createPageUrl('Shop') },
    ...categories.slice(0, 4).map(cat => ({
      label: cat.name,
      to: `${createPageUrl('Shop')}?category=${cat.slug}`
    }))
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50 py-2' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo - centered on mobile */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0">
              <img 
                src="https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png" 
                alt="Char'Cute'rie" 
                className={`transition-all duration-300 ${atTop ? 'h-16 md:h-20' : 'h-10 md:h-12'}`}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map(link => (
                <Link 
                  key={link.to}
                  to={link.to}
                  className="text-white/80 hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <a 
                href="https://www.tiktok.com/@char.cute.rie" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={() => setUserMenuOpen(v => !v)}
                >
                  {currentUser?.profile_image_url
                    ? <img src={currentUser.profile_image_url} className="w-7 h-7 rounded-full object-cover hidden lg:block" alt="" />
                    : null}
                  <User className={`h-5 w-5 ${currentUser?.profile_image_url ? 'lg:hidden' : ''}`} />
                </Button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      {currentUser ? (
                        <>
                          <div className="px-4 py-3 border-b border-zinc-800">
                            <p className="text-white text-sm font-medium truncate">{currentUser.full_name}</p>
                            <p className="text-zinc-400 text-xs truncate">{currentUser.email}</p>
                          </div>
                          <Link
                            to={createPageUrl('Profile')}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                          >
                            <Settings className="w-4 h-4" />
                            Edit Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-zinc-300 hover:text-red-400 hover:bg-zinc-800 transition-colors text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { base44.auth.redirectToLogin(window.location.href); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                          >
                            <LogIn className="w-4 h-4" />
                            Login
                          </button>
                          <button
                            onClick={() => { base44.auth.redirectToLogin(window.location.href); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                          >
                            <UserPlus className="w-4 h-4" />
                            Register
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/10"
                onClick={onCartClick || (() => window.location.href = createPageUrl('Cart'))}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-zinc-900 z-50 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <img 
                  src="https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png" 
                  alt="Char'Cute'rie" 
                  className="h-10"
                />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <nav className="flex flex-col gap-1 flex-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-lg text-white/80 hover:text-white hover:bg-zinc-800 transition-colors py-2.5 px-3 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-white/10 my-4" />
                <a 
                  href="https://www.tiktok.com/@char.cute.rie" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-lg text-white/80 hover:text-pink-400 transition-colors py-2.5 px-3 rounded-lg"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  Follow on TikTok
                </a>
              </nav>

              {/* Mobile user section */}
              <div className="mt-auto pt-4 border-t border-zinc-800">
                {currentUser ? (
                  <div className="space-y-1">
                    <p className="text-zinc-400 text-xs px-3 mb-2">{currentUser.full_name}</p>
                    <Link to={createPageUrl('Profile')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-zinc-300 hover:text-white py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors">
                      <Settings className="w-4 h-4" /> Edit Profile
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 text-zinc-300 hover:text-red-400 py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="w-full flex items-center gap-2 text-zinc-300 hover:text-white py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors">
                      <LogIn className="w-4 h-4" /> Login
                    </button>
                    <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="w-full flex items-center gap-2 text-zinc-300 hover:text-white py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors">
                      <UserPlus className="w-4 h-4" /> Register
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}