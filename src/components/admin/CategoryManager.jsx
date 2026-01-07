import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, GripVertical } from 'lucide-react'; // Quitamos Plus, usamos texto "Agregar"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Swal from 'sweetalert2';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');

    useEffect(() => { fetchCats(); }, []);

    const fetchCats = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('order_index', { ascending: true });
        setCategories(data || []);
    };

    const addCategory = async () => {
        if (!newCatName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Escribe un nombre para la categoría' });
            return;
        }

        const newIndex = categories.length;
        const { error } = await supabase
            .from('categories')
            .insert([{ name: newCatName, order_index: newIndex }]);

        if (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        } else {
            setNewCatName('');
            fetchCats();
            Swal.fire({ icon: 'success', title: 'Categoría creada', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
    };

    const deleteCategory = async (id) => {
        await supabase.from('categories').delete().eq('id', id);
        fetchCats();
    };

    // --- REORDENAMIENTO ---
    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(categories);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setCategories(items);

        const updates = items.map((cat, index) => ({
            id: cat.id,
            name: cat.name,
            order_index: index
        }));

        await supabase.from('categories').upsert(updates);
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-visible">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Categorías de la Tienda</h3>

            <div className="flex gap-2 mb-6 items-center">
                <input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nombre de categoría (ej: Labiales)"
                    className="flex-1 p-3 h-[50px] bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-rose-500"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                    onClick={addCategory}
                    className="h-[50px] bg-gray-900 text-white px-6 rounded-xl font-bold hover:bg-black transition-transform active:scale-95"
                >
                    Agregar
                </button>
            </div>

            {/* ZONA DE ARRASTRE HORIZONTAL (BURBUJAS) */}
            <DragDropContext onDragEnd={handleOnDragEnd}>
                {/* direction="horizontal" es la clave para que funcionen lado a lado */}
                <Droppable droppableId="categories-bubbles" direction="horizontal">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex flex-wrap gap-3" // Mantenemos flex-wrap para que bajen si no caben
                        >
                            {categories.map((cat, index) => (
                                <Draggable key={cat.id} draggableId={cat.id.toString()} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            // Estilos dinámicos: Si se arrastra, se resalta
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging
                                                    ? 'bg-rose-500 text-white border-rose-600 shadow-lg scale-110 rotate-2 z-50'
                                                    : 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300'
                                                }`}
                                        >
                                            {/* Icono de agarre sutil (opcional, ayuda a saber que es arrastrable) */}
                                            {/* <GripVertical size={14} className="opacity-50" /> */}

                                            <span>{cat.name}</span>

                                            <button
                                                // onMouseDown evita que el click de borrar inicie el drag
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Evita conflictos con drag
                                                    deleteCategory(cat.id);
                                                }}
                                                className={`ml-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${snapshot.isDragging
                                                        ? 'bg-white/20 text-white hover:bg-white/40'
                                                        : 'bg-white text-rose-300 hover:text-red-500 hover:bg-red-50'
                                                    }`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {categories.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">No hay categorías. Agrega una arriba.</p>
            )}
        </div>
    );
};

export default CategoryManager;