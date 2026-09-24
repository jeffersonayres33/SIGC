import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { toastService, ToastMessage } from '../../services/toastService';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastService.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isEdit = toast.type === 'edit';
        const isDelete = toast.type === 'delete';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white rounded-xl border p-3.5 shadow-xl transition-all duration-300 transform translate-y-0 flex items-start space-x-3 text-xs ${
              isSuccess ? 'border-emerald-200 shadow-emerald-500/10' :
              isEdit ? 'border-blue-200 shadow-blue-500/10' :
              isDelete ? 'border-rose-200 shadow-rose-500/10' :
              isWarning ? 'border-amber-200 shadow-amber-500/10' :
              'border-slate-200 shadow-slate-500/10'
            }`}
          >
            <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
              isSuccess ? 'bg-emerald-50 text-emerald-600' :
              isEdit ? 'bg-blue-50 text-blue-600' :
              isDelete ? 'bg-rose-50 text-rose-600' :
              isWarning ? 'bg-amber-50 text-amber-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {isSuccess && <CheckCircle2 className="w-4 h-4" />}
              {isEdit && <Edit3 className="w-4 h-4" />}
              {isDelete && <Trash2 className="w-4 h-4" />}
              {isWarning && <AlertTriangle className="w-4 h-4" />}
              {!isSuccess && !isEdit && !isDelete && !isWarning && <Info className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs ${
                  isSuccess ? 'text-emerald-800' :
                  isEdit ? 'text-blue-800' :
                  isDelete ? 'text-rose-800' :
                  isWarning ? 'text-amber-800' :
                  'text-slate-800'
                }`}>
                  {toast.title}
                </span>
                <button
                  onClick={() => toastService.remove(toast.id)}
                  className="text-slate-400 hover:text-slate-600 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                {toast.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
