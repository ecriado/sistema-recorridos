import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  FileCheck, 
  Plus, 
  X, 
  Camera,
  Check
} from 'lucide-react';
import { Recorrido, CheckpointItem } from '../../types';

interface RecorridoDetalleViewProps {
  recorrido: Recorrido;
  onBack: () => void;
  onGoToClosure: () => void;
  onStartRecorrido: (id: string) => void;
}

export const RecorridoDetalleView: React.FC<RecorridoDetalleViewProps> = ({
  recorrido,
  onBack,
  onGoToClosure,
  onStartRecorrido,
}) => {
  const [inspectingCheckpoint, setInspectingCheckpoint] = useState<number | null>(null);
  const [inspectStatus, setInspectStatus] = useState<'Conforme' | 'Hallazgo/Falla'>('Conforme');
  const [inspectComment, setInspectComment] = useState('');

  // Sample checkpoints for this inspection walkthrough
  const sampleCheckpoints = [
    { id: 1, orden: 1, nombre: 'Acceso Principal y Molinetes', descripcion: 'Validación de lectores biométricos y cámaras', estado: 'Conforme' },
    { id: 2, orden: 2, nombre: 'Cuarto de Máquinas y Subestación', descripcion: 'Termografía en interruptores generales y nivel de aceite', estado: 'Conforme' },
    { id: 3, orden: 3, nombre: 'Gabinete Red Húmeda Piso 3', descripcion: 'Manómetro siamés y manguera 30m certificada', estado: 'Hallazgo/Falla' },
    { id: 4, orden: 4, nombre: 'Salida de Emergencia y Presurización', descripcion: 'Prueba de apertura antipánico y extracción de aire', estado: 'Pendiente' },
  ];

  const handleSaveInspection = () => {
    setInspectingCheckpoint(null);
    setInspectComment('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5eeff] hover:bg-[#d3e4fe] transition-all text-[#0b1c30] text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#0051d5] group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver a Recorridos</span>
        </button>

        <div className="flex items-center gap-2">
          {recorrido.estado === 'Programado' && (
            <button
              type="button"
              onClick={() => onStartRecorrido(recorrido.id_recorrido)}
              className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Iniciar Recorrido
            </button>
          )}

          <button
            type="button"
            onClick={onGoToClosure}
            className="px-4 py-2 rounded-lg bg-[#069669] text-white text-xs font-bold hover:bg-[#057a55] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Previsualización y Cierre de Recorrido
          </button>
        </div>
      </div>

      {/* Recorrido Overview Banner */}
      <div className="rounded-2xl bg-[#111c2e] text-white p-6 border border-[#213145] shadow-md">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-[#85f8c4]">
              {recorrido.id_recorrido}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
              {recorrido.estado}
            </span>
            <span className="text-xs text-[#bcc7df]">
              Creado por: {recorrido.creado_por}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {recorrido.nombre}
          </h1>

          <p className="text-xs sm:text-sm text-[#bcc7df] leading-relaxed">
            {recorrido.observaciones || 'Auditoría física y registro de conformidad técnica de áreas comunes y cuartos electromecánicos.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs text-[#bcc7df]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#85f8c4]" />
              <span>{recorrido.edificio_nombre || recorrido.id_edificio}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#85f8c4]" />
              <span>Inicio: {new Date(recorrido.fecha_programada).toLocaleString('es-GT')}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#85f8c4]" />
              <span>Inspector: {recorrido.inspector_nombre || recorrido.inspector_email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoints List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0b1c30]">Checkpoints del Recorrido</h2>
            <p className="text-xs text-[#64748b]">2 de 4 puntos inspeccionados • 50% de avance</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[#e5eeff] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0051d5] to-[#069669] w-1/2 rounded-full transition-all"></div>
        </div>

        <div className="flex flex-col gap-3">
          {sampleCheckpoints.map((chk) => (
            <div
              key={chk.id}
              className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#eff4ff] text-[#0051d5] font-bold text-xs flex items-center justify-center shrink-0">
                  {chk.orden}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0b1c30]">{chk.nombre}</h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{chk.descripcion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    chk.estado === 'Conforme'
                      ? 'bg-emerald-100 text-emerald-800'
                      : chk.estado === 'Hallazgo/Falla'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {chk.estado}
                </span>

                <button
                  type="button"
                  onClick={() => setInspectingCheckpoint(chk.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors"
                >
                  Inspeccionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect Checkpoint Modal */}
      {inspectingCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Inspección de Checkpoint</h3>
              <button
                type="button"
                onClick={() => setInspectingCheckpoint(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Estado del Punto</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectStatus('Conforme')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      inspectStatus === 'Conforme'
                        ? 'bg-emerald-50 text-[#069669] border-[#069669] shadow-sm'
                        : 'border-[#e5eeff] text-[#64748b]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ✓ Conforme
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectStatus('Hallazgo/Falla')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      inspectStatus === 'Hallazgo/Falla'
                        ? 'bg-red-50 text-[#ba1a1a] border-[#ba1a1a] shadow-sm'
                        : 'border-[#e5eeff] text-[#64748b]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    ⚠ Hallazgo / Falla
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Comentario Técnico</label>
                <textarea
                  rows={3}
                  placeholder="Observaciones de la inspección ocular, mediciones o pruebas..."
                  value={inspectComment}
                  onChange={(e) => setInspectComment(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Fotografía de Evidencia (Supabase Storage)</label>
                <div className="p-4 rounded-xl border border-dashed border-[#c5c6cd] bg-[#f8f9ff] flex flex-col items-center justify-center gap-2 text-center">
                  <Camera className="w-5 h-5 text-[#0051d5]" />
                  <span className="text-xs text-[#64748b]">Cargar o tomar fotografía</span>
                  <input type="file" accept="image/*" className="text-xs cursor-pointer text-[#64748b]" />
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInspectingCheckpoint(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveInspection}
                  className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] shadow-sm"
                >
                  Guardar Inspección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
