import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Sparkles, Send, Bot, User, Trash2, ArrowRight, ImageOff } from 'lucide-react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Swal from 'sweetalert2';
import { useCurrency } from '../context/CurrencyContext';

// --- COMPONENTE DE IMAGEN SEGURA PARA EL CHAT ---
const ChatProductImage = ({ src }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 border border-gray-200 flex-shrink-0">
                <ImageOff size={14} />
            </div>
        );
    }
    return (
        <img
            src={src}
            className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
            alt=""
            onError={() => setError(true)}
        />
    );
};

export default function Search({ onProductClick, products, onCurrencyChange }) {
    const [mode, setMode] = useState('search');
    const [searchTerm, setSearchTerm] = useState('');
    const { exchangeRate } = useCurrency(); // Tasa del contexto para cálculos financieros

    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: '¡Hola! Soy Solara AI ✨. Dime qué necesitas (ej: "Tengo 500 bolívares" o "Busco algo para piel grasa").' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll al fondo del chat cada vez que hay un mensaje nuevo
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // --- LÓGICA DE PROCESAMIENTO INTELIGENTE OFFLINE ---
    const processMessage = () => {
        if (!inputMessage.trim()) return;

        const rawText = inputMessage;
        const text = rawText.toLowerCase();
        setInputMessage('');

        // 1. Mostrar el mensaje del usuario en el chat
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: rawText }]);
        setIsTyping(true);

        // Simulamos un tiempo de respuesta para que se sienta como una IA
        setTimeout(() => {
            let responseText = "";
            let recommendedProducts = [];

            // A. DETECCIÓN DE PRESUPUESTO (Dólares o Bolívares)
            const moneyRegex = /(\d+([.,]\d+)?)\s*(dolares|dólares|usd|\$|bs|bolívares|bolivares|bolos|soberanos|bcv)?/i;
            const match = text.match(moneyRegex);

            const esBolivares = text.includes('bs') || text.includes('bolos') || text.includes('bolivares') || text.includes('bcv');
            const esDolares = text.includes('usd') || text.includes('dolar') || text.includes('$');

            if (match) {
                let amount = parseFloat(match[1].replace(',', '.'));
                let originalAmount = amount;

                // Si detectamos jerga de Bolívares, convertimos a Dólares usando la tasa del contexto
                if (esBolivares && !esDolares) {
                    amount = amount / exchangeRate;
                    responseText = `Entendido, con Bs ${originalAmount} (aprox. $${amount.toFixed(2)}), he armado este combo ideal para ti:`;
                } else {
                    responseText = `Con un presupuesto de $${amount.toFixed(2)}, estos son los productos que mejor se ajustan:`;
                }

                // Filtrar productos que no excedan el presupuesto
                const affordable = products.filter(p => p.price <= amount);

                if (affordable.length > 0) {
                    let currentTotal = 0;
                    // Mezclamos un poco para no recomendar siempre lo mismo
                    const shuffled = [...affordable].sort(() => 0.5 - Math.random());

                    for (let p of shuffled) {
                        if (currentTotal + p.price <= amount) {
                            recommendedProducts.push(p);
                            currentTotal += p.price;
                        }
                        if (recommendedProducts.length >= 4) break; // Máximo 4 recomendaciones
                    }
                } else {
                    responseText = `Oye, con $${amount.toFixed(2)} está un poco difícil armar un combo 😅, pero mira nuestra opción más económica:`;
                    recommendedProducts = [...products].sort((a, b) => a.price - b.price).slice(0, 1);
                }
            }
            // B. BÚSQUEDA POR INTENCIÓN O PALABRAS CLAVE
            else {
                const keywords = {
                    'piel grasa': ['mate', 'polvo', 'control', 'fijador'],
                    'boda': ['waterproof', 'fijador', 'iluminador', 'larga duracion'],
                    'fiesta': ['glitter', 'brillo', 'rojo', 'pestanas', 'iluminador'],
                    'regalo': ['set', 'kit', 'perfume', 'paleta'],
                    'labios': ['labial', 'gloss', 'tinta'],
                    'ojos': ['mascara', 'rimel', 'delineador', 'sombra']
                };

                let searchTerms = [text];
                Object.keys(keywords).forEach(key => {
                    if (text.includes(key)) searchTerms = [...searchTerms, ...keywords[key]];
                });

                recommendedProducts = products.filter(p => {
                    const info = `${p.name} ${p.description} ${p.category}`.toLowerCase();
                    return searchTerms.some(term => info.includes(term));
                }).slice(0, 4);

                if (recommendedProducts.length > 0) {
                    responseText = "¡Claro! Esto es lo mejor que encontré para lo que buscas:";
                } else {
                    responseText = "No encontré exactamente eso, pero mira estas tendencias que te encantarán 😍:";
                    recommendedProducts = products.filter(p => p.is_featured).slice(0, 3);
                }
            }

            // 2. Enviar respuesta del Bot con los productos recomendados
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: responseText,
                products: recommendedProducts
            }]);
            setIsTyping(false);

        }, 800);
    };

    const clearChat = () => {
        setMessages([{ id: 1, type: 'bot', text: '¡Chat reiniciado! ✨ ¿En qué puedo ayudarte ahora?' }]);
    };

    return (
        <div className="pb-24 animate-fade-in min-h-screen bg-gray-50 flex flex-col">
            <Header title="Explorar" onCurrencyChange={onCurrencyChange} />

            {/* TABS DE SELECCIÓN DE MODO */}
            <div className="px-6 pt-4">
                <div className="flex p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setMode('search')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'search' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'}`}
                    >
                        <SearchIcon size={16} /> Catálogo
                    </button>
                    <button
                        onClick={() => setMode('chat')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'chat' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400'}`}
                    >
                        <Sparkles size={16} /> Solara AI
                    </button>
                </div>
            </div>

            {/* MODO 1: BÚSQUEDA TRADICIONAL (CATÁLOGO) */}
            {mode === 'search' && (
                <div className="px-6 pt-6 max-w-5xl mx-auto w-full animate-fade-in">
                    <div className="relative group mb-8">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre o categoría..."
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 font-medium outline-none focus:border-rose-300 shadow-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products
                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(product => <ProductCard key={product.id} product={product} onClick={onProductClick} />)
                        }
                    </div>
                </div>
            )}

            {/* MODO 2: CHAT INTELIGENTE OFFLINE */}
            {mode === 'chat' && (
                <div className="flex flex-col flex-1 h-[calc(100vh-200px)] animate-slide-up relative">
                    {/* Botón Borrar Chat */}
                    <button
                        onClick={clearChat}
                        className="absolute top-4 right-6 z-10 p-2 bg-white/80 backdrop-blur text-gray-400 hover:text-red-500 rounded-full shadow-sm border border-gray-100 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>

                    {/* Área de Visualización de Mensajes */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] space-y-2`}>
                                    <div className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-gray-200' : 'bg-rose-500'}`}>
                                            {msg.type === 'user' ? <User size={14} className="text-gray-600" /> : <Bot size={14} className="text-white" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.type === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>

                                    {/* Recomendaciones de Productos dentro del Chat */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="pl-11 grid gap-2">
                                            {msg.products.map(product => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => onProductClick(product)}
                                                    className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 cursor-pointer hover:border-rose-300 transition-all group"
                                                >
                                                    <ChatProductImage src={product.images?.[0] || product.image} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 text-xs truncate group-hover:text-rose-500">{product.name}</h4>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xs font-black text-rose-500">${product.price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-rose-50 p-1.5 rounded-lg text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                        <ArrowRight size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="pl-11 text-xs text-gray-400 font-bold animate-pulse">Solara está procesando...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Área de Entrada de Texto fija en la parte inferior */}
                    <div className="p-4 bg-white border-t border-gray-100 fixed bottom-[80px] left-0 right-0 md:static md:bottom-0 z-20">
                        <div className="max-w-4xl mx-auto flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && processMessage()}
                                    placeholder="Ej: Tengo 10$ a bcv..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium outline-none focus:border-rose-500 focus:bg-white transition-all"
                                />
                                <button
                                    onClick={processMessage}
                                    disabled={!inputMessage.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-rose-500 text-white rounded-lg shadow-md hover:bg-rose-600 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}