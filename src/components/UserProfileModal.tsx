import React, { useState, useEffect } from 'react';
import { 
  X, User as UserIcon, Mail, Phone, Building, Lock, 
  Camera, Upload, Check, ShieldCheck, Sparkles, Image as ImageIcon,
  Eye, EyeOff, Save, Trash2, CheckCircle2, Film, Clapperboard, Video, Aperture
} from 'lucide-react';
import { User, StudioBrandingConfig } from '../types';
import { COLOR_PRESET_MAP } from '../services/brandingService';
import { PHOTOGRAPHY_AVATAR_PRESETS, PhotographyAvatarPreset } from '../data/photographyAvatars';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveUser: (updatedUser: User) => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  theme = 'dark',
  branding,
}) => {
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeAvatarTab, setActiveAvatarTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedAvatarCategory, setSelectedAvatarCategory] = useState<'all' | 'cameras' | 'cinema' | 'optics' | 'studio'>('all');

  const filteredAvatars = selectedAvatarCategory === 'all'
    ? PHOTOGRAPHY_AVATAR_PRESETS
    : PHOTOGRAPHY_AVATAR_PRESETS.filter(p => p.category === selectedAvatarCategory);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCompany(currentUser.company || '');
      setPassword(currentUser.password || '');
      setAvatar(currentUser.avatar || '');
      setNotes(currentUser.notes || '');
      setSaveSuccess(false);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const updated: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      password: password.trim() || currentUser.password,
      avatar: avatar.trim(),
      notes: notes.trim(),
    };

    onSaveUser(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="user-profile-dialog"
        className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-6 relative border transition-colors ${
          isDark ? 'bg-[#141618] border-slate-700/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Close button */}
        <button
          id="close-profile-modal-btn"
          type="button"
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-xl transition-colors cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${colorTheme.twBg}`}>
            {currentUser.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Mi Perfil & Cuenta
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
                {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'photographer' ? 'Fotógrafo' : 'Cliente'}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Actualiza tu fotografía de perfil, nombre visible, datos de contacto y contraseña.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>¡Perfil actualizado con éxito! Cambios guardados en la plataforma.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar Section */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Live Preview */}
              <div className="relative group shrink-0">
                <div className={`w-20 h-20 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-lg transition-all ${
                  isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                } ${avatar ? '' : `${colorTheme.twBg} text-white font-bold text-2xl`}`}>
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt={name || 'Avatar'} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => setAvatar('')}
                    />
                  ) : (
                    <span>{(name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    title="Eliminar avatar"
                    className="absolute -top-1 -right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Avatar Options Selector */}
              <div className="flex-1 space-y-2 w-full text-left">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Fotografía de Perfil / Avatar
                  </span>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveAvatarTab('presets')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                        activeAvatarTab === 'presets' 
                          ? `${colorTheme.twBg} text-white` 
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAvatarTab('upload')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                        activeAvatarTab === 'upload' 
                          ? `${colorTheme.twBg} text-white` 
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAvatarTab('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                        activeAvatarTab === 'url' 
                          ? `${colorTheme.twBg} text-white` 
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {/* Sub-view: Preset Photography & Video Avatars */}
                {activeAvatarTab === 'presets' && (
                  <div className="space-y-2.5">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarCategory('all')}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          selectedAvatarCategory === 'all'
                            ? `${colorTheme.twBg} text-white font-semibold shadow-xs`
                            : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Todos ({PHOTOGRAPHY_AVATAR_PRESETS.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarCategory('cameras')}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          selectedAvatarCategory === 'cameras'
                            ? `${colorTheme.twBg} text-white font-semibold shadow-xs`
                            : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Cámaras
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarCategory('cinema')}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          selectedAvatarCategory === 'cinema'
                            ? `${colorTheme.twBg} text-white font-semibold shadow-xs`
                            : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Cine & Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarCategory('optics')}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          selectedAvatarCategory === 'optics'
                            ? `${colorTheme.twBg} text-white font-semibold shadow-xs`
                            : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Óptica & Objetivos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarCategory('studio')}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          selectedAvatarCategory === 'studio'
                            ? `${colorTheme.twBg} text-white font-semibold shadow-xs`
                            : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Estudio & Flash
                      </button>
                    </div>

                    {/* Avatars Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-1.5 rounded-xl border max-h-48 overflow-y-auto ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/60 border-slate-200'}">
                      {filteredAvatars.map((preset) => {
                        const isSelected = avatar === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAvatar(preset.url)}
                            title={`${preset.name} (${preset.categoryLabel})`}
                            className={`group relative flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? `${colorTheme.twBorder} ring-2 ${colorTheme.twRing} ${isDark ? 'bg-slate-800' : 'bg-white shadow-xs'} scale-102`
                                : isDark
                                  ? 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-xs">
                              <img 
                                src={preset.url} 
                                alt={preset.name} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                              />
                              {isSelected && (
                                <span className={`absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[10px]`}>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] font-medium truncate max-w-full leading-tight ${
                              isSelected ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : (isDark ? 'text-slate-400' : 'text-slate-600')
                            }`}>
                              {preset.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-view: Upload Local Photo */}
                {activeAvatarTab === 'upload' && (
                  <div className="flex items-center gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed text-xs font-medium cursor-pointer transition-colors ${
                      isDark ? 'border-slate-700 hover:border-slate-500 bg-slate-900 text-slate-300' : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700'
                    }`}>
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar imagen desde tu dispositivo...</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}

                {/* Sub-view: Custom URL */}
                {activeAvatarTab === 'url' && (
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            
            {/* Full Name */}
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nombre Completo *
              </label>
              <div className="relative">
                <input
                  id="profile-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofia Valenzuela"
                  className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <UserIcon className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Correo Electrónico *
              </label>
              <div className="relative">
                <input
                  id="profile-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@estudio.com"
                  className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <input
                  id="profile-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <Phone className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Company / Brand */}
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Empresa / Razón Social
              </label>
              <div className="relative">
                <input
                  id="profile-company-input"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Lumina Pro / Particular"
                  className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <Building className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Password */}
            <div className="sm:col-span-2">
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contraseña de Acceso
              </label>
              <div className="relative">
                <input
                  id="profile-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce una contraseña segura"
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

            {/* Bio / Notes */}
            <div className="sm:col-span-2">
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Notas / Biografía del Usuario
              </label>
              <textarea
                id="profile-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles sobre el cliente, estilo fotográfico o preferencias..."
                className={`w-full border rounded-xl p-3 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none resize-none ${
                  isDark 
                    ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/40">
            <button
              type="button"
              id="cancel-profile-btn"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="save-profile-btn"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
