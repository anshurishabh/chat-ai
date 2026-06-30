'use client';

export default function ConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 font-bold rounded-xl transition-colors text-sm ${
              danger
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-green-500 hover:bg-green-400 text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}