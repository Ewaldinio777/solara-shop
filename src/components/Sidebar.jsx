// src/components/Sidebar.jsx corregido
import React from 'react';
import { Home, Search, ShoppingBag, User, Settings } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, cartCount }) {
    const menuItems = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'search', icon: Search, label: 'Explorar' },
        { id: 'cart', icon: ShoppingBag, label: 'Carrito', badge: cartCount > 0 ? cartCount : null },
        { id: 'profile', icon: User, label: 'Perfil' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-100 sticky top-0 left-0 z-50">
            {/* Logo Area */}
            <div className="p-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight font-serif cursor-pointer" onClick={() => setCurrentView('home')}>
                    SOLARA<span className="text-rose-500">.</span>
                </h2>
            </div>

            {/* Menu Links */}
            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map(item => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-rose-50 text-rose-500 shadow-sm shadow-rose-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                            <span className={`font-bold text-sm ${isActive ? 'font-extrabold' : 'font-medium'}`}>{item.label}</span>

                            {item.badge && (
                                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* SECCIÓN DE AJUSTES ELIMINADA TOTALMENTE */}
        </aside>
    );
}