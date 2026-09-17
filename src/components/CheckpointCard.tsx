import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  CheckCheck, 
  ZoomIn, 
  FileText, 
  Image as ImageIcon, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-react';
import { CheckpointItem, EvidenceFile } from '../types';

interface CheckpointCardProps {
  checkpoint: CheckpointItem;
  onViewImage: (img: { url: string; title: string; filename: string; metadata?: string; size?: string }) => void;
}

export const CheckpointCard: React.FC<CheckpointCardProps> = ({ 
  checkpoint, 
  onViewImage 
}) => {
  const getStatusBadge = () => {
    switch (checkpoint.status) {
      case 'conforme':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e5eeff] text-[#069669] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {checkpoint.statusLabel}
          </span>
        );
      case 'hallazgo_abierto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            {checkpoint.statusLabel}
          </span>
        );
      case 'hallazgo_resuelto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e5eeff] text-[#069669] text-xs font-semibold">
            <CheckCheck className="w-3.5 h-3.5" />
            {checkpoint.statusLabel}
          </span>
        );
    }
  };

  const getNumberColor = () => {
    if (checkpoint.status === 'hallazgo_abierto') {
      return 'bg-[#ffdad6] text-[#ba1a1a]';
    }
    if (checkpoint.status === 'hallazgo_resuelto') {
      return 'bg-[#e5eeff] text-[#069669]';
    }
    return 'bg-[#e5eeff] text-[#0b1c30]';
  };

  return (
    <div className="rounded-xl bg-white border border-[#e5eeff] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Checkpoint Index Badge */}
          <div className={`w-7 h-7 rounded-full ${getNumberColor()} flex items-center justify-center shrink-0 font-bold text-xs mt-0.5`}>
            {checkpoint.number}
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm sm:text-base text-[#0b1c30]">
                {checkpoint.title}
              </span>
              {getStatusBadge()}
              <span className="text-xs text-[#64748b]">• {checkpoint.time}</span>
            </div>

            <p className="text-sm text-[#45474c] leading-relaxed">
              {checkpoint.description}
            </p>

            {/* If there is an active finding assignee / severity */}
            {checkpoint.assignee && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e5eeff] text-[#0b1c30] text-xs font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-[#0051d5]" />
                  {checkpoint.assignee}
                </span>
                {checkpoint.severity && (
                  <span className="inline-flex items-center gap-1 text-[#ba1a1a] text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Severidad: {checkpoint.severity}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Right Tag */}
        {checkpoint.tag && (
          <div className="shrink-0 self-start">
            <span
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                checkpoint.status === 'hallazgo_abierto'
                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                  : checkpoint.status === 'hallazgo_resuelto'
                  ? 'bg-[#e5eeff] text-[#069669]'
                  : 'bg-[#e5eeff] text-[#45474c]'
              }`}
            >
              {checkpoint.tag}
            </span>
          </div>
        )}
      </div>

      {/* Single Evidence File Display */}
      {checkpoint.evidence && (
        <div className="mt-4 pt-3 flex flex-wrap items-center gap-4 bg-[#eff4ff]/70 border border-[#e5eeff] rounded-lg p-3">
          <button
            type="button"
            onClick={() =>
              onViewImage({
                url: checkpoint.evidence!.imageUrl,
                title: checkpoint.title,
                filename: checkpoint.evidence!.filename,
                metadata: checkpoint.evidence!.metadata,
                size: checkpoint.evidence!.size,
              })
            }
            className="relative group w-24 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm border border-[#d3e4fe] cursor-zoom-in"
          >
            <img
              src={checkpoint.evidence.imageUrl}
              alt={checkpoint.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[#0b1c30]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="w-5 h-5" />
            </div>
          </button>

          <div className="flex flex-col justify-center gap-0.5 text-xs text-[#64748b]">
            <div className="flex items-center gap-2 flex-wrap">
              {checkpoint.status === 'hallazgo_abierto' ? (
                <AlertCircle className="w-4 h-4 text-[#ba1a1a]" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#0051d5]" />
              )}
              <span className="font-mono text-[#0b1c30] font-semibold text-xs">
                {checkpoint.evidence.filename}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#e5eeff] text-[10px] text-[#45474c] font-medium">
                {checkpoint.evidence.typeTag}
              </span>
            </div>

            <div className="text-[11px]">
              <span className="text-[#64748b]">
                {checkpoint.evidence.bucket ? 'Bucket: ' : 'URL: '}
              </span>
              <span className="font-mono text-[#0051d5]">
                {checkpoint.evidence.displayUrl}
              </span>
            </div>

            <div className="text-[11px] text-[#75777d]">
              {checkpoint.evidence.size}
              {checkpoint.evidence.hash && ` • Hash: ${checkpoint.evidence.hash}`}
              {checkpoint.evidence.tokenExpires && ` • Expiración Token: ${checkpoint.evidence.tokenExpires}`}
              {checkpoint.evidence.metadata && ` • ${checkpoint.evidence.metadata}`}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Gallery (Antes / Después) */}
      {checkpoint.comparison && (
        <div className="mt-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Antes */}
          <div className="flex items-center gap-3 bg-[#eff4ff]/70 border border-[#e5eeff] rounded-lg p-2.5">
            <button
              type="button"
              onClick={() =>
                onViewImage({
                  url: checkpoint.comparison!.before.imageUrl,
                  title: `${checkpoint.title} - ${checkpoint.comparison!.before.label}`,
                  filename: checkpoint.comparison!.before.filename,
                  size: checkpoint.comparison!.before.size,
                })
              }
              className="relative group w-16 h-14 rounded overflow-hidden shrink-0 border border-[#ffdad6] cursor-zoom-in"
            >
              <img
                src={checkpoint.comparison.before.imageUrl}
                alt={checkpoint.comparison.before.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#ba1a1a]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ZoomIn className="w-4 h-4" />
              </div>
            </button>
            <div className="flex flex-col text-xs font-mono text-[#45474c] overflow-hidden">
              <span className="font-bold text-[#ba1a1a]">
                {checkpoint.comparison.before.label}
              </span>
              <span className="truncate text-[#64748b]">
                {checkpoint.comparison.before.filename}
              </span>
              <span className="text-[10px] text-[#75777d]">
                {checkpoint.comparison.before.size}
              </span>
            </div>
          </div>

          {/* Después */}
          <div className="flex items-center gap-3 bg-[#eff4ff]/70 border border-[#e5eeff] rounded-lg p-2.5">
            <button
              type="button"
              onClick={() =>
                onViewImage({
                  url: checkpoint.comparison!.after.imageUrl,
                  title: `${checkpoint.title} - ${checkpoint.comparison!.after.label}`,
                  filename: checkpoint.comparison!.after.filename,
                  size: checkpoint.comparison!.after.size,
                })
              }
              className="relative group w-16 h-14 rounded overflow-hidden shrink-0 border border-[#85f8c4] cursor-zoom-in"
            >
              <img
                src={checkpoint.comparison.after.imageUrl}
                alt={checkpoint.comparison.after.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#069669]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ZoomIn className="w-4 h-4" />
              </div>
            </button>
            <div className="flex flex-col text-xs font-mono text-[#45474c] overflow-hidden">
              <span className="font-bold text-[#069669]">
                {checkpoint.comparison.after.label}
              </span>
              <span className="truncate text-[#64748b]">
                {checkpoint.comparison.after.filename}
              </span>
              <span className="text-[10px] text-[#75777d]">
                {checkpoint.comparison.after.size} • {checkpoint.comparison.after.seal}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
