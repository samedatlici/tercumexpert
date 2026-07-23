import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'

/**
 * Kültürel temalı 404 sayfası. Ziyaretçi siteyi hangi dilde kullanıyorsa, o dile ait
 * bayrak + kültürel motifler (SVG çizim) + o dile özgü esprili metinle karşılanır.
 * Arka planda ince TercümExpert logo filigranı. Arapça RTL.
 */

/* Bayraklar (SVG) */
const FLAG: Record<string, string> = {
  tr: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="20" fill="#E30A17"/><circle cx="12" cy="10" r="5" fill="#fff"/><circle cx="13.6" cy="10" r="4" fill="#E30A17"/><path d="M17 10l3.2-1-2 2.6.1-3.3 1.9 2.7z" fill="#fff"/></svg>`,
  en: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="3"/><path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="5"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3"/></svg>`,
  fr: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="10" height="20" fill="#0055A4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#EF4135"/></svg>`,
  de: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="6.67" fill="#111"/><rect y="6.67" width="30" height="6.67" fill="#DD0000"/><rect y="13.34" width="30" height="6.67" fill="#FFCE00"/></svg>`,
  nl: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="6.67" fill="#AE1C28"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><rect y="13.34" width="30" height="6.67" fill="#21468B"/></svg>`,
  es: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/></svg>`,
  ar: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="20" fill="#1a7a4c"/><circle cx="15" cy="10" r="5" fill="#fff"/><circle cx="16.6" cy="10" r="4" fill="#1a7a4c"/></svg>`,
  ru: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="6.67" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039A6"/><rect y="13.34" width="30" height="6.67" fill="#D52B1E"/></svg>`,
  az: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="6.7" fill="#0092BC"/><rect y="6.7" width="30" height="6.6" fill="#E4002B"/><rect y="13.3" width="30" height="6.7" fill="#00AE65"/><circle cx="14" cy="10" r="3.2" fill="#fff"/><circle cx="15.2" cy="10" r="2.6" fill="#E4002B"/><path d="M18 10l2-.6-1.2 1.6v-2l1.2 1.6z" fill="#fff"/></svg>`,
  pl: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#DC143C"/></svg>`,
  bg: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="6.67" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#00966E"/><rect y="13.34" width="30" height="6.67" fill="#D62612"/></svg>`,
  pt: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="12" height="20" fill="#006600"/><rect x="12" width="18" height="20" fill="#FF0000"/><circle cx="12" cy="10" r="3.4" fill="#FFCC00" stroke="#fff" stroke-width=".6"/></svg>`,
  da: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="30" height="20" fill="#C8102E"/><rect x="10" width="4" height="20" fill="#fff"/><rect y="8" width="30" height="4" fill="#fff"/></svg>`,
  it: `<svg viewBox="0 0 30 20" width="26" height="18"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE2B37"/></svg>`,
}

