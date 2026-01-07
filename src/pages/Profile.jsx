import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import Cropper from 'react-easy-crop';
import {
    ShoppingBag,
    Heart,
    Settings,
    ChevronLeft,
    LogOut,
    MapPin,
    ArrowRight,
    Camera,
    X,
    Check,
    ImageOff,
    Plus,
    Trash2,
    Layout,
    Lock,
    Phone,
    Mail,
    Loader2,
    Eye,
    EyeOff,
    Clock4,
    Package,
    XCircle
} from 'lucide-react';
import LoginRegister from '../components/LoginRegister';
import Header from '../components/Header';
import Swal from 'sweetalert2';
import { useCurrency } from '../context/CurrencyContext';

// =====================================================================
// UTILIDADES
// =====================================================================
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
        canvas.toBlob((file) => { resolve(file); }, 'image/jpeg', 0.95);
    });
}

const VENEZUELA_STATES = [
    "Barinas", "Amazonas", "Anzoátegui", "Apure", "Aragua", "Bolívar", "Carabobo", "Cojedes",
    "Delta Amacuro", "Distrito Capital", "Falcón", "Guárico", "Lara", "Mérida", "Miranda",
    "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "Vargas",
    "Yaracuy", "Zulia"
];

// =====================================================================
// COMPONENTES DE UI MODALES
// =====================================================================

function ModalNormal({ children, onClose, id }) {
    return createPortal(
        <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in" onClick={onClose}></div>
            <div
                id={id}
                className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up pointer-events-auto flex flex-col max-h-[90vh]"
            >
                {children}
            </div>
        </div>,
        document.body
    );
}

function HeaderView({ title, onBack }) {
    return (
        <div className="flex items-center px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
            <button onClick={onBack} className="mr-2 text-gray-400 hover:text-rose-500 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-50">
                <ChevronLeft />
            </button>
            <h3 className="text-gray-800 font-black text-lg">{title}</h3>
        </div>
    );
}

