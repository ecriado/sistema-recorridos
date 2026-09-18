import React, { useState, useRef, useEffect } from 'react';
import { Building2, User, Database, ShieldCheck, ChevronDown, Check, Sparkles, RefreshCw } from 'lucide-react';
import { Usuario } from '../types';

interface HeaderProps {
  currentUser: Usuario;
  usuarios: Usuario[];
  onSelectUser: (user: Usuario) => void;
  onOpenMigrationModal?: () => void;
  isSuperAdmin: boolean;
  onSyncSupabase?: () => void;
  isSyncing?: boolean;
  supabaseCount?: { edificios: number; tareas: number; usuarios: number };
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  usuarios, 
  onSelectUser, 
  onOpenMigrationModal,
  isSuperAdmin,
  onSyncSupabase,
  isSyncing = false,
  supabaseCount
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (rol: string) => {
    switch (rol) {
      case 'SuperAdmin':
        return 'bg-[#eff4ff] text-[#0051d5] border-[#b4c5ff]';
      case 'Supervisor':
        return 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]';
      case 'Administrador':
        return 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]';
      case 'Mantenimiento':
        return 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]';
      default:
        return 'bg-[#f8f9ff] text-[#64748b] border-[#e2e8f0]';
    }
  };

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

          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e5eeff]/70 border border-[#d3e4fe] ${
              isSuperAdmin ? 'hover:bg-[#d3e4fe] cursor-pointer transition-colors' : ''
            }`}
            onClick={() => {
              if (isSuperAdmin && onOpenMigrationModal) {
                onOpenMigrationModal();
              }
            }}
            title={isSuperAdmin ? 'Herramientas de Base de Datos (SuperAdmin)' : 'Conectado a PostgreSQL (Supabase)'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#069669] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#069669]"></span>
            </span>
            <span className="text-xs font-semibold text-[#0b1c30]">
              En línea{' '}
              <span className="text-[#0051d5] font-semibold">
                {supabaseCount ? `(${supabaseCount.edificios} Edificios BD)` : '(Supabase DB)'}
              </span>
            </span>
          </div>

          {onSyncSupabase && (
            <button
              type="button"
              onClick={onSyncSupabase}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#d3e4fe] hover:bg-[#eff4ff] text-xs font-medium text-[#0051d5] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              title="Recargar datos directamente desde la base de datos de Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0051d5]' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}</span>
            </button>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* BOTÓN DIAGNOSTICAR Y REPARAR BD: EXCLUSIVO SUPERADMIN */}
          {isSuperAdmin && onOpenMigrationModal && (
            <button
              type="button"
              onClick={onOpenMigrationModal}
              className="px-3 py-1.5 rounded-lg bg-[#eff4ff] border border-[#0051d5]/40 text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Herramienta de diagnóstico y reparación reservada exclusivamente para SuperAdmin"
            >
              <ShieldCheck className="w-4 h-4 text-[#0051d5]" />
              <span className="hidden sm:inline">Diagnosticar &amp; Reparar BD</span>
              <span className="px-1.5 py-0.2 rounded bg-[#0051d5] text-white text-[10px] font-mono font-medium">
                SuperAdmin
              </span>
            </button>
          )}

          {/* User Profile Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#eff4ff] border border-transparent hover:border-[#d3e4fe] transition-all cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-semibold text-[#0b1c30] leading-tight">
                  {currentUser.nombre}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(currentUser.rol)}`}>
                    {currentUser.rol}
                  </span>
                </div>
              </div>

              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm transition-colors ${
                isSuperAdmin ? 'bg-[#0051d5]' : 'bg-[#111c2e]'
              }`}>
                {isSuperAdmin ? (
                  <ShieldCheck className="w-5 h-5 text-[#85f8c4]" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748b] hidden sm:block" />
            </button>

            {/* Dropdown Menu to switch active role / user */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#d3e4fe] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-[#f1f5f9]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30]">
                    <Sparkles className="w-3.5 h-3.5 text-[#0051d5]" />
                    <span>Cambiar Perfil / Rol Operativo</span>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5">
                    Selecciona un usuario para probar la interfaz y sus permisos:
                  </p>
                </div>

                <div className="py-1 max-h-64 overflow-y-auto">
                  {usuarios.map((u) => {
                    const isSelected = u.id_usuario === currentUser.id_usuario;
                    return (
                      <button
                        key={u.id_usuario}
                        type="button"
                        onClick={() => {
                          onSelectUser(u);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-[#eff4ff] transition-colors ${
                          isSelected ? 'bg-[#f4f7ff]' : ''
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#0b1c30]">
                              {u.nombre}
                            </span>
                            {u.rol === 'SuperAdmin' && (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#0051d5]" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#64748b]">
                            {u.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(u.rol)}`}>
                            {u.rol}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#0051d5]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isSuperAdmin ? (
                  <div className="px-3.5 pt-2 pb-1 border-t border-[#f1f5f9] bg-[#f8faff] rounded-b-xl">
                    <p className="text-[10px] text-[#0051d5] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#0051d5]" />
                      Perfil SuperAdmin: acceso a reparación y gestión total.
                    </p>
                  </div>
                ) : (
                  <div className="px-3.5 pt-2 pb-1 border-t border-[#f1f5f9] bg-[#fff] rounded-b-xl">
                    <p className="text-[10px] text-[#64748b]">
                      Las herramientas de reparación de BD están ocultas para este rol.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
