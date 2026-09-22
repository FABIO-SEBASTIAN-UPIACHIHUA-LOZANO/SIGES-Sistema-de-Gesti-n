import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

// IMPLEMENTACIÓN: confirmación reutilizable para evitar eliminaciones
// accidentales desde los menús de tres puntos.
export function ConfirmDeleteDialog({ open, title, description, error, deleting, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onCancel();
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="delete-dialog-title" className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={deleting} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X size={19} />
          </button>
        </div>

        {error && <p className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onCancel} disabled={deleting} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {deleting && <Loader2 size={16} className="animate-spin" />}
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
