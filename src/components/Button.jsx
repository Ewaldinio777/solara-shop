import React from 'react';

export default function Button({ children, onClick, variant = 'primary', className = '', icon: Icon, fullWidth = false }) {
    const baseStyle = `flex items-center justify-center px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-95 ${fullWidth ? 'w-full' : ''}`;
    const variants = {
        primary: "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 hover:shadow-rose-300",
        secondary: "bg-white text-gray-800 border border-gray-100 shadow-sm hover:bg-gray-50",
        outline: "border-2 border-rose-200 text-rose-500 hover:border-rose-300 hover:bg-rose-50",
        ghost: "text-rose-500 hover:bg-rose-50"
    };

    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {Icon && <Icon size={18} className="mr-2" />}
            {children}
        </button>
    );
}