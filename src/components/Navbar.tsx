import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, ShieldCheck, LogOut, HardDrive, KeyRound, 
  Sparkles, LayoutDashboard, Image as ImageIcon, Users, 
  Sun, Moon, Database, Palette, User as UserIcon, ChevronDown,
  Settings, ExternalLink, Check, Heart
} from 'lucide-react';
import { User, ServerStorageStats, StudioBrandingConfig, AppNotification } from '../types';
import { formatBytes } from '../services/storageService';
import { APP_ID } from '../lib/instant';
import { COLOR_PRESET_MAP } from '../services/brandingService';
import { BrandIcon } from './BrandIcon';
import { NotificationsPopover } from './NotificationsPopover';

interface NavbarProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string, targetId?: string) => void;
  onLoginClick: (roleHint?: 'admin' | 'client') => void;
  onLogout: () => void;
  storageStats: ServerStorageStats;
  isDbConnected?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  branding?: StudioBrandingConfig;
  onOpenProfileModal?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (notificationId: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLoginClick,
  onLogout,
  storageStats,
  isDbConnected = true,
  theme,
  onToggleTheme,
  branding,
  onOpenProfileModal,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onClearNotifications,
}) => {
  const [showDbInfo, setShowDbInfo] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const usedPercentage = Math.min(100, (storageStats.usedBytes / storageStats.totalCapacityBytes) * 100);
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHomeView = currentView === 'home';

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
      isHomeView
        ? 'bg-black/25 hover:bg-black/35 backdrop-blur-md text-white border-white/10 shadow-lg'
        : isDark 
          ? 'bg-[#141618]/80 backdrop-blur-md text-slate-200 border-slate-800' 
          : 'bg-white/80 backdrop-blur-md text-slate-800 border-slate-200/80 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Studio Brand */}
          <div 
            id="brand-logo-btn"
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-colors overflow-hidden ${colorTheme.twBg} ${colorTheme.twBgHover}`}>
              {branding?.logoType === 'image' && branding.logoImageUrl ? (
                <img src={branding.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <BrandIcon name={branding?.logoIcon || 'Camera'} className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className={`text-lg font-bold tracking-tight flex items-center gap-1.5 font-sans ${
                isHomeView ? 'text-white drop-shadow-sm' : isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {branding?.studioName || 'LUMINA STUDIO'}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider backdrop-blur-md ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
                  {branding?.studioBadgeText || 'PRO'}
                </span>
              </span>
              <p className={`text-[11px] -mt-0.5 tracking-normal ${
                isHomeView ? 'text-slate-200/80 drop-shadow-xs' : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {branding?.studioTagline || 'Galerías Privadas & Almacenamiento RAW'}
              </p>
            </div>
          </div>
            {/* Center Navigation depending on Role */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border backdrop-blur-md ${
            isHomeView 
              ? 'bg-black/35 border-white/15 text-white'
              : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}>
            {currentUser?.role === 'admin' || currentUser?.role === 'photographer' ? (
              <>
                <button
                  id="nav-admin-dashboard-btn"
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentView === 'admin' || currentView.startsWith('admin-')
                      ? `${colorTheme.twBg} text-white shadow-sm font-semibold`
                      : isHomeView
                        ? 'text-slate-200 hover:text-white hover:bg-white/15'
                        : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Panel General</span>
                </button>
                <button
                  id="nav-client-portal-btn"
                  onClick={() => onNavigate('home')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentView === 'home'
                      ? `${colorTheme.twBg} text-white shadow-sm font-semibold`
                      : isHomeView
                        ? 'text-slate-200 hover:text-white hover:bg-white/15'
                        : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Portal Clientes</span>
                </button>
              </>
            ) : currentUser ? (
              /* When Client is logged in */
              <div
                id="nav-client-title"
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold select-none tracking-wide ${
                  isHomeView
                    ? 'text-white drop-shadow-xs'
                    : isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                <span>Mis Galerías & Álbumes</span>
              </div>
            ) : (
              /* When Logged Out */
              <>
                <button
                  id="nav-client-home-btn"
                  onClick={() => onNavigate('home')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentView === 'home'
                      ? `${colorTheme.twBg} text-white shadow-sm font-semibold`
                      : isHomeView
                        ? 'text-slate-200 hover:text-white hover:bg-white/15'
                        : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Portal de Clientes</span>
                </button>
                <button
                  id="nav-client-pin-btn"
                  onClick={() => onNavigate('pin-access')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentView === 'pin-access'
                      ? `${colorTheme.twBg} text-white shadow-sm font-semibold`
                      : isHomeView
                        ? 'text-slate-200 hover:text-white hover:bg-white/15'
                        : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Acceso con PIN</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notifications Center Popover - only visible when user is logged in */}
            {currentUser && (
              <NotificationsPopover
                notifications={notifications}
                currentUser={currentUser}
                onNavigate={onNavigate}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onClearAll={onClearNotifications}
                isDark={isDark}
                branding={branding}
                isHomeView={isHomeView}
              />
            )}

            {/* Theme Toggle Switch (Modo Claro / Modo Oscuro) */}
            <div className="flex items-center">
              <button
                id="theme-toggle-switch-btn"
                type="button"
                onClick={onToggleTheme}
                title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                className={`relative flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${
                  isHomeView
                    ? 'bg-black/35 border-white/15 text-amber-300 hover:bg-white/15'
                    : isDark 
                      ? 'bg-slate-900/90 border-slate-700 text-amber-300 hover:bg-slate-800' 
                      : 'bg-slate-100/90 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline text-xs text-slate-200 font-medium">Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" />
                    <span className="hidden sm:inline text-xs text-slate-700 font-medium">Modo Oscuro</span>
                  </>
                )}
              </button>
            </div>

            {/* InstantDB Live Status Badge */}
            <div className="relative hidden sm:block">
              <button
                id="instantdb-status-btn"
                onClick={() => setShowDbInfo(!showDbInfo)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium backdrop-blur-md transition-all cursor-pointer ${
                  isHomeView
                    ? 'bg-black/35 border-white/15 text-slate-200 hover:bg-white/15'
                    : isDark 
                      ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 text-slate-200' 
                      : 'bg-slate-100/90 border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
                title={`InstantDB App ID: ${APP_ID}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDbConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isDbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span className="font-mono-code text-[11px]">InstantDB</span>
              </button>

              {showDbInfo && (
                <div 
                  id="instantdb-info-popover"
                  className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-3 ${
                    isDark ? 'bg-[#1A1C1E] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Database className={`w-4 h-4 ${colorTheme.twText}`} />
                      <span className="font-semibold">InstantDB Sync</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      Conectado
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">App ID</span>
                    <p className={`font-mono-code text-[11px] p-1.5 rounded-lg border break-all select-all mt-1 ${
                      isDark ? `bg-slate-950 border-slate-800 ${colorTheme.twText}` : `bg-slate-50 border-slate-200 ${colorTheme.twText}`
                    }`}>
                      {APP_ID}
                    </p>
                  </div>
                  <div className={`text-[11px] p-2.5 rounded-lg border ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    Sincronización multi-cliente en tiempo real activa.
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Section & Interactive Dropdown */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <div 
                  id="user-profile-header-trigger"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer backdrop-blur-md transition-all ${
                    showUserDropdown 
                      ? `${colorTheme.twBorder} ${colorTheme.twBadgeBg}` 
                      : isHomeView
                        ? 'bg-black/35 border-white/15 text-white hover:bg-white/15'
                        : isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-slate-100/90 border-slate-200 hover:border-slate-300'
                  }`}
                  title="Opciones de cuenta & perfil"
                >
                  {/* Avatar image or initial */}
                  <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 ${
                    currentUser.avatar ? 'bg-slate-800' : colorTheme.twBg
                  }`}>
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="text-left hidden sm:block">
                    <p className={`font-semibold leading-none truncate max-w-[110px] ${isHomeView ? 'text-white' : isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {currentUser.name}
                    </p>
                    <p className={`text-[10px] font-medium capitalize mt-0.5 ${colorTheme.twText}`}>
                      {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'photographer' ? 'Fotógrafo' : 'Cliente'}
                    </p>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
                    showUserDropdown ? 'rotate-180 text-white' : ''
                  }`} />
                </div>

                {/* Profile Dropdown Menu */}
                {showUserDropdown && (
                  <div 
                    id="user-profile-dropdown-menu"
                    className={`absolute right-0 mt-2 w-72 rounded-3xl border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-1 ${
                      isDark ? 'bg-[#151719] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {/* User Header Summary */}
                    <div className={`p-3.5 rounded-2xl border mb-2 flex items-center gap-3 ${
                      isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-base text-white shadow-md shrink-0 ${
                        currentUser.avatar ? 'bg-slate-800' : colorTheme.twBg
                      }`}>
                        {currentUser.avatar ? (
                          <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className={`font-bold truncate text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {currentUser.name}
                        </p>
                        <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {currentUser.email}
                        </p>
                        <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
                          {currentUser.role === 'admin' ? 'Administrador Pro' : currentUser.role === 'photographer' ? 'Fotógrafo' : 'Cliente'}
                        </span>
                      </div>
                    </div>

                    {/* Edit Profile Action */}
                    <button
                      id="dropdown-edit-profile-btn"
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (onOpenProfileModal) {
                          onOpenProfileModal();
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors text-left cursor-pointer ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorTheme.twBadgeBg} ${colorTheme.twText}`}>
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">Editar Perfil & Foto</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cambiar avatar, nombre, teléfono...</p>
                      </div>
                    </button>

                    {/* Admin Navigation Options */}
                    {(currentUser.role === 'admin' || currentUser.role === 'photographer') && (
                      <>
                        <button
                          id="dropdown-admin-dashboard-btn"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('admin');
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors text-left cursor-pointer ${
                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            <LayoutDashboard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-xs">Panel Administrativo</p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gestión de sesiones y clientes</p>
                          </div>
                        </button>

                        <button
                          id="dropdown-branding-design-btn"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('admin-branding');
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors text-left cursor-pointer ${
                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            <Palette className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-xs">Personalizar Diseño & Colores</p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Logos, títulos, colores y textos</p>
                          </div>
                        </button>
                      </>
                    )}

                    {/* Divider */}
                    <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                    {/* Logout Option */}
                    <button
                      id="dropdown-logout-btn"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-colors text-left cursor-pointer text-rose-500 ${
                        isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={() => onLoginClick('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-white font-semibold text-xs transition-all shadow-md cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

