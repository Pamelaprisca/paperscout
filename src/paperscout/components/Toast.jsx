import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  function showToast(message, tone = "success") {
    window.clearTimeout(timerRef.current);
    setToast({ message, tone });
    timerRef.current = window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div
          className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg"
          role="status"
        >
          {toast.tone === "error" ? (
            <XCircle className="mt-0.5 text-rose-600" size={17} aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 text-teal-700" size={17} aria-hidden="true" />
          )}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  return context ?? { showToast() {} };
}
