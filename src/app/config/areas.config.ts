/**
 * ÇEVİRİ ALANLARI (Hizmet Türü = tercüman uzmanlığı = havuz filtresi).
 * Her alanın kendi belge türleri (alt başlıklar) vardır — belge türü YALNIZCA
 * açıklama amaçlıdır: fiyatı etkilemez, havuzda filtre değildir.
 * Etiketler dict.quote.areas / dict.quote.docTypes'ten gelir (14 dil).
 *
 * NOT: Yeminli / Noter / Apostil burada DEĞİL — onlar "ek seçenek" (add-on).
 */
export type AreaId =
  | 'academic'
  | 'legal'
  | 'official'
  | 'medical'
  | 'technical'
  | 'commercial'
  | 'localization'
  | 'literary'
  | 'general'

export interface Area {
  id: AreaId
  docs: string[]
}

export const AREAS: Area[] = [
  { id: 'academic', docs: ['diploma', 'transcript', 'student-certificate', 'diploma-supplement', 'thesis', 'reference-letter', 'academic-article', 'other'] },
  { id: 'legal', docs: ['contract', 'court-decision', 'power-of-attorney', 'petition', 'consent-statement', 'warning-notice', 'litigation-doc', 'other'] },
  { id: 'official', docs: ['passport', 'id-card', 'civil-registry', 'birth-certificate', 'marriage-certificate', 'driver-license', 'criminal-record', 'military-status', 'apostille', 'other'] },
  { id: 'medical', docs: ['medical-report', 'epicrisis', 'prescription', 'lab-result', 'medical-article', 'patient-consent', 'other'] },
  { id: 'technical', docs: ['user-manual', 'technical-spec', 'patent', 'product-catalog', 'datasheet', 'installation-guide', 'safety-data-sheet', 'other'] },
  { id: 'commercial', docs: ['invoice', 'balance-sheet', 'commercial-contract', 'financial-report', 'tax-document', 'activity-certificate', 'bank-statement', 'other'] },
  { id: 'localization', docs: ['website', 'mobile-app', 'software-ui', 'game', 'marketing-content', 'subtitle', 'e-commerce', 'other'] },
  { id: 'literary', docs: ['book', 'short-story', 'poem', 'screenplay', 'essay', 'article', 'other'] },
  { id: 'general', docs: ['general-document', 'correspondence', 'cv', 'presentation', 'other'] },
]

export const AREA_IDS = AREAS.map((a) => a.id)

export function docsForArea(area: string): string[] {
  return AREAS.find((a) => a.id === area)?.docs ?? ['other']
}

export function isArea(v: unknown): v is AreaId {
  return typeof v === 'string' && AREA_IDS.includes(v as AreaId)
}
