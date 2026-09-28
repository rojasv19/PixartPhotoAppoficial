import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, User as UserIcon, Mail, Phone, Building, Lock, 
  Camera, Upload, Check, ShieldCheck, Sparkles, Image as ImageIcon,
  Eye, EyeOff, Save, Trash2, CheckCircle2, RotateCcw, Download, ExternalLink
} from 'lucide-react';
import { User, StudioBrandingConfig, GalleryImage, GallerySession } from '../types';
import { COLOR_PRESET_MAP } from '../services/brandingService';
import { DEFAULT_PROFILE_AVATAR } from '../data/photographyAvatars';
import { isSameId } from '../services/instantDbService';
import { downloadSingleImage, downloadImagesAsZip, formatBytes } from '../services/storageService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveUser: (updatedUser: User) => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
  images?: GalleryImage[];
  galleries?: GallerySession[];
  onOpenGallery?: (galleryId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  theme = 'dark',
  branding,
  images = [],
  galleries = [],
  onOpenGallery,
}) => {
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalTexts: any = (branding?.modalTexts?.userProfileModal as any) || {
    title: 'Mi Perfil & Cuenta',
    subtitle: 'Actualiza tu fotografía de perfil, nombre visible, datos de contacto y contraseña.',
    nameLabel: 'Nombre Completo *',
    namePlaceholder: 'Ej: Sofia Valenzuela',
    emailLabel: 'Correo Electrónico *',
    emailPlaceholder: 'Correo',
    phoneLabel: 'Teléfono / WhatsApp',
    phonePlaceholder: '+34 600 000 000',
    companyLabel: 'Empresa / Razón Social',
    companyPlaceholder: 'Pixart Photo / Particular',
    passwordLabel: 'Contraseña de Acceso',
    passwordPlaceholder: 'Introduce una contraseña segura',
    notesLabel: 'Notas / Biografía del Usuario',
    notesPlaceholder: 'Detalles sobre el cliente, estilo fotográfico o preferencias...',
    saveButtonText: 'Guardar Cambios',
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'final_selection'>('profile');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<GalleryImage | null>(null);

  // Compute final selection images for the active user
  const userFinalImages = useMemo(() => {
    const userGalIdSet = new Set<string>();
    (currentUser?.assignedGalleryIds || []).forEach(id => userGalIdSet.add(id));
    galleries.forEach(g => {
      if ((g.clientIds || []).some(cid => isSameId(cid, currentUser?.id))) {
        userGalIdSet.add(g.id);
      }
    });

    return images.filter(img => {
      const isFinal = !!img.isFinalSelection || (img.tags || []).some(t => {
        const lower = t.toLowerCase();
        return lower === 'selección final' || lower === 'seleccion final' || lower === 'seleccion_final';
      });
      if (!isFinal) return false;

      // Admins and photographers can see all final selection images; clients see their own galleries
      if (currentUser?.role === 'admin' || currentUser?.role === 'photographer') return true;
      if (userGalIdSet.size > 0) {
        return Array.from(userGalIdSet).some(gid => isSameId(gid, img.galleryId));
      }
      return true;
    });
  }, [images, galleries, currentUser]);

  const totalFinalBytes = useMemo(() => {
    return userFinalImages.reduce((acc, img) => acc + (img.fileSizeBytes || 0), 0);
  }, [userFinalImages]);

  const handleDownloadAllZip = async () => {
    if (userFinalImages.length === 0 || downloadingZip) return;
    setDownloadingZip(true);
    try {
      await downloadImagesAsZip(
        userFinalImages, 
        `${currentUser?.name || 'Cliente'}_Seleccion_Final_AltaRes`
      );
    } catch (e) {
      console.error('Error downloading final selection zip:', e);
    } finally {
      setDownloadingZip(false);
    }
  };

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
      setPreviewPhoto(null);
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
        className={`w-full ${activeTab === 'final_selection' ? 'max-w-4xl' : 'max-w-xl'} rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-6 relative border transition-all ${
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
                {modalTexts.title || 'Mi Perfil & Cuenta'}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
                {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'photographer' ? 'Fotógrafo' : 'Cliente'}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {modalTexts.subtitle || 'Actualiza tu fotografía de perfil, nombre visible, datos de contacto y revisa tus entregas.'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <button
            type="button"
            id="profile-tab-info-btn"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? `${colorTheme.twBg} text-white shadow-md ${colorTheme.twShadow}`
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Mis Datos & Cuenta</span>
          </button>

          <button
            type="button"
            id="profile-tab-final-selection-btn"
            onClick={() => setActiveTab('final_selection')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'final_selection'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Selección Final</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
              activeTab === 'final_selection'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {userFinalImages.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Profile Form */}
        {activeTab === 'profile' && (
          <>
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
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar Live Preview */}
              <div className="relative group shrink-0">
                <div className={`w-20 h-20 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-lg transition-all ${
                  isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                }`}>
                  <img 
                    src={avatar || DEFAULT_PROFILE_AVATAR} 
                    alt={name || 'Avatar'} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={() => setAvatar('')}
                  />
                </div>
              </div>

              {/* Avatar Options & Upload Controls */}
              <div className="flex-1 space-y-3 w-full text-left">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className={`text-xs font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Fotografía de Perfil
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {avatar && avatar !== DEFAULT_PROFILE_AVATAR ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 inline" /> Imagen personalizada activa
                        </span>
                      ) : (
                        <span className="text-slate-400">Imagen predeterminada activa</span>
                      )}
                    </span>
                  </div>

                  {avatar && avatar !== DEFAULT_PROFILE_AVATAR && (
                    <button
                      type="button"
                      onClick={() => setAvatar(DEFAULT_PROFILE_AVATAR)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Restablecer avatar predeterminado"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer predeterminado</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir Imagen Personalizada</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="O escribe la URL directa de la imagen (https://...)"
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:ring-1 ${colorTheme.twRing} focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            
            {/* Full Name */}
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {modalTexts.nameLabel || 'Nombre Completo *'}
              </label>
              <div className="relative">
                <input
                  id="profile-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={modalTexts.namePlaceholder || 'Ej: Sofia Valenzuela'}
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
                {modalTexts.emailLabel || 'Correo Electrónico *'}
              </label>
              <div className="relative">
                <input
                  id="profile-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={modalTexts.emailPlaceholder || 'usuario@estudio.com'}
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
                {modalTexts.phoneLabel || 'Teléfono / WhatsApp'}
              </label>
              <div className="relative">
                <input
                  id="profile-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={modalTexts.phonePlaceholder || '+34 600 000 000'}
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
                {modalTexts.companyLabel || 'Empresa / Razón Social'}
              </label>
              <div className="relative">
                <input
                  id="profile-company-input"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={modalTexts.companyPlaceholder || 'Pixart Photo / Particular'}
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
                {modalTexts.passwordLabel || 'Contraseña de Acceso'}
              </label>
              <div className="relative">
                <input
                  id="profile-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={modalTexts.passwordPlaceholder || 'Introduce una contraseña segura'}
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
                {modalTexts.notesLabel || 'Notas / Biografía del Usuario'}
              </label>
              <textarea
                id="profile-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={modalTexts.notesPlaceholder || 'Detalles sobre el cliente, estilo fotográfico o preferencias...'}
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
              <span>{modalTexts.saveButtonText || 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>
        </>
        )}

        {/* Tab 2: Final Selection Gallery */}
        {activeTab === 'final_selection' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header / Summary Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Tus Fotografías Definitivas
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {userFinalImages.length} {userFinalImages.length === 1 ? 'Foto' : 'Fotos'}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Fotografías editadas y aprobadas en máxima resolución. Descarga directa sin marcas de agua.
                </p>
                {userFinalImages.length > 0 && (
                  <p className="text-[11px] font-mono-code text-slate-400">
                    Peso total: <span className="text-emerald-400 font-semibold">{formatBytes(totalFinalBytes)}</span>
                  </p>
                )}
              </div>

              {/* Batch Download ZIP Button */}
              {userFinalImages.length > 0 && (
                <button
                  type="button"
                  id="profile-download-all-final-zip-btn"
                  onClick={handleDownloadAllZip}
                  disabled={downloadingZip}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingZip ? 'Empaquetando ZIP...' : `Descargar Todo (${userFinalImages.length} fotos ZIP)`}</span>
                </button>
              )}
            </div>

            {/* Empty State */}
            {userFinalImages.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Aún no hay fotografías en tu Selección Final
                </h4>
                <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tu fotógrafo subirá aquí las imágenes seleccionadas una vez completado el proceso de edición y retoque profesional. Podrás descargarlas en máxima resolución en cualquier momento.
                </p>
              </div>
            ) : (
              /* Grid of Final Selection Images */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {userFinalImages.map(img => {
                  const parentGallery = galleries.find(g => isSameId(g.id, img.galleryId));
                  return (
                    <div 
                      key={img.id}
                      className={`group relative rounded-2xl overflow-hidden border transition-all ${
                        isDark ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div 
                        onClick={() => setPreviewPhoto(img)}
                        className="relative aspect-[4/3] w-full bg-black cursor-pointer overflow-hidden"
                      >
                        <img 
                          src={img.url} 
                          alt={img.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver en detalle</span>
                          </span>
                        </div>

                        {/* Top Badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Final</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-emerald-300 text-[10px] font-mono-code">
                            {formatBytes(img.fileSizeBytes)}
                          </span>
                        </div>
                      </div>

                      {/* Photo Info & Actions */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {img.title}
                            </p>
                            {parentGallery && (
                              <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {parentGallery.title}
                              </p>
                            )}
                          </div>

                          {/* Direct High-Res Download Button */}
                          <button
                            type="button"
                            onClick={() => downloadSingleImage(img, 'high-res', { watermarkEnabled: false, excludeWatermark: true })}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer shrink-0"
                            title="Descargar en máxima resolución"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-code pt-1 border-t border-slate-800/60">
                          <span>{img.width} × {img.height} px</span>
                          {onOpenGallery && parentGallery && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenGallery(parentGallery.id);
                                onClose();
                              }}
                              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <span>Ver galería</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Close Action */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal-level Quick Preview if a photo in final selection is clicked */}
        {previewPhoto && (
          <div 
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewPhoto(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div 
              className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewPhoto.highResUrl || previewPhoto.url} 
                alt={previewPhoto.title}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
              <div className="flex items-center justify-between w-full px-4 text-white text-xs">
                <span className="font-semibold">{previewPhoto.title} • {previewPhoto.width}×{previewPhoto.height} px</span>
                <button
                  type="button"
                  onClick={() => downloadSingleImage(previewPhoto, 'high-res', { watermarkEnabled: false, excludeWatermark: true })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Alta Resolución</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
