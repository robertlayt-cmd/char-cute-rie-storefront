import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Heart, Sparkles, Star } from 'lucide-react';

export default function About() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header cartCount={0} onCartClick={() => {}} categories={categories} />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Char'Cute'rie</h1>
            <p className="text-xl text-zinc-400">Handcrafted with love in Australia 🇦🇺</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            {settings?.about_text ? (
              <p className="text-zinc-300 leading-relaxed">{settings.about_text}</p>
            ) : (
              <>
                <p className="text-zinc-300 leading-relaxed">
                  Welcome to Char'Cute'rie! We create adorable handcrafted polymer clay earrings, 
                  jewellery, and accessories with a cute, food-inspired twist. Every piece is 
                  uniquely designed and made with love in Brisbane, Australia.
                </p>

                <div className="grid md:grid-cols-3 gap-8 my-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-pink-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Made with Love</h3>
                    <p className="text-zinc-400 text-sm">
                      Each piece is carefully handcrafted with attention to detail
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Unique Designs</h3>
                    <p className="text-zinc-400 text-sm">
                      Original designs inspired by cute food and charcuterie themes
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Quality Materials</h3>
                    <p className="text-zinc-400 text-sm">
                      Premium polymer clay with hypoallergenic stainless steel findings
                    </p>
                  </div>
                </div>

                <p className="text-zinc-300 leading-relaxed">
                  Our journey started with a passion for creating cute, wearable art that brings 
                  joy to everyday outfits. From our signature food-themed earrings to our 
                  playful decor pieces, every item is designed to make you smile.
                </p>

                <p className="text-zinc-300 leading-relaxed">
                  Follow our creative journey on TikTok{' '}
                  <a 
                    href="https://www.tiktok.com/@char.cute.rie" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300"
                  >
                    @char.cute.rie
                  </a>
                  {' '}where we share behind-the-scenes content, new designs, and exclusive offers!
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}