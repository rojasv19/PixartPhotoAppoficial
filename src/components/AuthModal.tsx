import React, { useState } from 'react';
import { 
  X, Lock, Mail, KeyRound, ShieldCheck, Camera, 
  ArrowRight, ShieldAlert, Eye, EyeOff
} from 'lucide-react';
import { GallerySession, StudioBrandingConfig } from '../types';
import { COLOR_PRESET_MAP, DEFAULT_MODAL_TEXTS } from '../services/brandingService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string, targetRole?: 'admin' | 'client') => boolean;
  onPinSubmit: (pin: string) => boolean;
  galleries: GallerySession[];
  initialMode?: 'admin' | 'client' | 'pin';
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onPinSubmit,
  initialMode = 'admin',
  theme = 'dark',
  branding,
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'client'>(
    initialMode === 'pin' || initialMode === 'client' ? 'client' : 'admin'
  );
  
  // Client sub-mode (Email/Password or PIN)
  const [clientAccessType, setClientAccessType] = useState<'password' | 'pin'>(
    initialMode === 'pin' ? 'pin' : 'password'
  );

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
  const isDark = theme === 'dark';
  const modalTexts = branding?.modalTexts?.authModal || DEFAULT_MODAL_TEXTS.authModal;

  // Sync initial tab if modal reopens
  React.useEffect(() => {
    if (isOpen) {
      if (initialMode === 'admin') {
        setActiveTab('admin');
      } else if (initialMode === 'pin') {
        setActiveTab('client');
        setClientAccessType('pin');
      } else {
        setActiveTab('client');
        setClientAccessType('password');
      }
      setAuthError(null);
      setEmail('');
      setPassword('');
      setPinCode('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      setAuthError('Por favor ingresa usuario/correo y contraseña.');
      return;
    }
    const success = onLogin(email.trim(), password.trim(), activeTab);
    if (success) {
      onClose();
    } else {
      setAuthError('Credenciales no válidas. Por favor verifica tus datos de acceso.');
    }
  };

  const handlePinFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!pinCode.trim()) {
      setAuthError('Ingresa el código PIN de tu sesión.');
      return;
    }
    const success = onPinSubmit(pinCode.trim());
    if (success) {
      onClose();
    } else {
      setAuthError('Código PIN inválido. Verifica el código entregado por el fotógrafo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      
      <div 
        id="auth-modal-card"
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-6 relative border transition-colors ${
          isDark 
            ? 'bg-[#141618] border-slate-700/80 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button 
          id="close-auth-modal-btn"
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-xl transition-colors cursor-pointer ${
            isDark 
              ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
            {activeTab === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>
          <div>
            <h3 className={`text-xl font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeTab === 'admin' 
                ? (modalTexts.adminTabTitle || 'Acceso de Administrador') 
                : (modalTexts.clientTabTitle || 'Portal de Clientes')}
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeTab === 'admin' 
                ? (modalTexts.adminTabSubtitle || 'Panel de control, sesiones RAW y almacenamiento') 
                : (modalTexts.clientTabSubtitle || 'Accede a tus galerías privadas en alta resolución')}
            </p>
          </div>
        </div>

        {/* 2 Main Option Tabs */}
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl border text-xs ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            id="auth-tab-admin"
            onClick={() => {
              setActiveTab('admin');
              setAuthError(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? `${colorTheme.twBg} text-white shadow-md`
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{modalTexts.adminTabTitle || 'Administrador'}</span>
          </button>

          <button
            type="button"
            id="auth-tab-client"
            onClick={() => {
              setActiveTab('client');
              setAuthError(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'client'
                ? `${colorTheme.twBg} text-white shadow-md`
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{modalTexts.clientTabTitle || 'Clientes'}</span>
          </button>
        </div>

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {modalTexts.usernameLabel || 'Usuario o Correo:'}
              </label>
              <div className="relative">
                <input
                  id="auth-admin-email-input"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={modalTexts.usernamePlaceholder || 'demo23 o correo admin'}
                  className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {modalTexts.passwordLabel || 'Contraseña:'}
              </label>
              <div className="relative">
                <input
                  id="auth-admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={modalTexts.passwordPlaceholder || '••••••••'}
                  className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono-code focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              id="submit-auth-admin-btn"
              className={`w-full py-3 rounded-xl text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
            >
              <span>{modalTexts.adminLoginButtonText || 'Ingresar al Panel de Gestión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Client Access Mode (Password vs PIN) */}
        {activeTab === 'client' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Sub-selector: Usuario/Contraseña vs PIN */}
            <div className={`flex rounded-xl p-1 border text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                id="client-subtab-password"
                onClick={() => {
                  setClientAccessType('password');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  clientAccessType === 'password'
                    ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {modalTexts.clientSubTabPassword || 'Usuario & Contraseña'}
              </button>
              <button
                type="button"
                id="client-subtab-pin"
                onClick={() => {
                  setClientAccessType('pin');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  clientAccessType === 'pin'
                    ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {modalTexts.clientSubTabPin || 'Código PIN'}
              </button>
            </div>

            {clientAccessType === 'password' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {modalTexts.usernameLabel || 'Usuario o Correo de Cliente:'}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-client-email-input"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={modalTexts.usernamePlaceholder || 'demo23 o tu correo'}
                      className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                        isDark 
                          ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {modalTexts.passwordLabel || 'Contraseña:'}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-client-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={modalTexts.passwordPlaceholder || '••••••••'}
                      className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono-code focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                        isDark 
                          ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-3 cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="submit-auth-client-btn"
                  className={`w-full py-3 rounded-xl text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                >
                  <span>{modalTexts.clientLoginButtonText || 'Acceder a Mis Galerías'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePinFormSubmit} className="space-y-3.5">
                <div className="text-center space-y-1">
                  <KeyRound className={`w-7 h-7 mx-auto ${colorTheme.twText}`} />
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {modalTexts.pinDescription || 'Ingresa el PIN de seguridad proporcionado para tu sesión'}
                  </p>
                </div>

                <div>
                  <input
                    id="auth-pin-input"
                    type="text"
                    maxLength={8}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder={modalTexts.pinPlaceholder || 'Código PIN (ej: 8492)'}
                    className={`w-full border rounded-xl px-4 py-3 text-center text-lg font-mono-code tracking-widest ${colorTheme.twText} focus:ring-2 ${colorTheme.twRing} focus:outline-none ${
                      isDark 
                        ? 'bg-slate-950 border-slate-700 placeholder:text-slate-600' 
                        : 'bg-white border-slate-300 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {authError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  id="submit-auth-pin-btn"
                  className={`w-full py-3 rounded-xl text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                >
                  <span>{modalTexts.pinButtonText || 'Abrir Galería Privada'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

