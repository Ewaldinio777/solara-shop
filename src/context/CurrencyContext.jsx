import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    // 1. Intentamos leer la moneda y tasa guardada en el navegador para arranque instantáneo
    const savedCurrency = localStorage.getItem('solara_currency') || 'USD';
    const savedRate = parseFloat(localStorage.getItem('solara_rate')) || 60.00;

    const [currency, setCurrencyState] = useState(savedCurrency);
    const [exchangeRate, setExchangeRate] = useState(savedRate);

    // Wrapper para guardar moneda en local
    const setCurrency = (newCurrency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('solara_currency', newCurrency);
    };

    // 2. CARGA ROBUSTA DE TASA
    useEffect(() => {
        const fetchRate = async () => {
            try {
                // Leemos directo de Supabase
                const { data, error } = await supabase
                    .from('dolar_tasa')
                    .select('tasa')
                    .eq('id', 1)
                    .single();

                if (data && data.tasa) {
                    const newRate = parseFloat(data.tasa);
                    console.log("✅ Tasa sincronizada:", newRate);
                    setExchangeRate(newRate);
                    localStorage.setItem('solara_rate', newRate); // Guardar para la próxima
                } else if (error) {
                    console.error("⚠️ Error de permisos o red:", error);
                }
            } catch (err) {
                console.error("Error fatal tasa:", err);
            }
        };

        fetchRate();

        // Escuchar cambios en vivo (Si actualizas en Admin, cambia aquí al instante)
        const channel = supabase
            .channel('public:dolar_tasa')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'dolar_tasa' }, (payload) => {
                if (payload.new && payload.new.tasa) {
                    const liveRate = parseFloat(payload.new.tasa);
                    setExchangeRate(liveRate);
                    localStorage.setItem('solara_rate', liveRate);
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // 3. LÓGICA DE VISUALIZACIÓN (Simplificada y Directa)
    const getDisplayPrice = (product) => {
        if (!product) return { value: 0, text: "$0.00", isBs: false };

        // Precios puros
        const priceUsd = parseFloat(product.price || 0);

        // Aquí está la clave: Si no hay precio base especial, usa el normal
        const priceBase = (product.price_bs_base && parseFloat(product.price_bs_base) > 0)
            ? parseFloat(product.price_bs_base)
            : priceUsd;

        if (currency === 'USD') {
            return {
                value: priceUsd,
                text: `$${priceUsd.toFixed(2)}`,
                isBs: false
            };
        } else {
            // Cálculo Bolívares: Base Especial * Tasa
            const finalBs = priceBase * exchangeRate;

            return {
                value: finalBs,
                text: `Bs ${finalBs.toFixed(2)}`,
                isBs: true,
                // CAMBIO: Ahora mostramos priceBase como referencia para que la matemática cuadre
                ref: `$${priceBase.toFixed(2)}`
            };
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, getDisplayPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);