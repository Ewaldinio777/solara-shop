import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Bell, RefreshCw } from 'lucide-react';

export default function Header({ title, onCurrencyChange }) {
    const { currency, setCurrency } = useCurrency();

    const handleSwitch = () => {
        // Si App nos pasó la función de control (que revisa el carrito), la usamos.
        if (onCurrencyChange) {
            onCurrencyChange(currency, setCurrency);
        } else {
            // Comportamiento fallback
            setCurrency(currency === 'USD' ? 'VES' : 'USD');
        }
    };

    return (
        <div className="px-6 pt-6 pb-2 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-gray-100/50 backdrop-blur-lg bg-white/80">
            <div>
                <span className="text-xs font-bold text-rose-500 tracking-widest uppercase">
                    {title || 'Bienvenida'}
                </span>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight font-serif">SOLARA<span className="text-rose-500">.</span></h2>
            </div>

            <div className="flex gap-2 items-center">
                {/* Switch Moneda */}
                <button
                    onClick={handleSwitch}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-95"
                >
                    <RefreshCw size={14} className={currency === 'VES' ? 'rotate-180 transition-transform' : ''} />
                    {currency === 'USD' ? 'USD' : 'Bs'}
                </button>

                {/* Campana */}
                <button className="p-2.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-500 rounded-full transition-colors relative">
                    <Bell size={20} />
                </button>
            </div>
        </div>
    );
}