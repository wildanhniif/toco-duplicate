"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Article = {
  id: number;
  article_id?: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  image_url: string;
  author_name: string;
  created_at: string;
};

export default function ArticleView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/articles?limit=50`);
        if (res.ok) {
           const data = await res.json();
           // Handle wrapped response { data: [...] } or direct array
           const list = Array.isArray(data) ? data : data.data || [];
           setArticles(list);
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const featured = articles[0];
  const list = articles.slice(1);

  return (
    <main className="min-h-screen bg-white pt-40 pb-12">
       <div className="w-full max-w-[1440px] mx-auto px-[5%]">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-8">
             <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/" className="hover:underline">Beranda</Link>
                <span>&gt;</span>
                <span className="font-semibold text-blue-900">Artikel & Edukasi</span>
             </div>
          </div>

          {/* Hero / Featured */}
          {featured && (
             <section className="mb-12">
               <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-gray-900 p-6 md:p-12 flex items-center">
                   {/* Fallback layout or image */}
                   <div className="relative z-10 max-w-2xl text-white">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/30 text-white">
                          {featured.category || "Berita"}
                      </span>
                      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-sm">
                         {featured.title}
                      </h1>
                      <p className="text-gray-200 text-lg mb-6 line-clamp-2 drop-shadow-sm">
                         {featured.summary}
                      </p>
                      <Link href={`/articles/${featured.slug}`}>
                         <button className="bg-white text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            Baca Artikel
                         </button>
                      </Link>
                   </div>
                   
                   {/* Background Decor */}
                   <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />
                   <Image 
                      src={featured.image_url} 
                      alt={featured.title} 
                      fill 
                      className="object-cover object-center"
                   />
               </div>
             </section>
          )}

          {/* Categories / Filter Tabs */}
          <div className="flex items-center gap-6 border-b border-gray-100 pb-4 mb-8 overflow-x-auto">
             {["Semua Artikel", "Promo", "Berita", "Edukasi"].map((tab, i) => (
                <button 
                  key={tab} 
                  className={`text-sm font-medium whitespace-nowrap pb-1 ${i === 0 ? "text-gray-900 border-b-2 border-yellow-400" : "text-gray-500 hover:text-gray-700"}`}
                >
                   {tab}
                </button>
             ))}
          </div>

          {/* Grid List */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                   <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"/>
                ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {list.map((article) => (
                 <Link key={article.id || article.article_id} href={`/articles/${article.slug}`}>
                   <article className="group cursor-pointer">
                      <div className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden mb-3">
                         <Image 
                           src={article.image_url} 
                           alt={article.title} 
                           fill 
                           className="object-cover transition-transform duration-300 group-hover:scale-105" 
                         />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm font-medium">
                            {article.category}
                         </span>
                         <span className="text-[10px] text-gray-400">
                            {article.created_at ? format(new Date(article.created_at), "d MMM yyyy", { locale: id }) : ""}
                         </span>
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                         {article.title}
                      </h3>
                   </article>
                 </Link>
               ))}
            </div>
          )}
       </div>
    </main>
  );
}
