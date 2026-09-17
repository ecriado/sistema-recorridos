import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  MapPin, 
  User, 
  ShieldCheck, 
  Power, 
  X 
} from 'lucide-react';
import { Edificio, Usuario } from '../../types';

interface EdificiosViewProps {
  edificios: Edificio[];
  usuarios: Usuario[];
  onCreateEdificio: (nuevo: { nombre: string; direccion: string; id_administrador: string }) => void;
  onToggleActive: (id: string) => void;
}

export const EdificiosView: React.FC<EdificiosViewProps> = ({
  edificios,
  usuarios,
  onCreateEdificio,
  onToggleActive,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [adminId, setAdminId] = useState(usuarios[1]?.id_usuario || '');

  const admins = usuarios.filter((u) => u.rol === 'Administrador');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onCreateEdificio({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      id_administrador: adminId,
    });

    setIsModalOpen(false);
    setNombre('');
    setDireccion('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Gestión de Edificios y Propiedades
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Administración de complejos corporativos, residenciales y asignación de responsables
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Nuevo Edificio
        </button>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {edificios.map((ed) => (
          <div
            key={ed.id_edificio}
            className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-[#0051d5]">
                  {ed.id_edificio}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    ed.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {ed.activo ? 'Operativo' : 'Inactivo'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#0b1c30] mb-2 leading-snug">
                {ed.nombre}
              </h3>

              <div className="flex items-center gap-2 text-xs text-[#64748b] mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
                <span className="truncate">{ed.direccion || 'Sin dirección registrada'}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748b] p-2.5 bg-[#f8f9ff] rounded-lg border border-[#e5eeff]">
                <User className="w-3.5 h-3.5 text-[#069669] shrink-0" />
                <span className="truncate">
                  Admin: <strong>{ed.administrador_actual || 'Sin Administrador'}</strong>
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
              <span className="text-[11px] text-[#069669] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Supabase Synced
              </span>
              <button
                type="button"
                onClick={() => onToggleActive(ed.id_edificio)}
                className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Power className="w-3 h-3" />
                {ed.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Building Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Registrar Nuevo Edificio</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre del Edificio / Complejo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Torre Gran Plaza Nivel 1 a 20"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Dirección Física</label>
                <input
                  type="text"
                  placeholder="Ej. Boulevard Los Próceres 24-00, Zona 10"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Administrador Responsable</label>
                <select
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  {admins.map((adm) => (
                    <option key={adm.id_usuario} value={adm.id_usuario}>
                      {adm.nombre} ({adm.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm"
                >
                  Guardar en PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
