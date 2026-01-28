import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Star, ImageOff, Filter, PieChart, Calendar, AlertCircle } from 'lucide-react';

// --- COMPONENTE AUXILIAR PARA MINIATURAS (Igual que en AdminDashboard) ---
const ProductThumbnail = ({ url, alt }) => {
    const [error, setError] = useState(false);

    // Si no hay URL o dio error, mostramos el placeholder
    if (!url || error) {
        return (
            <div className="w-10 h-10 min-w-[2.5rem] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200" title="Sin imagen">
                <ImageOff size={16} />
            </div>
        );
    }

    return (
        <img
            src={url}
            alt={alt || "Producto"}
            className="w-10 h-10 min-w-[2.5rem] rounded-lg object-cover bg-gray-100 border border-gray-100"
            onError={() => setError(true)}
        />
    );
};

export default function TrendsManager({ products }) {
    const [orders, setOrders] = useState([]);
    const [timeFilter, setTimeFilter] = useState('all'); // all, year, month, day

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select('items, created_at');
            
            if (data) {
                setOrders(data);
            }
        };
        fetchOrders();
    }, []);

    // Helper para filtrar por fecha
    const isDateMatch = (dateStr, filter) => {
        if (filter === 'all') return true;
        const d = new Date(dateStr);
        const now = new Date();
        if (filter === 'year') return d.getFullYear() === now.getFullYear();
        if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filter === 'day') return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
    };

    const bestSellers = useMemo(() => {
        const salesCount = {};

        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const id = item.id || item.product_id;
                    const qty = item.quantity || 0;
                    if (id) {
                        salesCount[id] = (salesCount[id] || 0) + qty;
                    }
                });
            }
        });

        const sortedIds = Object.keys(salesCount).sort((a, b) => salesCount[b] - salesCount[a]);
        
        return sortedIds.map(id => {
            const product = products.find(p => p.id.toString() === id.toString());
            return product ? { ...product, sold: salesCount[id] } : null;
        }).filter(item => item !== null && item.sold > 0);

    }, [orders, products]);

    const chartData = useMemo(() => {
        const salesCount = {};
        let totalSales = 0;

        orders.filter(o => isDateMatch(o.created_at, timeFilter)).forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const id = item.id || item.product_id;
                    const qty = item.quantity || 0;
                    if (id) {
                        salesCount[id] = (salesCount[id] || 0) + qty;
                        totalSales += qty;
                    }
                });
            }
        });

        const sortedIds = Object.keys(salesCount).sort((a, b) => salesCount[b] - salesCount[a]);
        const top5Ids = sortedIds.slice(0, 5);
        
        let data = top5Ids.map(id => {
            const product = products.find(p => p.id.toString() === id.toString());
            return {
                name: product ? product.name : 'Desconocido',
                value: salesCount[id],
                percentage: totalSales > 0 ? (salesCount[id] / totalSales) * 100 : 0,
                color: ''
            };
        });

        const othersCount = sortedIds.slice(5).reduce((acc, id) => acc + salesCount[id], 0);
        if (othersCount > 0) {
            data.push({
                name: 'Otros',
                value: othersCount,
                percentage: totalSales > 0 ? (othersCount / totalSales) * 100 : 0,
                color: '#94a3b8'
            });
        }

        // Colors matching the requested visual style (Blue, Green, Orange, Red, Purple, etc.)
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#a855f7', '#ec4899', '#6366f1'];
        data = data.map((d, i) => ({ ...d, color: d.color || colors[i % colors.length] }));

        return data;
    }, [orders, products, timeFilter]);


    const getConicGradient = () => {
        if (chartData.length === 0) return 'conic-gradient(#f3f4f6 0% 100%)';
        
        let gradientStr = '';
        let currentDeg = 0;
        
        chartData.forEach((slice, i) => {
            const sliceDeg = (slice.percentage / 100) * 360;
            const endDeg = currentDeg + sliceDeg;
            gradientStr += `${slice.color} ${currentDeg}deg ${endDeg}deg${i < chartData.length - 1 ? ', ' : ''}`;
            currentDeg = endDeg; 
        });
        
        return `conic-gradient(${gradientStr})`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* LISTA AUTOMÁTICA EN PORTADA (MÁS VENDIDOS) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Star className="text-yellow-400 fill-yellow-400" size={20} /> 
                    <span>En Portada (Más Vendidos)</span>
                </h3>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {bestSellers.length > 0 ? (
                        bestSellers.map((product, index) => (
                            <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-white hover:border-rose-200 transition-colors">
                                <span className={`font-black text-lg w-8 text-center ${index < 3 ? 'text-rose-500' : 'text-gray-400'}`}>
                                    #{index + 1}
                                </span>

                                <ProductThumbnail url={product.images?.[0]} alt={product.name} />

                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-rose-400 font-medium">{product.sold} vendidos</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            <AlertCircle className="mb-2 opacity-50" size={24} />
                            <p>No se han vendido productos</p>
                            <p className="text-sm opacity-60">Las ventas aparecerán aquí automáticamente</p>
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICO DE VENTAS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <PieChart className="text-rose-500" size={20} /> Distribución de Ventas
                    </h3>
                    
                    {/* Filtros */}
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <Calendar size={14} className="text-gray-400" />
                            <select 
                                value={timeFilter} 
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="bg-transparent text-sm font-medium text-gray-600 outline-none cursor-pointer appearance-none pr-4"
                            >
                                <option value="all">Todo el tiempo</option>
                                <option value="year">Este Año</option>
                                <option value="month">Este Mes</option>
                                <option value="day">Hoy</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                    {chartData.length > 0 ? (
                        <div className="flex flex-col md:flex-row items-center gap-8 w-full px-4">
                            {/* PIE CHART VISUAL */}
                            <div 
                                className="w-56 h-56 rounded-full shadow-lg relative flex-shrink-0 border-4 border-white"
                                style={{ background: getConicGradient() }}
                            >
                                {/* Full Pie Chart - No center hole */}
                            </div>

                            {/* LEYENDA */}
                            <div className="flex-1 w-full space-y-3">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></div>
                                        <span className="flex-1 text-gray-700 truncate font-medium">
                                            {d.name} <span className="text-gray-500 font-normal">[{Math.round(d.percentage)}%]</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <PieChart size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No hay datos para este periodo</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}