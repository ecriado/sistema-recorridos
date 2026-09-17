import React, { useState } from 'react';
import { 
  Star, 
  FileEdit, 
  PenTool, 
  FileCheck2, 
  ChevronDown 
} from 'lucide-react';
import { DictamenFormState, TipoCierre } from '../types';

interface SupervisorDictamenProps {
  formState: DictamenFormState;
  onChange: (updates: Partial<DictamenFormState>) => void;
  onOpenSignatureModal: () => void;
  isSealed: boolean;
}

export const SupervisorDictamen: React.FC<SupervisorDictamenProps> = ({
  formState,
  onChange,
  onOpenSignatureModal,
  isSealed,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : formState.rating;

  return (
    <div className="rounded-xl bg-white border border-[#e5eeff] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#e5eeff] text-[#0051d5] flex items-center justify-center">
          <FileEdit className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-base sm:text-lg text-[#0b1c30]">
          Dictamen del Supervisor
        </h3>
      </div>

      {/* Star Rating Widget */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-xs font-semibold text-[#0b1c30]">
          Calificación General de la Infraestructura
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= displayRating;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => onChange({ rating: star })}
                className="p-1 hover:scale-110 transition-transform focus:outline-none"
                aria-label={`Calificar con ${star} estrellas`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[#c5c6cd]'
                  }`}
                />
              </button>
            );
          })}
          <span className="font-bold text-sm text-[#0b1c30] ml-2 font-mono">
            {formState.rating.toFixed(1)} / 5.0
          </span>
        </div>
        <span className="text-[11px] text-[#64748b]">
          Calificación ponderada sugerida según incidentes detectados.
        </span>
      </div>

      {/* Closure Type Select */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label
          htmlFor="tipoCierre"
          className="text-xs font-semibold text-[#0b1c30]"
        >
          Tipo de Cierre Administrativo
        </label>
        <div className="relative">
          <select
            id="tipoCierre"
            value={formState.tipoCierre}
            onChange={(e) =>
              onChange({ tipoCierre: e.target.value as TipoCierre })
            }
            className="w-full h-11 px-3 bg-[#eff4ff]/70 text-[#0b1c30] rounded-lg text-sm border border-[#e5eeff] appearance-none focus:outline-none focus:border-[#0051d5] focus:bg-white transition-colors cursor-pointer pr-10"
          >
            <option value="conforme_obs">
              Satisfactorio con Observaciones (Recomendado)
            </option>
            <option value="conforme_pleno">
              Conforme Pleno (Requiere 0 hallazgos abiertos)
            </option>
            <option value="no_conforme">
              No Conforme (Apertura de Auditoría Extraordinaria)
            </option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-[#64748b] pointer-events-none" />
        </div>
      </div>

      {/* Remarks Textarea */}
      <div className="flex flex-col gap-1.5 mb-5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="dictamenTexto"
            className="text-xs font-semibold text-[#0b1c30]"
          >
            Dictamen de Auditoría
          </label>
          <span className="text-[11px] text-[#64748b]">
            {formState.dictamenTexto.length} / 500 car.
          </span>
        </div>
        <textarea
          id="dictamenTexto"
          rows={4}
          maxLength={500}
          value={formState.dictamenTexto}
          onChange={(e) => onChange({ dictamenTexto: e.target.value })}
          placeholder="Ingrese el resumen técnico o condiciones requeridas para la validación definitiva..."
          className="w-full p-3 bg-[#eff4ff]/70 rounded-lg text-sm text-[#0b1c30] border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] focus:bg-white transition-colors resize-none leading-relaxed"
        ></textarea>
      </div>

      {/* Supabase Automation Checkbox */}
      <div className="rounded-lg bg-[#eff4ff]/80 border border-[#e5eeff] p-3 mb-5 flex items-start gap-3">
        <input
          type="checkbox"
          id="togglePdfBucket"
          checked={formState.notifyPdfInSupabase}
          onChange={(e) =>
            onChange({ notifyPdfInSupabase: e.target.checked })
          }
          className="w-4 h-4 mt-0.5 accent-[#0051d5] rounded cursor-pointer shrink-0"
        />
        <label htmlFor="togglePdfBucket" className="flex flex-col cursor-pointer">
          <span className="text-xs font-bold text-[#0b1c30]">
            Notificar y Almacenar PDF en Supabase
          </span>
          <span className="text-[11px] text-[#64748b] mt-0.5">
            Generar informe criptográficamente firmado y subir al bucket{' '}
            <code className="text-[#0051d5] font-mono font-semibold">
              audit-reports
            </code>
            .
          </span>
        </label>
      </div>

      {/* Final Sign-off Button */}
      <button
        type="button"
        id="btnTriggerFinalize"
        onClick={onOpenSignatureModal}
        disabled={isSealed}
        className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
          isSealed
            ? 'bg-[#069669] text-white cursor-default'
            : 'bg-[#0051d5] text-white hover:bg-[#0041ab] active:scale-[0.99]'
        }`}
      >
        {isSealed ? (
          <>
            <FileCheck2 className="w-4 h-4" />
            Auditoría Sellada en Postgres
          </>
        ) : (
          <>
            <PenTool className="w-4 h-4" />
            Firmar y Cerrar Auditoría
          </>
        )}
      </button>
    </div>
  );
};
