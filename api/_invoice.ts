// =====================================================================
// TercümExpert — Fatura (PDF) HTML şablonu. 14 dil. Arapça RTL.
// Bu belge ÖNİZLEME/PROFORMA niteliğindedir — yasal e-Fatura DEĞİLDİR.
// Satıcı bilgileri şimdilik DEMO'dur; şirket kurulunca güncellenecek.
// HTML üretilir; PDF'e çevirme api/order-invoice.ts (Node, chromium) içindedir.
// =====================================================================

/** DEMO satıcı bilgileri — şirket kurulunca gerçek bilgilerle değiştirilecek. */
export const DEMO_SELLER = {
  name: 'TercümExpert (DEMO)',
  legal: 'TercümExpert Çeviri Hizmetleri (Demo Ünvan)',
  address: 'Beşiktaş, İstanbul, Türkiye',
  taxOffice: 'Beşiktaş V.D. (Demo)',
  taxNo: '0000000000',
  email: 'info@tercumexpert.com',
  phone: '+90 555 123 45 67',
}

const LOCALES = ['tr', 'en', 'fr', 'de', 'nl', 'es', 'ar', 'ru', 'az', 'pl', 'bg', 'pt', 'da', 'it']
export function normInvLocale(l: unknown): string {
  const s = typeof l === 'string' ? l.toLowerCase() : ''
  return LOCALES.includes(s) ? s : 'tr'
}

interface InvStrings {
  invInvoice: string
  invSellerCopy: string
  invNo: string
  invDate: string
  invOrderNo: string
  invSeller: string
  invBillTo: string
  invDescription: string
  invQty: string
  invUnitPrice: string
  invAmount: string
  invSubtotal: string
  invVat: string
  invTotal: string
  invServiceLine: string
  invNote: string
  invThanks: string
}

