// Corrected DeliveryDashboard logic to prevent white screen and data mapping issues
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Truck, CheckCircle2, MapPin, Phone, User, Package,
    Clock, LogOut
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function DeliveryDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('pending'); // pending | history
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveryOrders();
        
        // Suscripción real-time
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDeliveryOrders)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchDeliveryOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            // SAFEGUARD: data can be null on error or empty
            const safeData = data || [];

            // Filtrar solo Envios
            const deliveryOrders = safeData.filter(order => 
                order.delivery_info && order.delivery_info.method === 'envio'
            );
            
            setOrders(deliveryOrders);
        } catch (error) {
            console.error("Error fetching delivery orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDelivered = async (orderId) => {
        const result = await Swal.fire({
            title: '¿Confirmar Entrega?',
            text: "El pedido se marcará como entregado y completado.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#F43F5E',
            cancelButtonColor: '#9CA3AF',
            confirmButtonText: 'Sí, Entregado',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase
                    .from('orders')
                    .update({ status: 'Entregado' }) 
                    .eq('id', orderId);

                if (error) throw error;

                Swal.fire({
                    title: '¡Entregado!',
                    text: 'El pedido ha sido actualizado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#F43F5E'
                });
                fetchDeliveryOrders();
            } catch (error) {
                console.error("Error updating order:", error);
                Swal.fire('Error', 'No se pudo actualizar el pedido', 'error');
            }
        }
    };

    const handleMarkAsPending = async (orderId) => {
        // Opción para revertir si fue un error (opcional, pero útil en desarrollo)
         try {
                const { error } = await supabase
                    .from('orders')
                    .update({ status: 'sent' }) 
                    .eq('id', orderId); // status 'sent' podría ser el previo a delivered
                 fetchDeliveryOrders();
            } catch (error) {}
    }

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'pending') {
            return order.status !== 'Entregado' && order.status !== 'Cancelado';
        } else {
            return order.status === 'Entregado';
        }
    });

    const pendingCount = orders.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado').length;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-rose-500 selection:text-white pb-20">
            
            {/* ENCABEZADO (Header) */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-500 p-2 rounded-xl text-white shadow-lg shadow-rose-200">
                            <Truck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="font-black text-xl tracking-tight leading-none text-gray-900">Delivery<span className="text-rose-500">.</span></h1>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Panel de Repartidor</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onLogout}
                        className="bg-gray-100 p-2.5 rounded-full text-gray-500 hover:text-white hover:bg-rose-500 transition-all active:scale-95"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                {/* NAVEGACIÓN PRINCIPAL (Tabs) */}
                <div className="max-w-5xl mx-auto px-4 mt-2">
                    <div className="flex gap-6">
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                                activeTab === 'pending' 
                                ? 'border-rose-500 text-rose-500' 
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <span className="relative">
                                🔔 Por Entregar
                                {pendingCount > 0 && <span className="absolute -top-2 -right-3 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{pendingCount}</span>}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                                activeTab === 'history' 
                                ? 'border-green-500 text-green-500' 
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <CheckCircle2 size={16} /> Historial
                        </button>
                    </div>
                </div>
            </header>

            {/* ÁREA DE CONTENIDO DINÁMICO */}
            <main className="max-w-3xl mx-auto p-6 space-y-6">
                
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mx-auto mb-4"></div>
                        <p className="text-gray-400 font-bold animate-pulse">Cargando pedidos...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <Package className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No hay pedidos {activeTab === 'pending' ? 'pendientes' : 'en el historial'}</h3>
                        <p className="text-gray-400 text-sm mt-2">Los pedidos asignados para envío aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                             // Definir variables seguras
                             const deliveryAddress = order.delivery_info?.shipping || order.delivery_info?.address || 'Sin dirección registrada';
                             const clientName = order.delivery_info?.full_name || order.user_email || 'Cliente';
                             const clientPhone = order.delivery_info?.phone || 'No registrado';
                             const shortId = (typeof order.id === 'string') ? order.id.slice(0, 8) : '...';
                             const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Fecha desc.';
                             const items = Array.isArray(order.items) ? order.items : [];

                            return (
                            <div key={order.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-100 hover:shadow-2xl hover:border-rose-100 transition-all group overflow-hidden relative">
                                {/* Decoración de fondo */}
                                <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
                                    <Truck size={120} className="text-rose-500" />
                                </div>

                                <div className="relative z-10">
                                    {/* Cabecera de Tarjeta */}
                                    <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Pedido #{shortId}</p>
                                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                <User size={16} className="text-gray-400" /> 
                                                {clientName}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                order.status === 'Entregado' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Entregado' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                                                {order.status}
                                            </span>
                                            <p className="text-xs text-gray-400 font-bold mt-1 flex items-center justify-end gap-1">
                                                <Clock size={12} />
                                                {orderDate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Información de Entrega */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin size={12} /> Dirección de Entrega
                                            </h4>
                                            <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                {deliveryAddress}
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Phone size={12} /> Contacto
                                            </h4>
                                            <div className="flex flex-col gap-2">
                                                <a href={`tel:${clientPhone}`} className="text-sm font-bold text-gray-600 bg-gray-50 hover:bg-rose-500 hover:text-white transition-colors p-3 rounded-xl flex items-center justify-between group/phone border border-gray-100">
                                                    {clientPhone}
                                                    <Phone size={14} className="opacity-50 group-hover/phone:opacity-100" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumen Productos (Expandible o simple) */}
                                    <div className="mb-6">
                                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Package size={12} /> Items ({items.length})
                                        </h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="flex-shrink-0 bg-gray-50 rounded-lg p-2 border border-gray-100 flex items-center gap-2 min-w-[150px]">
                                                    <div className="w-8 h-8 rounded bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                                                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : <Package size={14} className="text-gray-300" />}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-bold text-gray-700 truncate">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Botón de Acción */}
                                    {activeTab === 'pending' && (
                                        <button 
                                            onClick={() => handleMarkAsDelivered(order.id)}
                                            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-xl shadow-xl shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide group/btn"
                                        >
                                            <CheckCircle2 className="group-hover/btn:scale-110 transition-transform" />
                                            Marcar como Entregado
                                        </button>
                                    )}
                                     {activeTab === 'history' && (
                                        <div className="w-full bg-gray-50 text-green-600 font-bold py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                                            <CheckCircle2 size={16} /> Entregado 
                                            <span className="text-xs normal-case text-gray-400 ml-1">
                                                (Total: ${order.total})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </main>
        </div>
    );
}
