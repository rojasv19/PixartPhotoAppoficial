import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, Heart, Upload, MessageSquare, ImageIcon, Check, CheckCheck, 
  Trash2, ExternalLink, Sparkles, Download, Layers, Shield, X, Clock
} from 'lucide-react';
import { AppNotification, User, StudioBrandingConfig } from '../types';
import { COLOR_PRESET_MAP } from '../services/brandingService';

interface NotificationsPopoverProps {
  notifications: AppNotification[];
  currentUser: User | null;
  onNavigate: (view: string, targetId?: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll?: () => void;
  isDark?: boolean;
  branding?: StudioBrandingConfig;
  isHomeView?: boolean;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  notifications,
  currentUser,
  onNavigate,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  isDark = true,
  branding,
  isHomeView = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'favorite' | 'upload'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
  const currentUserId = currentUser?.id || 'anonymous';
  const currentUserRole = currentUser?.role || 'client';

  // Filter notifications for current user's role or targeted user ID
  const userNotifications = notifications.filter(notif => {
    if (notif.targetUserId && notif.targetUserId !== currentUserId) {
      return false;
    }
    if (notif.targetRole && notif.targetRole !== 'all') {
      if (notif.targetRole === 'admin' && currentUserRole !== 'admin' && currentUserRole !== 'photographer') {
        return false;
      }
      if (notif.targetRole === 'client' && currentUserRole === 'admin') {
        // Admins can see everything or client targeted
      }
    }
    return true;
  });

  const unreadCount = userNotifications.filter(n => !(n.readBy || []).includes(currentUserId)).length;

  // Filter tab list
  const filteredNotifications = userNotifications.filter(notif => {
    const isRead = (notif.readBy || []).includes(currentUserId);
    if (filterType === 'unread') return !isRead;
    if (filterType === 'favorite') return notif.type === 'favorite';
    if (filterType === 'upload') return notif.type === 'upload';
    return true;
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'favorite':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />;
      case 'upload':
        return <Upload className="w-3.5 h-3.5 text-blue-400" />;
      case 'feedback':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      case 'gallery':
        return <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'download':
        return <Download className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    onMarkAsRead(notif.id);
    setIsOpen(false);

    if (notif.linkView) {
      onNavigate(notif.linkView, notif.galleryId);
    } else if (notif.galleryId) {
      onNavigate('gallery', notif.galleryId);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button Trigger */}
      <button
        id="navbar-notifications-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:p-2.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? `${colorTheme.twBorder} ${colorTheme.twBadgeBg} text-white ring-2 ${colorTheme.twRing}`
            : isHomeView
            ? 'bg-black/35 border-white/15 text-slate-200 hover:bg-white/15'
            : isDark
            ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 text-slate-200 hover:bg-slate-800'
            : 'bg-slate-100/90 border-slate-300 text-slate-700 hover:bg-slate-200'
        }`}
        title={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Centro de Notificaciones'}
      >
        <div className="relative flex items-center justify-center">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          id="navbar-notifications-dropdown"
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col ${
            isDark ? 'bg-[#15171A] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}
          style={{ maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between gap-2 ${
            isDark ? 'border-slate-800/80 bg-[#121316]' : 'border-slate-200 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${colorTheme.twBadgeBg} ${colorTheme.twText}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Notificaciones
                </h3>
                <p className="text-[11px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Al día'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                id="notifications-mark-all-read-btn"
                onClick={onMarkAllAsRead}
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className={`px-4 py-2 border-b flex items-center gap-1.5 text-xs overflow-x-auto ${
            isDark ? 'border-slate-800/60 bg-[#17191C]' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? `${colorTheme.twBg} text-white shadow-xs`
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({userNotifications.length})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                filterType === 'unread'
                  ? `${colorTheme.twBg} text-white shadow-xs`
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sin Leer ({unreadCount})
            </button>
            <button
              onClick={() => setFilterType('favorite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'favorite'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3 h-3 fill-current" />
              <span>Favoritas</span>
            </button>
            <button
              onClick={() => setFilterType('upload')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Cargas</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-800/40">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  No hay notificaciones en esta vista
                </p>
                <p className="text-[11px] text-slate-400">
                  Las selecciones de fotos de clientes y nuevas cargas aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const isRead = (notif.readBy || []).includes(currentUserId);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 hover:bg-slate-800/40 relative group ${
                      !isRead
                        ? isDark ? 'bg-slate-900/60' : 'bg-blue-50/40'
                        : ''
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-xs" />
                    )}

                    {/* Actor Avatar or Event Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      {notif.actorAvatar ? (
                        <img
                          src={notif.actorAvatar}
                          alt={notif.actorName || 'Usuario'}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-700 ${
                          isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}>
                          {getNotificationIcon(notif.type)}
                        </div>
                      )}
                      {notif.actorAvatar && (
                        <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-700">
                          {getNotificationIcon(notif.type)}
                        </div>
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold truncate ${
                          !isRead 
                            ? isDark ? 'text-white' : 'text-slate-900' 
                            : isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-mono-code">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {notif.message}
                      </p>

                      {notif.galleryTitle && (
                        <div className="pt-1 flex items-center gap-1.5 text-[10px] text-blue-400 font-medium truncate">
                          <span>📁 {notif.galleryTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Icon on Hover */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Links */}
          <div className={`p-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/80 bg-[#121316]' : 'border-slate-200 bg-slate-50'
          }`}>
            {currentUser?.role === 'admin' || currentUser?.role === 'photographer' ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin-favorites');
                }}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Ver Selección de Favoritas</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('home');
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ir al Portal</span>
              </button>
            )}

            {onClearAll && userNotifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
