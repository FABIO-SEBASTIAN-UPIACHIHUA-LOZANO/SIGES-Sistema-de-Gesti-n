import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Wrench } from "lucide-react";
import api from "../services/api";

export function MobileCameraUpload() {
  const { sessionId } = useParams();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    setErrorMsg("");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !sessionId) return;

    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await api.post(`/uploads/session/${sessionId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCompleted(true);
    } catch (err) {
      console.error("Error enviando foto desde celular:", err);
      setErrorMsg(
        err.response?.data?.detail || "No se pudo enviar la foto. Inténtalo nuevamente."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-8">
      {/* Encabezado Móvil */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SisTec Mobile</h1>
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Captura de Recepción</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
          <Smartphone className="h-3.5 w-3.5" />
          Cámara Móvil
        </div>
      </div>

      {/* Cuerpo principal */}
      <div className="my-auto py-6 space-y-6 max-w-md mx-auto w-full">
        {completed ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4 backdrop-blur-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Foto Enviada Exitosamente!</h2>
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              La imagen de recepción ha sido enviada a la laptop en tiempo real. Ya puedes cerrar esta ventana en tu teléfono.
            </p>
            <button
              onClick={() => {
                setCompleted(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Tomar otra foto
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Fotografía de Máquina</h2>
              <p className="text-sm text-slate-400">
                Toma la foto del equipo que está ingresando al taller para adjuntarla al servicio.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                {errorMsg}
              </div>
            )}

            {/* Input Oculto de la Cámara */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Área de Cámara / Vista previa */}
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-slate-900 shadow-2xl">
                <img
                  src={previewUrl}
                  alt="Foto capturada"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 flex justify-between items-center">
                  <span className="text-xs text-indigo-300 font-medium">✓ Imagen lista</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-indigo-400 hover:text-white underline"
                  >
                    Repetir foto
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group w-full h-72 rounded-3xl border-2 border-dashed border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/40 transition-all flex flex-col items-center justify-center p-6 text-center space-y-4"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                  <Camera className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Tocar para abrir la Cámara</p>
                  <p className="text-xs text-slate-400 mt-1">Se activará la cámara trasera de tu teléfono</p>
                </div>
              </button>
            )}

            {/* Botón de Envío */}
            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full h-14 rounded-2xl bg-indigo-600 text-base font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Enviando foto a la laptop...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Enviar foto a la laptop
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pie Móvil */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-900 pt-4">
        SisTec SaaS Platform · Sincronización en Tiempo Real
      </div>
    </div>
  );
}
