import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, X, Plus, Star, ImageOff } from 'lucide-react'; // Agregamos ImageOff
import Swal from 'sweetalert2';

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

export default function TrendsManager({ products, onUpdate }) {
    const [trendingList, setTrendingList] = useState([]);

    useEffect(() => {
        // Ordenamos por la columna trending_order
        const filtered = products
            .filter(p => p.is_featured)
            .sort((a, b) => (a.trending_order || 999) - (b.trending_order || 999));
        setTrendingList(filtered);
    }, [products]);

    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(trendingList);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTrendingList(items); // Actualización visual inmediata

        // Actualización en BD
        const updates = items.map((item, index) => ({
            id: item.id,
            trending_order: index,
            is_featured: true,
            name: item.name, // Supabase a veces pide campos required en upsert
            price: item.price
        }));

        const { error } = await supabase.from('products').upsert(updates, { onConflict: 'id' });

        if (!error) {
            onUpdate(); // Refrescar datos globales
            Swal.fire({ icon: 'success', title: 'Orden guardado', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 1000 });
        }
    };

    const toggleFeatured = async (product) => {
        const newVal = !product.is_featured;
        await supabase.from('products').update({ is_featured: newVal }).eq('id', product.id);
        onUpdate();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* ZONA DE ARRASTRAR */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Star className="text-yellow-400 fill-yellow-400" size={20} /> En Portada (Ordenable)
                </h3>
                <DragDropContext onDragEnd={handleOnDragEnd}>
                    <Droppable droppableId="trends">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {trendingList.map((product, index) => (
                                    <Draggable key={product.id} draggableId={product.id.toString()} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${snapshot.isDragging ? 'bg-rose-50 border-rose-500 shadow-lg scale-105 z-50' : 'bg-white border-gray-100 hover:border-rose-200'}`}
                                            >
                                                <div className="text-gray-300 cursor-grab active:cursor-grabbing"><GripVertical size={20} /></div>
                                                <span className="font-bold text-rose-500 w-6">#{index + 1}</span>

                                                {/* IMAGEN SEGURA */}
                                                <ProductThumbnail url={product.images?.[0]} alt={product.name} />

                                                <p className="font-bold text-gray-800 flex-1 line-clamp-1">{product.name}</p>
                                                <button onClick={() => toggleFeatured(product)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><X size={16} /></button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                {trendingList.length === 0 && <p className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-100 rounded-xl">Arrastra productos aquí</p>}
            </div>

            {/* LISTA PARA AGREGAR */}
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 h-fit max-h-[600px] overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-4">Inventario Disponible</h3>
                <div className="space-y-2">
                    {products.filter(p => !p.is_featured).map(product => (
                        <div key={product.id} className="flex items-center gap-3 p-3 bg-white rounded-xl opacity-70 hover:opacity-100 transition-opacity shadow-sm">

                            {/* IMAGEN SEGURA */}
                            <ProductThumbnail url={product.images?.[0]} alt={product.name} />

                            <p className="text-sm font-medium text-gray-700 flex-1">{product.name}</p>
                            <button onClick={() => toggleFeatured(product)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Plus size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}