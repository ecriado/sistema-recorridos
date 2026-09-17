import React from 'react';
import { X, Download, ExternalLink, Image as ImageIcon, Database } from 'lucide-react';

interface LightboxProps {
  image: {
    url: string;
    title: string;
    filename: string;
    metadata?: string;
    size?: string;
  } | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative max-w-4xl w-full flex flex-col items-center">
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between text-white pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#85f8c4]" />
            <span className="font-semibold text-sm">{image.title}</span>
            <span className="text-xs text-[#cbd5e1] font-mono">({image.filename})</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={image.url}
              target="_blank"
              rel="noreferrer"
              download={image.filename}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs"
              title="Descargar archivo original"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-res image display */}
        <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/10">
          <img
            src={image.url}
            alt={image.title}
            className="max-h-[75vh] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Metadata Footer */}
        <div className="w-full mt-3 flex items-center justify-between text-xs text-[#cbd5e1] px-1">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#85f8c4]" />
            Bucket: <code className="font-mono text-white">walkthrough-photos</code>
          </span>
          <div className="flex items-center gap-3">
            {image.size && <span>Tamaño: {image.size}</span>}
            {image.metadata && <span>{image.metadata}</span>}
            <span className="text-[#85f8c4] font-medium">Supabase Storage v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
