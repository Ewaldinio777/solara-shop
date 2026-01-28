import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    ChevronLeft, MapPin, Truck, Store, CreditCard,
    ArrowRight, Info, Loader2, Building2, Smartphone,
    Receipt, CheckCircle2, Image as ImageIcon, Wallet,
    FileText, UploadCloud, X, Hash, User
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useCurrency } from '../context/CurrencyContext';

export default function Checkout({ cart, onBack, session, clearCart }) {
    const { getDisplayPrice } = useCurrency();
    const [deliveryMethod, setDeliveryMethod] = useState('retiro');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Estados de selección
    const [userAddresses, setUserAddresses] = useState([]);
    const [userPhone, setUserPhone] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [selectedShippingAddr, setSelectedShippingAddr] = useState('');
    const [selectedBillingAddr, setSelectedBillingAddr] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentId, setSelectedPaymentId] = useState('');
    const [storeConfig, setStoreConfig] = useState({ phone: '', locations: [] });
    const [selectedStoreLocation, setSelectedStoreLocation] = useState('');
    const [paymentProofUrl, setPaymentProofUrl] = useState(null);

    const SHIPPING_COST = 3.00;

    useEffect(() => {
        async function loadCheckoutData() {
            if (!session) return;

            // 1. Cargar Direcciones y Datos del Perfil del Usuario
            const { data: profile } = await supabase
                .from('profiles')
                .select('address, phone, full_name')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                // Guardar Teléfono y Nombre para el pedido
                if (profile.phone) setUserPhone(profile.phone);
                if (profile.full_name) setUserFullName(profile.full_name);

                if (profile.address) {
                    const list = profile.address.split('|').filter(a => a.trim() !== '');
                    setUserAddresses(list);
                    if (list.length > 0) {
                        setSelectedShippingAddr(list[0]);
                        setSelectedBillingAddr(list[0]);
                    }
                }
            }

            // 2. Cargar Métodos de Pago (Dinámicos de la BD)
            const { data: payments } = await supabase.from('payment_methods').select('*');
            setPaymentMethods(payments || []);
            if (payments?.length > 0) setSelectedPaymentId(payments[0].id);

            // 3. Cargar Configuración de Tienda (WA y Sedes)
            const { data: settings } = await supabase.from('store_settings').select('contact_phone').eq('id', 1).single();
            const { data: locs } = await supabase.from('store_locations').select('*');

            setStoreConfig({
                phone: settings?.contact_phone || '584245138139',
                locations: locs || []
            });
            if (locs?.length > 0) setSelectedStoreLocation(locs[0].address);

            setLoading(false);
        }
        loadCheckoutData();
    }, [session]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `proof-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('products').getPublicUrl(fileName);
            setPaymentProofUrl(data.publicUrl);
        } catch (err) {
            Swal.fire('Error', 'No se pudo subir la captura', 'error');
        } finally {
            setUploading(false);
        }
    };

    const subtotalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalUSD = deliveryMethod === 'envio' ? subtotalUSD + SHIPPING_COST : subtotalUSD;

    const subtotalDisplay = getDisplayPrice({ price: subtotalUSD });
    const shippingDisplay = getDisplayPrice({ price: SHIPPING_COST });
    const totalDisplay = getDisplayPrice({ price: totalUSD });

    const handleConfirmOrder = async () => {
        if (deliveryMethod === 'envio' && !selectedShippingAddr) return Swal.fire('Error', 'Selecciona dirección de envío', 'error');
        if (!selectedBillingAddr) return Swal.fire('Error', 'Selecciona dirección de facturación', 'error');
        if (!selectedPaymentId) return Swal.fire('Error', 'Selecciona método de pago', 'error');
        if (!paymentProofUrl) return Swal.fire('Falta Pago', 'Sube la captura de tu pago para confirmar.', 'warning');

        const pay = paymentMethods.find(p => p.id === selectedPaymentId);
        const nombreCliente = session.user.user_metadata?.full_name || session.user.email;
        const itemsList = cart.map(item => `✨ ${item.name} (x${item.quantity})`).join('%0A');

        // Mensaje de WhatsApp Estético
        const mensaje = `*💖 NUEVA ORDEN - SOLARA 💖*%0A%0A` +
            `*👤 CLIENTE:* ${nombreCliente}%0A` +
            `*📍 ENTREGA:* ${deliveryMethod === 'envio' ? '🚀 Envío a Domicilio' : '🏠 Retiro en Tienda'}%0A` +
            `*📌 DIRECCIÓN:* ${deliveryMethod === 'envio' ? selectedShippingAddr : selectedStoreLocation}%0A` +
            `*🧾 FACTURACIÓN:* ${selectedBillingAddr}%0A` +
            `*💳 PAGO:* ${pay?.type} (${pay?.bank_name || ''})%0A%0A` +
            `*🛍️ PRODUCTOS:*%0A${itemsList}%0A%0A` +
            `*----------------------------*%0A` +
            `*💵 SUBTOTAL:* ${subtotalDisplay.text}%0A` +
            `*🚚 ENVÍO:* ${deliveryMethod === 'envio' ? shippingDisplay.text : 'GRATIS'}%0A` +
            `*💰 TOTAL A PAGAR:* ${totalDisplay.text}%0A` +
            `*----------------------------*%0A%0A` +
            `✅ _He adjuntado mi captura de pago. ¡Espero mi pedido!_`;

        const whatsappUrl = `https://wa.me/${storeConfig.phone}?text=${mensaje}`;

        try {
            await supabase.from('orders').insert([{
                user_email: session.user.email,
                total: totalUSD,
                status: 'Pendiente',
                items: cart,
                delivery_info: {
                    method: deliveryMethod,
                    shipping: selectedShippingAddr,
                    billing: selectedBillingAddr,
                    pickup_location: selectedStoreLocation,
                    payment_method: pay?.type,
                    proof: paymentProofUrl,
                    phone: userPhone || 'No registrado',
                    full_name: userFullName || nombreCliente
                }
            }]);

            window.open(whatsappUrl, '_blank');
            await Swal.fire({ title: '¡Listo!', text: 'Pedido registrado. Revisa WhatsApp ✨', icon: 'success', confirmButtonColor: '#F43F5E', customClass: { popup: 'rounded-[2.5rem]' } });
            clearCart();
            onBack();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-rose-500" size={40} /></div>;

    const currentPayment = paymentMethods.find(p => p.id === selectedPaymentId);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-fade-in font-sans">
            {/* Header Fino */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-8 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
                <button onClick={onBack} className="p-3 hover:bg-rose-50 rounded-2xl text-rose-500 transition-all bg-gray-50 active:scale-90"><ChevronLeft size={24} /></button>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">Checkout</h2>
            </div>

            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">

                {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
                <div className="space-y-6">
                    {/* 1. MODO DE ENTREGA */}
                    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 text-lg"><Truck className="text-rose-500" /> Logística de Entrega</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setDeliveryMethod('retiro')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${deliveryMethod === 'retiro' ? 'border-rose-500 bg-rose-50 shadow-md shadow-rose-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                                <Store size={28} />
                                <span className="font-black text-sm">Retiro</span>
                                <span className="text-[10px] font-bold text-green-500 uppercase">Gratis</span>
                            </button>
                            <button onClick={() => setDeliveryMethod('envio')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${deliveryMethod === 'envio' ? 'border-rose-500 bg-rose-50 shadow-md shadow-rose-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                                <Truck size={28} />
                                <span className="font-black text-sm">Envío</span>
                                <span className="text-[10px] font-bold text-rose-500 uppercase">+$3.00</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-2">
                                {deliveryMethod === 'envio' ? '¿A dónde enviamos?' : '¿Dónde retiras?'}
                            </label>
                            <select
                                value={deliveryMethod === 'envio' ? selectedShippingAddr : selectedStoreLocation}
                                onChange={(e) => deliveryMethod === 'envio' ? setSelectedShippingAddr(e.target.value) : setSelectedStoreLocation(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-rose-500 appearance-none shadow-inner"
                            >
                                {deliveryMethod === 'envio'
                                    ? userAddresses.map((a, i) => <option key={i} value={a}>{a}</option>)
                                    : storeConfig.locations.map((l, i) => <option key={i} value={l.address}>{l.name} - {l.address}</option>)
                                }
                            </select>
                        </div>
                    </section>

                    {/* 2. FACTURACIÓN */}
                    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 text-lg"><Receipt className="text-rose-500" /> Facturación</h3>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Selecciona Dirección para Recibo</label>
                        <select
                            value={selectedBillingAddr}
                            onChange={(e) => setSelectedBillingAddr(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-rose-500 appearance-none shadow-inner"
                        >
                            {userAddresses.map((a, i) => <option key={i} value={a}>{a}</option>)}
                        </select>
                    </section>
                </div>

                {/* COLUMNA DERECHA: PAGO Y TOTAL */}
                <div className="space-y-6">
                    {/* 3. PAGO */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100 space-y-6">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 text-xl"><CreditCard className="text-rose-500" /> Método de Pago</h3>
                        <select
                            value={selectedPaymentId}
                            onChange={(e) => setSelectedPaymentId(e.target.value)}
                            className="w-full bg-rose-500 text-white rounded-2xl p-4 font-black outline-none focus:ring-4 focus:ring-rose-200 transition-all shadow-lg"
                        >
                            {paymentMethods.map(m => <option key={m.id} value={m.id} className="text-gray-900">{m.type} - {m.bank_name || 'Directo'}</option>)}
                        </select>

                        {currentPayment && (
                            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 grid grid-cols-2 gap-y-4 gap-x-2 animate-fade-in">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><Building2 size={10} /> Banco</p>
                                    <p className="font-bold text-sm text-gray-700">{currentPayment.bank_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1 justify-end"><User size={10} /> Titular</p>
                                    <p className="font-bold text-sm text-gray-700">{currentPayment.owner_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><Hash size={10} /> CI / RIF</p>
                                    <p className="font-bold text-sm text-gray-700">{currentPayment.id_number}</p>
                                </div>
                                {currentPayment.phone_number && (
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1 justify-end"><Smartphone size={10} /> Teléfono</p>
                                        <p className="font-bold text-sm text-gray-700">{currentPayment.phone_number}</p>
                                    </div>
                                )}
                                {currentPayment.account_number && (
                                    <div className="col-span-2 pt-3 border-t border-gray-100">
                                        <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Número de Cuenta</p>
                                        <p className="font-mono text-[11px] text-rose-600 bg-rose-50/50 p-3 rounded-xl break-all border border-rose-100 select-all">{currentPayment.account_number}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">¿Ya pagaste? Sube tu captura aquí</label>
                            <label className="w-full h-32 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 hover:border-rose-200 transition-all relative overflow-hidden group">
                                {uploading ? <Loader2 className="animate-spin text-rose-500" /> :
                                    paymentProofUrl ? <img src={paymentProofUrl} className="w-full h-full object-cover" alt="pago" /> :
                                        <><UploadCloud className="text-gray-300 group-hover:text-rose-500 transition-colors" size={32} /><span className="text-xs font-bold text-gray-400 mt-2">Adjuntar Comprobante</span></>}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </section>

                    {/* RESUMEN FINAL */}
                    <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-400 font-bold text-sm"><span>Subtotal</span><span>{subtotalDisplay.text}</span></div>
                            <div className="flex justify-between font-bold text-sm">
                                <span className="text-gray-400">Entrega</span>
                                <span className={deliveryMethod === 'envio' ? 'text-gray-900' : 'text-green-500 font-black'}>{deliveryMethod === 'envio' ? shippingDisplay.text : 'GRATIS (Retiro)'}</span>
                            </div>
                            <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Total</p><h4 className="text-5xl font-black text-gray-900 tracking-tighter">{totalDisplay.text}</h4></div>
                                <CheckCircle2 size={48} className="text-rose-500 opacity-20" />
                            </div>
                        </div>

                        <button onClick={handleConfirmOrder} className="w-full bg-rose-500 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                            Confirmar Pedido <ArrowRight />
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}