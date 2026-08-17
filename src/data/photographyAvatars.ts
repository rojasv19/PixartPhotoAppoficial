export interface PhotographyAvatarPreset {
  id: string;
  name: string;
  category: 'cameras' | 'cinema' | 'optics' | 'studio';
  categoryLabel: string;
  url: string;
}

// Crisp, high-contrast photography & video themed vector avatars
export const PHOTOGRAPHY_AVATAR_PRESETS: PhotographyAvatarPreset[] = [
  {
    id: 'cam-mirrorless',
    name: 'Cámara Mirrorless Pro',
    category: 'cameras',
    categoryLabel: 'Cámaras & Sensores',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-cam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#1d4ed8"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-cam)" stroke="#38bdf8" stroke-width="2.5"/>
        <rect x="26" y="38" width="68" height="48" rx="10" fill="#334155" stroke="#64748b" stroke-width="2"/>
        <path d="M42 38 L48 28 L72 28 L78 38 Z" fill="#475569" stroke="#64748b" stroke-width="1.5"/>
        <circle cx="60" cy="62" r="20" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
        <circle cx="60" cy="62" r="14" fill="url(#lens-grad)"/>
        <circle cx="56" cy="58" r="4.5" fill="#ffffff" opacity="0.85"/>
        <circle cx="82" cy="46" r="3" fill="#ef4444"/>
        <rect x="34" y="44" width="8" height="4" rx="1" fill="#94a3b8"/>
      </svg>
    `)}`,
  },
  {
    id: 'optics-aperture',
    name: 'Diafragma Aperture f/1.2',
    category: 'optics',
    categoryLabel: 'Óptica & Objetivos',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-ap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
          <linearGradient id="iris-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="50%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-ap)" stroke="#06b6d4" stroke-width="2.5"/>
        <circle cx="60" cy="60" r="44" fill="none" stroke="#334155" stroke-width="3" stroke-dasharray="4 2"/>
        <circle cx="60" cy="60" r="36" fill="#0f172a" stroke="url(#iris-grad)" stroke-width="3"/>
        <g stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round">
          <line x1="60" y1="24" x2="48" y2="52"/>
          <line x1="88" y1="42" x2="62" y2="48"/>
          <line x1="94" y1="72" x2="68" y2="76"/>
          <line x1="60" y1="96" x2="72" y2="68"/>
          <line x1="32" y1="78" x2="58" y2="72"/>
          <line x1="26" y1="48" x2="52" y2="44"/>
        </g>
        <circle cx="60" cy="60" r="10" fill="#06b6d4" opacity="0.3"/>
        <circle cx="60" cy="60" r="6" fill="#ffffff"/>
      </svg>
    `)}`,
  },
  {
    id: 'cinema-camera',
    name: 'Cámara Cinema 8K RAW',
    category: 'cinema',
    categoryLabel: 'Cine & Video',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-cine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#18181b"/>
            <stop offset="100%" stop-color="#09090b"/>
          </linearGradient>
          <linearGradient id="reel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-cine)" stroke="#f59e0b" stroke-width="2.5"/>
        <circle cx="44" cy="38" r="14" fill="#27272a" stroke="url(#reel-grad)" stroke-width="2"/>
        <circle cx="44" cy="38" r="4" fill="#f59e0b"/>
        <circle cx="72" cy="38" r="14" fill="#27272a" stroke="url(#reel-grad)" stroke-width="2"/>
        <circle cx="72" cy="38" r="4" fill="#f59e0b"/>
        <rect x="28" y="50" width="48" height="36" rx="6" fill="#27272a" stroke="#52525b" stroke-width="2"/>
        <path d="M76 60 L96 46 L96 90 L76 76 Z" fill="url(#reel-grad)" stroke="#b45309" stroke-width="1.5"/>
        <circle cx="42" cy="68" r="4" fill="#ef4444"/>
        <rect x="52" y="62" width="16" height="12" rx="2" fill="#09090b"/>
        <text x="54" y="71" fill="#10b981" font-family="monospace" font-size="7" font-weight="bold">REC</text>
      </svg>
    `)}`,
  },
  {
    id: 'cinema-clapper',
    name: 'Claqueta de Dirección Film',
    category: 'cinema',
    categoryLabel: 'Cine & Video',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-clap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-clap)" stroke="#818cf8" stroke-width="2.5"/>
        <g transform="translate(24, 28)">
          <path d="M0 16 L72 16 L72 60 L0 60 Z" fill="#1e293b" stroke="#e2e8f0" stroke-width="2.5" rx="4"/>
          <path d="M0 0 L72 0 L72 16 L0 16 Z" fill="#0f172a" stroke="#e2e8f0" stroke-width="2.5"/>
          <path d="M10 0 L20 16 M28 0 L38 16 M46 0 L56 16 M64 0 L72 12" stroke="#ffffff" stroke-width="3"/>
          <text x="8" y="32" fill="#38bdf8" font-family="sans-serif" font-size="7" font-weight="bold">PROD: LUMINA</text>
          <text x="8" y="44" fill="#94a3b8" font-family="sans-serif" font-size="6">SCENE: 01</text>
          <text x="44" y="44" fill="#94a3b8" font-family="sans-serif" font-size="6">TAKE: 04</text>
          <circle cx="62" cy="52" r="3" fill="#10b981"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'studio-softbox',
    name: 'Iluminación & Softbox de Estudio',
    category: 'studio',
    categoryLabel: 'Estudio & Iluminación',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-soft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1c1917"/>
            <stop offset="100%" stop-color="#0c0a09"/>
          </linearGradient>
          <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-soft)" stroke="#f59e0b" stroke-width="2.5"/>
        <path d="M34 26 L86 26 L96 68 L24 68 Z" fill="url(#glow-grad)" stroke="#d97706" stroke-width="2"/>
        <line x1="34" y1="26" x2="96" y2="68" stroke="#d97706" stroke-width="1.5" opacity="0.6"/>
        <line x1="86" y1="26" x2="24" y2="68" stroke="#d97706" stroke-width="1.5" opacity="0.6"/>
        <rect x="56" y="68" width="8" height="12" fill="#78716c"/>
        <path d="M60 80 L60 98 M60 88 L46 98 M60 88 L74 98" stroke="#a8a29e" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="60" cy="47" r="8" fill="#ffffff" filter="drop-shadow(0 0 4px #ffffff)"/>
      </svg>
    `)}`,
  },
  {
    id: 'optics-telephoto',
    name: 'Teleobjetivo Prime 70-200mm',
    category: 'optics',
    categoryLabel: 'Óptica & Objetivos',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-lens" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <linearGradient id="red-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-lens)" stroke="#ef4444" stroke-width="2.5"/>
        <g transform="translate(60, 60) rotate(-45) translate(-60, -60)">
          <rect x="42" y="24" width="36" height="72" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
          <rect x="42" y="34" width="36" height="4" fill="url(#red-ring)"/>
          <rect x="44" y="44" width="32" height="18" fill="#334155"/>
          <line x1="48" y1="44" x2="48" y2="62" stroke="#94a3b8" stroke-width="1"/>
          <line x1="56" y1="44" x2="56" y2="62" stroke="#94a3b8" stroke-width="1"/>
          <line x1="64" y1="44" x2="64" y2="62" stroke="#94a3b8" stroke-width="1"/>
          <line x1="72" y1="44" x2="72" y2="62" stroke="#94a3b8" stroke-width="1"/>
          <circle cx="60" cy="24" r="14" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <rect x="46" y="80" width="28" height="12" fill="#475569" rx="2"/>
          <circle cx="60" cy="74" r="3" fill="#f59e0b"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'film-roll',
    name: 'Película Analógica 35mm RAW',
    category: 'cameras',
    categoryLabel: 'Cámaras & Sensores',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-film" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1c1917"/>
            <stop offset="100%" stop-color="#292524"/>
          </linearGradient>
          <linearGradient id="film-label" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-film)" stroke="#f59e0b" stroke-width="2.5"/>
        <g transform="translate(30, 24)">
          <rect x="0" y="8" width="34" height="60" rx="6" fill="#0c0a09" stroke="#78716c" stroke-width="2"/>
          <rect x="0" y="22" width="34" height="28" fill="url(#film-label)"/>
          <text x="4" y="38" fill="#000000" font-family="sans-serif" font-size="8" font-weight="900">35mm</text>
          <text x="4" y="46" fill="#000000" font-family="sans-serif" font-size="6" font-weight="bold">ISO 400</text>
          <rect x="12" y="2" width="10" height="6" fill="#a8a29e" rx="1"/>
          <path d="M34 26 L62 26 L62 50 L34 50 Z" fill="#1c1917" stroke="#57534e" stroke-width="1.5"/>
          <circle cx="40" cy="30" r="2" fill="#ffffff"/>
          <circle cx="48" cy="30" r="2" fill="#ffffff"/>
          <circle cx="56" cy="30" r="2" fill="#ffffff"/>
          <circle cx="40" cy="46" r="2" fill="#ffffff"/>
          <circle cx="48" cy="46" r="2" fill="#ffffff"/>
          <circle cx="56" cy="46" r="2" fill="#ffffff"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'studio-drone',
    name: 'Dron Aéreo Cinemático 4K',
    category: 'cinema',
    categoryLabel: 'Cine & Video',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-drone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#042f2e"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="teal-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2dd4bf"/>
            <stop offset="100%" stop-color="#0d9488"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-drone)" stroke="#2dd4bf" stroke-width="2.5"/>
        <g transform="translate(60, 60)">
          <line x1="-32" y1="-32" x2="32" y2="32" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
          <line x1="-32" y1="32" x2="32" y2="-32" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
          <circle cx="-32" cy="-32" r="10" fill="#0f172a" stroke="url(#teal-glow)" stroke-width="2"/>
          <circle cx="32" cy="-32" r="10" fill="#0f172a" stroke="url(#teal-glow)" stroke-width="2"/>
          <circle cx="-32" cy="32" r="10" fill="#0f172a" stroke="url(#teal-glow)" stroke-width="2"/>
          <circle cx="32" cy="32" r="10" fill="#0f172a" stroke="url(#teal-glow)" stroke-width="2"/>
          <rect x="-18" y="-18" width="36" height="36" rx="8" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
          <circle cx="0" cy="0" r="8" fill="#020617" stroke="#2dd4bf" stroke-width="2"/>
          <circle cx="0" cy="0" r="4" fill="#38bdf8"/>
          <circle cx="-10" cy="-10" r="1.5" fill="#ef4444"/>
          <circle cx="10" cy="-10" r="1.5" fill="#10b981"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'studio-ringlight',
    name: 'Ring Light & Retrato Glamour',
    category: 'studio',
    categoryLabel: 'Estudio & Iluminación',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#311042"/>
            <stop offset="100%" stop-color="#140727"/>
          </linearGradient>
          <linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f472b6"/>
            <stop offset="50%" stop-color="#ec4899"/>
            <stop offset="100%" stop-color="#d946ef"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-ring)" stroke="#ec4899" stroke-width="2.5"/>
        <circle cx="60" cy="52" r="34" fill="none" stroke="url(#pink-grad)" stroke-width="8"/>
        <circle cx="60" cy="52" r="34" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
        <rect x="52" y="44" width="16" height="16" rx="4" fill="#18181b" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="60" cy="52" r="4" fill="#06b6d4"/>
        <line x1="60" y1="86" x2="60" y2="102" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
        <line x1="60" y1="96" x2="46" y2="104" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="60" y1="96" x2="74" y2="104" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `)}`,
  },
  {
    id: 'viewfinder-focus',
    name: 'Visor Autofocus & Matriz RAW',
    category: 'cameras',
    categoryLabel: 'Cámaras & Sensores',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-vf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#022c22"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-vf)" stroke="#10b981" stroke-width="2.5"/>
        <rect x="26" y="26" width="68" height="68" rx="4" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="8 4"/>
        <g stroke="#34d399" stroke-width="2.5" stroke-linecap="round">
          <line x1="26" y1="38" x2="26" y2="26"/>
          <line x1="26" y1="26" x2="38" y2="26"/>
          <line x1="94" y1="38" x2="94" y2="26"/>
          <line x1="94" y1="26" x2="82" y2="26"/>
          <line x1="26" y1="82" x2="26" y2="94"/>
          <line x1="26" y1="94" x2="38" y2="94"/>
          <line x1="94" y1="82" x2="94" y2="94"/>
          <line x1="94" y1="94" x2="82" y2="94"/>
        </g>
        <circle cx="60" cy="60" r="14" fill="none" stroke="#10b981" stroke-width="2"/>
        <circle cx="60" cy="60" r="3" fill="#ef4444"/>
        <text x="60" y="82" fill="#34d399" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">AF-ON [RAW]</text>
      </svg>
    `)}`,
  },
  {
    id: 'optics-prism',
    name: 'Prisma Óptico & Refracción de Luz',
    category: 'optics',
    categoryLabel: 'Óptica & Objetivos',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-prism" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#18181b"/>
            <stop offset="100%" stop-color="#09090b"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-prism)" stroke="#a855f7" stroke-width="2.5"/>
        <path d="M60 26 L92 84 L28 84 Z" fill="#27272a" stroke="#e4e4e7" stroke-width="2" opacity="0.9"/>
        <line x1="16" y1="62" x2="48" y2="58" stroke="#ffffff" stroke-width="2.5"/>
        <line x1="72" y1="56" x2="104" y2="40" stroke="#ef4444" stroke-width="2"/>
        <line x1="72" y1="58" x2="104" y2="48" stroke="#f59e0b" stroke-width="2"/>
        <line x1="72" y1="60" x2="104" y2="56" stroke="#10b981" stroke-width="2"/>
        <line x1="72" y1="62" x2="104" y2="64" stroke="#06b6d4" stroke-width="2"/>
        <line x1="72" y1="64" x2="104" y2="72" stroke="#8b5cf6" stroke-width="2"/>
      </svg>
    `)}`,
  },
  {
    id: 'studio-gimbal',
    name: 'Estabilizador Gimbal 3-Ejes',
    category: 'cinema',
    categoryLabel: 'Cine & Video',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="bg-gimbal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#312e81"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg-gimbal)" stroke="#6366f1" stroke-width="2.5"/>
        <rect x="56" y="64" width="8" height="38" rx="4" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="60" cy="74" r="3" fill="#6366f1"/>
        <path d="M40 50 C40 64, 80 64, 80 50" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
        <rect x="46" y="32" width="28" height="20" rx="4" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
        <circle cx="60" cy="42" r="5" fill="#38bdf8"/>
        <circle cx="40" cy="50" r="3" fill="#10b981"/>
        <circle cx="80" cy="50" r="3" fill="#10b981"/>
      </svg>
    `)}`,
  },
];
