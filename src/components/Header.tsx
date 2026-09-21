import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Database, 
  ShieldCheck, 
  ChevronDown, 
  RefreshCw, 
  LogOut, 
  Camera, 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Building
} from 'lucide-react';
import { Usuario } from '../types';
import { changeSelfPassword } from '../lib/supabaseClient';

interface HeaderProps {
  currentUser?: Usuario;
  usuarios?: Usuario[];
  onSelectUser?: (user: Usuario) => void;
  onOpenMigrationModal?: () => void;
  isSuperAdmin: boolean;
  onSyncSupabase?: () => void;
  isSyncing?: boolean;
  supabaseCount?: { edificios: number; tareas: number; usuarios: number };
  onOpenAuth?: () => void;
  onLogout?: () => void;
  isChangePasswordOpen?: boolean;
  onCloseChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onOpenMigrationModal,
  isSuperAdmin,
  onSyncSupabase,
  isSyncing = false,
  supabaseCount,
  onLogout,
  isChangePasswordOpen: externalChangePasswordOpen,
  onCloseChangePassword: externalCloseChangePassword,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [internalChangePasswordOpen, setInternalChangePasswordOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isChangePasswordOpen = externalChangePasswordOpen ?? internalChangePasswordOpen;
  const setIsChangePasswordOpen = (open: boolean) => {
    setInternalChangePasswordOpen(open);
    if (!open && externalCloseChangePassword) {
      externalCloseChangePassword();
    }
  };

  // Logo de empresa: preferir el logo personalizado o el logo.png por defecto
  const [companyLogo, setCompanyLogo] = useState<string>(() => {
    return localStorage.getItem('eazyops_company_logo') || '/logo.png';
  });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setCompanyLogo(base64);
          localStorage.setItem('eazyops_company_logo', base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ ok: false, message: 'La contraseña debe contener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ ok: false, message: 'Las contraseñas no coinciden.' });
      return;
    }

    if (!currentUser) {
      setPasswordStatus({ ok: false, message: 'No hay usuario autenticado.' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changeSelfPassword(currentUser.id_usuario, currentUser.email, newPassword);
      setPasswordStatus(res);
      if (res.ok) {
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPasswordStatus(null);
        }, 1800);
      }
    } catch (err: any) {
      setPasswordStatus({ ok: false, message: err?.message || 'Error al cambiar contraseña.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white border-b border-[#e5eeff] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Logo Corporativo interactivo */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <div 
              onClick={() => isSuperAdmin && logoInputRef.current?.click()}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all group ${
                isSuperAdmin ? 'cursor-pointer hover:ring-2 hover:ring-[#0051d5]' : ''
              } bg-white border border-[#d3e4fe] shadow-xs`}
              title={isSuperAdmin ? 'Haz clic para cambiar el logo de la empresa' : 'Logo corporativo'}
            >
              <img 
                src={companyLogo} 
                alt="Logo Empresa" 
                className="w-full h-full object-contain p-0.5" 
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <Building2 className="w-5 h-5 text-[#0051d5] absolute inset-0 m-auto pointer-events-none" />
              
              {isSuperAdmin && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-lg text-[#0b1c30] tracking-tight leading-none">
                EAZY
              </span>
              <span className="text-[10px] font-semibold text-[#64748b] tracking-wider leading-none mt-0.5">
                PROPERTY
              </span>
			  <span className="text-[10px] font-semibold text-[#64748b] tracking-wider leading-none mt-0.5">
                MANAGEMENT
              </span>
            </div>
          </div>

          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e5eeff]/70 border border-[#d3e4fe]"
            title="Conectado a PostgreSQL (Supabase)"
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
          {/* BOTÓN DIAGNÓSTICO DE BD (SUPERADMIN) */}
          {isSuperAdmin && onOpenMigrationModal && (
            <button
              type="button"
              onClick={onOpenMigrationModal}
              className="px-3.5 py-1.5 rounded-lg bg-[#eff4ff] border border-[#0051d5]/40 text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Diagnóstico en vivo, verificación de tablas y script de reparación en Supabase"
            >
              <ShieldCheck className="w-4 h-4 text-[#0051d5]" />
              <span className="hidden sm:inline">Diagnóstico de BD</span>
              <span className="px-1.5 py-0.2 rounded bg-[#0051d5] text-white text-[10px] font-mono font-medium">
                SuperAdmin
              </span>
            </button>
          )}

          {/* User Profile Menu (Without role switcher) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#eff4ff] border border-transparent hover:border-[#d3e4fe] transition-all cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-semibold text-[#0b1c30] leading-tight">
                  {currentUser?.nombre || 'Usuario'}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(currentUser?.rol || 'Administrador')}`}>
                    {currentUser?.rol || 'Administrador'}
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

            {/* Profile Dropdown (Strictly User Card + Actions, NO user switcher) */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#d3e4fe] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Summary Card */}
                <div className="px-4 py-3 border-b border-[#f1f5f9] bg-[#f8faff] rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isSuperAdmin ? 'bg-[#0051d5]' : 'bg-[#111c2e]'
                    }`}>
                      {currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#0b1c30] truncate">
                        {currentUser?.nombre || 'Usuario'}
                      </span>
                      <span className="text-[11px] text-[#64748b] truncate font-mono">
                        {currentUser?.email || ''}
                      </span>
                      <div className="mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getRoleBadgeStyle(currentUser?.rol || 'Administrador')}`}>
                          {currentUser?.rol || 'Administrador'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(currentUser?.edificio_asignado || currentUser?.id_edificio_asignado) && (
                    <div className="mt-2.5 pt-2 border-t border-[#e5eeff] text-[11px] text-[#0051d5] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Edificio: <strong>{currentUser.edificio_asignado || currentUser.id_edificio_asignado}</strong></span>
                    </div>
                  )}
                </div>

                {/* Profile Actions */}
                <div className="p-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setPasswordStatus(null);
                      setNewPassword('');
                      setConfirmPassword('');
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <KeyRound className="w-4 h-4 text-[#0051d5]" />
                    <span>Cambiar mi contraseña</span>
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Cerrar Sesión</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#d3e4fe]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Cambiar Contraseña</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#64748b]">
                Actualiza la clave de acceso para tu cuenta <strong className="text-[#0b1c30]">{currentUser?.email}</strong>.
              </p>

              {passwordStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                    passwordStatus.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {passwordStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">
                      {passwordStatus.ok ? 'Éxito' : 'Error'}
                    </span>
                    {passwordStatus.message}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 pr-10 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-mono border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0b1c30] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Confirmar Nueva Contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-mono border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2 rounded-lg bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingPass ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Actualizar Contraseña</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
