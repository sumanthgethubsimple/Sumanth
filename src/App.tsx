import React, { useState } from 'react';
import { Search, ShoppingBag, Star, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Comparison {
  platform: string;
  price: string;
  rating: string;
  link: string;
}

interface ProductInfo {
  name: string;
  description: string;
  price: string;
  rating: string;
  imageUrl: string;
}

interface SearchResult {
  mainProduct: ProductInfo;
  comparisons: Comparison[];
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `I am looking for a product. Here is the link or name: ${query}. 
        Please identify the product, find its details, and search for it across different e-commerce platforms (like Amazon, Walmart, eBay, Best Buy, Target, etc.) to compare prices and ratings.
        If the input is a link, extract the product from it.
        Provide a representative image URL for the product (make sure it's a valid, public image URL, preferably from a reliable source or placeholder if not found).
        Return the data strictly in the requested JSON format.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mainProduct: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "The name of the product" },
                  description: { type: Type.STRING, description: "A brief description of the product" },
                  price: { type: Type.STRING, description: "The typical or found price of the product (e.g., $99.99)" },
                  rating: { type: Type.STRING, description: "The average rating (e.g., 4.5/5)" },
                  imageUrl: { type: Type.STRING, description: "A valid URL to an image of the product" }
                },
                required: ["name", "description", "price", "rating", "imageUrl"]
              },
              comparisons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING, description: "The name of the e-commerce platform (e.g., Amazon)" },
                    price: { type: Type.STRING, description: "The price on this platform" },
                    rating: { type: Type.STRING, description: "The rating on this platform" },
                    link: { type: Type.STRING, description: "A direct link to the product on this platform" }
                  },
                  required: ["platform", "price", "rating", "link"]
                },
                description: "A list of alternative sellers and their prices"
              }
            },
            required: ["mainProduct", "comparisons"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text) as SearchResult;
        setResult(data);
      } else {
        setError("Could not find product information. Please try another link or query.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <ShoppingBag size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">PriceMatch AI</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero / Search Section */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-neutral-950">
            Find the best price across the web
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Paste a product link or name, and we'll instantly compare prices and ratings across top retailers.
          </p>

          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="absolute left-4 text-neutral-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste product link or name (e.g., iPhone 15 Pro)"
              className="w-full pl-12 pr-32 py-4 bg-white border border-neutral-300 rounded-2xl shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Compare</span>
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Results Section */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Product Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200 sticky top-24">
                <div className="aspect-square rounded-2xl bg-neutral-100 mb-6 overflow-hidden flex items-center justify-center">
                  {result.mainProduct.imageUrl ? (
                    <img 
                      src={result.mainProduct.imageUrl} 
                      alt={result.mainProduct.name}
                      className="w-full h-full object-contain mix-blend-multiply p-4"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/product/400/400';
                      }}
                    />
                  ) : (
                    <ShoppingBag size={48} className="text-neutral-300" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-tight">
                  {result.mainProduct.name}
                </h3>
                <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                  {result.mainProduct.description}
                </p>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Typical Price</p>
                    <p className="text-2xl font-bold text-neutral-900">{result.mainProduct.price}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium text-sm">
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                    <span>{result.mainProduct.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparisons List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                Available Options <span className="text-neutral-400 font-normal text-base">({result.comparisons.length})</span>
              </h3>
              
              {result.comparisons.length > 0 ? (
                <div className="grid gap-4">
                  {result.comparisons.map((comp, idx) => {
                    let domain = 'Link unavailable';
                    try {
                      domain = comp.link !== '#' && comp.link.startsWith('http') ? new URL(comp.link).hostname : comp.link;
                    } catch (e) {}
                    
                    return (
                      <motion.a
                        key={idx}
                        href={comp.link !== '#' && comp.link.startsWith('http') ? comp.link : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group block bg-white border border-neutral-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all sm:flex sm:items-center sm:justify-between"
                      >
                        <div className="mb-4 sm:mb-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm">
                              {comp.platform.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="text-lg font-semibold text-neutral-900">{comp.platform}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-amber-600 font-medium">
                              <Star size={14} className="fill-amber-500" />
                              <span>{comp.rating}</span>
                            </div>
                            <span className="text-neutral-300">•</span>
                            <span className="text-neutral-500 truncate max-w-[200px]">{domain}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                          <span className="text-2xl font-bold text-neutral-900">{comp.price}</span>
                          <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors">
                            View Deal <ExternalLink size={14} />
                          </span>
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
                  <ShoppingBag size={48} className="mx-auto text-neutral-300 mb-4" />
                  <h4 className="text-lg font-medium text-neutral-900 mb-2">No comparisons found</h4>
                  <p className="text-neutral-500">We couldn't find this product on other platforms right now.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
