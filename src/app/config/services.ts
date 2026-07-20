/**
 * Hizmet kataloğu (data — çeviri metinleri content/serviceItems'da).
 * icon: Lucide ikon anahtarı (registry components/common/Icon ile eşlenir).
 * order: gösterim sırası. homeFeatured: anasayfada ilk grupta gösterilenler.
 */
export const SERVICES = [
  { id: 'sworn', icon: 'Stamp', order: 1, homeFeatured: true },
  { id: 'notarized', icon: 'FileCheck2', order: 2, homeFeatured: true },
  { id: 'apostille', icon: 'Globe2', order: 3, homeFeatured: true },
  { id: 'legal', icon: 'Scale', order: 4, homeFeatured: true },
  { id: 'technical', icon: 'Cog', order: 5, homeFeatured: false },
  { id: 'medical', icon: 'HeartPulse', order: 6, homeFeatured: false },
  { id: 'academic', icon: 'GraduationCap', order: 7, homeFeatured: false },
  { id: 'localization', icon: 'Globe', order: 8, homeFeatured: false },
] as const

export type ServiceId = (typeof SERVICES)[number]['id']
export const SERVICE_IDS = SERVICES.map((s) => s.id)
