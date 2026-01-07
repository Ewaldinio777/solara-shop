import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Home as HomeIcon, Search, ShoppingBag, User, Settings, Lock, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';
import { CurrencyProvider } from './context/CurrencyContext';

// Importaciones de Páginas y Componentes
import Home from './pages/Home';
import SearchPage from './pages/Search';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import Sidebar from './components/Sidebar';
import Orders from './pages/Orders';

// Nuestro Hook
import { useCart } from './hooks/useCart';

export default function App() {
    const [currentView, setCurrentView] = useState(() => localStorage.getItem('solara_last_view') || 'home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [products, setProducts] = useState([]);
    const [session, setSession] = useState(null);
    const [isResetting, setIsResetting] = useState(false);

    // --- ESTADO PARA FAVORITOS ---
    const [favorites, setFavorites] = useState([]);

    const { cart, addToCart, updateCartQuantity, removeFromCart, clearCart } = useCart();

    useEffect(() => {
        localStorage.setItem('solara_last_view', currentView);
    }, [currentView]);

    useEffect(() => {
        fetchProducts();

        // 1. Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            checkAdmin(session);
            if (session) fetchFavorites(session.user.id);
        });

        // 2. Escuchar cambios de autenticación (CORRECCIÓN INTEGRAL DE LOGOUT)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (event === "PASSWORD_RECOVERY") setIsResetting(true);

            if (event === "SIGNED_OUT") {
                // Limpieza total de estados al cerrar sesión
                setSession(null);
                setFavorites([]);
                setIsAdminMode(false);

                // Si el usuario está en una vista privada, redirigir al Home
                const privateViews = ['profile', 'admin_dashboard', 'orders', 'checkout'];
                if (privateViews.includes(currentView)) {
                    setCurrentView('home');
                }

                // Limpieza de tokens residuales en el navegador
                localStorage.removeItem('supabase.auth.token');

                // Feedback visual de sesión cerrada
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Sesión cerrada correctamente',
                    showConfirmButton: false,
                    timer: 2000
                });
            } else {
                setSession(newSession);
                checkAdmin(newSession);
                if (newSession) fetchFavorites(newSession.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [currentView]); // Se añade currentView como dependencia para evaluar redirecciones

    const checkAdmin = (session) => {
        if (session?.user?.email === 'solaraproyecto@hotmail.com') setIsAdminMode(true);
        else setIsAdminMode(false);
    };

    async function fetchFavorites(userId) {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('product_id')
                .eq('user_id', userId);

            if (error) throw error;
            setFavorites(data.map(f => f.product_id));
        } catch (error) {
            console.error("Error cargando favoritos:", error.message);
        }
    }

    const toggleFavorite = async (productId) => {
        if (!session) {
            return Swal.fire({
                title: 'Inicia Sesión',
                text: 'Debes tener una cuenta para guardar tus favoritos ✨',
                icon: 'info',
                confirmButtonColor: '#F43F5E'
            });
        }

        const isFav = favorites.includes(productId);

        try {
            if (isFav) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', session.user.id)
                    .eq('product_id', productId);

                setFavorites(prev => prev.filter(id => id !== productId));
            } else {
                await supabase
                    .from('favorites')
                    .insert([{ user_id: session.user.id, product_id: productId }]);

                setFavorites(prev => [...prev, productId]);
            }
        } catch (error) {
            console.error("Error en favoritos:", error.message);
        }
    };

    const updateProductInState = (productId, newRating) => {
        setProducts(prevProducts =>
            prevProducts.map(p =>
                p.id === productId ? { ...p, rating: newRating } : p
            )
        );
        if (selectedProduct && selectedProduct.id === productId) {
            setSelectedProduct(prev => ({ ...prev, rating: newRating }));
        }
    };

    async function fetchProducts() {
        try {
            const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
            if (error) throw error;
            const formattedProducts = data.map(item => ({
                id: item.id,
                name: item.name,
                category: item.categories?.name || 'General',
                category_id: item.category_id,
                price: parseFloat(item.price),
                price_bs_base: item.price_bs_base ? parseFloat(item.price_bs_base) : parseFloat(item.price),
                oldPrice: item.old_price ? parseFloat(item.old_price) : null,
                rating: item.rating ? parseFloat(item.rating) : 0,
                image: item.images && item.images.length > 0 ? item.images[0] : item.image,
                description: item.description,
                shades: item.shades || [],
                stock: item.stock,
                is_featured: item.is_featured,
                images: item.images || []
            }));
            setProducts(formattedProducts);
        } catch (error) { console.error("Error:", error.message); }
    }

    const handleCurrencySwitchAttempt = (currentCurrency, setCurrencyFunc, targetCurrency = null) => {
        if (cart.length > 0) {
            Swal.fire({
                title: 'Compra en curso',
                text: 'Para cambiar de moneda, primero debes vaciar tu carrito o completar la compra actual.',
                icon: 'warning',
                confirmButtonColor: '#F43F5E',
                confirmButtonText: 'Entendido'
            });
            return;
        }
        const nextCurrency = targetCurrency || (currentCurrency === 'USD' ? 'VES' : 'USD');
        setCurrencyFunc(nextCurrency);
    };

    const handleProductClick = (product) => setSelectedProduct(product);
    const closeProductDetail = () => setSelectedProduct(null);

    const renderView = () => {
        if (isResetting) return <ResetPassword onComplete={() => setIsResetting(false)} />;
        if (currentView === 'admin_dashboard' && isAdminMode) return <AdminDashboard onSwitchToClient={() => setCurrentView('home')} products={products} onProductAdded={fetchProducts} />;

        switch (currentView) {
            case 'home':
                return <Home
                    onProductClick={handleProductClick}
                    products={products}
                    session={session}
                    onCurrencyChange={handleCurrencySwitchAttempt}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                />;
            case 'search':
                return <SearchPage
                    onProductClick={handleProductClick}
                    products={products}
                    onCurrencyChange={handleCurrencySwitchAttempt}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                />;
            case 'cart':
                return <Cart
                    cart={cart}
                    updateQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    onCheckout={() => {
                        if (!session) {
                            setCurrentView('profile');
                            Swal.fire({
                                title: 'Inicia Sesión',
                                text: 'Debes estar logueado para finalizar tu pedido ✨',
                                icon: 'info',
                                confirmButtonColor: '#F43F5E'
                            });
                        } else {
                            setCurrentView('checkout');
                        }
                    }}
                    onCurrencyChange={handleCurrencySwitchAttempt}
                />;
            case 'checkout':
                return <Checkout
                    cart={cart}
                    session={session}
                    onBack={() => setCurrentView('cart')}
                    clearCart={clearCart}
                />;
            case 'profile':
                return <Profile
                    session={session}
                    products={products}
                    onProductClick={handleProductClick}
                    onAddToCart={(prod, qty) => addToCart(prod, qty, () => setCurrentView('cart'))}
                    onCurrencyChange={handleCurrencySwitchAttempt}
                    onRequestAdmin={() => setCurrentView('admin_dashboard')}
                    onNavigateToOrders={() => setCurrentView('orders')}
                />;
            case 'orders':
                return <Orders
                    session={session}
                    onBack={() => setCurrentView('profile')}
                />;

            default:
                return <Home products={products} session={session} onCurrencyChange={handleCurrencySwitchAttempt} />;
        }
    };

    return (
        <CurrencyProvider>
            <div className="bg-white min-h-screen font-sans text-gray-900 flex relative overflow-hidden">
                {currentView !== 'admin_dashboard' && currentView !== 'checkout' && !isResetting && (
                    <Sidebar
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        cartCount={cart.length}
                    />
                )}

                <main className="flex-1 w-full relative h-screen overflow-y-auto">
                    <div className={`${currentView !== 'admin_dashboard' && currentView !== 'checkout' && !isResetting ? 'pb-24 md:pb-0' : ''} min-h-full`}>
                        {renderView()}
                    </div>
                </main>

                {currentView !== 'admin_dashboard' && currentView !== 'checkout' && !isResetting && (
                    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-gray-900/90 backdrop-blur-md text-white px-4 py-4 rounded-full shadow-2xl flex justify-between items-center z-40">
                        {[
                            { id: 'home', icon: HomeIcon },
                            { id: 'search', icon: Search },
                            { id: 'cart', icon: ShoppingBag, badge: cart.length > 0 ? cart.length : null },
                            { id: 'profile', icon: User },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id)}
                                className={`relative p-2 transition-all duration-300 ${currentView === item.id || (item.id === 'profile' && currentView === 'orders') ? 'text-rose-400 scale-110' : 'text-gray-400 hover:text-white'}`}
                            >
                                <item.icon size={22} strokeWidth={(currentView === item.id || (item.id === 'profile' && currentView === 'orders')) ? 2.5 : 2} />
                                {item.badge && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-gray-900"></span>}
                            </button>
                        ))}
                    </nav>
                )}

                {selectedProduct && (
                    <div className="fixed inset-0 z-[9000] flex items-end md:items-center justify-center p-0 md:p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeProductDetail}></div>
                        <div className="relative w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                            <ProductDetail
                                product={selectedProduct}
                                isFavorite={favorites.includes(selectedProduct.id)}
                                onToggleFavorite={toggleFavorite}
                                onBack={closeProductDetail}
                                onAddToCart={(prod, qty) => {
                                    addToCart(prod, qty, () => setCurrentView('cart'));
                                    closeProductDetail();
                                }}
                                session={session}
                                onRateSuccess={updateProductInState}
                            />
                        </div>
                    </div>
                )}

                <style>{`
                    .hide-scrollbar::-webkit-scrollbar { display: none; } 
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } 
                    @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } 
                    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; } 
                    @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } 
                    .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .swal2-container { z-index: 100000 !important; }
                `}</style>
            </div>
        </CurrencyProvider>
    );
}