const STR: Record<string, InvStrings> = {
  tr: { invInvoice: 'FATURA', invSellerCopy: 'FATURA — SATICI NÜSHASI', invNo: 'Fatura No', invDate: 'Tarih', invOrderNo: 'Sipariş No', invSeller: 'Satıcı', invBillTo: 'Alıcı', invDescription: 'Açıklama', invQty: 'Adet', invUnitPrice: 'Birim Fiyat', invAmount: 'Tutar', invSubtotal: 'Ara Toplam', invVat: 'KDV (%20)', invTotal: 'Genel Toplam', invServiceLine: 'Çeviri hizmeti', invNote: 'Bu belge önizleme/proforma niteliğindedir; yasal e-Fatura değildir.', invThanks: 'Siparişiniz için teşekkür ederiz.' },
  en: { invInvoice: 'INVOICE', invSellerCopy: 'INVOICE — SELLER COPY', invNo: 'Invoice No', invDate: 'Date', invOrderNo: 'Order No', invSeller: 'Seller', invBillTo: 'Bill To', invDescription: 'Description', invQty: 'Qty', invUnitPrice: 'Unit price', invAmount: 'Amount', invSubtotal: 'Subtotal', invVat: 'VAT (20%)', invTotal: 'Total', invServiceLine: 'Translation service', invNote: 'This is a preview/proforma document, not a legal e-invoice.', invThanks: 'Thank you for your order.' },
  fr: { invInvoice: 'FACTURE', invSellerCopy: 'FACTURE — COPIE VENDEUR', invNo: 'N° de facture', invDate: 'Date', invOrderNo: 'N° de commande', invSeller: 'Vendeur', invBillTo: 'Facturé à', invDescription: 'Description', invQty: 'Qté', invUnitPrice: 'Prix unitaire', invAmount: 'Montant', invSubtotal: 'Sous-total', invVat: 'TVA (20%)', invTotal: 'Total', invServiceLine: 'Service de traduction', invNote: 'Ce document est un aperçu/une facture proforma, et non une facture électronique légale.', invThanks: 'Merci pour votre commande.' },
  de: { invInvoice: 'RECHNUNG', invSellerCopy: 'RECHNUNG — VERKÄUFEREXEMPLAR', invNo: 'Rechnungsnr.', invDate: 'Datum', invOrderNo: 'Bestellnr.', invSeller: 'Verkäufer', invBillTo: 'Rechnungsempfänger', invDescription: 'Beschreibung', invQty: 'Menge', invUnitPrice: 'Einzelpreis', invAmount: 'Betrag', invSubtotal: 'Zwischensumme', invVat: 'MwSt. (20%)', invTotal: 'Gesamt', invServiceLine: 'Übersetzungsdienstleistung', invNote: 'Dies ist ein Vorschau-/Proformadokument und keine rechtsgültige E-Rechnung.', invThanks: 'Vielen Dank für Ihre Bestellung.' },
  nl: { invInvoice: 'FACTUUR', invSellerCopy: 'FACTUUR — VERKOPERSKOPIE', invNo: 'Factuurnr.', invDate: 'Datum', invOrderNo: 'Bestelnr.', invSeller: 'Verkoper', invBillTo: 'Factuuradres', invDescription: 'Omschrijving', invQty: 'Aantal', invUnitPrice: 'Stukprijs', invAmount: 'Bedrag', invSubtotal: 'Subtotaal', invVat: 'btw (20%)', invTotal: 'Totaal', invServiceLine: 'Vertaaldienst', invNote: 'Dit is een voorbeeld-/proformadocument en geen wettelijke e-factuur.', invThanks: 'Bedankt voor uw bestelling.' },
  es: { invInvoice: 'FACTURA', invSellerCopy: 'FACTURA — COPIA DEL VENDEDOR', invNo: 'N.º de factura', invDate: 'Fecha', invOrderNo: 'N.º de pedido', invSeller: 'Vendedor', invBillTo: 'Facturar a', invDescription: 'Descripción', invQty: 'Cant.', invUnitPrice: 'Precio unitario', invAmount: 'Importe', invSubtotal: 'Subtotal', invVat: 'IVA (20%)', invTotal: 'Total', invServiceLine: 'Servicio de traducción', invNote: 'Este es un documento de vista previa/proforma, no una factura electrónica con validez legal.', invThanks: 'Gracias por su pedido.' },
  ar: { invInvoice: 'فاتورة', invSellerCopy: 'فاتورة — نسخة البائع', invNo: 'رقم الفاتورة', invDate: 'التاريخ', invOrderNo: 'رقم الطلب', invSeller: 'البائع', invBillTo: 'الفوترة إلى', invDescription: 'الوصف', invQty: 'الكمية', invUnitPrice: 'سعر الوحدة', invAmount: 'المبلغ', invSubtotal: 'المجموع الفرعي', invVat: 'ضريبة القيمة المضافة (20%)', invTotal: 'الإجمالي', invServiceLine: 'خدمة ترجمة', invNote: 'هذه وثيقة معاينة/فاتورة مبدئية، وليست فاتورة إلكترونية قانونية.', invThanks: 'شكرًا لك على طلبك.' },
  ru: { invInvoice: 'СЧЁТ', invSellerCopy: 'СЧЁТ — ЭКЗЕМПЛЯР ПРОДАВЦА', invNo: 'Номер счёта', invDate: 'Дата', invOrderNo: 'Номер заказа', invSeller: 'Продавец', invBillTo: 'Плательщик', invDescription: 'Описание', invQty: 'Кол-во', invUnitPrice: 'Цена за единицу', invAmount: 'Сумма', invSubtotal: 'Промежуточный итог', invVat: 'НДС (20%)', invTotal: 'Итого', invServiceLine: 'Услуга перевода', invNote: 'Это предварительный/проформа-документ, а не юридический электронный счёт.', invThanks: 'Благодарим вас за заказ.' },
  az: { invInvoice: 'QAİMƏ-FAKTURA', invSellerCopy: 'QAİMƏ-FAKTURA — SATICI NÜSXƏSİ', invNo: 'Qaimə-faktura №', invDate: 'Tarix', invOrderNo: 'Sifariş №', invSeller: 'Satıcı', invBillTo: 'Alıcı', invDescription: 'Təsvir', invQty: 'Miqdar', invUnitPrice: 'Vahid qiyməti', invAmount: 'Məbləğ', invSubtotal: 'Aralıq cəmi', invVat: 'ƏDV (20%)', invTotal: 'Ümumi məbləğ', invServiceLine: 'Tərcümə xidməti', invNote: 'Bu, ilkin baxış/proforma sənəddir, hüquqi elektron qaimə-faktura deyil.', invThanks: 'Sifarişiniz üçün təşəkkür edirik.' },
  pl: { invInvoice: 'FAKTURA', invSellerCopy: 'FAKTURA — EGZEMPLARZ SPRZEDAWCY', invNo: 'Nr faktury', invDate: 'Data', invOrderNo: 'Nr zamówienia', invSeller: 'Sprzedawca', invBillTo: 'Nabywca', invDescription: 'Opis', invQty: 'Ilość', invUnitPrice: 'Cena jednostkowa', invAmount: 'Kwota', invSubtotal: 'Suma częściowa', invVat: 'VAT (20%)', invTotal: 'Razem', invServiceLine: 'Usługa tłumaczenia', invNote: 'To jest dokument podglądowy/proforma, a nie prawna e-faktura.', invThanks: 'Dziękujemy za złożenie zamówienia.' },
  bg: { invInvoice: 'ФАКТУРА', invSellerCopy: 'ФАКТУРА — КОПИЕ ЗА ПРОДАВАЧА', invNo: 'Фактура №', invDate: 'Дата', invOrderNo: 'Поръчка №', invSeller: 'Продавач', invBillTo: 'Получател', invDescription: 'Описание', invQty: 'Количество', invUnitPrice: 'Единична цена', invAmount: 'Сума', invSubtotal: 'Междинна сума', invVat: 'ДДС (20%)', invTotal: 'Обща сума', invServiceLine: 'Преводаческа услуга', invNote: 'Това е предварителен/проформа документ, а не законна електронна фактура.', invThanks: 'Благодарим Ви за поръчката.' },
  pt: { invInvoice: 'FATURA', invSellerCopy: 'FATURA — CÓPIA DO VENDEDOR', invNo: 'N.º da fatura', invDate: 'Data', invOrderNo: 'N.º do pedido', invSeller: 'Vendedor', invBillTo: 'Faturar a', invDescription: 'Descrição', invQty: 'Qtd.', invUnitPrice: 'Preço unitário', invAmount: 'Valor', invSubtotal: 'Subtotal', invVat: 'IVA (20%)', invTotal: 'Total', invServiceLine: 'Serviço de tradução', invNote: 'Este é um documento de pré-visualização/proforma, não uma fatura eletrónica com validade legal.', invThanks: 'Obrigado pelo seu pedido.' },
  da: { invInvoice: 'FAKTURA', invSellerCopy: 'FAKTURA — SÆLGERKOPI', invNo: 'Fakturanr.', invDate: 'Dato', invOrderNo: 'Ordrenr.', invSeller: 'Sælger', invBillTo: 'Faktureres til', invDescription: 'Beskrivelse', invQty: 'Antal', invUnitPrice: 'Enhedspris', invAmount: 'Beløb', invSubtotal: 'Subtotal', invVat: 'Moms (20%)', invTotal: 'Total', invServiceLine: 'Oversættelsesydelse', invNote: 'Dette er et forhåndsvisnings-/proformadokument, ikke en juridisk e-faktura.', invThanks: 'Tak for din ordre.' },
  it: { invInvoice: 'FATTURA', invSellerCopy: 'FATTURA — COPIA DEL VENDITORE', invNo: 'N. fattura', invDate: 'Data', invOrderNo: 'N. ordine', invSeller: 'Venditore', invBillTo: 'Intestare a', invDescription: 'Descrizione', invQty: 'Qtà', invUnitPrice: 'Prezzo unitario', invAmount: 'Importo', invSubtotal: 'Subtotale', invVat: 'IVA (20%)', invTotal: 'Totale', invServiceLine: 'Servizio di traduzione', invNote: 'Questo è un documento di anteprima/proforma, non una fattura elettronica con valore legale.', invThanks: 'Grazie per il tuo ordine.' },
}

