import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  CheckCheck, 
  BadgeCheck, 
  PenTool, 
  RotateCcw, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditCode: string;
  auditLocation: string;
  supervisorLicense: string;
  onConfirmSeal: (signatureData: string) => Promise<void>;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  auditCode,
  auditLocation,
  supervisorLicense,
  onConfirmSeal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [certified, setCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setHasDrawn(false);
      setCertified(false);
      setIsSubmitting(false);
      setErrorMsg('');
      return;
    }

    // Set up canvas when opened
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle high DPI
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0051d5';
      ctx.lineWidth = 2.5;
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg('');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e) {
      // prevent scrolling on mobile while drawing
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!certified) {
      setErrorMsg('Por favor confirme la certificación antes de sellar en Supabase.');
      return;
    }
    if (!hasDrawn) {
      setErrorMsg('Por favor agregue su firma digital en el recuadro.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const dataUrl = canvasRef.current ? canvasRef.current.toDataURL('image/png') : '';
      await onConfirmSeal(dataUrl);
      onClose();
    } catch {
      setErrorMsg('Error al conectar con Supabase. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
        {/* Modal Header */}
        <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0051d5] flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">
                Confirmación de Cierre Digital
              </h4>
              <p className="text-xs text-[#bcc7df]">
                Sellado de acta e inserción de hash en Postgres
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Audit Info Snippet */}
          <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              Auditoría Seleccionada:
            </span>
            <span className="font-bold text-sm text-[#0b1c30]">
              {auditLocation} • {auditCode}
            </span>
            <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
              <span className="text-[#069669] font-semibold">9 Conformes</span>
              <span className="text-[#cbd5e1]">•</span>
              <span className="text-[#ba1a1a] font-semibold">1 Hallazgo Abierto</span>
              <span className="text-[#cbd5e1]">•</span>
              <span className="text-[#0051d5] font-semibold">Dictamen: Conforme c/ Obs.</span>
            </div>
          </div>

          {/* Supervisor Credential */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#0b1c30]">
              Identificador de Firma del Supervisor
            </label>
            <div className="flex items-center gap-2.5 p-2.5 bg-[#f8f9ff] border border-[#e5eeff] rounded-lg">
              <BadgeCheck className="w-4 h-4 text-[#0051d5] shrink-0" />
              <input
                type="text"
                readOnly
                value={supervisorLicense}
                className="w-full bg-transparent text-xs font-mono font-medium text-[#0b1c30] focus:outline-none cursor-default"
              />
            </div>
          </div>

          {/* Canvas Stylus Signature Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#0b1c30]">
                Firma Manuscrita Digital
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-[#0051d5] font-medium hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar trazo
              </button>
            </div>

            <div className="relative w-full h-36 rounded-xl bg-[#f8f9ff] border-2 border-dashed border-[#c5c6cd] overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#75777d] text-xs font-medium gap-1.5">
                  <PenTool className="w-4 h-4 text-[#94a3b8]" />
                  Firme aquí con stylus o puntero táctil / ratón
                </div>
              )}
            </div>
          </div>

          {/* Legal Certification Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none mt-1">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => {
                setCertified(e.target.checked);
                if (e.target.checked) setErrorMsg('');
              }}
              className="w-4 h-4 mt-0.5 accent-[#0051d5] rounded cursor-pointer shrink-0"
            />
            <span className="text-xs text-[#45474c] leading-relaxed">
              Certifico que la inspección física fue completada bajo la norma técnica vigente y que las evidencias en Supabase Storage reflejan el estado real de la infraestructura.
            </span>
          </label>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#eff4ff]/60 border-t border-[#e5eeff] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando con Supabase...
              </>
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                Sellar en Base de Datos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
