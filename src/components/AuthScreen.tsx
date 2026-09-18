import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Database,
  UserPlus,
  LogIn,
  RefreshCw,
  X
} from 'lucide-react';
import { Usuario, UserRole } from '../types';
import { authenticateUser, registerUserInSupabase } from '../lib/supabaseClient';

interface AuthScreenProps {
  usuarios: Usuario[];
  currentUser: Usuario;
  onLoginSuccess: (user: Usuario) => void;
  onCancel?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  usuarios,
  currentUser,
  onLoginSuccess,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'quick_test' | 'register'>('login');
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register form state
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regRol, setRegRol] = useState<UserRole>('Supervisor');
  const [isRegistering, setIsRegistering] = useState(false);

  // Quick filter
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [searchFilter, setSearchFilter] = useState<string>('');

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
        }, 600);
      } else {
        setErrorMessage(res.message || 'Credenciales no válidas.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado durante la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regNombre.trim() || !regEmail.trim()) {
      setErrorMessage('Completa el nombre y correo electrónico.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await registerUserInSupabase({
        nombre: regNombre.trim(),
        email: regEmail.trim(),
        password: regPassword || undefined,
        rol: regRol,
        usuario_login: regLogin.trim() || regEmail.trim().split('@')[0],
      });

      if (res.ok && res.user) {
        setSuccessMessage('¡Usuario registrado exitosamente en Supabase! Iniciando sesión...');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 800);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar usuario.');
    } finally {
      setIsRegistering(false);
    }
  };

  const filteredQuickUsers = usuarios.filter((u) => {
    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.usuario_login.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleBadgeStyle = (rol: UserRole) => {
    switch (rol) {
      case 'SuperAdmin':
        return 'bg-[#eff4ff] text-[#0051d5] border-[#0051d5]/40';
      case 'Supervisor':
        return 'bg-[#ecfdf5] text-[#047857] border-[#047857]/40';
      case 'Administrador':
        return 'bg-[#fffbeb] text-[#b45309] border-[#b45309]/40';
      case 'Mantenimiento':
        return 'bg-[#f8fafc] text-[#475569] border-[#cbd5e1]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1c30] via-[#111c2e] to-[#1e293b] flex flex-col justify-center items-center p-4 sm:p-6 text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0051d5]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#069669]/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#213145] text-[#0b1c30] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-[#0b1c30] p-6 sm:p-7 text-white flex flex-col gap-3 relative border-b border-[#213145]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="Cerrar y volver a la app"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0051d5] flex items-center justify-center text-white shadow-lg shadow-[#0051d5]/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">EazyOps</span>
                <span className="px-2 py-0.5 rounded-full bg-[#0051d5]/30 border border-[#0051d5]/60 text-[10px] font-mono font-semibold text-[#85f8c4]">
                  v2.4 Supabase Auth
                </span>
              </div>
              <p className="text-xs text-[#bcc7df] mt-0.5">
                Portal de Autenticación y Pruebas de Roles Operativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-[#bcc7df]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#069669] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#069669]"></span>
            </span>
            <span>Servicio Supabase conectado: <code className="font-mono text-emerald-400">wafkfxukpgtfromlgvif.supabase.co</code></span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#e5eeff] bg-[#f8f9ff]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'border-[#0051d5] text-[#0051d5] bg-white'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quick_test');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quick_test'
                ? 'border-[#0051d5] text-[#0051d5] bg-white'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#0051d5]" />
            Prueba de Roles ({usuarios.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'border-[#0051d5] text-[#0051d5] bg-white'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        {/* Tab 1: Credenciales (Login) */}
        {activeTab === 'login' && (
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">Ingreso al Sistema</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Introduce tus credenciales registradas en Supabase (Auth o tabla usuarios).
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
                <label className="text-xs font-semibold text-[#0b1c30] flex items-center justify-between">
                  <span>Correo Electrónico o Usuario Login</span>
                  <span className="text-[10px] text-[#0051d5] font-normal">Ej: criado.eddie@gmail.com</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="usuario@eazyops.gt o tu_login"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f8f9ff] border border-[#d3e4fe] text-xs text-[#0b1c30] focus:outline-none focus:border-[#0051d5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0b1c30]">Contraseña</label>
                  <span className="text-[10px] text-[#64748b]">
                    (Opcional si usas usuario migrado sin password)
                  </span>
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
                    <span>Iniciar Sesión en Supabase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-3 p-3 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] text-[11px] text-[#0051d5] flex items-start gap-2">
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-[#0051d5]" />
                <div>
                  <strong className="block font-semibold">Modo de Pruebas Activo:</strong>
                  Puedes escribir tu correo registrado como SuperAdmin (<code className="font-mono font-bold">criado.eddie@gmail.com</code>) o seleccionar cualquier cuenta en la pestaña <strong>"Prueba de Roles"</strong> para probar la experiencia completa de cada perfil con 1 solo clic.
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Acceso Rápido de Prueba (1-Clic) */}
        {activeTab === 'quick_test' && (
          <div className="p-6 sm:p-8 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Prueba Inmediata de Perfiles y Permisos</h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Haz clic sobre cualquiera de los usuarios en tu base de datos para ingresar con su rol específico:
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1 h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
              >
                <option value="todos">Todos los Roles</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrador">Administrador</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
            </div>

            {/* User List */}
            <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1">
              {filteredQuickUsers.map((u) => {
                const isCurrent = u.id_usuario === currentUser.id_usuario;
                return (
                  <button
                    key={u.id_usuario}
                    type="button"
                    onClick={() => {
                      setSuccessMessage(`Sesión iniciada como ${u.nombre} (${u.rol})`);
                      setTimeout(() => onLoginSuccess(u), 300);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                      isCurrent 
                        ? 'bg-[#eff4ff] border-[#0051d5] shadow-xs' 
                        : 'bg-white border-[#e5eeff] hover:border-[#0051d5] hover:bg-[#f8f9ff]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                        u.rol === 'SuperAdmin' ? 'bg-[#0051d5]' : 'bg-[#111c2e]'
                      }`}>
                        {u.rol === 'SuperAdmin' ? (
                          <ShieldCheck className="w-4 h-4 text-[#85f8c4]" />
                        ) : (
                          u.nombre.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                            {u.nombre}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-[#0051d5] text-white rounded font-semibold">
                              Actual
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#64748b] truncate">
                          {u.email} • <code className="font-mono text-[10px] text-[#0051d5]">{u.usuario_login}</code>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(u.rol)}`}>
                        {u.rol}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#0051d5] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}

              {filteredQuickUsers.length === 0 && (
                <div className="p-6 text-center text-xs text-[#64748b]">
                  No se encontraron usuarios con ese criterio.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Registrar Usuario */}
        {activeTab === 'register' && (
          <div className="p-6 sm:p-8">
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">Crear Nuevo Usuario para Pruebas</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Se registrará en Supabase Auth y se guardará en la tabla <code className="font-mono text-[#0051d5]">usuarios</code> de PostgreSQL.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMessage}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Eddie Criado"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0b1c30]">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@eazyops.gt"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0b1c30]">Usuario Login</label>
                  <input
                    type="text"
                    placeholder="usuario.login"
                    value={regLogin}
                    onChange={(e) => setRegLogin(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0b1c30]">Contraseña Supabase</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0b1c30]">Rol Asignado</label>
                  <select
                    value={regRol}
                    onChange={(e) => setRegRol(e.target.value as UserRole)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="SuperAdmin">SuperAdmin (Acceso total)</option>
                    <option value="Supervisor">Supervisor de Calidad</option>
                    <option value="Administrador">Administrador de Propiedad</option>
                    <option value="Mantenimiento">Técnico de Mantenimiento</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full h-11 rounded-xl bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 mt-2"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Usuario en Supabase</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-[#f8f9ff] px-6 py-3.5 border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#64748b]">
          <span className="flex items-center gap-1 text-[11px]">
            <Database className="w-3.5 h-3.5 text-[#0051d5]" />
            PostgreSQL Supabase (Online)
          </span>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[#0051d5] hover:underline text-xs font-semibold cursor-pointer"
            >
              Explorar sin iniciar sesión →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
