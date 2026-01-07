import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UploadCloud, X, Loader2, Image as ImageIcon, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';

// AHORA GESTIONA DOS PRECIOS
export default function ProductForm({ onProductAdded, onCancel, productToEdit }) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        price: '',          // Precio Dólar (Cash)
        price_bs_base: '',  // Precio para cálculo en Bolívares
        category_id: '',
        description: '',
        stock: 20,
        images: []
    });

    useEffect(() => {
        const fetchData = async () => {
            // 1. Cargar Categorías
            const { data: catData } = await supabase.from('categories').select('*');
            setCategories(catData || []);

            // 2. Si estamos EDITANDO, rellenar el formulario
            if (productToEdit) {
                setFormData({
                    name: productToEdit.name,
                    price: productToEdit.price,
                    // Si existe el precio base especial, lo ponemos. Si no, sugerimos el precio normal.
                    price_bs_base: productToEdit.price_bs_base || productToEdit.price,

                    category_id: productToEdit.category_id || (catData && catData.find(c => c.name === productToEdit.category)?.id) || '',
                    description: productToEdit.description || '',
                    stock: productToEdit.stock,
                    images: productToEdit.images || []
                });
            } else {
                // Si es NUEVO, poner categoría por defecto
                if (catData && catData.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: catData[0].id }));
                }
            }
        };
        fetchData();
    }, [productToEdit]);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setUploading(true);
        const uploadedUrls = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `${fileName}`;
                const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('products').getPublicUrl(filePath);
                uploadedUrls.push(data.publicUrl);
            }
            setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        } catch (error) {
            Swal.fire('Error', 'Error subiendo imagen', 'error');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.images.length === 0) return Swal.fire('Falta Imagen', 'Sube al menos una imagen', 'warning');

        setLoading(true);
        try {
            // Lógica de Precios:
            const finalPrice = parseFloat(formData.price);
            // Si el usuario deja vacío el precio base, usamos el precio normal
            const finalBaseBs = formData.price_bs_base ? parseFloat(formData.price_bs_base) : finalPrice;

            const payload = {
                name: formData.name,
                price: finalPrice,
                price_bs_base: finalBaseBs, // Guardamos el precio especial
                category_id: parseInt(formData.category_id),
                description: formData.description,
                stock: parseInt(formData.stock),
                images: formData.images
            };

            let error;

            if (productToEdit) {
                // MODO EDICIÓN
                const { error: updateError } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', productToEdit.id);
                error = updateError;
            } else {
                // MODO CREACIÓN
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([{ ...payload, is_featured: false }]);
                error = insertError;
            }

            if (error) throw error;

            Swal.fire(productToEdit ? 'Actualizado' : 'Creado', '', 'success');
            onProductAdded();

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-rose-100 animate-fade-in mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* GALERÍA */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Imágenes ({formData.images.length})</label>
                    <div className="grid grid-cols-4 gap-4">
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 hover:bg-rose-50 transition-colors">
                            {uploading ? <Loader2 className="animate-spin text-rose-500" /> : <UploadCloud className="text-gray-400" />}
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                        {formData.images.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                                <img src={url} className="w-full h-full object-cover" alt="prev" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100"><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CAMPOS PRINCIPALES */}
                <div><label className="text-xs font-bold text-gray-500">Nombre del Producto</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" /></div>

                {/* ZONA DE PRECIOS DOBLES */}
                <div className="grid grid-cols-2 gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <div>
                        <label className="text-xs font-bold text-rose-800 flex items-center gap-1">
                            <DollarSign size={12} /> Precio Cash (USD)
                        </label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="w-full p-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-rose-500 border border-rose-200 text-rose-600 font-bold"
                            placeholder="Ej: 3.00"
                        />
                        <p className="text-[10px] text-rose-400 mt-1">Precio si pagan en divisas.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                            Precio Base Tasa ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.price_bs_base}
                            onChange={e => setFormData({ ...formData, price_bs_base: e.target.value })}
                            className="w-full p-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-gray-400 border border-gray-200 text-gray-700 font-bold"
                            placeholder="Ej: 4.65"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Monto en $ que se multiplica por la tasa.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500">Categoría</label>
                        <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500">Stock</label><input required type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" /></div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Descripción (Opcional)</label>
                    <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={loading} className="flex-[2] py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
                        {loading ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Publicar Producto')}
                    </button>
                </div>
            </form>
        </div>
    );
}