// --- NUEVA VISTA DE HISTORIAL DE PEDIDOS CON DETALLE ---
function OrdersView({ session, onBack }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
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
                console.error("Error cargando pedidos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [session]);

    if (selectedOrder) {
        const date = new Date(selectedOrder.created_at);
        return (
            <div className="min-h-[60vh] flex flex-col bg-white">
                <HeaderView title="Detalle del Pedido" onBack={() => setSelectedOrder(null)} />
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Clock4 className="text-rose-500" size={20} />
                            <div>
                                <p className="text-[10px] font-black text-rose-400 uppercase">Realizado el</p>
                                <p className="font-bold text-gray-900 text-sm">{date.toLocaleDateString()} a las {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        <span className="bg-white text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">{selectedOrder.status}</span>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Productos</h4>
                        <div className="space-y-2">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="font-bold text-sm text-gray-700">{item.name} <span className="text-rose-400">x{item.quantity}</span></span>
                                    <span className="font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Comprobante de Pago</h4>
                        <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
                            {selectedOrder.delivery_info?.proof ? (
                                <img src={selectedOrder.delivery_info.proof} className="w-full h-full object-cover" alt="Comprobante" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <ImageOff size={32} />
                                    <span className="text-[10px] font-bold mt-2 uppercase">Sin captura</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                        <span className="text-gray-400 font-bold text-sm uppercase">Total</span>
                        <span className="text-3xl font-black text-rose-500">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[50vh] flex flex-col bg-gray-50">
            <HeaderView title="Mis Pedidos" onBack={onBack} />
            <div className="p-6 space-y-4 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="font-bold text-sm">No has realizado pedidos aún</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors"><Package size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Pedido #{order.id.toString().slice(-4)}</p>
                                    <p className="font-bold text-gray-900 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-rose-500">${order.total.toFixed(2)}</p>
                                <span className="text-[9px] font-black uppercase text-gray-400">{order.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// --- VISTA DE FAVORITOS ---
function FavoritesView({ onBack, session, products, onProductClick, onAddToCart }) {
    const [favProducts, setFavProducts] = useState([]);
    const [loadingFavs, setLoadingFavs] = useState(true);
    const { getDisplayPrice } = useCurrency();

    useEffect(() => {
        const loadFavs = async () => {
            try {
                const { data, error } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
                if (error) throw error;
                if (data) {
                    const ids = data.map(f => f.product_id);
                    setFavProducts(products.filter(p => ids.includes(p.id)));
                }
            } catch (err) {
                console.error("Error cargando favoritos:", err);
            } finally {
                setLoadingFavs(false);
            }
        };
        loadFavs();
    }, [session, products]);

    const handleQuickAdd = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product, 1);
        Swal.update({ target: document.getElementById('profile-modal-container') });
    };

    return (
        <div className="min-h-[50vh] flex flex-col bg-gray-50">
            <HeaderView title="Mis Favoritos" onBack={onBack} />
            <div className="flex-1 overflow-y-auto p-6">
                {loadingFavs ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>
                ) : favProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <Heart size={48} className="mb-4 opacity-20" />
                        <p className="font-bold text-sm">Tu lista está vacía</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {favProducts.map(p => {
                            const { text, isBs, ref } = getDisplayPrice(p);
                            return (
                                <div key={p.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative group overflow-hidden">
                                    <button onClick={(e) => handleQuickAdd(e, p)} className="absolute top-2 right-2 w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-90 transition-all z-[30]">
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                    <div className="w-full cursor-pointer" onClick={() => onProductClick(p)}>
                                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-50 flex items-center justify-center">
                                            {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} /> : <ImageOff size={20} className="text-gray-300" />}
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-[10px] uppercase line-clamp-1 group-hover:text-rose-500">{p.name}</h4>
                                        <p className="text-rose-500 font-black text-sm mt-1">{text}</p>
                                        {isBs && <p className="text-[8px] text-gray-400 font-bold tracking-tighter">Ref: {ref}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- VISTA DE DIRECCIONES ---
function AddressView({ onBack, session, currentAddress, onUpdate }) {
    const [addresses, setAddresses] = useState(currentAddress ? currentAddress.split('|').filter(a => a.trim() !== '') : []);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ street: '', building: '', city: '', zip: '', state: 'Barinas' });

    const handleSave = async (e) => {
        e.preventDefault();
        const newAddressString = `${form.street}${form.building ? ', ' + form.building : ''}, ${form.city}, Edo. ${form.state}${form.zip ? ', CP: ' + form.zip : ''}`;
        const updated = [...addresses, newAddressString];
        const { error } = await supabase.from('profiles').update({ address: updated.join('|') }).eq('id', session.user.id);
        if (!error) {
            setAddresses(updated);
            setIsAdding(false);
            setForm({ street: '', building: '', city: '', zip: '', state: 'Barinas' });
            onUpdate();
            Swal.fire({ icon: 'success', title: 'Dirección guardada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        }
    };

    const handleRemove = async (index) => {
        const updated = addresses.filter((_, i) => i !== index);
        const { error } = await supabase.from('profiles').update({ address: updated.join('|') }).eq('id', session.user.id);
        if (!error) {
            setAddresses(updated);
            onUpdate();
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col bg-white">
            <HeaderView title={isAdding ? "Nueva Dirección" : "Mis Direcciones"} onBack={isAdding ? () => setIsAdding(false) : onBack} />
            <div className="p-6 flex-1 overflow-y-auto">
                {!isAdding ? (
                    <div className="space-y-4">
                        <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:border-rose-300 hover:text-rose-500 transition-all">
                            <Plus size={20} /> Agregar Dirección
                        </button>
                        {addresses.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <MapPin size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-bold">No tienes direcciones registradas</p>
                            </div>
                        ) : (
                            addresses.map((addr, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 bg-white rounded-full text-rose-500 shadow-sm shrink-0"><MapPin size={16} /></div>
                                        <span className="text-[11px] font-bold text-gray-700 leading-tight">{addr}</span>
                                    </div>
                                    <button onClick={() => handleRemove(i)} className="text-gray-300 hover:text-red-500 transition-colors p-1 ml-2"><Trash2 size={16} /></button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4 animate-fade-in pb-10">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Calle / Avenida / Sector</label>
                            <input required value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="Ej: Av. 23 de Enero" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Casa, Apto, Punto de referencia</label>
                            <input value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} placeholder="Ej: Res. Victoria, frente a la plaza" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ciudad / Municipio</label>
                                <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ej: Barinas" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cód. Postal</label>
                                <input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="5201" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estado</label>
                            <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500 text-sm appearance-none">
                                {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-95 transition-all"><Check size={20} /> Guardar Dirección</button>
                    </form>
                )}
            </div>
        </div>
    );
}

// --- VISTA DE AJUSTES MEJORADA CON ICONOS DE VISIBILIDAD ---
function SettingsView({ onBack, session, userData, onUpdate }) {
    const [activeSubView, setActiveSubView] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' });
    const [phoneForm, setPhoneForm] = useState(userData?.phone || '');
    const [emailForm, setEmailForm] = useState(session?.user?.email || '');

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passForm.newPass !== passForm.confirmPass) {
            return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
        }
        if (passForm.newPass.length < 6) {
            return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
        setLoading(false);
        if (error) Swal.fire('Error', error.message, 'error');
        else {
            Swal.fire('¡Éxito!', 'Contraseña actualizada correctamente', 'success');
            setActiveSubView(null);
            setPassForm({ newPass: '', confirmPass: '' });
        }
    };

    const handleUpdatePhone = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error: profileError } = await supabase.from('profiles').update({ phone: phoneForm }).eq('id', session.user.id);
        const { error: authError } = await supabase.auth.updateUser({ data: { phone: phoneForm } });
        setLoading(false);
        if (profileError || authError) Swal.fire('Error', 'No se pudo actualizar el teléfono', 'error');
        else {
            Swal.fire('¡Éxito!', 'Teléfono actualizado', 'success');
            setActiveSubView(null);
            onUpdate();
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ email: emailForm });
        setLoading(false);
        if (error) Swal.fire('Error', error.message, 'error');
        else {
            Swal.fire('Verificación enviada', 'Confirma el cambio en tu correo electrónico.', 'info');
            setActiveSubView(null);
        }
    };

    if (activeSubView) {
        return (
            <div className="min-h-[50vh] flex flex-col bg-white">
                <HeaderView
                    title={activeSubView === 'pass' ? "Cambiar Contraseña" : activeSubView === 'phone' ? "Cambiar Teléfono" : "Cambiar Correo"}
                    onBack={() => setActiveSubView(null)}
                />
                <div className="p-8 animate-fade-in">
                    <form className="space-y-6" onSubmit={
                        activeSubView === 'pass' ? handleUpdatePassword :
                            activeSubView === 'phone' ? handleUpdatePhone : handleUpdateEmail
                    }>
                        {activeSubView === 'pass' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showPass ? "text" : "password"}
                                            value={passForm.newPass}
                                            onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-4 pr-12 outline-none focus:border-rose-500"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                                        >
                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showConfirmPass ? "text" : "password"}
                                            value={passForm.confirmPass}
                                            onChange={e => setPassForm({ ...passForm, confirmPass: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-4 pr-12 outline-none focus:border-rose-500"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                                        >
                                            {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                        {activeSubView === 'phone' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Número de Teléfono</label>
                                <input required type="tel" value={phoneForm} onChange={e => setPhoneForm(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500" placeholder="0412-1234567" />
                            </div>
                        )}
                        {activeSubView === 'email' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nueva Dirección de Correo</label>
                                <input required type="email" value={emailForm} onChange={e => setEmailForm(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-rose-500" placeholder="nuevo@correo.com" />
                                <p className="text-[10px] text-gray-400 italic mt-2">Nota: Se enviará un correo de confirmación.</p>
                            </div>
                        )}
                        <button disabled={loading} type="submit" className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                            {loading ? 'Procesando...' : 'Confirmar Cambio'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[50vh] flex flex-col bg-gray-50">
            <HeaderView title="Ajustes de Cuenta" onBack={onBack} />
            <div className="p-6 space-y-4">
                <button onClick={() => setActiveSubView('pass')} className="w-full flex items-center justify-between p-5 bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors"><Lock size={20} /></div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900">Seguridad</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Cambiar contraseña</p>
                        </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300" />
                </button>

                <button onClick={() => setActiveSubView('phone')} className="w-full flex items-center justify-between p-5 bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors"><Phone size={20} /></div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900">Teléfono</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{userData?.phone || 'Sin número'}</p>
                        </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300" />
                </button>

                <button onClick={() => setActiveSubView('email')} className="w-full flex items-center justify-between p-5 bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors"><Mail size={20} /></div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900">Email</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[150px]">{session?.user?.email}</p>
                        </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300" />
                </button>
            </div>
        </div>
    );
}

// =====================================================================
// COMPONENTE PRINCIPAL PROFILE
// =====================================================================
export default function Profile({ session, products, onProductClick, onAddToCart, onCurrencyChange, onRequestAdmin }) {
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [activeView, setActiveView] = useState(null);
    const fileInputRef = useRef(null);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);

    const getProfile = useCallback(async () => {
        if (!session) return;
        try {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('full_name, avatar_url, phone, address').eq('id', session.user.id).single();
            if (error) throw error;
            if (data) {
                setUserData(data);
                if (data.avatar_url) downloadImage(data.avatar_url);
            }
        } catch (error) { console.error('Error:', error.message); } finally { setLoading(false); }
    }, [session]);

    useEffect(() => { getProfile(); }, [getProfile]);

    async function downloadImage(path) {
        try {
            const { data, error } = await supabase.storage.from('avatars').download(path);
            if (error) throw error;
            setAvatarUrl(URL.createObjectURL(data));
        } catch (error) { console.error('Error:', error.message); }
    }

    const handleFileSelect = (event) => {
        if (event.target.files?.[0]) {
            const reader = new FileReader();
            reader.addEventListener('load', () => { setSelectedImageSrc(reader.result); setActiveView('crop'); });
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    const handleUploadAvatar = async (croppedImageBlob) => {
        try {
            const filePath = `${session.user.id}/${Math.random()}.jpg`;
            await supabase.storage.from('avatars').upload(filePath, croppedImageBlob);
            await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', session.user.id);
            setAvatarUrl(URL.createObjectURL(croppedImageBlob));
            setActiveView(null);
            Swal.fire({ icon: 'success', title: 'Foto actualizada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#F43F5E',
            confirmButtonText: 'Sí, salir',
            customClass: { popup: 'rounded-[2.5rem]', confirmButton: 'rounded-xl font-bold', cancelButton: 'rounded-xl font-bold' }
        }).then(async (result) => { if (result.isConfirmed) await supabase.auth.signOut(); });
    };

    if (!session) return <LoginRegister />;

    const userName = userData?.full_name || session.user.email?.split('@')[0] || 'Usuario';
    const isAdmin = session.user.email === 'solaraproyecto@hotmail.com';

    let ModalContent = null;
    if (activeView === 'crop') ModalContent = <PhotoCropView imageSrc={selectedImageSrc} onCancel={() => setActiveView(null)} onSave={handleUploadAvatar} />;

    // CAMBIO: Ahora llama a la nueva OrdersView real
    else if (activeView === 'orders') ModalContent = <OrdersView session={session} onBack={() => setActiveView(null)} />;

    else if (activeView === 'favorites') ModalContent = <FavoritesView onBack={() => setActiveView(null)} session={session} products={products} onProductClick={onProductClick} onAddToCart={onAddToCart} />;
    else if (activeView === 'address') ModalContent = <AddressView session={session} currentAddress={userData?.address} onBack={() => setActiveView(null)} onUpdate={getProfile} />;
    else if (activeView === 'settings') ModalContent = <SettingsView session={session} userData={userData} onBack={() => setActiveView(null)} onUpdate={getProfile} />;

    return (
        <div className="pb-24 animate-fade-in w-full bg-white min-h-screen">
            <Header title="Perfil" onCurrencyChange={onCurrencyChange} />
            <div className="px-4 md:px-12 lg:px-24 pt-8 w-full mx-auto">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                {activeView && (
                    <ModalNormal id="profile-modal-container" onClose={() => { if (activeView !== 'crop') setActiveView(null); }}>
                        {ModalContent}
                    </ModalNormal>
                )}

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 text-center relative overflow-hidden group max-w-2xl mx-auto">
                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative mb-4 group/avatar cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <div className="w-24 h-24 rounded-full bg-rose-500 text-white flex items-center justify-center text-4xl font-black shadow-lg border-4 border-white overflow-hidden relative">
                                {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : userName.charAt(0).toUpperCase()}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center"><Camera size={24} className="text-white" /></div>
                            </div>
                            <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-rose-500 md:hidden"><Camera size={16} /></div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 font-serif">{userName}</h2>
                        <p className="text-rose-500 font-bold text-sm">{session.user.email}</p>
                    </div>
                </div>

                {isAdmin && (
                    <div className="max-w-5xl mx-auto mb-8 animate-fade-in">
                        <button onClick={onRequestAdmin} className="w-full group bg-[#F43F5E] p-8 rounded-[2.5rem] shadow-xl shadow-rose-200 flex items-center justify-between hover:bg-[#e11d48] transition-all border border-rose-400">
                            <div className="flex items-center gap-5 text-left">
                                <div className="p-4 bg-white/20 rounded-2xl text-white group-hover:scale-110 transition-transform"><Layout size={32} /></div>
                                <div>
                                    <h4 className="font-black text-white text-2xl leading-none mb-1">Panel Dashboard</h4>
                                    <p className="text-xs text-rose-100 font-bold uppercase tracking-wider">Gestión administrativa de la tienda</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-full text-[#F43F5E] shadow-lg group-hover:translate-x-2 transition-transform"><ArrowRight size={24} /></div>
                        </button>
                    </div>
                )}

                {!isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {[
                            { icon: ShoppingBag, label: 'Mis Pedidos', detail: 'Historial de compras', view: 'orders', color: 'bg-blue-50 text-blue-500' },
                            { icon: Heart, label: 'Deseos', detail: 'Tus favoritos', view: 'favorites', color: 'bg-rose-50 text-rose-500' },
                            { icon: MapPin, label: 'Direcciones', detail: userData?.address ? `${userData.address.split('|').filter(a => a.trim() !== '').length} guardadas` : 'Ninguna', view: 'address', color: 'bg-orange-50 text-orange-500' },
                            { icon: Settings, label: 'Ajustes', detail: 'Seguridad cuenta', view: 'settings', color: 'bg-gray-50 text-gray-500' },
                        ].map((item, idx) => (
                            <button key={idx} onClick={() => setActiveView(item.view)} className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start gap-4 text-left">
                                <div className={`p-4 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}><item.icon size={28} /></div>
                                <div><h4 className="font-black text-gray-900 text-xl leading-none mb-1">{item.label}</h4><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.detail}</p></div>
                                <div className="w-full pt-4 mt-auto border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-rose-500 uppercase">Gestionar</span>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-rose-500 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-12 mb-12 flex justify-center">
                    <button onClick={handleLogout} className="w-full max-w-sm flex items-center justify-center p-6 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-[2rem] transition-all font-bold gap-2 border-2 border-dashed border-gray-100"><LogOut size={20} /> Cerrar Sesión</button>
                </div>
            </div>
        </div>
    );
}

function PhotoCropView({ imageSrc, onCancel, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels); }, []);
    return (
        <div className="flex flex-col h-[80vh] bg-black">
            <div className="p-4 flex justify-between bg-black/50 text-white z-20"><button onClick={onCancel} className="p-2"><X /></button><button onClick={async () => onSave(await getCroppedImg(imageSrc, croppedAreaPixels))} className="bg-rose-500 px-4 py-2 rounded-xl font-bold">Listo</button></div>
            <div className="flex-1 relative"><Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} /></div>
            <div className="p-4 bg-gray-900"><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-rose-500" /></div>
        </div>
    );
}