import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const showAbout = settings?.page_about_active !== false;
  const showShipping = settings?.page_shipping_active !== false;
  const showReturns = settings?.page_returns_active !== false;
  const showContact = settings?.page_contact_active !== false;

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <img 
              src="https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png" 
              alt="Char'Cute'rie" 
              className="h-12 mb-4"
            />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Handcrafted polymer clay earrings & accessories with a cute, 
              food-inspired twist. Made with love in Australia 🇦🇺
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to={createPageUrl('Shop')} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link to={`${createPageUrl('Shop')}?category=earrings`} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                  Earrings
                </Link>
              </li>
              <li>
                <Link to={`${createPageUrl('Shop')}?category=brooches`} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                  Brooches
                </Link>
              </li>
              <li>
                <Link to={`${createPageUrl('Shop')}?category=decor`} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                  Decor
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-3">
              {showShipping && (
                <li>
                  <Link to={createPageUrl('Shipping')} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                    Shipping Info
                  </Link>
                </li>
              )}
              {showReturns && (
                <li>
                  <Link to={createPageUrl('Returns')} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                    Returns & Refunds
                  </Link>
                </li>
              )}
              {showContact && (
                <li>
                  <Link to={createPageUrl('Contact')} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
              )}
              {showAbout && (
                <li>
                  <Link to={createPageUrl('About')} className="text-zinc-400 hover:text-pink-400 transition-colors text-sm">
                    About Us
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-4 mb-6">
              <a 
                href="https://www.tiktok.com/@char.cute.rie" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-pink-500 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-pink-500 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
            <p className="text-zinc-500 text-sm">
              📍 Melbourne, Australia
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            © 2024 Char'Cute'rie. All rights reserved.
          </p>
          <p className="text-zinc-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> in Australia
          </p>
        </div>
      </div>
    </footer>
  );
}