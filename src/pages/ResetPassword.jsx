import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword({ onComplete }) {
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            await Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada', 'success');
            onComplete(); // Volver al perfil/home
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-rose-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-xl text-center">
                <h2 className="text-2xl font-black mb-2">Nueva Contraseña</h2>
                <p className="text-gray-500 text-sm mb-6">Ingresa tu nueva clave de acceso</p>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="relative text-left">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input required type={showPass ? "text" : "password"} placeholder="Nueva contraseña"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-rose-500" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button disabled={loading} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold">
                        {loading ? 'Actualizando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
}