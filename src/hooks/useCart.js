// src/hooks/useCart.js corregido
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

export function useCart() {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('solara_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // 1. Guardar cambios en localStorage
    useEffect(() => {
        localStorage.setItem('solara_cart', JSON.stringify(cart));
    }, [cart]);

    // 2. Limpiar carrito al cerrar sesión para evitar persistencia entre usuarios
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setCart([]);
                localStorage.removeItem('solara_cart');
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const addToCart = (product, quantity, onNavigate) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            let newCart;

            if (existingItem) {
                newCart = prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newCart = [...prevCart, { ...product, quantity }];
            }

            // Alerta de confirmación con opciones de navegación
            Swal.fire({
                title: '¡Añadido con éxito!',
                text: `Agregaste ${product.name} al carrito.`,
                icon: 'success',
                showCancelButton: true, // Habilita el botón de cancelar
                confirmButtonColor: '#F43F5E', // Tu color corporativo
                cancelButtonColor: '#374151',
                confirmButtonText: 'Ir al carrito',
                cancelButtonText: 'Seguir comprando',
                customClass: {
                    container: 'swal2-high-zindex',
                    popup: 'rounded-[2rem]',
                    confirmButton: 'rounded-xl font-bold',
                    cancelButton: 'rounded-xl font-bold'
                }
            }).then((result) => {
                // Solo navega si el usuario hizo clic en "Ir al carrito"
                if (result.isConfirmed && onNavigate) {
                    onNavigate();
                }
            });

            return newCart;
        });
    };

    const updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('solara_cart');
    };

    return {
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart
    };
}