/* Kültürel motifler (viewBox 0 0 64 64) */
const M: Record<string, string> = {
  eiffel: `<path d="M32 6v4"/><path d="M30 10h4"/><path d="M31 12C29 25 22 42 14 56"/><path d="M33 12C35 25 42 42 50 56"/><path d="M30 12h4"/><path d="M24 34h16"/><path d="M25 33l1-8h12l1 8"/><path d="M19 46q13-7 26 0"/><path d="M12 56h40"/><path d="M27 56l3-10M37 56l-3-10"/>`,
  croissant: `<path d="M13 45C8 27 26 14 48 23c3 1 2 6-2 5C33 24 22 32 25 44c1 4-9 4-12 1z" fill="currentColor" stroke="none"/><path d="M18 41l6-7M24 44l6-8M30 44l7-8M36 42l7-8M42 38l5-6" stroke="#fff" stroke-width="2.2"/>`,
  teaglass: `<path d="M25 15h14l-2 7c3 4 3 12 0 17-2 4-8 4-10 0-3-5-3-13 0-17z"/><path d="M27 22h10"/><ellipse cx="32" cy="53" rx="15" ry="2.6"/>`,
  tulip: `<path d="M22 25c0-9 5-14 5-14 1 6 4 8 5 8s4-2 5-8c0 0 5 5 5 14 0 7-4 11-10 11s-10-4-10-11z"/><path d="M27 20q5 4 10 0"/><path d="M32 36v18"/><path d="M32 47c-6 0-11-4-13-9 8-1 12 2 13 7"/>`,
  bigben: `<path d="M25 56h14"/><path d="M27 56V29h10v27"/><path d="M26 29l6-8 6 8"/><path d="M32 21v-3"/><circle cx="32" cy="35" r="4.5"/><path d="M32 35v-3M32 35l2 1"/><path d="M28 45h8M28 50h8"/>`,
  bus: `<rect x="9" y="15" width="46" height="33" rx="5"/><path d="M9 31h46"/><rect x="14" y="20" width="7" height="7" rx="1"/><rect x="25" y="20" width="7" height="7" rx="1"/><rect x="36" y="20" width="7" height="7" rx="1"/><path d="M46 20h5v7"/><rect x="14" y="35" width="9" height="9" rx="1"/><path d="M45 35h6v9h-6z"/><circle cx="20" cy="50" r="4"/><circle cx="44" cy="50" r="4"/>`,
  brandenburg: `<path d="M11 56h42"/><path d="M15 56V28M22 56V28M29 56V28M36 56V28M43 56V28M50 56V28"/><path d="M10 28h44v-6H10z"/><path d="M24 22v-4h16v4"/><path d="M27 18c1-3 3-3 5-3s4 0 5 3"/>`,
  beerstein: `<path d="M17 21h21v32H17z"/><path d="M17 27h21"/><path d="M38 27h6a5 5 0 0 1 0 13h-6"/><path d="M16 21c2-3 22-3 23 0"/><path d="M21 17q1 2 2 0M27 16q1 2 2 0M32 17q1 2 2 0"/>`,
  windmill: `<path d="M25 56l2-24h10l2 24z"/><path d="M26 32h12"/><path d="M27 32l5-6 5 6"/><path d="M32 27L16 14M32 27l16-13M32 27L16 40M32 27l16 13"/><path d="M20 17l4 4M44 17l-4 4M20 37l4-4M44 37l-4-4"/><circle cx="32" cy="27" r="2.4"/><rect x="30" y="40" width="4" height="8"/>`,
  bicycle: `<circle cx="18" cy="44" r="11"/><circle cx="46" cy="44" r="11"/><circle cx="18" cy="44" r="1.6" fill="currentColor"/><circle cx="46" cy="44" r="1.6" fill="currentColor"/><path d="M18 44l8-16h13"/><path d="M26 28l9 16"/><path d="M23 28h5"/><path d="M46 44L37 27h5"/><path d="M35 44l2-17"/><path d="M32 44a3 3 0 1 0 .1 0" fill="currentColor"/>`,
  guitar: `<path d="M28 22c-4 0-6 3-6 6 0 2 1 4 1 6-3 2-6 6-6 11 0 6 5 10 11 10s11-4 11-10c0-5-3-9-6-11 0-2 1-4 1-6 0-3-2-6-6-6z"/><circle cx="28" cy="45" r="3.6"/><path d="M23 51h10"/><path d="M34 25l11-11"/><path d="M37 28l11-11"/><path d="M44 12l5-4 2 5-4 4z"/><path d="M37 21l2 2M40 18l2 2"/>`,
  sun: `<circle cx="32" cy="32" r="10"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6"/>`,
  lantern: `<circle cx="32" cy="9" r="2"/><path d="M32 11v3"/><path d="M26 14h12l-2-3H28z"/><path d="M26 14c-3 6-3 24 0 30h12c3-6 3-24 0-30"/><path d="M32 14v30M27 20c-2 8-2 16 0 24M37 20c2 8 2 16 0 24"/><path d="M29 44l-1 5h8l-1-5"/><path d="M30 49h4l-1 5h-2z"/>`,
  palm: `<path d="M30 58C29 44 30 35 32 28M34 58C35 45 34 36 33 28"/><path d="M31 51q2 1 3 0M31 44q2 1 3 0M31 37q1.5 1 3 0"/><path d="M32 28C22 20 10 22 5 31c9-5 16-3 22 3M32 28C42 20 54 22 59 31c-9-5-16-3-22 3M32 28C25 19 19 12 21 4c5 5 9 13 11 22M32 28C39 19 45 12 43 4c-5 5-9 13-11 22M32 29C27 24 18 24 12 29c7-2 13 0 18 5M32 29C37 24 46 24 52 29c-7-2-13 0-18 5"/><circle cx="30" cy="29" r="1.8" fill="currentColor"/><circle cx="34" cy="29" r="1.8" fill="currentColor"/><circle cx="32" cy="31" r="1.8" fill="currentColor"/>`,
  geostar: `<rect x="17" y="17" width="30" height="30"/><rect x="17" y="17" width="30" height="30" transform="rotate(45 32 32)"/><circle cx="32" cy="32" r="7"/>`,
  onion: `<path d="M32 8c9 9 9 17 0 23-9-6-9-14 0-23z"/><path d="M32 2v6M29 5h6"/><path d="M27 31h10v6H27z"/><path d="M23 37h18v18H23z"/><path d="M30 55v-8a2 2 0 0 1 4 0v8"/><path d="M27 43h3M34 43h3"/>`,
  matryoshka: `<path d="M32 8c-9 0-13 9-13 23 0 13 6 21 13 21s13-8 13-21c0-14-4-23-13-23z"/><path d="M21 27c3 5 19 5 22 0"/><circle cx="32" cy="24" r="6"/><circle cx="29.5" cy="23" r="1" fill="currentColor"/><circle cx="34.5" cy="23" r="1" fill="currentColor"/><path d="M30 27q2 2 4 0"/><path d="M32 40a7 7 0 0 1 0 13"/><path d="M32 43v7M28.5 46.5h7"/>`,
  flame: `<path d="M19 55C12 48 14 35 22 27c1 5 0 8-1 11 2-2 5-4 5-8 3 5 3 14-1 20-1 2 0 4 2 5"/><path d="M32 55C24 47 27 30 36 20c1 6-1 10-2 13 3-3 6-6 6-11 4 7 3 20-2 27-1 3 1 5 3 6"/><path d="M46 55C39 49 41 37 48 30c1 4 0 7-1 9 2-2 4-3 4-7 3 5 2 13-2 18-1 2 0 4 2 5"/><path d="M15 55h34"/>`,
  pomegranate: `<circle cx="31" cy="37" r="15"/><path d="M31 22v-6M31 22l-5-4M31 22l5-4"/><path d="M41 27c5-4 8-1 5 3-2 3-6 1-5-3z"/><circle cx="27" cy="35" r="1.4" fill="currentColor"/><circle cx="34" cy="34" r="1.4" fill="currentColor"/><circle cx="31" cy="41" r="1.4" fill="currentColor"/><circle cx="36" cy="42" r="1.4" fill="currentColor"/><circle cx="25" cy="43" r="1.4" fill="currentColor"/>`,
  castle: `<path d="M10 55V27h3v-4h4v4h4v-4h4v4h3v28z"/><path d="M11 27l5-6 5 6"/><path d="M43 55V27h3v-4h4v4h4v-4h4v4h3v28"/><path d="M44 27l5-6 5 6"/><path d="M24 55V37h3v-3h3v3h4v-3h3v3h3v18z"/><path d="M28 55v-9a4 4 0 0 1 8 0v9"/><path d="M16 21v-6h6l-2 2 2 2z"/>`,
  pierogi: `<path d="M12 37c4-14 36-14 40 0-5 9-35 9-40 0z"/><path d="M13 36q2.5 3 5 0t5 0 5 0 5 0 5 0 5 0 5 0"/><path d="M25 22c1-3 3-3 4 0M33 20c1-3 3-3 4 0"/>`,
  rose: `<path d="M32 14c6 0 11 5 11 10 0 6-5 11-11 11s-11-5-11-11c0-5 5-10 11-10z"/><path d="M32 19c4 0 7 3 7 6 0 4-3 6-7 6"/><path d="M32 24a3 3 0 1 0 .1 0"/><path d="M32 35v19"/><path d="M32 45c-5 0-10-3-11-8 7-1 10 2 11 7"/><path d="M32 50c5 0 10-3 11-8-7-1-10 2-11 7"/>`,
  mountains: `<path d="M5 53l17-28 8 13 11-19 18 34z"/><path d="M18 33l4 4 4-4M40 26l4 4 3-3"/><circle cx="49" cy="15" r="5"/>`,
  rooster: `<path d="M39 21q1.5-3 3-1 1.5-3 3-1 1.5-3 3-1"/><path d="M42 22c3 1 5 4 5 7 0 2-1 4-2 5 2 3 2 7 0 11"/><path d="M50 28l4 1-3 3"/><path d="M46 31q-2 3 0 5"/><path d="M45 46c-4 4-11 5-16 2"/><path d="M29 48c-6-3-9-9-9-16 0-5 3-9 6-11"/><path d="M28 42C22 37 13 34 8 36c6 0 10 3 13 8M27 38C20 32 12 30 8 31c6 1 11 5 14 10M28 34C22 29 16 27 13 27"/><circle cx="44" cy="27" r="1.3" fill="currentColor"/><path d="M31 50v6M39 49v6"/><path d="M28 56h6M36 55h6"/>`,
  tart: `<ellipse cx="32" cy="30" rx="15" ry="3.2"/><path d="M17 30c0 13 4 20 15 20s15-7 15-20"/><path d="M22 32v15M27 33v16M32 33v17M37 33v16M42 32v15"/><circle cx="29" cy="29" r="2.2"/>`,
  townhouse: `<path d="M11 55V31l6-8 6 8v24z"/><path d="M23 55V25l8-9 8 9v30z"/><path d="M39 55V34l7-8 7 8v21z"/><rect x="15" y="34" width="4" height="4"/><rect x="15" y="44" width="4" height="7"/><rect x="27" y="30" width="4" height="4"/><rect x="27" y="39" width="4" height="4"/><rect x="27" y="47" width="4" height="8"/><rect x="43" y="38" width="4" height="4"/><rect x="43" y="46" width="4" height="6"/>`,
  viking: `<path d="M7 44C14 51 50 51 57 44"/><path d="M7 44C4 39 6 34 11 34c-1 3 0 5 3 7"/><path d="M57 44C60 39 58 35 53 35c1 2 1 4-2 6"/><path d="M11 44h42"/><path d="M32 44V15"/><path d="M20 19h24v14H20z"/><path d="M26 19v14M32 19v14M38 19v14"/><circle cx="17" cy="41" r="2"/><circle cx="25" cy="41" r="2"/><circle cx="39" cy="41" r="2"/><circle cx="47" cy="41" r="2"/>`,
  colosseum: `<path d="M12 51V34a20 11 0 0 1 40 0v17"/><path d="M12 43h40M12 34h40"/><path d="M17 51v-5a2.5 2.5 0 0 1 5 0v5M25 51v-5a2.5 2.5 0 0 1 5 0v5M33 51v-5a2.5 2.5 0 0 1 5 0v5M41 51v-5a2.5 2.5 0 0 1 5 0v5"/><path d="M20 43v-4a2.2 2.2 0 0 1 4.4 0v4M28 43v-4a2.2 2.2 0 0 1 4.4 0v4M36 43v-4a2.2 2.2 0 0 1 4.4 0v4"/><path d="M12 51h40"/>`,
  pizza: `<path d="M32 10l21 40c-13 6-29 6-42 0z"/><path d="M13 47c12 6 26 6 38 0"/><circle cx="30" cy="33" r="2.4" fill="currentColor"/><circle cx="39" cy="32" r="2.4" fill="currentColor"/><circle cx="34" cy="43" r="2.4" fill="currentColor"/><circle cx="25" cy="44" r="2.4" fill="currentColor"/>`,
}

