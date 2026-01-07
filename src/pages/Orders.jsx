import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    ChevronLeft, ShoppingBag, Calendar, Clock,
    CreditCard, Package, ExternalLink, ImageOff,
    CheckCircle2, Clock4, XCircle, Eye
} from 'lucide-react';
import { createPortal } from 'react-dom';

// Modal de Detalle de Pedido
function OrderDetailModal({ order, onClose }) {
    if (!order) return null;

    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">

                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                    <h3 className="font-black text-gray-900 text-xl">Detalle del Pedido</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status y Fecha */}
                    <div className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Clock4 className="text-rose-500" size={20} />
                            <div>
                                <p className="text-[10px] font-black text-rose-400 uppercase">Realizado el</p>
                                <p className="font-bold text-gray-900 text-sm">{formattedDate} a las {formattedTime}</p>
                            </div>
                        </div>
                        <span className="bg-white text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">
                            {order.status}
                        </span>
                    </div>

                    {/* Resumen de Productos */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Productos</h4>
                        <div className="space-y-2">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="font-bold text-sm text-gray-700">{item.name} <span className="text-rose-400">x{item.quantity}</span></span>
                                    <span className="font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Entrega y Pago */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Método</h4>
                            <div className="bg-gray-50 p-3 rounded-xl text-xs font-bold text-gray-700">
                                {order.delivery_info?.method === 'envio' ? '🚀 Envío' : '🏠 Retiro'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pago</h4>
                            <div className="bg-gray-50 p-3 rounded-xl text-xs font-bold text-gray-700">
                                {order.delivery_info?.payment_method || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Captura de Pantalla */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Comprobante de Pago</h4>
                        <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group relative">
                            {order.delivery_info?.proof ? (
                                <img
                                    src={order.delivery_info.proof}
                                    className="w-full h-full object-cover"
                                    alt="Comprobante"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <ImageOff size={32} />
                                    <span className="text-[10px] font-bold mt-2 uppercase">No adjunto</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-end">
                        <span className="text-gray-400 font-bold text-sm uppercase">Total Pagado</span>
                        <span className="text-3xl font-black text-rose-500">${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function Orders({ session, onBack }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (session) fetchOrders();
    }, [session]);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_email', session.user.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error("Error cargando pedidos:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 animate-fade-in flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30">
                <button onClick={onBack} className="p-2 hover:bg-rose-50 rounded-full text-gray-400 hover:text-rose-500 transition-all">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-black text-gray-900 font-serif">Mi Historial</h2>
            </div>

            <div className="p-6 flex-1 max-w-2xl mx-auto w-full space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Buscando tus pedidos...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <ShoppingBag size={64} strokeWidth={1} className="mb-4" />
                        <p className="font-bold text-sm">Aún no has realizado pedidos</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const date = new Date(order.created_at).toLocaleDateString();
                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pedido #{order.id.toString().slice(-4)}</p>
                                            <p className="font-bold text-gray-900 text-sm">{date}</p>
                                        </div>
                                    </div>
                                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                        {order.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                                        <span className="font-black text-rose-500 text-lg">${order.total.toFixed(2)}</span>
                                    </div>
                                    <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-rose-500 transition-colors uppercase tracking-widest">
                                        Ver Detalle <Eye size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}