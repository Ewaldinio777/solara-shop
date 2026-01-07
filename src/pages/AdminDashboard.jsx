import React, { useState, useEffect } from 'react';
import {
    Package, Layout, LogOut, RefreshCw, ImageOff, CreditCard, MapPin,
    Phone, Save, Loader2, Settings as SettingsIcon, Smartphone, Globe,
    Building2, DollarSign, Plus, Edit3, Trash2, Users, Image as ImageIcon
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient';

// Importa tus componentes de admin
import CategoryManager from '../components/admin/CategoryManager';
import ProductForm from '../components/admin/ProductForm';
import TrendsManager from '../components/admin/TrendsManager';
import BannerBuilder from '../components/admin/BannerBuilder';

// --- COMPONENTE: GESTIÓN DE CONFIGURACIÓN DE TIENDA ---
const StoreSettings = () => {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [storePhone, setStorePhone] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: p } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });
        const { data: l } = await supabase.from('store_locations').select('*').order('created_at', { ascending: true });
        const { data: s } = await supabase.from('store_settings').select('contact_phone').eq('id', 1).single();

        setPayments(p || []);
        setLocations(l || []);
        if (s) setStorePhone(s.contact_phone);
        setLoading(false);
    };

    // ACCIÓN UNIFICADA PARA AGREGAR/EDITAR PAGOS
    const handlePaymentAction = async (item = null) => {
        const isEdit = !!item;
        const { value: formValues } = await Swal.fire({
            title: isEdit ? 'Editar Cuenta' : 'Nueva Cuenta de Pago',
            html: `
                <div class="flex flex-col gap-4 text-left px-1 mt-4">
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-gray-400 uppercase ml-2">Tipo de cuenta</label>
                        <select id="p-type" class="swal2-select !flex !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14">
                            <option value="Pago Móvil" ${item?.type === 'Pago Móvil' ? 'selected' : ''}>Pago Móvil 🇻🇪</option>
                            <option value="Transferencia" ${item?.type === 'Transferencia' ? 'selected' : ''}>Transferencia Bancaria</option>
                            <option value="Zelle" ${item?.type === 'Zelle' ? 'selected' : ''}>Zelle 🇺🇸</option>
                            <option value="Binance" ${item?.type === 'Binance' ? 'selected' : ''}>Binance Pay 🟡</option>
                        </select>
                    </div>
                    <div id="dynamic-fields" class="space-y-4"></div>
                </div>
            `,
            didOpen: () => {
                const typeSelect = document.getElementById('p-type');
                const container = document.getElementById('dynamic-fields');

                const renderFields = (val) => {
                    if (val === 'Pago Móvil') {
                        container.innerHTML = `
                            <input id="p-bank" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Banco (Ej: Banesco)" value="${item?.bank_name || ''}">
                            <input id="p-id" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Cédula / RIF (Ej: V-12345678)" value="${item?.id_number || ''}">
                            <input id="p-phone" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Teléfono" value="${item?.phone_number || ''}">
                        `;
                    } else if (val === 'Zelle' || val === 'Binance') {
                        container.innerHTML = `
                            <input id="p-data" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Correo o Binance ID" value="${item?.account_number || ''}">
                            <input id="p-owner" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Nombre del Titular" value="${item?.owner_name || ''}">
                        `;
                    } else {
                        container.innerHTML = `
                            <input id="p-bank" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Nombre del Banco" value="${item?.bank_name || ''}">
                            <input id="p-owner" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Nombre del Titular" value="${item?.owner_name || ''}">
                            <input id="p-data" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Número de Cuenta" value="${item?.account_number || ''}">
                            <input id="p-id" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Cédula / RIF" value="${item?.id_number || ''}">
                        `;
                    }
                };

                typeSelect.addEventListener('change', (e) => renderFields(e.target.value));
                renderFields(typeSelect.value);
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            confirmButtonColor: '#F43F5E',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-[2.5rem] p-8',
                confirmButton: 'rounded-2xl font-bold py-4 px-8',
                cancelButton: 'rounded-2xl font-bold py-4 px-8'
            },
            preConfirm: () => {
                const type = document.getElementById('p-type').value;
                const data = { type };
                if (type === 'Pago Móvil') {
                    data.bank_name = document.getElementById('p-bank').value;
                    data.id_number = document.getElementById('p-id').value;
                    data.phone_number = document.getElementById('p-phone').value;
                } else if (type === 'Zelle' || type === 'Binance') {
                    data.account_number = document.getElementById('p-data').value;
                    data.owner_name = document.getElementById('p-owner').value;
                } else {
                    data.bank_name = document.getElementById('p-bank').value;
                    data.owner_name = document.getElementById('p-owner').value;
                    data.account_number = document.getElementById('p-data').value;
                    data.id_number = document.getElementById('p-id').value;
                }
                return data;
            }
        });

        if (formValues) {
            const { error } = isEdit
                ? await supabase.from('payment_methods').update(formValues).eq('id', item.id)
                : await supabase.from('payment_methods').insert([formValues]);

            if (!error) {
                Swal.fire({ icon: 'success', title: '¡Listo!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                fetchData();
            }
        }
    };

    const handleLocationAction = async (item = null) => {
        const isEdit = !!item;
        const { value: formValues } = await Swal.fire({
            title: isEdit ? 'Editar Sede' : 'Nueva Sede',
            html: `
                <div class="space-y-4 mt-4 text-left">
                    <input id="l-name" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Nombre (Ej: Sede Principal)" value="${item?.name || ''}">
                    <input id="l-addr" class="swal2-input !w-full !m-0 !rounded-2xl !border-gray-100 !text-sm !h-14" placeholder="Dirección Completa" value="${item?.address || ''}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar Sede',
            confirmButtonColor: '#F43F5E',
            customClass: { popup: 'rounded-[2.5rem] p-8', confirmButton: 'rounded-2xl font-bold py-4' },
            preConfirm: () => {
                const name = document.getElementById('l-name').value;
                const address = document.getElementById('l-addr').value;
                if (!name || !address) return Swal.showValidationMessage('⚠️ Completa los campos');
                return { name, address };
            }
        });

        if (formValues) {
            const { error } = isEdit
                ? await supabase.from('store_locations').update(formValues).eq('id', item.id)
                : await supabase.from('store_locations').insert([formValues]);

            if (!error) {
                Swal.fire({ icon: 'success', title: 'Ubicación guardada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                fetchData();
            }
        }
    };

    const updateStorePhone = async () => {
        if (!storePhone) return Swal.fire('Error', 'Ingresa un número', 'error');
        setSavingPhone(true);
        const { error } = await supabase.from('store_settings').upsert({ id: 1, contact_phone: storePhone });
        setSavingPhone(false);
        if (!error) Swal.fire({ icon: 'success', title: 'WhatsApp actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    };

    const deleteItem = async (table, id) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F43F5E',
            confirmButtonText: 'Sí, eliminar',
            customClass: { popup: 'rounded-[2.5rem]' }
        });
        if (result.isConfirmed) {
            await supabase.from(table).delete().eq('id', id);
            fetchData();
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-rose-500" size={40} /></div>;

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div>
                <h3 className="text-3xl font-black text-gray-900 mb-2 font-serif">Ajustes de Tienda</h3>
                <p className="text-gray-500 font-medium italic">Configuración de canales de pago y logística de Solara.</p>
            </div>

            {/* MÉTODOS DE PAGO */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><CreditCard size={24} /></div>
                        <h4 className="text-xl font-bold text-gray-900">Canales de Pago</h4>
                    </div>
                    <button onClick={() => handlePaymentAction()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg">
                        <Plus size={18} /> Nueva Cuenta
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {payments.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-300 italic bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">No hay métodos de pago configurados</div>
                    ) : payments.map(p => (
                        <div key={p.id} className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 relative group overflow-hidden transition-all hover:bg-white hover:shadow-md">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/20"></div>
                            <span className="text-[9px] font-black bg-rose-500 text-white px-3 py-1 rounded-full uppercase tracking-tighter">{p.type}</span>
                            <h5 className="font-black text-gray-900 text-xl mt-4">{p.bank_name || p.type}</h5>
                            <div className="mt-3 space-y-1.5">
                                {p.owner_name && <p className="text-sm text-gray-800 font-bold flex items-center gap-2"><Users size={14} className="text-gray-400" /> {p.owner_name}</p>}
                                {p.id_number && <p className="text-sm text-gray-600 font-bold">V-{p.id_number}</p>}
                                {p.phone_number && <p className="text-sm text-rose-600 font-black flex items-center gap-2"><Smartphone size={14} /> {p.phone_number}</p>}
                                {p.account_number && <p className="text-[10px] font-mono text-gray-400 mt-3 bg-white p-3 rounded-xl border border-dashed border-gray-200 break-all">{p.account_number}</p>}
                            </div>
                            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handlePaymentAction(p)} className="text-gray-400 hover:text-rose-500 transition-colors bg-white p-2 rounded-xl border border-gray-50 shadow-sm">
                                    <Edit3 size={18} />
                                </button>
                                <button onClick={() => deleteItem('payment_methods', p.id)} className="text-gray-400 hover:text-red-500 transition-colors bg-white p-2 rounded-xl border border-gray-50 shadow-sm">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SEDES */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><MapPin size={24} /></div>
                        <h4 className="text-xl font-black text-gray-900">Ubicaciones Pickup</h4>
                    </div>
                    <button onClick={() => handleLocationAction()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg">
                        <Plus size={18} /> Nueva Sede
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {locations.length === 0 ? (
                        <div className="py-12 text-center text-gray-300 italic bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">No hay sedes registradas</div>
                    ) : locations.map(l => (
                        <div key={l.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 group transition-all hover:bg-white hover:border-blue-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-400"><Building2 size={24} /></div>
                                <div>
                                    <h5 className="font-black text-gray-900 text-lg">{l.name}</h5>
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Globe size={12} /> {l.address}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleLocationAction(l)} className="text-gray-400 hover:text-rose-500 transition-colors p-3 bg-white rounded-xl border border-gray-100">
                                    <Edit3 size={20} />
                                </button>
                                <button onClick={() => deleteItem('store_locations', l.id)} className="text-gray-400 hover:text-red-500 transition-colors p-3 bg-white rounded-xl border border-gray-100">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CONTACTO WHATSAPP */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><Phone size={24} /></div>
                    <div>
                        <h4 className="text-xl font-bold text-gray-900">Central de Pedidos (WhatsApp)</h4>
                        <p className="text-xs text-gray-400">Canal directo para confirmaciones de compra.</p>
                    </div>
                </div>
                <div className="flex gap-3 max-w-xl">
                    <div className="relative flex-1">
                        <Smartphone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                            type="text"
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                            placeholder="Ej: 584241234567"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-12 pr-6 outline-none focus:border-rose-500 font-bold transition-all text-gray-700 shadow-inner"
                        />
                    </div>
                    <button
                        onClick={updateStorePhone}
                        disabled={savingPhone}
                        className="bg-rose-500 text-white px-8 rounded-2xl font-bold hover:bg-rose-600 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-xl shadow-rose-100"
                    >
                        {savingPhone ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Actualizar
                    </button>
                </div>
            </section>
        </div>
    );
};

// --- COMPONENTES AUXILIARES IGUALES ---

const ProductThumbnail = ({ url, alt }) => {
    const [error, setError] = useState(false);
    if (!url || error) return <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 border border-gray-200"><ImageOff size={18} /></div>;
    return <img src={url} alt={alt} className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100" onError={() => setError(true)} />;
};

const ExchangeRateWidget = () => {
    const [rate, setRate] = useState(0);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const getRate = async () => {
            const { data } = await supabase.from('dolar_tasa').select('tasa').eq('id', 1).single();
            if (data) setRate(data.tasa);
        };
        getRate();
    }, []);
    const updateRate = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const data = await response.json();
            const newRate = parseFloat(data.promedio);
            await supabase.from('dolar_tasa').upsert({ id: 1, tasa: newRate, updated_at: new Date() });
            setRate(newRate);
            Swal.fire({ icon: 'success', title: 'Tasa Sincronizada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
    };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-50 text-orange-500 rounded-3xl"><DollarSign size={28} /></div>
                <div><h3 className="font-black text-gray-900 text-xl font-serif">Monitor BCV</h3><p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sincronización Automática</p></div>
            </div>
            <div className="text-right flex items-center gap-6">
                <div className="text-4xl font-black text-gray-900 tracking-tighter">Bs {rate ? rate.toFixed(2) : '---'}</div>
                <button onClick={updateRate} disabled={loading} className="bg-gray-900 text-white p-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>
    );
};

const ProductManager = ({ products, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const handleDelete = async (id) => {
        const res = await Swal.fire({
            title: '¿Borrar producto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F43F5E',
            confirmButtonText: 'Borrar',
            customClass: { popup: 'rounded-[2.5rem]' }
        });
        if (res.isConfirmed) { await supabase.from('products').delete().eq('id', id); onUpdate(); }
    };
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {!showForm && (
                <>
                    <CategoryManager />
                    <div className="border-t border-gray-100 my-4"></div>
                    <div>
                        <div className="flex justify-between items-end mb-6 px-2">
                            <h3 className="text-2xl font-black text-gray-900 font-serif">Inventario</h3>
                            <button onClick={() => setShowForm(true)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={20} /> Nuevo Item</button>
                        </div>
                        <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="grid gap-2">
                                {products.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-3xl transition-all group border-b border-gray-50 last:border-0">
                                        <ProductThumbnail url={p.images?.[0]} alt={p.name} />
                                        <div className="flex-1"><h4 className="font-bold text-gray-900">{p.name}</h4><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category} • {p.stock} Unid.</p></div>
                                        <div className="text-right"><div className="font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-xl text-lg">${p.price.toFixed(2)}</div></div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setProductToEdit(p); setShowForm(true) }} className="p-3 bg-white shadow-sm border border-gray-100 text-gray-600 rounded-xl hover:text-rose-500 transition-all"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-3 bg-white shadow-sm border border-gray-100 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
            {showForm && <ProductForm productToEdit={productToEdit} onProductAdded={() => { setShowForm(false); setProductToEdit(null); onUpdate(); }} onCancel={() => { setShowForm(false); setProductToEdit(null); }} />}
        </div>
    );
};

export default function AdminDashboard({ onSwitchToClient, products, onProductAdded }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const menu = [
        { id: 'dashboard', label: 'Resumen', icon: Layout },
        { id: 'products', label: 'Inventario', icon: Package },
        { id: 'trends', label: 'Tendencias', icon: DollarSign },
        { id: 'marketing', label: 'Marketing', icon: ImageIcon },
        { id: 'settings', label: 'Ajustes Tienda', icon: SettingsIcon },
    ];
    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <aside className="w-64 bg-white border-r border-gray-100 fixed h-full hidden md:flex flex-col p-6 z-20">
                <div className="p-2 mb-10">
                    <h2 className="text-3xl font-black tracking-tighter text-gray-900 font-serif" onClick={onSwitchToClient}>SOLARA<span className="text-rose-500">.</span></h2>
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Admin Panel</span>
                </div>
                <nav className="space-y-3 flex-1">
                    {menu.map(m => (
                        <button key={m.id} onClick={() => setActiveTab(m.id)} className={`w-full flex gap-3 px-5 py-4 rounded-2xl font-black transition-all ${activeTab === m.id ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 scale-105' : 'text-gray-400 hover:bg-rose-50 hover:text-rose-500'}`}><m.icon size={20} strokeWidth={2.5} /> {m.label}</button>
                    ))}
                </nav>
                <button onClick={onSwitchToClient} className="flex gap-3 px-5 py-4 text-gray-400 font-black hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all border-2 border-dashed border-gray-100 mt-auto"><LogOut size={20} /> Salir</button>
            </aside>
            <main className="flex-1 md:ml-64 p-8">
                {activeTab === 'dashboard' && <><ExchangeRateWidget /><div className="p-20 text-center text-gray-300 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 font-black uppercase tracking-widest">Resumen Solara</div></>}
                {activeTab === 'products' && <ProductManager products={products} onUpdate={onProductAdded} />}
                {activeTab === 'trends' && <TrendsManager products={products} onUpdate={onProductAdded} />}
                {activeTab === 'marketing' && <BannerBuilder />}
                {activeTab === 'settings' && <StoreSettings />}
            </main>
        </div>
    );
}