import React, { useState } from 'react';
import { ShoppingBag, Minus, Plus, ArrowRight, Trash2, ImageOff, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { useCurrency } from '../context/CurrencyContext';

// Miniatura auxiliar para productos en el carrito
const CartThumbnail = ({ src, alt }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <div className="w-20 h-20 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-300 border border-gray-100">
                <ImageOff size={20} />
                <span className="text-[8px] font-bold mt-1 uppercase">Sin Foto</span>
            </div>
        );
    }
    return (
        <img src={src} className="w-20 h-20 rounded-xl object-cover bg-gray-100" alt={alt} onError={() => setError(true)} />
    );
};

export default function Cart({ cart, updateQuantity, onCheckout, removeFromCart, clearCart, onCurrencyChange }) {
    const { currency, getDisplayPrice } = useCurrency();
    const [isProcessing, setIsProcessing] = useState(false);

    // Cálculos de totales
    const total = cart.reduce((sum, item) => {
        const priceInfo = getDisplayPrice(item);
        return sum + (priceInfo.value * item.quantity);
    }, 0);

    const totalRefUsd = cart.reduce((sum, item) => {
        const basePrice = (currency === 'VES' && item.price_bs_base) ? item.price_bs_base : item.price;
        return sum + (basePrice * item.quantity);
    }, 0);

    // Lógica corregida: Solo animación y redirección directa
    const handleCheckoutClick = () => {
        setIsProcessing(true);

        // Simulación de carga para feedback visual
        setTimeout(() => {
            setIsProcessing(false);
            // Llama directamente a la función de App.jsx para cambiar de página
            // Sin alertas de SweetAlert en medio
            onCheckout();
        }, 1500);
    };

    const handleClearCart = () => {
        Swal.fire({
            title: '¿Vaciar carrito?',
            text: "Se eliminarán todos los productos seleccionados",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F43F5E',
            confirmButtonText: 'Sí, vaciar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-[2rem]' }
        }).then((result) => {
            if (result.isConfirmed) clearCart();
        });
    };

    return (
        <div className="pb-32 animate-fade-in min-h-screen bg-gray-50">
            <Header title={`Mi Carrito (${cart.length})`} onCurrencyChange={onCurrencyChange} />

            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                    <ShoppingBag size={64} className="mb-4 text-gray-200" />
                    <p className="font-medium">Tu carrito está vacío</p>
                </div>
            ) : (
                <div className="px-6 py-6 space-y-4 max-w-4xl mx-auto">
                    <div className="flex justify-end">
                        <button onClick={handleClearCart} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 size={14} /> Vaciar Carrito
                        </button>
                    </div>

                    {cart.map(item => {
                        const priceInfo = getDisplayPrice(item);
                        return (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 relative group">
                                <CartThumbnail src={item.image} alt={item.name} />
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="pr-8">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                                        <div className="flex flex-col">
                                            <span className="text-rose-500 font-bold">{priceInfo.text}</span>
                                            {priceInfo.isBs && <span className="text-[10px] text-gray-400">Ref: {priceInfo.ref}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-600 hover:text-rose-500"><Minus size={14} /></button>
                                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-600 hover:text-rose-500"><Plus size={14} /></button>
                                        </div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {currency === 'USD' ? `$${(priceInfo.value * item.quantity).toFixed(2)}` : `Bs ${(priceInfo.value * item.quantity).toFixed(2)}`}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-50 md:sticky">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-sm">Total a Pagar</span>
                                {currency === 'VES' && <span className="text-xs text-gray-400">Ref Total: ${totalRefUsd.toFixed(2)}</span>}
                            </div>
                            <span className="text-3xl font-black text-gray-900">
                                {currency === 'USD' ? `$${total.toFixed(2)}` : `Bs ${total.toFixed(2)}`}
                            </span>
                        </div>

                        <button
                            onClick={handleCheckoutClick}
                            disabled={isProcessing}
                            className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-rose-200 hover:bg-rose-600 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-90 disabled:cursor-not-allowed overflow-hidden"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span>Procesando pago...</span>
                                    </div>
                                    {/* Barra de progreso integrada en el diseño del botón */}
                                    <div className="w-full max-w-[200px] h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                                        <div className="h-full bg-white animate-progress-bar"></div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Pagar Ahora</span>
                                    <ArrowRight size={22} />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes progress-bar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress-bar {
                    animation: progress-bar 1.5s linear forwards;
                }
            `}</style>
        </div>
    );
}