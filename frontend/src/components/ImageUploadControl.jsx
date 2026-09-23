import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  QrCode,
  Camera,
  X,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Smartphone,
  Sparkles,
  Trash2,
  RefreshCw
} from "lucide-react";
import api from "../services/api";

export function ImageUploadControl({ value, onChange, label = "Foto / Imagen del Equipo" }) {
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [sessionStatus, setSessionStatus] = useState("PENDING");

  // Subida directa de archivo desde la PC
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/uploads/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onChange(res.data.url);
    } catch (err) {
      console.error("Error al subir archivo:", err);
      alert(err.response?.data?.detail || "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  // Crear sesión QR para captura móvil
  const handleOpenQrModal = async () => {
    try {
      setUploading(true);
      const res = await api.post("/uploads/session/create");
      const sid = res.data.session_id;
      setSessionId(sid);
      setSessionStatus("PENDING");

      // Construir URL móvil basada en el host actual de la laptop
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      const mobileAppUrl = `${window.location.protocol}//${hostname}${port}/captura-movil/${sid}`;
      
      setQrUrl(mobileAppUrl);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error("Error iniciando sesión QR:", err);
      alert("No se pudo generar la sesión para el celular.");
    } finally {
      setUploading(false);
    }
  };

  // Escuchar el estado de la sesión QR mediante Polling en segundo plano
  useEffect(() => {
    let interval = null;

    if (isQrModalOpen && sessionId && sessionStatus === "PENDING") {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/uploads/session/${sessionId}`);
          if (res.data.status === "COMPLETED" && res.data.photo_url) {
            setSessionStatus("COMPLETED");
            onChange(res.data.photo_url);
            clearInterval(interval);
            setTimeout(() => {
              setIsQrModalOpen(false);
            }, 1200);
          }
        } catch (err) {
          console.error("Error verificando sesión QR:", err);
        }
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQrModalOpen, sessionId, sessionStatus, onChange]);

  const qrCodeImageApi = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`
    : "";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-indigo-600" />
          {label}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Quitar foto
          </button>
        )}
      </label>

      {/* Input oculto para subida directa */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Si ya hay una foto cargada */}
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img
              src={value}
              alt="Vista previa del equipo"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=Foto";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Fotografía adjuntada
            </p>
            <p className="truncate text-xs text-slate-500 mt-0.5">{value}</p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleOpenQrModal}
              className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1"
            >
              <QrCode className="h-3.5 w-3.5" />
              QR
            </button>
          </div>
        </div>
      ) : (
        /* Opciones de Carga si no hay foto */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Botón Subir Archivo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-semibold text-slate-700 shadow-sm hover:border-indigo-500 hover:bg-indigo-50/40 transition disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            ) : (
              <Upload className="h-4 w-4 text-indigo-600" />
            )}
            Subir Archivo de Foto
          </button>

          {/* Botón Escanear QR con Celular */}
          <button
            type="button"
            onClick={handleOpenQrModal}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 py-3 px-4 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 transition disabled:opacity-50"
          >
            <QrCode className="h-4 w-4 text-indigo-600" />
            Tomar foto con Celular (QR)
          </button>
        </div>
      )}

      {/* Modal QR de Captura Móvil */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" />
                Captura Móvil por QR
              </span>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sessionStatus === "COMPLETED" ? (
              <div className="py-6 space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">¡Foto Recibida!</h3>
                <p className="text-xs text-slate-500">
                  La imagen tomada desde el celular se ha sincronizado correctamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Escanea con la cámara del Celular</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Abre la cámara de tu teléfono para tomar la foto del equipo al instante.
                  </p>
                </div>

                {/* Imagen del Código QR */}
                <div className="mx-auto h-56 w-56 rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-inner flex items-center justify-center">
                  {qrCodeImageApi ? (
                    <img
                      src={qrCodeImageApi}
                      alt="Código QR de Captura"
                      className="h-full w-full rounded-xl object-contain"
                    />
                  ) : (
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  )}
                </div>

                {/* Indicador de Estado Polling */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 px-3 border border-slate-200 text-xs font-medium text-slate-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  Esperando foto desde el celular...
                </div>

                <div className="text-[11px] text-slate-400 truncate">
                  Enlace: <span className="font-mono">{qrUrl}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