interface LocaleCfg {
  accent: string
  flag: string
  motifs: [string, string]
  mid: string | null
  h: string
  s: string
}

/* Dile özel: renk + bayrak + motifler + esprili başlık/alt metin. Türkçe'de orta motif YOK (düz 404). */
const CFG: Record<string, LocaleCfg> = {
  tr: { accent: '#E30A17', flag: 'tr', motifs: ['teaglass', 'tulip'], mid: null,
    h: 'Bu sayfa kayıplara karıştı', s: 'Aradığınız sayfa, çevrilirken yolunu kaybetmiş olabilir. Sizi ana sayfaya geri götürelim.' },
  en: { accent: '#0b3aa3', flag: 'en', motifs: ['bigben', 'bus'], mid: null,
    h: 'Lost in translation', s: 'The page you are looking for wandered off somewhere. Let’s get you back on track.' },
  fr: { accent: '#0055A4', flag: 'fr', motifs: ['eiffel', 'croissant'], mid: null,
    h: 'Cette page a filé à l’anglaise', s: 'La page que vous cherchez s’est éclipsée. Revenons ensemble à l’accueil.' },
  de: { accent: '#111827', flag: 'de', motifs: ['brandenburg', 'beerstein'], mid: null,
    h: 'Diese Seite ist verschwunden', s: 'Die gesuchte Seite hat sich irgendwo verlaufen. Kehren wir zur Startseite zurück.' },
  nl: { accent: '#AE1C28', flag: 'nl', motifs: ['windmill', 'bicycle'], mid: null,
    h: 'Deze pagina is zoek', s: 'De pagina die u zoekt is ergens verdwaald. Laten we teruggaan naar de startpagina.' },
  es: { accent: '#C60B1E', flag: 'es', motifs: ['guitar', 'sun'], mid: null,
    h: 'Esta página se ha perdido', s: 'La página que buscas se ha ido de paseo. Volvamos juntos al inicio.' },
  ar: { accent: '#1a7a4c', flag: 'ar', motifs: ['lantern', 'palm'], mid: 'geostar',
    h: 'هذه الصفحة ضاعت في الترجمة', s: 'يبدو أن الصفحة التي تبحث عنها قد تاهت في مكانٍ ما. لنعُد إلى الصفحة الرئيسية.' },
  ru: { accent: '#0039A6', flag: 'ru', motifs: ['onion', 'matryoshka'], mid: null,
    h: 'Эта страница потерялась', s: 'Похоже, нужная страница заблудилась при переводе. Давайте вернёмся на главную.' },
  az: { accent: '#00799e', flag: 'az', motifs: ['flame', 'pomegranate'], mid: null,
    h: 'Bu səhifə itdi', s: 'Axtardığınız səhifə haradasa yolunu azıb. Gəlin ana səhifəyə qayıdaq.' },
  pl: { accent: '#c8143a', flag: 'pl', motifs: ['castle', 'pierogi'], mid: null,
    h: 'Ta strona zaginęła', s: 'Szukana strona gdzieś się zawieruszyła. Wróćmy razem na stronę główną.' },
  bg: { accent: '#00966E', flag: 'bg', motifs: ['rose', 'mountains'], mid: null,
    h: 'Тази страница се изгуби', s: 'Търсената страница се е отклонила нанякъде. Да се върнем към началната страница.' },
  pt: { accent: '#046A38', flag: 'pt', motifs: ['rooster', 'tart'], mid: null,
    h: 'Esta página perdeu-se', s: 'A página que procura foi dar uma volta. Voltemos juntos ao início.' },
  da: { accent: '#C8102E', flag: 'da', motifs: ['townhouse', 'viking'], mid: null,
    h: 'Denne side er forsvundet', s: 'Siden, du leder efter, er blevet væk et sted. Lad os gå tilbage til forsiden.' },
  it: { accent: '#009246', flag: 'it', motifs: ['colosseum', 'pizza'], mid: null,
    h: 'Questa pagina si è persa', s: 'La pagina che cerchi è andata a fare un giro. Torniamo insieme alla home.' },
}