function IS(locale: string): InvStrings {
  return STR[locale] ?? STR.en
}
function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function money(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n)
  } catch {
    return `${(n || 0).toFixed(2)} TRY`
  }
}

export interface InvoiceOrder {
  order_no: number | string
  created_at: string
  locale?: string | null
  source_lang?: string | null
  target_lang?: string | null
  total?: number | null
  tax?: number | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  delivery_address?: string | null
  delivery_city?: string | null
  delivery_postal_code?: string | null
  delivery_country?: string | null
}

/** Fatura numarası: TE-YIL-000NN (order_no'dan türetilir; benzersiz ve okunaklı). */
export function invoiceNumber(order: InvoiceOrder): string {
  let year = new Date().getFullYear()
  try {
    year = new Date(order.created_at).getFullYear()
  } catch {
    /* now */
  }
  return `TE-${year}-${String(order.order_no).padStart(6, '0')}`
}

/**
 * Fatura HTML'i üretir (alıcının dilinde). isSellerCopy=true → "SATICI NÜSHASI".
 * PDF'e chromium ile çevrilir (api/order-invoice.ts).
 */
export function buildInvoiceHtml(opts: {
  order: InvoiceOrder
  locale: string
  isSellerCopy: boolean
}): string {
  const locale = normInvLocale(opts.locale)
  const s = IS(locale)
  const rtl = locale === 'ar'
  const dir = rtl ? 'rtl' : 'ltr'
  const start = rtl ? 'right' : 'left'
  const end = rtl ? 'left' : 'right'
  const o = opts.order
  const invNo = invoiceNumber(o)
  const total = Number(o.total) || 0
  const tax = Number(o.tax) || 0
  const subtotal = Math.max(0, total - tax)
  const langs = `${(o.source_lang || '').toUpperCase()} → ${(o.target_lang || '').toUpperCase()}`
  const seller = DEMO_SELLER
  const custLines = [
    o.contact_name,
    o.contact_email,
    o.contact_phone,
    [o.delivery_address, o.delivery_postal_code, o.delivery_city, o.delivery_country].filter(Boolean).join(', ') || null,
  ]
    .filter(Boolean)
    .map((x) => esc(x))
    .join('<br>')
  const sellerLines = [seller.legal, seller.address, `${seller.taxOffice} · ${seller.taxNo}`, seller.email, seller.phone]
    .map((x) => esc(x))
    .join('<br>')
  const dateStr = (() => {
    try {
      return new Date(o.created_at).toLocaleDateString(locale)
    } catch {
      return ''
    }
  })()

  return `<!DOCTYPE html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Noto Sans','Noto Sans Arabic',sans-serif; color: #0f172a; font-size: 12px; }
.page { padding: 40px 44px; }
.top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
.brand { font-size: 22px; font-weight: 800; letter-spacing: -.3px; }
.doc { text-align: ${end}; }
.doc h1 { margin: 0 0 6px; font-size: 20px; letter-spacing: .5px; }
.meta { font-size: 11px; color: #475569; line-height: 1.7; }
.meta b { color: #0f172a; }
.parties { display: flex; gap: 24px; margin: 24px 0; }
.party { flex: 1; }
.plabel { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #64748b; margin-bottom: 6px; font-weight: 700; }
.pbody { font-size: 12px; line-height: 1.7; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th { background: #0f172a; color: #fff; font-size: 11px; font-weight: 600; padding: 10px 12px; text-align: ${start}; }
th.num, td.num { text-align: ${end}; }
td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
.totals { margin-top: 16px; margin-${start}: auto; width: 260px; }
.trow { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
.trow.grand { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 15px; font-weight: 800; }
.note { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #94a3b8; line-height: 1.6; }
.thanks { margin-top: 10px; font-size: 12px; color: #334155; }
</style></head>
<body dir="${dir}"><div class="page">
  <div class="top">
    <div>
      <div class="brand">TercümExpert</div>
    </div>
    <div class="doc">
      <h1>${esc(opts.isSellerCopy ? s.invSellerCopy : s.invInvoice)}</h1>
      <div class="meta">
        <div><b>${esc(s.invNo)}:</b> ${esc(invNo)}</div>
        <div><b>${esc(s.invDate)}:</b> ${esc(dateStr)}</div>
        <div><b>${esc(s.invOrderNo)}:</b> #${esc(o.order_no)}</div>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="plabel">${esc(s.invSeller)}</div>
      <div class="pbody"><strong>${esc(seller.name)}</strong><br>${sellerLines}</div>
    </div>
    <div class="party">
      <div class="plabel">${esc(s.invBillTo)}</div>
      <div class="pbody">${custLines || '—'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${esc(s.invDescription)}</th>
        <th class="num">${esc(s.invQty)}</th>
        <th class="num">${esc(s.invUnitPrice)}</th>
        <th class="num">${esc(s.invAmount)}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${esc(s.invServiceLine)} <span style="color:#64748b">(${esc(langs)})</span></td>
        <td class="num">1</td>
        <td class="num">${esc(money(subtotal, locale))}</td>
        <td class="num">${esc(money(subtotal, locale))}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="trow"><span>${esc(s.invSubtotal)}</span><span>${esc(money(subtotal, locale))}</span></div>
    <div class="trow"><span>${esc(s.invVat)}</span><span>${esc(money(tax, locale))}</span></div>
    <div class="trow grand"><span>${esc(s.invTotal)}</span><span>${esc(money(total, locale))}</span></div>
  </div>

  <div class="thanks">${esc(s.invThanks)}</div>
  <div class="note">${esc(s.invNote)}</div>
</div></body></html>`
}
