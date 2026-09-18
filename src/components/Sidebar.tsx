import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ClipboardCheck, 
  Bot, 
  BarChart3, 
  Building,
  Users,
  Database,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { NavScreen, UserRole } from '../types';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  pendingTasksCount?: number;
  onOpenMigrationModal?: () => void;
  isSuperAdmin?: boolean;
  userRole?: UserRole;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentScreen, 
  onNavigate,
  pendingTasksCount = 1,
  onOpenMigrationModal,
  isSuperAdmin = false,
  userRole = 'Administrador',
  onLogout,
}) => {
  const allNavItems: { id: NavScreen; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tareas', label: 'Tareas', icon: <CheckSquare className="w-5 h-5" />, badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : undefined },
    { id: 'recorridos', label: 'Recorridos', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'automatizaciones', label: 'Automatizaciones', icon: <Bot className="w-5 h-5" /> },
    { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'edificios', label: 'Edificios', icon: <Building className="w-5 h-5" /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
  ];

  // Role filtering based on Google Apps Script specs:
  const navItems = allNavItems.filter((item) => {
    // 1. Usuarios is ONLY accessible to SuperAdmin
    if (item.id === 'usuarios') {
      return isSuperAdmin;
    }
    // 2. Mantenimiento does not access recorridos, reportes or edificios
    if (userRole === 'Mantenimiento') {
      if (item.id === 'recorridos' || item.id === 'reportes' || item.id === 'edificios') {
        return false;
      }
    }
    return true;
  });

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#eff4ff]/60 border-r border-[#e5eeff] z-30 flex flex-col justify-between py-4 shadow-[0_1px_8px_rgba(0,0,0,0.02)] overflow-y-auto">
      <div className="flex flex-col gap-4">
        <div className="px-5 pt-1">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
            Navegación Operativa
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id || (item.id === 'recorridos' && (currentScreen === 'recorrido_detalle' || currentScreen === 'recorrido_cierre'));
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0051d5] text-white shadow-sm'
                    : 'text-[#45474c] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Box */}
      <div className="px-4 pb-4">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            title="Cerrar sesión actual y regresar a la pantalla de login"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
};
