import React, { useState, useEffect } from 'react';
import { ChevronDown, Star, Heart, Minus, Plus, ShoppingBag, Share2, ImageOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { useCurrency } from '../context/CurrencyContext';
import { supabase } from '../lib/supabaseClient';

export default function ProductDetail({
    product,
    onBack,
    onAddToCart,
    session,
    isFavorite,
    onToggleFavorite,
    onRateSuccess // Prop necesaria para actualizar App.jsx sin recargar
}) {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Estado para la calificación local inmediata
    const [userRating, setUserRating] = useState(0);

    const { getDisplayPrice } = useCurrency();
    const { text, isBs, ref } = getDisplayPrice(product);

    // Determinar qué rating mostrar visualmente: 
    // Prioriza el voto recién hecho por el usuario, si no, usa el del producto.
    const currentRating = userRating || product.rating || 0;

    useEffect(() => {
        if (product) {
            const initialImage = (product.images && product.images.length > 0)
                ? product.images[0]
                : product.image;
            setSelectedImage(initialImage);
            setImageError(false);
            // Resetear calificación local al cambiar de producto
            setUserRating(0);
        }
    }, [product]);

    if (!product) return null;

    const handleImageChange = (img) => {
        if (selectedImage === img) return;
        setIsAnimating(true);
        setImageError(false);
        setTimeout(() => {
            setSelectedImage(img);
            setIsAnimating(false);
        }, 200);
    };

    // --- LÓGICA DE CALIFICACIÓN EN TIEMPO REAL ---
    const handleRate = async (ratingValue) => {
        if (!session) {
            return Swal.fire({
                title: 'Inicia Sesión',
                text: 'Debes ingresar para calificar productos ✨',
                icon: 'info',
                confirmButtonColor: '#F43F5E'
            });
        }

        try {
            // 1. Llamada a la función RPC de Supabase
            const { error } = await supabase.rpc('update_product_rating', {
                product_id: product.id,
                new_rating: ratingValue
            });

            if (error) throw error;

            // 2. ACTUALIZACIÓN EN TIEMPO REAL SIN F5
            setUserRating(ratingValue); // Actualiza este modal
            if (onRateSuccess) {
                onRateSuccess(product.id, ratingValue); // Actualiza la lista de App.jsx (Home/Search)
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `¡Gracias! Calificaste con ${ratingValue} estrellas`,
                showConfirmButton: false,
                timer: 2000
            });
        } catch (error) {
            console.error("Error al calificar:", error.message);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: 'Error de conexión o permisos. Inténtalo de nuevo.',
                confirmButtonColor: '#F43F5E'
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden relative">
            {/* Header Flotante */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <button onClick={onBack} className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm text-gray-700 hover:bg-gray-100 transition-all">
                    <ChevronDown size={24} />
                </button>
                <div className="flex gap-3">
                    <button className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm text-gray-700 hover:text-rose-500 transition-all">
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={() => onToggleFavorite(product.id)}
                        className={`bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm transition-all border ${isFavorite ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-gray-700 border-transparent'}`}
                    >
                        <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                    </button>
                </div>
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-40">

                {/* IMAGEN PRINCIPAL */}
                <div className="bg-gray-50 h-[45vh] w-full flex items-center justify-center p-8 rounded-b-[3rem] relative">
                    {selectedImage && !imageError ? (
                        <img
                            src={selectedImage}
                            alt={product.name}
                            className={`max-h-full max-w-full object-contain drop-shadow-xl transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                            <ImageOff size={64} strokeWidth={1} />
                            <p className="font-bold text-sm mt-4 uppercase tracking-widest">Sin Imagen Disponible</p>
                        </div>
                    )}

                    {/* Miniaturas */}
                    {product.images && product.images.length > 1 && (
                        <div className="absolute bottom-6 flex gap-2 p-2 bg-white/50 backdrop-blur-sm rounded-2xl overflow-x-auto max-w-[90%] hide-scrollbar">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleImageChange(img)}
                                    className={`w-10 h-10 min-w-[2.5rem] rounded-xl overflow-hidden border-2 transition-all bg-white ${selectedImage === img ? 'border-rose-500 scale-110' : 'border-transparent opacity-70'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info del Producto */}
                <div className="px-8 py-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-rose-500 font-bold text-xs tracking-widest uppercase mb-2 block">{product.category}</span>
                            <h2 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h2>

                            {/* SISTEMA DE CALIFICACIÓN DINÁMICO */}
                            <div className="flex items-center gap-1 mt-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRate(star)}
                                        className="focus:outline-none transition-transform active:scale-125 hover:scale-110"
                                    >
                                        <Star
                                            size={20}
                                            className={`${star <= currentRating
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-200'
                                                } transition-colors`}
                                        />
                                    </button>
                                ))}
                                <span className="text-xs font-bold text-gray-400 ml-2">
                                    {currentRating > 0 ? `(${currentRating.toFixed(1)})` : "Sin valoraciones"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed">
                        {product.description || "Descripción no disponible."}
                    </p>
                </div>
            </div>

            {/* Footer Fijo */}
            <div className="absolute bottom-0 left-0 right-0 px-8 pt-6 pb-12 md:px-10 md:pb-20 bg-white border-t border-gray-50 z-20">
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium line-through">
                            {product.oldPrice ? `$${product.oldPrice.toFixed(2)}` : ''}
                        </span>
                        <span className="text-3xl font-black text-gray-900">{text}</span>
                        {isBs && (
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                                Ref: {ref}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex gap-3">
                        <div className="flex items-center bg-gray-100 rounded-2xl px-3">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-500 hover:text-rose-500"><Minus size={18} /></button>
                            <span className="font-bold w-6 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-gray-500 hover:text-rose-500"><Plus size={18} /></button>
                        </div>
                        <button
                            onClick={() => onAddToCart(product, quantity)}
                            className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-rose-200 hover:bg-rose-600 transition-transform active:scale-95 flex justify-center items-center gap-2"
                        >
                            <ShoppingBag size={20} /> Agregar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}