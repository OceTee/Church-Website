import { useCallback, useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { site } from "../config/site";

export default function GiveOverlay({ isOpen, onClose }) {
  const [copied, setCopied] = useState(null);

  const handleClose = useCallback(() => {
    setCopied(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const details = [
    { label: "Account Number", value: site.giving.accountNumber },
    { label: "Account Name", value: site.giving.accountName },
    { label: "Bank", value: site.giving.bank },
  ];

  const handleCopy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Give"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 font-inter shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-700"
        >
          <X size={22} />
        </button>

        <div className="mb-8 text-center">
          <h2 className="font-playfair text-3xl font-bold text-[#330040]">Give</h2>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for supporting the work of the ministry.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {details.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5"
            >
              <div className="min-w-0">
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                  {label}
                </p>
                <p className="truncate text-lg font-semibold text-[#330040]">
                  {value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(value, label)}
                className="shrink-0 text-[#65007f] transition hover:text-[#330040]"
                title={`Copy ${label.toLowerCase()}`}
                aria-label={`Copy ${label.toLowerCase()}`}
              >
                {copied === label ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          God bless you for your generosity.
        </p>
      </div>
    </div>
  );
}
