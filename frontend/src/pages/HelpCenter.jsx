import React, { useMemo, useState } from "react";
import { ChevronDown, HelpCircle, Mail, Search } from "lucide-react";

const QUESTIONS = [
  { question: "¿Cómo registro un nuevo servicio?", answer: "Ingresa a Servicios desde el menú lateral y selecciona Nuevo servicio. Completa los datos del cliente, equipo y trabajo solicitado." },
  { question: "¿Dónde puedo revisar el inventario?", answer: "Abre Productos desde la sección Gestión. Allí podrás consultar existencias y detectar productos con stock bajo." },
  { question: "¿Cómo agrego un usuario al sistema?", answer: "Si tienes rol Administrador, entra a Usuarios, selecciona Nuevo usuario y asigna sus datos y rol de acceso." },
  { question: "¿Cómo cierro mi sesión de forma segura?", answer: "Abre el menú de tu perfil en la esquina superior derecha y selecciona Cerrar sesión." },
];

export function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(0);
  const filtered = useMemo(
    () => QUESTIONS.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Soporte</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Centro de ayuda</h1>
        <p className="mt-1 text-sm text-slate-500">Encuentra respuestas rápidas sobre el uso de SIGES.</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/10 sm:p-8">
        <HelpCircle className="h-8 w-8 text-indigo-100" />
        <h2 className="mt-3 text-xl font-bold">¿Cómo podemos ayudarte?</h2>
        <div className="relative mt-5 max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar una respuesta..."
            className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none ring-4 ring-white/10 placeholder:text-slate-400 focus:ring-white/25"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">Preguntas frecuentes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const index = QUESTIONS.indexOf(item);
              const open = openQuestion === index;
              return (
                <div key={item.question}>
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(open ? -1 : index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {item.question}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && <p className="px-6 pb-5 text-sm leading-6 text-slate-600">{item.answer}</p>}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="px-6 py-10 text-center text-sm text-slate-500">No encontramos resultados para tu búsqueda.</p>}
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">¿Necesitas más ayuda?</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Comunícate con el equipo de soporte para resolver tu consulta.</p>
          <a href="mailto:soporte@siges.local?subject=Solicitud%20de%20ayuda%20SIGES" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
}
