import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Database,
  LogIn,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { Usuario } from '../types';
import { authenticateUser, requestPasswordReset } from '../lib/supabaseClient';

interface AuthScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
}) => {
  // Mode: 'login' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password form state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Ingresa tu correo electrónico o nombre de usuario.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateUser(identifier.trim(), password);
      if (res.ok && res.user) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 500);
      } else {
        setErrorMessage(res.message || 'Credenciales no válidas.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado durante la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    if (!resetIdentifier.trim()) {
      setResetMessage({ ok: false, text: 'Por favor escribe tu correo electrónico o usuario de acceso.' });
      return;
    }

    setIsResetting(true);
    try {
      const res = await requestPasswordReset(resetIdentifier.trim());
      setResetMessage({ ok: res.ok, text: res.message });
    } catch (err: any) {
      setResetMessage({ ok: false, text: err?.message || 'Error al procesar solicitud de recuperación.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0b1c30] via-[#111c2e] to-[#1e293b] flex flex-col justify-center items-center p-4 sm:p-6 text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0051d5]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#069669]/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#213145] text-[#0b1c30] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-[#0b1c30] p-6 sm:p-7 text-white flex flex-col gap-3 relative border-b border-[#213145]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0051d5] flex items-center justify-center text-white shadow-lg shadow-[#0051d5]/30 overflow-hidden relative border border-white/10 shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo EazyOps" 
                className="w-full h-full object-contain p-1 relative z-10"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <Building2 className="w-6 h-6 text-white absolute inset-0 m-auto pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">EazyOps</span>
                <span className="px-2 py-0.5 rounded-full bg-[#0051d5]/30 border border-[#0051d5]/60 text-[10px] font-mono font-semibold text-[#85f8c4]">
                  PropTech Cloud
                </span>
              </div>
              <p className="text-xs text-[#bcc7df] mt-0.5">
                Plataforma de Gestión y Mantenimiento Operativo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-[#bcc7df]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#069669] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#069669]"></span>
            </span>
            <span>Servidor Supabase: <code className="font-mono text-emerald-400">wafkfxukpgtfromlgvif.supabase.co</code></span>
          </div>
        </div>

        {authMode === 'login' ? (
          /* Login Form */
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#0051d5]" />
                  <h3 className="text-base font-bold text-[#0b1c30]">Iniciar Sesión</h3>
                </div>
                <p className="text-xs text-[#64748b] mt-1">
                  Ingresa con tu cuenta registrada en Supabase para acceder al sistema.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Error de autenticación</span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">¡Acceso concedido!</span>
                    {successMessage}
                  </div>
                </div>
              )}

              {/* Identifier Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  Correo Electrónico o Usuario Login
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="ejemplo@eazyops.gt o usuario.login"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f8f9ff] border border-[#d3e4fe] text-xs text-[#0b1c30] focus:outline-none focus:border-[#0051d5] focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0b1c30]">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(identifier);
                      setResetMessage(null);
                      setAuthMode('forgot');
                    }}
                    className="text-[11px] font-semibold text-[#0051d5] hover:text-[#0041ab] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f8f9ff] border border-[#d3e4fe] text-xs text-[#0b1c30] focus:outline-none focus:border-[#0051d5] focus:bg-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0b1c30] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0051d5]/20 cursor-pointer disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales en Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar a EazyOps</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Forgot Password View */
          <div className="p-6 sm:p-8 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setResetMessage(null);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0051d5] hover:underline mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0051d5]" />
                <h3 className="text-base font-bold text-[#0b1c30]">Recuperar Contraseña</h3>
              </div>
              <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                Ingresa tu correo o usuario para generar un enlace seguro o solicitar asistencia de reseteo directo.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4 mt-4">
              {resetMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                    resetMessage.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {resetMessage.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">
                      {resetMessage.ok ? 'Solicitud Procesada' : 'Error en la solicitud'}
                    </span>
                    {resetMessage.text}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  Correo Electrónico o Usuario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="ejemplo@eazyops.gt"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f8f9ff] border border-[#d3e4fe] text-xs text-[#0b1c30] focus:outline-none focus:border-[#0051d5] focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full h-11 rounded-xl bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0051d5]/20 cursor-pointer disabled:opacity-60"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando solicitud a Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Enlace de Recuperación</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] text-[11px] text-[#0051d5] flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Si eres usuario administrador o de mantenimiento, también puedes solicitar el cambio directo de contraseña a tu <strong>SuperAdmin</strong> desde el panel de gestión.
                </span>
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-[#f8f9ff] px-6 py-3.5 border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#64748b]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Database className="w-3.5 h-3.5 text-[#0051d5]" />
            PostgreSQL Supabase (Online)
          </span>

          <span className="flex items-center gap-1 text-[11px] text-[#059669] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            Acceso Protegido
          </span>
        </div>
      </div>
    </div>
  );
};

