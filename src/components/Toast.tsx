import { useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    const bgColor = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    }[type];

    const icon = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    }[type];

    return (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
            <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}>
                <span className="text-2xl">{icon}</span>
                <span className="flex-1 font-medium">{message}</span>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white text-xl font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000); // Auto-dismiss after 4s
    };

    const ToastComponent = toast ? (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
        />
    ) : null;

    return { showToast, ToastComponent };
}
