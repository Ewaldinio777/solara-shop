import React from 'react';
import { TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function CurrencyBanner({ onCurrencyChange }) {
    const { exchangeRate, currency, setCurrency } = useCurrency();

    const handleSetCurrency = (target) => {
        if (currency === target) return; // Si ya es la misma, no hacemos nada

        if (onCurrencyChange) {
            onCurrencyChange(currency, setCurrency, target);
        } else {
            setCurrency(target);
        }
    };

    return (
        <div className="mx-4 md:mx-6 mt-6 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-3 shadow-lg shadow-rose-200/50 rounded-3xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
                {/* Tasa */}
                <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/20 w-full md:w-auto justify-center md:justify-start">
                    <TrendingUp size={18} className="text-white" />
                    <div className="flex items-center gap-2 leading-none">
                        <span className="text-[10px] md:text-xs text-rose-50 font-bold uppercase tracking-wider">Tasa BCV:</span>
                        <span className="text-sm md:text-base font-black text-white">Bs {exchangeRate?.toFixed(2) || '---'}</span>
                    </div>
                </div>

                {/* Selector */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                    <span className="text-xs font-medium text-rose-100 hidden lg:block">
                        Moneda de pago:
                    </span>

                    <div className="flex bg-rose-900/20 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => handleSetCurrency('USD')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${currency === 'USD'
                                ? 'bg-white text-rose-600 shadow-sm scale-100'
                                : 'text-rose-100 hover:bg-white/10'
                                }`}
                        >
                            <DollarSign size={14} />
                            USD ($)
                        </button>

                        <button
                            onClick={() => handleSetCurrency('VES')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${currency === 'VES'
                                ? 'bg-white text-rose-600 shadow-sm scale-100'
                                : 'text-rose-100 hover:bg-white/10'
                                }`}
                        >
                            <RefreshCw size={14} className={currency === 'VES' ? 'rotate-180 transition-transform' : ''} />
                            Bs (VES)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}