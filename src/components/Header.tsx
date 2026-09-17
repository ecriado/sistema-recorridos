import React from 'react';
import { Building2, User, Database } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userRole: string;
  onOpenMigrationModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, userRole, onOpenMigrationModal }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white border-b border-[#e5eeff] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0051d5] flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-[#0b1c30] tracking-tight leading-none">
                EAZY
              </span>
              <span className="text-[10px] font-semibold text-[#64748b] tracking-wider leading-none mt-0.5">
                PROPERTY OPS
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMigrationModal}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e5eeff]/70 hover:bg-[#d3e4fe] transition-colors border border-[#d3e4fe] cursor-pointer"
            title="Configuración y Migración a Supabase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#069669] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#069669]"></span>
            </span>
            <span className="text-xs font-semibold text-[#0b1c30]">
              En línea <span className="text-[#0051d5] font-semibold">(Supabase DB &amp; Storage)</span>
            </span>
          </button>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {onOpenMigrationModal && (
            <button
              type="button"
              onClick={onOpenMigrationModal}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#d3e4fe] text-[#0051d5] hover:bg-[#eff4ff] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Database className="w-3.5 h-3.5 text-[#069669]" />
              <span className="hidden sm:inline">Migración SQL</span>
            </button>
          )}

          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-[#0b1c30] leading-tight">{userName}</p>
            <p className="text-xs text-[#64748b] leading-tight">{userRole}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#111c2e] text-white flex items-center justify-center shadow-sm">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
