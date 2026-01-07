import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function BannerBuilder() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Estado inicial
    const [banner, setBanner] = useState({
        title: '',
        subtitle: '',
        button_text: '',
        image_url: '',
        color: 'from-rose-900/90'
    });

    // 1. CARGAR DATOS EXISTENTES
    useEffect(() => {
        fetchBanner();
    }, []);

    const fetchBanner = async () => {
        try {
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('id', 1)
                .single();

            if (data) setBanner(data);
        } catch (error) {
            console.error("Error cargando banner:", error);
        }
    };

    // 2. SUBIR IMAGEN
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `banner-${Math.random().toString(36).substring(2)}.${fileExt}`;
            // Usamos el bucket 'products' para simplificar, o crea uno 'banners'
            const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('products').getPublicUrl(fileName);
            setBanner(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            Swal.fire('Error', 'No se pudo subir la imagen', 'error');
        } finally {
            setUploading(false);
        }
    };

    // 3. GUARDAR CAMBIOS
    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('banners')
                .upsert({
                    id: 1, // Siempre editamos el ID 1
                    title: banner.title,
                    subtitle: banner.subtitle,
                    button_text: banner.button_text,
                    image_url: banner.image_url,
                    color: banner.color,
                    updated_at: new Date()
                });

            if (error) throw error;

            Swal.fire({
                title: '¡Banner Actualizado!',
                text: 'La portada de la tienda ha cambiado.',
                icon: 'success',
                confirmButtonColor: '#F43F5E'
            });
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Marketing & Portada</h2>
                    <p className="text-gray-500 text-sm">Personaliza lo que ven tus clientes al entrar.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-600 flex items-center gap-2 shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {loading ? 'Publicando...' : 'Publicar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* EDITOR */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5 h-fit">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon size={18} className="text-rose-500" /> Editar Contenido
                    </h3>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título Principal</label>
                        <input
                            value={banner.title || ''}
                            onChange={e => setBanner({ ...banner, title: e.target.value })}
                            className="w-full mt-2 p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtítulo</label>
                        <input
                            value={banner.subtitle || ''}
                            onChange={e => setBanner({ ...banner, subtitle: e.target.value })}
                            className="w-full mt-2 p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto del Botón</label>
                        <input
                            value={banner.button_text || ''}
                            onChange={e => setBanner({ ...banner, button_text: e.target.value })}
                            className="w-full mt-2 p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen de Fondo</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                value={banner.image_url || ''}
                                onChange={e => setBanner({ ...banner, image_url: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-rose-500 text-xs text-gray-600"
                                placeholder="https://..."
                            />
                            <label className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-500 cursor-pointer">
                                {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    {/* Selector de Color */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tono del Gradiente</label>
                        <div className="flex gap-2 mt-2">
                            {[
                                { class: 'from-rose-900/90', bg: 'bg-rose-900' },
                                { class: 'from-purple-900/90', bg: 'bg-purple-900' },
                                { class: 'from-blue-900/90', bg: 'bg-blue-900' },
                                { class: 'from-black/80', bg: 'bg-black' },
                            ].map((c) => (
                                <button
                                    key={c.class}
                                    onClick={() => setBanner({ ...banner, color: c.class })}
                                    className={`w-8 h-8 rounded-full ${c.bg} border-2 ${banner.color === c.class ? 'border-rose-500 scale-110' : 'border-transparent'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* PREVISUALIZACIÓN */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase">Vista Previa en Vivo</p>
                    </div>

                    <div className="relative rounded-[2rem] overflow-hidden h-80 shadow-2xl group border-4 border-white bg-gray-100">
                        {banner.image_url ? (
                            <img
                                src={banner.image_url}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt="Banner Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">Sin Imagen</div>
                        )}

                        <div className={`absolute inset-0 bg-gradient-to-r ${banner.color || 'from-rose-900/90'} via-transparent to-transparent flex flex-col justify-center px-10 md:px-16`}>
                            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg self-start mb-4 border border-white/30 shadow-sm">
                                NUEVA COLECCIÓN
                            </span>
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-3 drop-shadow-sm leading-tight">
                                {banner.title || 'Título Aquí'}
                            </h3>
                            <p className="text-white/90 text-sm md:text-lg mb-6 max-w-md font-medium">
                                {banner.subtitle || 'Subtítulo descriptivo de la campaña.'}
                            </p>
                            <button className="bg-white text-rose-600 px-8 py-3.5 rounded-2xl text-xs md:text-sm font-black w-fit shadow-xl">
                                {banner.button_text || 'Ver más'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}