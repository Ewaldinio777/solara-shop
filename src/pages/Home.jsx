import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sparkles } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import CurrencyBanner from '../components/CurrencyBanner';

export default function Home({ onProductClick, products, session, onCurrencyChange }) {
    const [activeCategory, setActiveCategory] = useState('Todo');

    // Estado para datos dinámicos
    const [banner, setBanner] = useState(null);
    const [orderedCategories, setOrderedCategories] = useState(['Todo']);

    // 1. CARGAR DATOS (Banner y Categorías Ordenadas)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // A. Cargar Banner
                const { data: bannerData } = await supabase.from('banners').select('*').eq('id', 1).single();
                if (bannerData) setBanner(bannerData);

                // B. Cargar Categorías en ORDEN (order_index)
                const { data: catData } = await supabase
                    .from('categories')
                    .select('name')
                    .order('order_index', { ascending: true });

                if (catData) {
                    // Creamos el array asegurando que 'Todo' sea el primero
                    // y luego mapéamos solo los nombres de las categorías ordenadas
                    setOrderedCategories(['Todo', ...catData.map(c => c.name)]);
                }
            } catch (error) {
                console.error("Error cargando datos del home:", error);
            }
        };
        fetchData();
    }, []);

    const getUserName = () => {
        if (!session) return 'Invitada';
        const metaName = session.user.user_metadata?.full_name;
        const emailName = session.user.email?.split('@')[0];
        return metaName || emailName || 'Usuario';
    };

    // 2. FILTROS DE PRODUCTOS

    // Productos en Tendencia (Solo si tienen is_featured activado)
    const trendingProducts = useMemo(() => products.filter(p => p.is_featured), [products]);

    // Productos de la Grilla Principal (Filtrados por categoría o todos)
    const mainGridProducts = useMemo(() => {
        if (activeCategory === 'Todo') return products;
        return products.filter(p => p.category === activeCategory);
    }, [activeCategory, products]);

    return (
        <div className="pb-24 animate-fade-in w-full bg-white">

            {/* Header y Banner de Tasa de Cambio */}
            <Header title={`Hola, ${getUserName()}`} onCurrencyChange={onCurrencyChange} />
            <CurrencyBanner onCurrencyChange={onCurrencyChange} />

            <div className="max-w-7xl mx-auto px-6 space-y-8 mt-6">

                {/* 3. PESTAÑAS DE CATEGORÍAS (ORDENADAS) */}
                <div>
                    <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                        {orderedCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-6 py-3 rounded-2xl transition-all border font-bold text-sm ${activeCategory === cat
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200 scale-105'
                                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. SECCIÓN TENDENCIAS (Solo visible en 'Todo') */}
                {activeCategory === 'Todo' && trendingProducts.length > 0 && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                Tendencias <Sparkles size={20} className="text-yellow-400 fill-yellow-400" />
                            </h3>
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg font-bold">
                                Lo más hot 🔥
                            </span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x">
                            {trendingProducts.map(product => (
                                <div key={product.id} className="min-w-[160px] md:min-w-[200px] snap-start">
                                    <ProductCard product={product} onClick={onProductClick} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. BANNER PUBLICITARIO (Dinámico desde BD - Solo visible en 'Todo') */}
                {activeCategory === 'Todo' && banner && (
                    <div className="relative rounded-3xl overflow-hidden h-40 md:h-64 lg:h-80 shadow-lg shadow-rose-200/50 group animate-fade-in">
                        <img
                            src={banner.image_url || "https://via.placeholder.com/800x400"}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            alt="Banner"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-r ${banner.color || 'from-rose-900/90'} via-rose-900/40 to-transparent flex flex-col justify-center px-8 md:px-12`}>
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-md self-start mb-2 border border-white/30">
                                NUEVA COLECCIÓN
                            </span>
                            <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
                                {banner.title}
                            </h3>
                            <p className="text-white/90 text-sm md:text-base mb-4 max-w-md hidden md:block">
                                {banner.subtitle}
                            </p>
                            <button className="bg-white text-rose-600 px-6 py-3 rounded-xl text-xs md:text-sm font-bold w-fit shadow-lg hover:scale-105 transition-transform hover:bg-rose-50">
                                {banner.button_text || "Ver más"}
                            </button>
                        </div>
                    </div>
                )}

                {/* 6. GRILLA PRINCIPAL DE PRODUCTOS */}
                <div>
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            {activeCategory === 'Todo' ? 'Explora todo' : activeCategory}
                            {activeCategory !== 'Todo' && <span className="text-gray-400 text-sm font-normal">({mainGridProducts.length})</span>}
                        </h3>
                    </div>

                    {mainGridProducts.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium">No hay productos en esta categoría aún.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {mainGridProducts.map(product => (
                                <ProductCard key={product.id} product={product} onClick={onProductClick} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}