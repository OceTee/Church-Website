import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function GiveOverlay({ isOpen, onClose }) {
    const [copied, setCopied] = useState(null);

    if (!isOpen) return null;

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 font-inter"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                >
                    <X size={22} />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-playfair font-bold text-[#330040]">Give</h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        Thank you for supporting the work of the ministry 😁
                    </p>
                </div>

                {/* Account Details */}
                <div className="flex flex-col gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Number</p>
                            <p className="text-lg font-semibold text-[#330040]">XXXXXXXX</p>
                        </div>
                        <button
                            onClick={() => handleCopy("XXXXXXXX", "number")}
                            className="text-[#65007f] hover:text-[#330040] transition"
                            title="Copy account number"
                        >
                            {copied === "number" ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Name</p>
                            <p className="text-lg font-semibold text-[#330040]">XXXXXX</p>
                        </div>
                        <button
                            onClick={() => handleCopy("XXXXXX", "name")}
                            className="text-[#65007f] hover:text-[#330040] transition"
                            title="Copy account name"
                        >
                            {copied === "name" ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    God bless you for your generosity 🙏
                </p>
            </div>
        </div>
    );
}

