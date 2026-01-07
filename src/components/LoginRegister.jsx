import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone, MapPin } from 'lucide-react';

export default function LoginRegister() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAuth = async (e) => {
        e.preventDefault();

        // Validación de coincidencia de contraseñas solo en registro
        if (!isLogin && formData.password !== formData.confirmPassword) {
            return Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden',
                confirmButtonColor: '#F43F5E'
            });
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenida!',
                    text: 'Iniciando sesión...',
                    timer: 1500,
                    showConfirmButton: false,
                });

            } else {
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: `${formData.firstName} ${formData.lastName}`,
                            first_name: formData.firstName,
                            last_name: formData.lastName,
                            phone: formData.phone,
                            address: formData.address
                        }
                    }
                });
                if (error) throw error;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Cuenta creada!',
                    text: 'Tu registro ha sido exitoso. Ya puedes ingresar.',
                    confirmButtonColor: '#F43F5E',
                    customClass: { popup: 'rounded-[2rem]', confirmButton: 'rounded-xl' }
                });

                setIsLogin(true);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#F43F5E'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const { value: email } = await Swal.fire({
            title: 'Recuperar Cuenta',
            input: 'email',
            inputLabel: 'Ingresa tu correo electrónico',
            showCancelButton: true,
            confirmButtonColor: '#F43F5E',
            customClass: { popup: 'rounded-[2rem]', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl' }
        });

        if (email) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                Swal.fire('¡Listo!', 'Revisa tu correo para el enlace.', 'success');
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-fade-in py-10">
            <div className={`w-full ${isLogin ? 'max-w-sm' : 'max-w-md'} bg-white p-8 rounded-[2rem] shadow-xl shadow-rose-100/50 border border-rose-50 transition-all`}>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 font-serif">SOLARA<span className="text-rose-500">.</span></h2>
                    <p className="text-gray-400 text-sm mt-2">{isLogin ? '¡Qué bueno verte de nuevo!' : 'Completa tus datos para comprar'}</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
                    <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Ingresar</button>
                    <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Registro</button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <input name="firstName" required type="text" placeholder="Nombre" value={formData.firstName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                                </div>
                                <div className="relative">
                                    <input name="lastName" required type="text" placeholder="Apellido" value={formData.lastName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                                </div>
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input name="phone" required type="tel" placeholder="Número de teléfono" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input name="address" required type="text" placeholder="Dirección de entrega" value={formData.address} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                            </div>
                        </>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="email" required type="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="password" required type={showPassword ? "text" : "password"} placeholder="Contraseña" value={formData.password} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input name="confirmPassword" required type={showPassword ? "text" : "password"} placeholder="Confirmar contraseña" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-rose-500 transition-all text-sm" />
                        </div>
                    )}

                    {isLogin && (
                        <div className="flex justify-end">
                            <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-rose-500">¿Olvidaste tu contraseña?</button>
                        </div>
                    )}

                    <button disabled={loading} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                        {loading ? 'Procesando...' : <>{isLogin ? 'Entrar' : 'Registrarme'} <ArrowRight size={20} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}