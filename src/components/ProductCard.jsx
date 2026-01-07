import React, { useState } from 'react';
import { Plus, ImageOff } from 'lucide-react'; // Importamos ImageOff
import { useCurrency } from '../context/CurrencyContext';

export default function ProductCard({ product, onClick }) {
    const { getDisplayPrice } = useCurrency();
    const { text, isBs, ref } = getDisplayPrice(product);

    // Determinamos si hay una imagen válida
    const imageUrl = product.images?.[0] || product.image;

    // Estado para manejar si la imagen da error al cargar (rompe)
    const [imageError, setImageError] = useState(false);

    return (
        <div
            onClick={() => onClick(product)}
            className="group relative bg-white rounded-3xl p-3 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-rose-100/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between"
        >
            {/* ZONA DE IMAGEN */}
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-50 flex items-center justify-center">

                {/* Lógica: Si hay URL y no ha dado error, mostramos la foto. Si no, el placeholder */}
                {imageUrl && !imageError ? (
                    <img
                        src={imageUrl}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt={product.name}
                        onError={() => setImageError(true)} // Si falla el link, activa el error
                    />
                ) : (
                    // PLACEHOLDER "SIN IMAGEN"
                    <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full bg-gray-50">
                        <ImageOff size={32} strokeWidth={1.5} />
                        <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Sin Imagen</span>
                    </div>
                )}

                {product.is_featured && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-md z-10">
                        TOP
                    </span>
                )}

                <button className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 z-10">
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>

            {/* Resto de la info igual... */}
            <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                    {product.category || 'General'}
                </p>
                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5em]">
                    {product.name}
                </h3>

                <div className="flex flex-col border-t border-gray-50 pt-2 mt-1">
                    <span className={`font-black text-rose-500 ${isBs ? 'text-lg' : 'text-xl'}`}>
                        {text}
                    </span>
                    {isBs && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                                Ref: {ref}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}