/* İnce logo filigranı (data-URI SVG). */
const WM_TILE =
  `<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'>` +
  `<text x='6' y='46' font-family='Arial,sans-serif' font-size='17' font-weight='700' fill='#0f172a' fill-opacity='.05' transform='rotate(-20 6 46)'>TercümExpert</text>` +
  `<text x='130' y='122' font-family='Arial,sans-serif' font-size='17' font-weight='700' fill='#0f172a' fill-opacity='.05' transform='rotate(-20 130 122)'>TercümExpert</text></svg>`
const WM = `url("data:image/svg+xml,${encodeURIComponent(WM_TILE)}")`

function Motif({ id, className }: { id: string; className: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: M[id] || '' }}
    />
  )
}

export default function NotFoundPage() {
  const { locale, dict } = useI18n()
  const n = dict.notFound
  const cfg = CFG[locale] ?? CFG.en
  const rtl = locale === 'ar'
  const numCls = 'font-black leading-none text-[88px] sm:text-[130px] lg:text-[150px] tracking-tight'
  const sideCls = 'hidden size-16 shrink-0 sm:block sm:size-24 lg:size-28'

  return (
    <>
      <Seo title={n.seo.title} description={n.seo.description} routeId="home" />
      <section className="section">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div
            lang={locale}
            dir={rtl ? 'rtl' : 'ltr'}
            style={{ color: cfg.accent, backgroundImage: WM }}
            className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_24px_60px_-30px_rgba(15,23,42,.35)]"
          >
            <div className="relative z-[1] flex flex-col items-center px-6 py-14 text-center sm:py-16">
              <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em]">
                <span
                  className="inline-block h-[18px] w-[26px] overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,.08)]"
                  dangerouslySetInnerHTML={{ __html: FLAG[cfg.flag] || '' }}
                />
                404 · {n.title}
              </span>

              <div className="my-3 flex items-center justify-center gap-2.5">
                <Motif id={cfg.motifs[0]} className={sideCls} />
                <span className={numCls}>4</span>
                {cfg.mid ? (
                  <Motif id={cfg.mid} className="size-[74px] sm:size-[112px] lg:size-[122px]" />
                ) : (
                  <span className={numCls}>0</span>
                )}
                <span className={numCls}>4</span>
                <Motif id={cfg.motifs[1]} className={sideCls} />
              </div>

              <h1 className="mt-2 max-w-[20ch] text-2xl font-extrabold leading-tight text-text-primary sm:text-3xl">
                {cfg.h}
              </h1>
              <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-text-secondary sm:text-base">
                {cfg.s}
              </p>

              <Link to={buildPath(locale, 'home')} className="mt-7">
                <Button intent="primary" size="lg">
                  {n.home}
                  <Icon name="ArrowRight" className={rtl ? 'size-4 rotate-180' : 'size-4'} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
