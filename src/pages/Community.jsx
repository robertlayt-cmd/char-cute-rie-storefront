import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ExternalLink, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

function MemberCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_30px_rgba(236,72,153,0.1)] flex flex-col"
    >
      <div className="relative h-40 overflow-hidden">
        {member.banner_image_url ? (
          <img src={member.banner_image_url} alt={member.business_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-900/40 to-purple-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
      </div>
      <div className="px-4 -mt-9">
        <div className="w-16 h-16 rounded-xl border-2 border-zinc-900 overflow-hidden bg-zinc-800">
          {member.profile_image_url ? (
            <img src={member.profile_image_url} alt={member.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-500">
              {member.business_name?.[0] || '?'}
            </div>
          )}
        </div>
      </div>
      <div className="pt-2 px-4 pb-4 flex flex-col flex-1">
        <h3 className="text-white font-bold text-base capitalize leading-tight">{member.business_name}</h3>
        {member.description && <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{member.description}</p>}
        {(member.tiktok_url || member.instagram_url || member.facebook_url) && (
          <div className="flex gap-2 mt-3">
            {member.tiktok_url && (
              <a href={member.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-pink-500 hover:text-white transition-all">
                <TikTokIcon />
              </a>
            )}
            {member.instagram_url && (
              <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-pink-500 hover:text-white transition-all">
                <InstagramIcon />
              </a>
            )}
            {member.facebook_url && (
              <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-pink-500 hover:text-white transition-all">
                <FacebookIcon />
              </a>
            )}
          </div>
        )}
        <div className="mt-auto pt-3">
          {member.website_url ? (
            <a href={member.website_url.startsWith('http') ? member.website_url : `https://${member.website_url}`} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="sm" className="w-full bg-pink-500 hover:bg-pink-600 text-white text-xs">
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Visit Website
              </Button>
            </a>
          ) : (
            <div className="h-8" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Community() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['community-members-all'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getCommunityMembers', {});
      return response.data?.members || [];
    },
  });

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.business_name?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header cartItems={cart} onCartClick={() => setShowCart(true)} />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back link */}
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="mb-10">
            <span className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full mb-3">
              💜 OUR COMMUNITY
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {settings?.community_title || 'Community'} Directory
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">Discover all the amazing businesses in our community</p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search businesses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-zinc-500 text-lg">No members found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((member, i) => (
                <MemberCard key={member.id} member={member} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}