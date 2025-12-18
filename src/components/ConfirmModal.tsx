interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-300 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
