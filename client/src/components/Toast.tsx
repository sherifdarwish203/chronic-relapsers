import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div
      className={`fixed top-4 right-4 left-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-80
        ${bg} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg z-50
        transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="text-white/80 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
