// =====================================================================
// TercümExpert — E-posta modülü (Edge için KENDİ KENDİNE YETEN kopya).
// Müşteriye sipariş durumu maillerini Resend ile gönderir. 14 dil.
// Deep import YOK (Edge kısıtı). Değerler src ile mantıken eşleşir.
//
// GEREKLİ ORTAM DEĞİŞKENLERİ (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY     : Resend API anahtarı (zorunlu — yoksa mail atılmaz, sessiz geçilir).
//   EMAIL_FROM         : Gönderen (ör. 'TercümExpert <siparis@tercumexpert.com>').
//                        Alan adı Resend'de DOĞRULANMIŞ olmalı. Yoksa varsayılan kullanılır.
//   PUBLIC_SITE_URL    : Sitenin genel adresi (ör. 'https://tercumexpert.com'). Buton linkleri için.
//   GOOGLE_REVIEW_URL  : Google değerlendirme sayfası linki. BOŞSA 10-gün değerlendirme maili GÖNDERİLMEZ.
// =====================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercümExpert <siparis@tercumexpert.com>'
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://tercumexpert-6fxj.vercel.app').replace(/\/+$/, '')
const GOOGLE_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || ''

const BRAND = 'TercümExpert'
const BRAND_BLUE = '#1d4ed8'
const BRAND_GREEN = '#16a34a'
const INK = '#0f172a'

export type EmailEvent = 'received' | 'in_progress' | 'translated' | 'shipped' | 'delivered' | 'review' | 'admin_new_order' | 'payment' | 'password_reset'

// Ödeme maili metinleri (tr+en; diğer diller tr'ye düşer — çoğu tercüman TR).
const PAYMENT: Record<string, { subject: string; heading: string; body: string }> = {
  tr: {
    subject: 'Ödemeniz gerçekleştirildi',
    heading: 'Ödemeniz yapıldı',
    body: 'Cüzdanınızdaki çekilebilir bakiye banka hesabınıza gönderildi. Ödeme dekontu bu e-postaya PDF olarak eklenmiştir. Tutar cüzdanınızda “Ödenen” bölümünde görünür.',
  },
  en: {
    subject: 'Your payment has been made',
    heading: 'Your payment has been made',
    body: 'Your withdrawable wallet balance has been sent to your bank account. The payment receipt is attached to this email as a PDF. The amount now appears under “Paid out” in your wallet.',
  },
}
function paymentStrings(locale: string): { subject: string; heading: string; body: string } {
  return PAYMENT[normalizeLocale(locale)] ?? PAYMENT.tr
}

// Şifre sıfırlama maili metinleri (14 dil).
const PWRESET: Record<string, { subject: string; heading: string; body: string; button: string }> = {
  tr: { subject: "Şifrenizi sıfırlayın", heading: "Şifre sıfırlama talebi", body: "TercümExpert hesabınızın şifresini sıfırlamak için bir talep aldık. Yeni bir şifre belirlemek için aşağıdaki butona tıklayın. Bu bağlantı tek kullanımlıktır ve kısa süre içinde geçerliliğini yitirecektir. Bu talebi siz oluşturmadıysanız bu e-postayı güvenle yok sayabilirsiniz; şifreniz değişmeden kalacaktır.", button: "Şifremi sıfırla" },
  en: { subject: "Reset your password", heading: "Password reset request", body: "We received a request to reset the password for your TercümExpert account. Click the button below to set a new password. This link can be used once and will expire soon. If you did not request this, you can safely ignore this email — your password will remain unchanged.", button: "Reset my password" },
  fr: { subject: "Réinitialisez votre mot de passe", heading: "Demande de réinitialisation du mot de passe", body: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte TercümExpert. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est utilisable une seule fois et expirera prochainement. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité — votre mot de passe restera inchangé.", button: "Réinitialiser mon mot de passe" },
  de: { subject: "Setzen Sie Ihr Passwort zurück", heading: "Anfrage zum Zurücksetzen des Passworts", body: "Wir haben eine Anfrage zum Zurücksetzen des Passworts für Ihr TercümExpert-Konto erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen. Dieser Link kann einmal verwendet werden und läuft in Kürze ab. Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail bedenkenlos ignorieren — Ihr Passwort bleibt unverändert.", button: "Mein Passwort zurücksetzen" },
  nl: { subject: "Stel uw wachtwoord opnieuw in", heading: "Verzoek om wachtwoord opnieuw in te stellen", body: "Wij hebben een verzoek ontvangen om het wachtwoord van uw TercümExpert-account opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen. Deze link kan eenmaal worden gebruikt en verloopt binnenkort. Als u dit verzoek niet heeft ingediend, kunt u deze e-mail veilig negeren — uw wachtwoord blijft ongewijzigd.", button: "Mijn wachtwoord opnieuw instellen" },
  es: { subject: "Restablezca su contraseña", heading: "Solicitud de restablecimiento de contraseña", body: "Hemos recibido una solicitud para restablecer la contraseña de su cuenta de TercümExpert. Haga clic en el botón que aparece a continuación para establecer una nueva contraseña. Este enlace puede utilizarse una sola vez y caducará en breve. Si no ha realizado esta solicitud, puede ignorar este mensaje con total tranquilidad; su contraseña permanecerá sin cambios.", button: "Restablecer mi contraseña" },
  ar: { subject: "إعادة تعيين كلمة المرور الخاصة بك", heading: "طلب إعادة تعيين كلمة المرور", body: "تلقّينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك لدى TercümExpert. يرجى النقر على الزر أدناه لتعيين كلمة مرور جديدة. يمكن استخدام هذا الرابط مرة واحدة وستنتهي صلاحيته قريبًا. إذا لم تكن أنت من قدّم هذا الطلب، فيمكنك تجاهل هذا البريد الإلكتروني بأمان، وستبقى كلمة المرور الخاصة بك دون تغيير.", button: "إعادة تعيين كلمة المرور" },
  ru: { subject: "Сброс пароля", heading: "Запрос на сброс пароля", body: "Мы получили запрос на сброс пароля для Вашей учётной записи TercümExpert. Нажмите кнопку ниже, чтобы задать новый пароль. Эта ссылка действительна для однократного использования, и срок её действия скоро истечёт. Если Вы не отправляли данный запрос, Вы можете спокойно проигнорировать это письмо — Ваш пароль останется без изменений.", button: "Сбросить пароль" },
  az: { subject: "Şifrənizi sıfırlayın", heading: "Şifrənin sıfırlanması sorğusu", body: "TercümExpert hesabınızın şifrəsinin sıfırlanması üçün sorğu aldıq. Yeni şifrə təyin etmək üçün aşağıdakı düyməyə klikləyin. Bu keçid yalnız bir dəfə istifadə oluna bilər və tezliklə vaxtı bitəcək. Əgər bu sorğunu siz göndərməmisinizsə, bu e-poçtu təhlükəsiz şəkildə nəzərə almaya bilərsiniz — şifrəniz dəyişməz qalacaq.", button: "Şifrəmi sıfırla" },
  pl: { subject: "Zresetuj swoje hasło", heading: "Prośba o zresetowanie hasła", body: "Otrzymaliśmy prośbę o zresetowanie hasła do Pana/Pani konta TercümExpert. Prosimy kliknąć poniższy przycisk, aby ustawić nowe hasło. Link ten może zostać wykorzystany jednorazowo i wkrótce wygaśnie. Jeśli to nie Pan/Pani wysłał(a) tę prośbę, może Pan/Pani bezpiecznie zignorować tę wiadomość — hasło pozostanie niezmienione.", button: "Zresetuj moje hasło" },
  bg: { subject: "Възстановяване на паролата ви", heading: "Заявка за възстановяване на парола", body: "Получихме заявка за възстановяване на паролата за вашия акаунт в TercümExpert. Кликнете върху бутона по-долу, за да зададете нова парола. Тази връзка може да бъде използвана еднократно и скоро ще изтече. Ако не сте отправяли тази заявка, можете спокойно да пренебрегнете този имейл — вашата парола ще остане непроменена.", button: "Възстановяване на паролата ми" },
  pt: { subject: "Reponha a sua palavra-passe", heading: "Pedido de reposição de palavra-passe", body: "Recebemos um pedido de reposição da palavra-passe da sua conta TercümExpert. Clique no botão abaixo para definir uma nova palavra-passe. Esta ligação pode ser utilizada uma única vez e expirará em breve. Se não efetuou este pedido, pode ignorar este email com segurança — a sua palavra-passe permanecerá inalterada.", button: "Repor a minha palavra-passe" },
  da: { subject: "Nulstil din adgangskode", heading: "Anmodning om nulstilling af adgangskode", body: "Vi har modtaget en anmodning om at nulstille adgangskoden til din TercümExpert-konto. Klik på knappen nedenfor for at oprette en ny adgangskode. Dette link kan bruges én gang og udløber snart. Hvis du ikke har anmodet om dette, kan du roligt se bort fra denne e-mail — din adgangskode forbliver uændret.", button: "Nulstil min adgangskode" },
  it: { subject: "Reimposti la Sua password", heading: "Richiesta di reimpostazione della password", body: "Abbiamo ricevuto una richiesta di reimpostazione della password per il Suo account TercümExpert. Faccia clic sul pulsante qui sotto per impostare una nuova password. Questo link può essere utilizzato una sola volta e scadrà a breve. Se non ha effettuato Lei questa richiesta, può ignorare questa email in tutta tranquillità: la Sua password rimarrà invariata.", button: "Reimposta la mia password" },
}
function pwResetStrings(locale: string): { subject: string; heading: string; body: string; button: string } {
  return PWRESET[normalizeLocale(locale)] ?? PWRESET.tr
}

// Sipariş route slug'ı (src/app/router/routes.ts ile aynı; eksik dillerde EN'e düşer).
const ORDER_SLUG: Record<string, string> = {
  tr: 'siparis', en: 'order', fr: 'commande', de: 'bestellung', es: 'pedido',
  it: 'ordine', ru: 'zakaz', ar: 'talab',
}
const LOCALES = ['tr', 'en', 'fr', 'de', 'nl', 'es', 'ar', 'ru', 'az', 'pl', 'bg', 'pt', 'da', 'it']
function normalizeLocale(l: unknown): string {
  const s = typeof l === 'string' ? l.toLowerCase() : ''
  return LOCALES.includes(s) ? s : 'tr'
}
function orderSlug(locale: string): string {
  return ORDER_SLUG[locale] ?? ORDER_SLUG.en
}

interface EmailStrings {
  greeting: string
  greetingNoName: string
  orderLabel: string
  viewOrder: string
  trackButton: string
  trackCodeLabel: string
  reviewButton: string
  downloadTranslation: string
  regards: string
  brandSignature: string
  footer: string
  subjectReceived: string
  headingReceived: string
  bodyReceived: string
  subjectInProgress: string
  headingInProgress: string
  bodyInProgress: string
  subjectTranslated: string
  headingTranslated: string
  bodyTranslated: string
  subjectShipped: string
  headingShipped: string
  bodyShipped: string
  subjectDelivered: string
  headingDelivered: string
  bodyDelivered: string
  subjectReview: string
  headingReview: string
  bodyReview: string
}

const STRINGS: Record<string, EmailStrings> = {
  tr: {
    greeting: 'Merhaba {name},',
    greetingNoName: 'Merhaba,',
    orderLabel: 'Sipariş No',
    viewOrder: 'Siparişi Görüntüle',
    trackButton: 'Kargonu Takip Et',
    trackCodeLabel: 'Kargo takip numarası',
    reviewButton: 'Bizi Değerlendirin',
    downloadTranslation: "Çevirinizi indirin",
    regards: 'Saygılarımızla,',
    brandSignature: 'TercümExpert Ekibi',
    footer: 'Bu e-posta siparişinizle ilgili olarak TercümExpert tarafından gönderilmiştir. Lütfen bu adrese yanıt vermeyin.',
    subjectReceived: 'Siparişiniz alındı — #{no}',
    headingReceived: 'Siparişiniz alındı',
    bodyReceived: 'Talebiniz ve belgeleriniz bize ulaştı. Uzman ekibimiz en kısa sürede inceleyip işleme alacak. Siparişinizin durumunu aşağıdaki butondan istediğiniz zaman takip edebilirsiniz.',
    subjectInProgress: 'Siparişiniz işleme alındı — #{no}',
    headingInProgress: 'Çeviriniz başladı',
    bodyInProgress: 'Uzman tercümanımız siparişinizi üstlendi ve çevirinize başladı. Tamamlandığında sizi tekrar bilgilendireceğiz.',
    subjectTranslated: 'Çeviriniz tamamlandı — #{no}',
    headingTranslated: 'Çeviriniz tamamlandı',
    bodyTranslated: 'Çeviriniz tamamlandı ve kalite kontrolümüzden geçti. Şimdi teslim aşamasına geçiyoruz.',
    subjectShipped: 'Siparişiniz kargoya verildi — #{no}',
    headingShipped: 'Siparişiniz kargoya verildi',
    bodyShipped: 'Belgeniz kargoya teslim edildi. Gönderinizi aşağıdaki kargo takip numarası veya bağlantısı ile izleyebilirsiniz.',
    subjectDelivered: 'Çeviriniz teslim edildi — #{no}',
    headingDelivered: 'Çeviriniz teslim edildi',
    bodyDelivered: 'Çeviriniz e-posta ile tarafınıza iletildi. Lütfen gelen kutunuzu (ve olası bir durumda spam klasörünüzü) kontrol edin.',
    subjectReview: 'Hizmetimizden memnun kaldınız mı?',
    headingReview: 'Deneyiminizi paylaşır mısınız?',
    bodyReview: 'TercümExpert’i tercih ettiğiniz için teşekkür ederiz. Kısa bir değerlendirme bırakarak hem bize gelişmemizde yardımcı olur hem de diğer müşterilere yol gösterirsiniz. Yalnızca bir dakikanızı alır.',
  },
  en: {
    greeting: 'Hello {name},',
    greetingNoName: 'Hello,',
    orderLabel: 'Order No',
    viewOrder: 'View Order',
    trackButton: 'Track Shipment',
    trackCodeLabel: 'Tracking number',
    reviewButton: 'Leave a Review',
    downloadTranslation: "Download your translation",
    regards: 'Best regards,',
    brandSignature: 'The TercümExpert Team',
    footer: 'This email was sent by TercümExpert regarding your order. Please do not reply to this address.',
    subjectReceived: 'Your order has been received — #{no}',
    headingReceived: 'Your order has been received',
    bodyReceived: 'Your request and documents have reached us. Our expert team will review them and begin processing shortly. You can track the status of your order at any time using the button below.',
    subjectInProgress: 'Your order is now being processed — #{no}',
    headingInProgress: 'Your translation has started',
    bodyInProgress: 'One of our expert translators has taken on your order and started working on your translation. We will notify you again once it is complete.',
    subjectTranslated: 'Your translation is complete — #{no}',
    headingTranslated: 'Your translation is complete',
    bodyTranslated: 'Your translation has been completed and has passed our quality check. We are now moving to the delivery stage.',
    subjectShipped: 'Your order has been shipped — #{no}',
    headingShipped: 'Your order has been shipped',
    bodyShipped: 'Your document has been handed over to the courier. You can follow your shipment using the tracking number or link below.',
    subjectDelivered: 'Your translation has been delivered — #{no}',
    headingDelivered: 'Your translation has been delivered',
    bodyDelivered: 'Your translation has been sent to you by email. Please check your inbox (and your spam folder just in case).',
    subjectReview: 'How was your experience with us?',
    headingReview: 'Would you share your experience?',
    bodyReview: 'Thank you for choosing TercümExpert. By leaving a short review, you help us improve and guide other customers. It only takes a minute.',
  },
  fr: {
    greeting: 'Bonjour {name},',
    greetingNoName: 'Bonjour,',
    orderLabel: 'Commande n°',
    viewOrder: 'Voir la commande',
    trackButton: 'Suivre l’envoi',
    trackCodeLabel: 'Numéro de suivi',
    reviewButton: 'Laisser un avis',
    downloadTranslation: "Télécharger votre traduction",
    regards: 'Cordialement,',
    brandSignature: 'L’équipe TercümExpert',
    footer: 'Cet e-mail a été envoyé par TercümExpert concernant votre commande. Merci de ne pas répondre à cette adresse.',
    subjectReceived: 'Votre commande a bien été reçue — #{no}',
    headingReceived: 'Votre commande a bien été reçue',
    bodyReceived: 'Votre demande et vos documents nous sont bien parvenus. Notre équipe d’experts va les examiner et commencera le traitement sous peu. Vous pouvez suivre l’état de votre commande à tout moment à l’aide du bouton ci-dessous.',
    subjectInProgress: 'Votre commande est en cours de traitement — #{no}',
    headingInProgress: 'Votre traduction a commencé',
    bodyInProgress: 'L’un de nos traducteurs experts a pris en charge votre commande et a commencé à travailler sur votre traduction. Nous vous informerons de nouveau dès qu’elle sera terminée.',
    subjectTranslated: 'Votre traduction est terminée — #{no}',
    headingTranslated: 'Votre traduction est terminée',
    bodyTranslated: 'Votre traduction a été réalisée et a passé notre contrôle qualité. Nous passons désormais à l’étape de la livraison.',
    subjectShipped: 'Votre commande a été expédiée — #{no}',
    headingShipped: 'Votre commande a été expédiée',
    bodyShipped: 'Votre document a été remis au transporteur. Vous pouvez suivre votre envoi à l’aide du numéro de suivi ou du lien ci-dessous.',
    subjectDelivered: 'Votre traduction a été livrée — #{no}',
    headingDelivered: 'Votre traduction a été livrée',
    bodyDelivered: 'Votre traduction vous a été envoyée par e-mail. Veuillez vérifier votre boîte de réception (et votre dossier de courrier indésirable, par précaution).',
    subjectReview: 'Comment s’est passée votre expérience avec nous ?',
    headingReview: 'Souhaitez-vous partager votre expérience ?',
    bodyReview: 'Merci d’avoir choisi TercümExpert. En laissant un court avis, vous nous aidez à nous améliorer et à guider d’autres clients. Cela ne prend qu’une minute.',
  },
  de: {
    greeting: 'Hallo {name},',
    greetingNoName: 'Hallo,',
    orderLabel: 'Bestellnr.',
    viewOrder: 'Bestellung ansehen',
    trackButton: 'Sendung verfolgen',
    trackCodeLabel: 'Sendungsnummer',
    reviewButton: 'Bewertung abgeben',
    downloadTranslation: "Ihre Übersetzung herunterladen",
    regards: 'Mit freundlichen Grüßen,',
    brandSignature: 'Ihr TercümExpert-Team',
    footer: 'Diese E-Mail wurde von TercümExpert zu Ihrer Bestellung versendet. Bitte antworten Sie nicht auf diese Adresse.',
    subjectReceived: 'Ihre Bestellung ist bei uns eingegangen — #{no}',
    headingReceived: 'Ihre Bestellung ist bei uns eingegangen',
    bodyReceived: 'Ihre Anfrage und Ihre Dokumente sind bei uns eingegangen. Unser Expertenteam wird sie prüfen und in Kürze mit der Bearbeitung beginnen. Sie können den Status Ihrer Bestellung jederzeit über die Schaltfläche unten verfolgen.',
    subjectInProgress: 'Ihre Bestellung wird jetzt bearbeitet — #{no}',
    headingInProgress: 'Ihre Übersetzung hat begonnen',
    bodyInProgress: 'Einer unserer erfahrenen Übersetzer hat Ihre Bestellung übernommen und mit der Arbeit an Ihrer Übersetzung begonnen. Wir benachrichtigen Sie erneut, sobald sie fertiggestellt ist.',
    subjectTranslated: 'Ihre Übersetzung ist fertiggestellt — #{no}',
    headingTranslated: 'Ihre Übersetzung ist fertiggestellt',
    bodyTranslated: 'Ihre Übersetzung wurde fertiggestellt und hat unsere Qualitätsprüfung bestanden. Wir gehen nun zum Versand über.',
    subjectShipped: 'Ihre Bestellung wurde versendet — #{no}',
    headingShipped: 'Ihre Bestellung wurde versendet',
    bodyShipped: 'Ihr Dokument wurde an den Zusteller übergeben. Sie können Ihre Sendung anhand der Sendungsnummer oder des Links unten verfolgen.',
    subjectDelivered: 'Ihre Übersetzung wurde zugestellt — #{no}',
    headingDelivered: 'Ihre Übersetzung wurde zugestellt',
    bodyDelivered: 'Ihre Übersetzung wurde Ihnen per E-Mail zugesandt. Bitte prüfen Sie Ihren Posteingang (und sicherheitshalber auch Ihren Spam-Ordner).',
    subjectReview: 'Wie war Ihre Erfahrung mit uns?',
    headingReview: 'Möchten Sie Ihre Erfahrung teilen?',
    bodyReview: 'Vielen Dank, dass Sie sich für TercümExpert entschieden haben. Mit einer kurzen Bewertung helfen Sie uns, besser zu werden, und geben anderen Kunden eine Orientierung. Es dauert nur eine Minute.',
  },
  nl: {
    greeting: 'Hallo {name},',
    greetingNoName: 'Hallo,',
    orderLabel: 'Bestelnr.',
    viewOrder: 'Bestelling bekijken',
    trackButton: 'Zending volgen',
    trackCodeLabel: 'Trackingnummer',
    reviewButton: 'Een beoordeling achterlaten',
    downloadTranslation: "Download uw vertaling",
    regards: 'Met vriendelijke groet,',
    brandSignature: 'Het TercümExpert-team',
    footer: 'Deze e-mail is door TercümExpert verzonden met betrekking tot uw bestelling. Beantwoord dit adres alstublieft niet.',
    subjectReceived: 'Uw bestelling is ontvangen — #{no}',
    headingReceived: 'Uw bestelling is ontvangen',
    bodyReceived: 'Uw aanvraag en documenten hebben ons bereikt. Ons expertteam zal ze beoordelen en binnenkort met de verwerking beginnen. U kunt de status van uw bestelling op elk moment volgen via de knop hieronder.',
    subjectInProgress: 'Uw bestelling wordt nu verwerkt — #{no}',
    headingInProgress: 'Uw vertaling is gestart',
    bodyInProgress: 'Een van onze deskundige vertalers heeft uw bestelling opgepakt en is met uw vertaling aan de slag gegaan. We laten het u opnieuw weten zodra deze klaar is.',
    subjectTranslated: 'Uw vertaling is voltooid — #{no}',
    headingTranslated: 'Uw vertaling is voltooid',
    bodyTranslated: 'Uw vertaling is voltooid en heeft onze kwaliteitscontrole doorstaan. We gaan nu over naar de bezorgfase.',
    subjectShipped: 'Uw bestelling is verzonden — #{no}',
    headingShipped: 'Uw bestelling is verzonden',
    bodyShipped: 'Uw document is overgedragen aan de koerier. U kunt uw zending volgen met het trackingnummer of de link hieronder.',
    subjectDelivered: 'Uw vertaling is bezorgd — #{no}',
    headingDelivered: 'Uw vertaling is bezorgd',
    bodyDelivered: 'Uw vertaling is per e-mail naar u verzonden. Controleer uw inbox (en voor de zekerheid ook uw spammap).',
    subjectReview: 'Hoe was uw ervaring met ons?',
    headingReview: 'Wilt u uw ervaring delen?',
    bodyReview: 'Bedankt dat u voor TercümExpert hebt gekozen. Door een korte beoordeling achter te laten, helpt u ons te verbeteren en geeft u andere klanten houvast. Het kost slechts een minuut.',
  },
  es: {
    greeting: 'Hola {name},',
    greetingNoName: 'Hola,',
    orderLabel: 'N.º de pedido',
    viewOrder: 'Ver pedido',
    trackButton: 'Seguir el envío',
    trackCodeLabel: 'Número de seguimiento',
    reviewButton: 'Dejar una reseña',
    downloadTranslation: "Descargue su traducción",
    regards: 'Un cordial saludo,',
    brandSignature: 'El equipo de TercümExpert',
    footer: 'Este correo ha sido enviado por TercümExpert en relación con su pedido. Por favor, no responda a esta dirección.',
    subjectReceived: 'Hemos recibido su pedido — #{no}',
    headingReceived: 'Hemos recibido su pedido',
    bodyReceived: 'Su solicitud y sus documentos han llegado a nosotros. Nuestro equipo de expertos los revisará y comenzará a procesarlos en breve. Puede consultar el estado de su pedido en cualquier momento mediante el botón que aparece a continuación.',
    subjectInProgress: 'Su pedido ya se está procesando — #{no}',
    headingInProgress: 'Su traducción ha comenzado',
    bodyInProgress: 'Uno de nuestros traductores expertos se ha hecho cargo de su pedido y ha comenzado a trabajar en su traducción. Le avisaremos de nuevo cuando esté finalizada.',
    subjectTranslated: 'Su traducción está lista — #{no}',
    headingTranslated: 'Su traducción está lista',
    bodyTranslated: 'Su traducción se ha completado y ha superado nuestro control de calidad. Ahora pasamos a la fase de entrega.',
    subjectShipped: 'Su pedido ha sido enviado — #{no}',
    headingShipped: 'Su pedido ha sido enviado',
    bodyShipped: 'Su documento se ha entregado a la empresa de mensajería. Puede seguir su envío mediante el número de seguimiento o el enlace que aparece a continuación.',
    subjectDelivered: 'Su traducción ha sido entregada — #{no}',
    headingDelivered: 'Su traducción ha sido entregada',
    bodyDelivered: 'Su traducción le ha sido enviada por correo electrónico. Le rogamos que revise su bandeja de entrada (y la carpeta de spam, por si acaso).',
    subjectReview: '¿Qué le ha parecido su experiencia con nosotros?',
    headingReview: '¿Le gustaría compartir su experiencia?',
    bodyReview: 'Gracias por elegir TercümExpert. Al dejar una breve reseña, nos ayuda a mejorar y orienta a otros clientes. Solo le llevará un minuto.',
  },
  ar: {
    greeting: 'مرحباً {name}،',
    greetingNoName: 'مرحباً،',
    orderLabel: 'رقم الطلب',
    viewOrder: 'عرض الطلب',
    trackButton: 'تتبع الشحنة',
    trackCodeLabel: 'رقم التتبع',
    reviewButton: 'أضف تقييماً',
    downloadTranslation: "تنزيل ترجمتك",
    regards: 'مع أطيب التحيات،',
    brandSignature: 'فريق TercümExpert',
    footer: 'تم إرسال هذا البريد الإلكتروني من TercümExpert بخصوص طلبك. يُرجى عدم الرد على هذا العنوان.',
    subjectReceived: 'تم استلام طلبك — #{no}',
    headingReceived: 'تم استلام طلبك',
    bodyReceived: 'لقد وصلنا طلبك ومستنداتك. سيقوم فريقنا المتخصص بمراجعتها والبدء في معالجتها قريباً. يمكنك متابعة حالة طلبك في أي وقت باستخدام الزر أدناه.',
    subjectInProgress: 'طلبك قيد المعالجة الآن — #{no}',
    headingInProgress: 'بدأت ترجمتك',
    bodyInProgress: 'تولى أحد مترجمينا المتخصصين طلبك وبدأ العمل على ترجمتك. سنُعلمك مجدداً بمجرد اكتمالها.',
    subjectTranslated: 'اكتملت ترجمتك — #{no}',
    headingTranslated: 'اكتملت ترجمتك',
    bodyTranslated: 'تم إنجاز ترجمتك واجتازت فحص الجودة لدينا. ننتقل الآن إلى مرحلة التسليم.',
    subjectShipped: 'تم شحن طلبك — #{no}',
    headingShipped: 'تم شحن طلبك',
    bodyShipped: 'تم تسليم مستندك إلى شركة الشحن. يمكنك متابعة شحنتك باستخدام رقم التتبع أو الرابط أدناه.',
    subjectDelivered: 'تم تسليم ترجمتك — #{no}',
    headingDelivered: 'تم تسليم ترجمتك',
    bodyDelivered: 'تم إرسال ترجمتك إليك عبر البريد الإلكتروني. يُرجى التحقق من صندوق الوارد (ومن مجلد الرسائل غير المرغوب فيها احتياطاً).',
    subjectReview: 'كيف كانت تجربتك معنا؟',
    headingReview: 'هل تشاركنا تجربتك؟',
    bodyReview: 'شكراً لاختيارك TercümExpert. بإضافة تقييم قصير، تساعدنا على التحسّن وترشد العملاء الآخرين. لن يستغرق الأمر سوى دقيقة.',
  },
  ru: {
    greeting: 'Здравствуйте, {name}!',
    greetingNoName: 'Здравствуйте!',
    orderLabel: 'Номер заказа',
    viewOrder: 'Посмотреть заказ',
    trackButton: 'Отследить отправление',
    trackCodeLabel: 'Трек-номер',
    reviewButton: 'Оставить отзыв',
    downloadTranslation: "Скачать ваш перевод",
    regards: 'С наилучшими пожеланиями,',
    brandSignature: 'Команда TercümExpert',
    footer: 'Это письмо отправлено компанией TercümExpert в связи с вашим заказом. Пожалуйста, не отвечайте на этот адрес.',
    subjectReceived: 'Ваш заказ получен — #{no}',
    headingReceived: 'Ваш заказ получен',
    bodyReceived: 'Ваш запрос и документы поступили к нам. Наша команда специалистов рассмотрит их и вскоре приступит к обработке. Вы можете в любой момент отслеживать статус заказа с помощью кнопки ниже.',
    subjectInProgress: 'Ваш заказ находится в обработке — #{no}',
    headingInProgress: 'Работа над вашим переводом началась',
    bodyInProgress: 'Один из наших опытных переводчиков принял ваш заказ и приступил к работе над переводом. Мы снова уведомим вас, как только он будет готов.',
    subjectTranslated: 'Ваш перевод готов — #{no}',
    headingTranslated: 'Ваш перевод готов',
    bodyTranslated: 'Ваш перевод завершён и прошёл нашу проверку качества. Теперь мы переходим к этапу доставки.',
    subjectShipped: 'Ваш заказ отправлен — #{no}',
    headingShipped: 'Ваш заказ отправлен',
    bodyShipped: 'Ваш документ передан курьерской службе. Вы можете отслеживать отправление по трек-номеру или ссылке ниже.',
    subjectDelivered: 'Ваш перевод доставлен — #{no}',
    headingDelivered: 'Ваш перевод доставлен',
    bodyDelivered: 'Ваш перевод отправлен вам по электронной почте. Пожалуйста, проверьте папку «Входящие» (а также папку «Спам» на всякий случай).',
    subjectReview: 'Как вам работа с нами?',
    headingReview: 'Поделитесь своими впечатлениями?',
    bodyReview: 'Благодарим вас за выбор TercümExpert. Оставив короткий отзыв, вы помогаете нам становиться лучше и подсказываете другим клиентам. Это займёт всего минуту.',
  },
  az: {
    greeting: 'Salam {name},',
    greetingNoName: 'Salam,',
    orderLabel: 'Sifariş nömrəsi',
    viewOrder: 'Sifarişə baxın',
    trackButton: 'Çatdırılmanı izləyin',
    trackCodeLabel: 'İzləmə nömrəsi',
    reviewButton: 'Rəy bildirin',
    downloadTranslation: "Tərcümənizi yükləyin",
    regards: 'Hörmətlə,',
    brandSignature: 'TercümExpert komandası',
    footer: 'Bu e-poçt sifarişinizlə bağlı TercümExpert tərəfindən göndərilmişdir. Xahiş edirik, bu ünvana cavab yazmayın.',
    subjectReceived: 'Sifarişiniz qəbul edildi — #{no}',
    headingReceived: 'Sifarişiniz qəbul edildi',
    bodyReceived: 'Müraciətiniz və sənədləriniz bizə çatdı. Ekspert komandamız onları nəzərdən keçirəcək və tezliklə emala başlayacaq. Aşağıdakı düymə vasitəsilə sifarişinizin vəziyyətini istənilən vaxt izləyə bilərsiniz.',
    subjectInProgress: 'Sifarişiniz artıq emal olunur — #{no}',
    headingInProgress: 'Tərcüməniz başladı',
    bodyInProgress: 'Ekspert tərcüməçilərimizdən biri sifarişinizi götürdü və tərcümənizi hazırlamağa başladı. Tamamlandıqda sizə yenidən xəbər verəcəyik.',
    subjectTranslated: 'Tərcüməniz hazırdır — #{no}',
    headingTranslated: 'Tərcüməniz hazırdır',
    bodyTranslated: 'Tərcüməniz tamamlandı və keyfiyyət yoxlamamızdan uğurla keçdi. İndi çatdırılma mərhələsinə keçirik.',
    subjectShipped: 'Sifarişiniz göndərildi — #{no}',
    headingShipped: 'Sifarişiniz göndərildi',
    bodyShipped: 'Sənədiniz kuryerə təhvil verildi. Göndərişinizi aşağıdakı izləmə nömrəsi və ya keçid vasitəsilə izləyə bilərsiniz.',
    subjectDelivered: 'Tərcüməniz çatdırıldı — #{no}',
    headingDelivered: 'Tərcüməniz çatdırıldı',
    bodyDelivered: 'Tərcüməniz sizə e-poçt vasitəsilə göndərildi. Xahiş edirik, gələnlər qutunuzu (ehtiyat üçün spam qovluğunuzu da) yoxlayın.',
    subjectReview: 'Bizimlə təcrübəniz necə oldu?',
    headingReview: 'Təcrübənizi bölüşərdinizmi?',
    bodyReview: 'TercümExpert-i seçdiyiniz üçün təşəkkür edirik. Qısa bir rəy buraxaraq bizə inkişaf etməyimizə və digər müştərilərə yol göstərməyimizə kömək edirsiniz. Bu, cəmi bir dəqiqə çəkir.',
  },
  pl: {
    greeting: 'Witaj {name},',
    greetingNoName: 'Dzień dobry,',
    orderLabel: 'Numer zamówienia',
    viewOrder: 'Zobacz zamówienie',
    trackButton: 'Śledź przesyłkę',
    trackCodeLabel: 'Numer śledzenia',
    reviewButton: 'Wystaw opinię',
    downloadTranslation: "Pobierz swoje tłumaczenie",
    regards: 'Z poważaniem,',
    brandSignature: 'Zespół TercümExpert',
    footer: 'Ta wiadomość została wysłana przez TercümExpert w związku z Twoim zamówieniem. Prosimy nie odpowiadać na ten adres.',
    subjectReceived: 'Twoje zamówienie zostało przyjęte — #{no}',
    headingReceived: 'Twoje zamówienie zostało przyjęte',
    bodyReceived: 'Twoje zgłoszenie i dokumenty do nas dotarły. Nasz zespół ekspertów je sprawdzi i wkrótce rozpocznie realizację. W każdej chwili możesz śledzić status zamówienia za pomocą przycisku poniżej.',
    subjectInProgress: 'Twoje zamówienie jest teraz realizowane — #{no}',
    headingInProgress: 'Rozpoczęliśmy tłumaczenie',
    bodyInProgress: 'Jeden z naszych doświadczonych tłumaczy podjął się Twojego zamówienia i rozpoczął pracę nad tłumaczeniem. Powiadomimy Cię ponownie, gdy będzie gotowe.',
    subjectTranslated: 'Twoje tłumaczenie jest gotowe — #{no}',
    headingTranslated: 'Twoje tłumaczenie jest gotowe',
    bodyTranslated: 'Twoje tłumaczenie zostało ukończone i przeszło naszą kontrolę jakości. Przechodzimy teraz do etapu dostawy.',
    subjectShipped: 'Twoje zamówienie zostało wysłane — #{no}',
    headingShipped: 'Twoje zamówienie zostało wysłane',
    bodyShipped: 'Twój dokument został przekazany kurierowi. Możesz śledzić przesyłkę za pomocą numeru śledzenia lub linku poniżej.',
    subjectDelivered: 'Twoje tłumaczenie zostało dostarczone — #{no}',
    headingDelivered: 'Twoje tłumaczenie zostało dostarczone',
    bodyDelivered: 'Twoje tłumaczenie zostało wysłane do Ciebie e-mailem. Sprawdź swoją skrzynkę odbiorczą (a na wszelki wypadek również folder ze spamem).',
    subjectReview: 'Jak oceniasz współpracę z nami?',
    headingReview: 'Podzielisz się swoją opinią?',
    bodyReview: 'Dziękujemy za wybór TercümExpert. Zostawiając krótką opinię, pomagasz nam się rozwijać i wskazujesz drogę innym klientom. To zajmie tylko chwilę.',
  },
  bg: {
    greeting: 'Здравейте, {name},',
    greetingNoName: 'Здравейте,',
    orderLabel: 'Поръчка №',
    viewOrder: 'Преглед на поръчката',
    trackButton: 'Проследяване на пратката',
    trackCodeLabel: 'Номер за проследяване',
    reviewButton: 'Оставете отзив',
    downloadTranslation: "Изтеглете вашия превод",
    regards: 'С уважение,',
    brandSignature: 'Екипът на TercümExpert',
    footer: 'Този имейл е изпратен от TercümExpert относно вашата поръчка. Моля, не отговаряйте на този адрес.',
    subjectReceived: 'Вашата поръчка е получена — #{no}',
    headingReceived: 'Вашата поръчка е получена',
    bodyReceived: 'Вашата заявка и документи достигнаха до нас. Нашият експертен екип ще ги прегледа и скоро ще започне обработката. По всяко време можете да проследите състоянието на поръчката си чрез бутона по-долу.',
    subjectInProgress: 'Вашата поръчка вече се обработва — #{no}',
    headingInProgress: 'Вашият превод започна',
    bodyInProgress: 'Един от нашите експертни преводачи пое вашата поръчка и започна работа по превода ви. Ще ви уведомим отново, когато е готов.',
    subjectTranslated: 'Вашият превод е готов — #{no}',
    headingTranslated: 'Вашият превод е готов',
    bodyTranslated: 'Вашият превод е завършен и премина нашата проверка за качество. Сега преминаваме към етапа на доставка.',
    subjectShipped: 'Вашата поръчка е изпратена — #{no}',
    headingShipped: 'Вашата поръчка е изпратена',
    bodyShipped: 'Вашият документ е предаден на куриера. Можете да проследите пратката си чрез номера за проследяване или връзката по-долу.',
    subjectDelivered: 'Вашият превод е доставен — #{no}',
    headingDelivered: 'Вашият превод е доставен',
    bodyDelivered: 'Вашият превод ви беше изпратен по имейл. Моля, проверете входящата си кутия (и папката със спам за всеки случай).',
    subjectReview: 'Как беше вашето преживяване с нас?',
    headingReview: 'Бихте ли споделили вашето впечатление?',
    bodyReview: 'Благодарим ви, че избрахте TercümExpert. Като оставите кратък отзив, вие ни помагате да се подобряваме и напътствате други клиенти. Отнема само минута.',
  },
  pt: {
    greeting: 'Olá {name},',
    greetingNoName: 'Olá,',
    orderLabel: 'N.º do pedido',
    viewOrder: 'Ver pedido',
    trackButton: 'Rastrear envio',
    trackCodeLabel: 'Número de rastreamento',
    reviewButton: 'Deixar uma avaliação',
    downloadTranslation: "Baixe a sua tradução",
    regards: 'Atenciosamente,',
    brandSignature: 'A equipa da TercümExpert',
    footer: 'Este e-mail foi enviado pela TercümExpert relativamente ao seu pedido. Por favor, não responda a este endereço.',
    subjectReceived: 'O seu pedido foi recebido — #{no}',
    headingReceived: 'O seu pedido foi recebido',
    bodyReceived: 'O seu pedido e os seus documentos chegaram até nós. A nossa equipa de especialistas irá analisá-los e começará a processá-los em breve. Pode acompanhar o estado do seu pedido a qualquer momento através do botão abaixo.',
    subjectInProgress: 'O seu pedido está agora a ser processado — #{no}',
    headingInProgress: 'A sua tradução foi iniciada',
    bodyInProgress: 'Um dos nossos tradutores especialistas assumiu o seu pedido e começou a trabalhar na sua tradução. Iremos avisá-lo novamente assim que estiver concluída.',
    subjectTranslated: 'A sua tradução está concluída — #{no}',
    headingTranslated: 'A sua tradução está concluída',
    bodyTranslated: 'A sua tradução foi concluída e passou no nosso controlo de qualidade. Estamos agora a avançar para a fase de entrega.',
    subjectShipped: 'O seu pedido foi expedido — #{no}',
    headingShipped: 'O seu pedido foi expedido',
    bodyShipped: 'O seu documento foi entregue à transportadora. Pode acompanhar o seu envio através do número de rastreamento ou do link abaixo.',
    subjectDelivered: 'A sua tradução foi entregue — #{no}',
    headingDelivered: 'A sua tradução foi entregue',
    bodyDelivered: 'A sua tradução foi-lhe enviada por e-mail. Por favor, verifique a sua caixa de entrada (e a pasta de spam, por precaução).',
    subjectReview: 'Como foi a sua experiência connosco?',
    headingReview: 'Gostaria de partilhar a sua experiência?',
    bodyReview: 'Obrigado por escolher a TercümExpert. Ao deixar uma breve avaliação, ajuda-nos a melhorar e orienta outros clientes. Demora apenas um minuto.',
  },
  da: {
    greeting: 'Hej {name},',
    greetingNoName: 'Hej,',
    orderLabel: 'Ordrenr.',
    viewOrder: 'Se ordre',
    trackButton: 'Spor forsendelse',
    trackCodeLabel: 'Sporingsnummer',
    reviewButton: 'Skriv en anmeldelse',
    downloadTranslation: "Download din oversættelse",
    regards: 'Med venlig hilsen,',
    brandSignature: 'TercümExpert-teamet',
    footer: 'Denne e-mail er sendt af TercümExpert vedrørende din ordre. Besvar venligst ikke denne adresse.',
    subjectReceived: 'Din ordre er modtaget — #{no}',
    headingReceived: 'Din ordre er modtaget',
    bodyReceived: 'Din forespørgsel og dine dokumenter er nået frem til os. Vores ekspertteam gennemgår dem og påbegynder behandlingen snarest. Du kan til enhver tid følge status på din ordre via knappen nedenfor.',
    subjectInProgress: 'Din ordre behandles nu — #{no}',
    headingInProgress: 'Din oversættelse er gået i gang',
    bodyInProgress: 'En af vores ekspertoversættere har påtaget sig din ordre og er begyndt at arbejde på din oversættelse. Vi giver dig besked igen, når den er færdig.',
    subjectTranslated: 'Din oversættelse er færdig — #{no}',
    headingTranslated: 'Din oversættelse er færdig',
    bodyTranslated: 'Din oversættelse er blevet færdiggjort og har bestået vores kvalitetskontrol. Vi går nu videre til leveringsfasen.',
    subjectShipped: 'Din ordre er afsendt — #{no}',
    headingShipped: 'Din ordre er afsendt',
    bodyShipped: 'Dit dokument er overdraget til kureren. Du kan følge din forsendelse via sporingsnummeret eller linket nedenfor.',
    subjectDelivered: 'Din oversættelse er leveret — #{no}',
    headingDelivered: 'Din oversættelse er leveret',
    bodyDelivered: 'Din oversættelse er sendt til dig via e-mail. Tjek venligst din indbakke (og din spammappe for en sikkerheds skyld).',
    subjectReview: 'Hvordan var din oplevelse hos os?',
    headingReview: 'Vil du dele din oplevelse?',
    bodyReview: 'Tak, fordi du valgte TercümExpert. Ved at skrive en kort anmeldelse hjælper du os med at blive bedre og vejleder andre kunder. Det tager kun et minut.',
  },
  it: {
    greeting: 'Ciao {name},',
    greetingNoName: 'Salve,',
    orderLabel: 'N. ordine',
    viewOrder: 'Visualizza ordine',
    trackButton: 'Traccia la spedizione',
    trackCodeLabel: 'Numero di tracciamento',
    reviewButton: 'Lascia una recensione',
    downloadTranslation: "Scarica la tua traduzione",
    regards: 'Cordiali saluti,',
    brandSignature: 'Il team di TercümExpert',
    footer: 'Questa email è stata inviata da TercümExpert in merito al tuo ordine. Ti preghiamo di non rispondere a questo indirizzo.',
    subjectReceived: 'Il tuo ordine è stato ricevuto — #{no}',
    headingReceived: 'Il tuo ordine è stato ricevuto',
    bodyReceived: 'La tua richiesta e i tuoi documenti ci sono pervenuti. Il nostro team di esperti li esaminerà e inizierà a elaborarli a breve. Puoi verificare lo stato del tuo ordine in qualsiasi momento tramite il pulsante qui sotto.',
    subjectInProgress: 'Il tuo ordine è ora in lavorazione — #{no}',
    headingInProgress: 'La tua traduzione è iniziata',
    bodyInProgress: 'Uno dei nostri traduttori esperti ha preso in carico il tuo ordine e ha iniziato a lavorare alla tua traduzione. Ti avviseremo di nuovo non appena sarà completata.',
    subjectTranslated: 'La tua traduzione è pronta — #{no}',
    headingTranslated: 'La tua traduzione è pronta',
    bodyTranslated: 'La tua traduzione è stata completata e ha superato il nostro controllo qualità. Stiamo ora passando alla fase di consegna.',
    subjectShipped: 'Il tuo ordine è stato spedito — #{no}',
    headingShipped: 'Il tuo ordine è stato spedito',
    bodyShipped: 'Il tuo documento è stato consegnato al corriere. Puoi seguire la tua spedizione tramite il numero di tracciamento o il link qui sotto.',
    subjectDelivered: 'La tua traduzione è stata consegnata — #{no}',
    headingDelivered: 'La tua traduzione è stata consegnata',
    bodyDelivered: 'La tua traduzione ti è stata inviata via email. Ti preghiamo di controllare la tua casella di posta (e la cartella spam, per sicurezza).',
    subjectReview: 'Com’è stata la tua esperienza con noi?',
    headingReview: 'Vuoi condividere la tua esperienza?',
    bodyReview: 'Grazie per aver scelto TercümExpert. Lasciando una breve recensione, ci aiuti a migliorare e orienti altri clienti. Ti richiede solo un minuto.',
  },
}

function S(locale: string): EmailStrings {
  return STRINGS[locale] ?? STRINGS.en
}
/** "Çevirinizi indirin" — teslim mailindeki indirme butonu etiketi (14 dil). */
export function deliverLabel(locale: string): string {
  return S(normalizeLocale(locale)).downloadTranslation
}

// Fatura + admin-sipariş maili ek metinleri (14 dil).
interface EmailExtra {
  invoiceAttached: string
  subjectAdminOrder: string
  headingAdminOrder: string
  bodyAdminOrder: string
  lblCustomer: string
  lblTotal: string
  lblService: string
  lblLangs: string
}
const EXTRA: Record<string, EmailExtra> = {
  tr: { invoiceAttached: 'Faturanız bu e-postaya PDF olarak eklenmiştir.', subjectAdminOrder: 'Yeni sipariş alındı — #{no}', headingAdminOrder: 'Yeni bir sipariş aldınız', bodyAdminOrder: 'TercümExpert üzerinden yeni bir sipariş verildi. Sipariş detayları aşağıdadır.', lblCustomer: 'Müşteri', lblTotal: 'Tutar', lblService: 'Hizmet', lblLangs: 'Diller' },
  en: { invoiceAttached: 'Your invoice is attached to this email as a PDF.', subjectAdminOrder: 'New order received — #{no}', headingAdminOrder: 'You have received a new order', bodyAdminOrder: 'A new order has just been placed on TercümExpert. Order details are below.', lblCustomer: 'Customer', lblTotal: 'Total', lblService: 'Service', lblLangs: 'Languages' },
  fr: { invoiceAttached: 'Votre facture est jointe à cet e-mail au format PDF.', subjectAdminOrder: 'Nouvelle commande reçue — #{no}', headingAdminOrder: 'Vous avez reçu une nouvelle commande', bodyAdminOrder: "Une nouvelle commande vient d'être passée sur TercümExpert. Les détails de la commande figurent ci-dessous.", lblCustomer: 'Client', lblTotal: 'Total', lblService: 'Service', lblLangs: 'Langues' },
  de: { invoiceAttached: 'Ihre Rechnung ist dieser E-Mail als PDF beigefügt.', subjectAdminOrder: 'Neue Bestellung eingegangen — #{no}', headingAdminOrder: 'Sie haben eine neue Bestellung erhalten', bodyAdminOrder: 'Auf TercümExpert wurde soeben eine neue Bestellung aufgegeben. Die Bestelldetails finden Sie unten.', lblCustomer: 'Kunde', lblTotal: 'Gesamt', lblService: 'Leistung', lblLangs: 'Sprachen' },
  nl: { invoiceAttached: 'Uw factuur is als pdf bij deze e-mail gevoegd.', subjectAdminOrder: 'Nieuwe bestelling ontvangen — #{no}', headingAdminOrder: 'U heeft een nieuwe bestelling ontvangen', bodyAdminOrder: 'Er is zojuist een nieuwe bestelling geplaatst op TercümExpert. De bestelgegevens vindt u hieronder.', lblCustomer: 'Klant', lblTotal: 'Totaal', lblService: 'Dienst', lblLangs: 'Talen' },
  es: { invoiceAttached: 'Su factura se adjunta a este correo electrónico en formato PDF.', subjectAdminOrder: 'Nuevo pedido recibido — #{no}', headingAdminOrder: 'Ha recibido un nuevo pedido', bodyAdminOrder: 'Se acaba de realizar un nuevo pedido en TercümExpert. A continuación se indican los detalles del pedido.', lblCustomer: 'Cliente', lblTotal: 'Total', lblService: 'Servicio', lblLangs: 'Idiomas' },
  ar: { invoiceAttached: 'فاتورتك مرفقة بهذا البريد الإلكتروني بصيغة PDF.', subjectAdminOrder: 'تم استلام طلب جديد — #{no}', headingAdminOrder: 'لقد استلمت طلبًا جديدًا', bodyAdminOrder: 'تم للتو تقديم طلب جديد على TercümExpert. تفاصيل الطلب موضحة أدناه.', lblCustomer: 'العميل', lblTotal: 'الإجمالي', lblService: 'الخدمة', lblLangs: 'اللغات' },
  ru: { invoiceAttached: 'Ваш счёт прикреплён к этому письму в формате PDF.', subjectAdminOrder: 'Получен новый заказ — #{no}', headingAdminOrder: 'Вы получили новый заказ', bodyAdminOrder: 'На TercümExpert только что был размещён новый заказ. Детали заказа приведены ниже.', lblCustomer: 'Клиент', lblTotal: 'Итого', lblService: 'Услуга', lblLangs: 'Языки' },
  az: { invoiceAttached: 'Qaimə-fakturanız bu e-poçta PDF formatında əlavə edilmişdir.', subjectAdminOrder: 'Yeni sifariş alındı — #{no}', headingAdminOrder: 'Yeni sifariş aldınız', bodyAdminOrder: 'TercümExpert saytında yeni sifariş verildi. Sifariş təfərrüatları aşağıdadır.', lblCustomer: 'Müştəri', lblTotal: 'Ümumi məbləğ', lblService: 'Xidmət', lblLangs: 'Dillər' },
  pl: { invoiceAttached: 'Twoja faktura jest załączona do tej wiadomości e-mail w formacie PDF.', subjectAdminOrder: 'Otrzymano nowe zamówienie — #{no}', headingAdminOrder: 'Otrzymałeś nowe zamówienie', bodyAdminOrder: 'W serwisie TercümExpert właśnie złożono nowe zamówienie. Szczegóły zamówienia znajdują się poniżej.', lblCustomer: 'Klient', lblTotal: 'Razem', lblService: 'Usługa', lblLangs: 'Języki' },
  bg: { invoiceAttached: 'Вашата фактура е приложена към този имейл във формат PDF.', subjectAdminOrder: 'Получена нова поръчка — #{no}', headingAdminOrder: 'Получихте нова поръчка', bodyAdminOrder: 'Току-що беше направена нова поръчка в TercümExpert. Детайлите на поръчката са по-долу.', lblCustomer: 'Клиент', lblTotal: 'Обща сума', lblService: 'Услуга', lblLangs: 'Езици' },
  pt: { invoiceAttached: 'A sua fatura está anexada a este e-mail em formato PDF.', subjectAdminOrder: 'Novo pedido recebido — #{no}', headingAdminOrder: 'Você recebeu um novo pedido', bodyAdminOrder: 'Um novo pedido acaba de ser efetuado na TercümExpert. Os detalhes do pedido encontram-se abaixo.', lblCustomer: 'Cliente', lblTotal: 'Total', lblService: 'Serviço', lblLangs: 'Idiomas' },
  da: { invoiceAttached: 'Din faktura er vedhæftet denne e-mail som en PDF.', subjectAdminOrder: 'Ny ordre modtaget — #{no}', headingAdminOrder: 'Du har modtaget en ny ordre', bodyAdminOrder: 'Der er netop afgivet en ny ordre på TercümExpert. Ordredetaljerne findes nedenfor.', lblCustomer: 'Kunde', lblTotal: 'Total', lblService: 'Ydelse', lblLangs: 'Sprog' },
  it: { invoiceAttached: 'La fattura è allegata a questa e-mail in formato PDF.', subjectAdminOrder: 'Nuovo ordine ricevuto — #{no}', headingAdminOrder: 'Hai ricevuto un nuovo ordine', bodyAdminOrder: "È appena stato effettuato un nuovo ordine su TercümExpert. I dettagli dell'ordine sono riportati di seguito.", lblCustomer: 'Cliente', lblTotal: 'Totale', lblService: 'Servizio', lblLangs: 'Lingue' },
}
export function emailExtra(locale: string): EmailExtra {
  return EXTRA[normalizeLocale(locale)] ?? EXTRA.en
}
function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

interface BuildParams {
  event: EmailEvent
  locale: string
  name: string
  orderNo: number | string
  orderUrl: string
  tracking?: string
  reviewUrl?: string
  invoiceNote?: boolean // 'received' mailine "faturanız ektedir" satırı ekler
  details?: Array<{ label: string; value: string }> // 'admin_new_order' için detay tablosu
  ctaUrl?: string // verilirse ana buton bu adrese gider (ör. admin → tercüme havuzu)
  ctaLabel?: string // ctaUrl ile birlikte kullanılır
}

/** Markalı HTML mail gövdesi (inline stiller — mail istemcileri için). Arapça'da RTL. */
function shell(locale: string, heading: string, bodyHtml: string): string {
  const rtl = locale === 'ar'
  const dir = rtl ? 'rtl' : 'ltr'
  const align = rtl ? 'right' : 'left'
  return `<!DOCTYPE html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(heading)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
<tr><td style="padding:20px 28px;border-bottom:1px solid #eef0f3;">
<span style="font-size:18px;font-weight:800;color:${INK};letter-spacing:-.2px;">TercümExpert</span>
</td></tr>
<tr><td dir="${dir}" style="padding:28px;text-align:${align};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${INK};font-weight:700;">${esc(heading)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #eef0f3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:${align};">${esc(S(locale).footer)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function button(label: string, url: string, color: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr><td style="border-radius:8px;background:${color};">
<a href="${esc(url)}" style="display:inline-block;padding:12px 26px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a>
</td></tr></table>`
}

/** Bir olay için { subject, html } üretir. */
export function buildEmail(p: BuildParams): { subject: string; html: string } {
  const s = S(p.locale)
  const t = p.name.trim() ? s.greeting.replace('{name}', esc(p.name.trim())) : s.greetingNoName
  const no = String(p.orderNo)
  const rtl = p.locale === 'ar'
  const align = rtl ? 'right' : 'left'
  const para = (txt: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#334155;text-align:${align};">${esc(txt)}</p>`
  const greetHtml = `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${INK};font-weight:600;text-align:${align};">${t}</p>`
  const orderChip = `<p style="margin:0 0 18px;font-size:13px;color:#64748b;text-align:${align};">${esc(s.orderLabel)}: <strong style="color:${INK};">#${esc(no)}</strong></p>`

  let subject = ''
  let heading = ''
  let bodyText = ''
  let cta = ''

  switch (p.event) {
    case 'received':
      subject = s.subjectReceived; heading = s.headingReceived; bodyText = s.bodyReceived
      cta = button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      break
    case 'in_progress':
      subject = s.subjectInProgress; heading = s.headingInProgress; bodyText = s.bodyInProgress
      cta = button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      break
    case 'translated':
      subject = s.subjectTranslated; heading = s.headingTranslated; bodyText = s.bodyTranslated
      cta = button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      break
    case 'shipped': {
      subject = s.subjectShipped; heading = s.headingShipped; bodyText = s.bodyShipped
      const tr = (p.tracking || '').trim()
      if (tr && isUrl(tr)) {
        cta = button(s.trackButton, tr, BRAND_BLUE)
      } else if (tr) {
        cta =
          `<p style="margin:0 0 14px;font-size:13px;color:#64748b;text-align:${align};">${esc(s.trackCodeLabel)}: <strong style="color:${INK};font-size:16px;">${esc(tr)}</strong></p>` +
          button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      } else {
        cta = button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      }
      break
    }
    case 'delivered':
      subject = s.subjectDelivered; heading = s.headingDelivered; bodyText = s.bodyDelivered
      cta = button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      break
    case 'review':
      subject = s.subjectReview; heading = s.headingReview; bodyText = s.bodyReview
      cta = p.reviewUrl ? button(s.reviewButton, p.reviewUrl, BRAND_GREEN) : ''
      break
    case 'admin_new_order': {
      const ex = emailExtra(p.locale)
      subject = ex.subjectAdminOrder; heading = ex.headingAdminOrder; bodyText = ex.bodyAdminOrder
      cta = button(s.viewOrder, p.orderUrl, BRAND_BLUE)
      break
    }
    case 'payment': {
      const pm = paymentStrings(p.locale)
      subject = pm.subject; heading = pm.heading; bodyText = pm.body
      cta = ''
      break
    }
    case 'password_reset': {
      const pw = pwResetStrings(p.locale)
      subject = pw.subject; heading = pw.heading; bodyText = pw.body
      cta = button(pw.button, p.ctaUrl || p.orderUrl, BRAND_BLUE)
      break
    }
  }

  // Buton override (ör. admin maili → müşteri sipariş sayfası yerine tercüme havuzu).
  if (p.ctaUrl && p.ctaLabel) cta = button(p.ctaLabel, p.ctaUrl, BRAND_BLUE)

  // 'received' → fatura eki bilgisi. 'admin_new_order' → detay tablosu.
  const invNoteHtml =
    p.invoiceNote && (p.event === 'received' || p.event === 'admin_new_order')
      ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${INK};font-weight:600;text-align:${align};">${esc(emailExtra(p.locale).invoiceAttached)}</p>`
      : ''
  const detailsHtml =
    p.details && p.details.length
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 16px;border:1px solid #eef0f3;border-radius:8px;">${p.details
          .map(
            (d, i) =>
              `<tr${i % 2 ? ' style="background:#f8fafc;"' : ''}><td style="padding:8px 12px;font-size:13px;color:#64748b;text-align:${align};">${esc(d.label)}</td><td style="padding:8px 12px;font-size:13px;color:${INK};font-weight:600;text-align:${rtl ? 'left' : 'right'};">${esc(d.value)}</td></tr>`,
          )
          .join('')}</table>`
      : ''

  const signature = `<p style="margin:22px 0 0;font-size:14px;line-height:1.5;color:#475569;text-align:${align};">${esc(s.regards)}<br><strong style="color:${INK};">${esc(s.brandSignature)}</strong></p>`
  const showChip = p.event !== 'review' && p.event !== 'payment' && p.event !== 'password_reset'
  const bodyHtml = greetHtml + (showChip ? orderChip : '') + para(bodyText) + detailsHtml + invNoteHtml + cta + signature
  const finalSubject = subject.replace('{no}', no)
  return { subject: finalSubject, html: shell(p.locale, heading, bodyHtml) }
}

/** Resend eki: content = base64 PDF. */
export interface EmailAttachment {
  filename: string
  content: string // base64
}

/** Resend ile mail gönderir (opsiyonel PDF ekiyle). RESEND_API_KEY yoksa sessizce atlar. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[],
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!RESEND_API_KEY) return { ok: false, skipped: true }
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, skipped: true }
  try {
    const payload: Record<string, unknown> = { from: EMAIL_FROM, to, subject, html }
    if (attachments && attachments.length) payload.attachments = attachments
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}

interface OrderLikeEmail {
  order_no: number | string
  contact_name?: string | null
  contact_email?: string | null
  locale?: string | null
  tracking_info?: string | null
  tracking_url?: string | null
}

/** Sipariş satırından ilgili olayın mailini kurar ve gönderir. Best-effort (hata işlemi bozmaz). */
export async function sendOrderEmail(event: EmailEvent, order: OrderLikeEmail): Promise<{ ok: boolean; skipped?: boolean }> {
  const to = (order.contact_email || '').trim()
  if (!to) return { ok: false, skipped: true }
  if (event === 'review' && !GOOGLE_REVIEW_URL) return { ok: false, skipped: true } // link yoksa gönderme
  const locale = normalizeLocale(order.locale)
  const orderUrl = `${SITE_URL}/${locale}/${orderSlug(locale)}/${order.order_no}`
  const { subject, html } = buildEmail({
    event,
    locale,
    name: order.contact_name || '',
    orderNo: order.order_no,
    orderUrl,
    tracking: (order.tracking_info || order.tracking_url || '') as string,
    reviewUrl: GOOGLE_REVIEW_URL,
  })
  return sendEmail(to, subject, html)
}

/** Sipariş takip sayfası URL'i (mail butonları için). */
export function orderUrl(locale: string, orderNo: number | string): string {
  const l = normalizeLocale(locale)
  return `${SITE_URL}/${l}/${orderSlug(l)}/${orderNo}`
}

/** Tercüman paneli (havuz) URL'i — admin maili butonu buraya gider. */
export function panelUrl(locale: string): string {
  const l = normalizeLocale(locale)
  const slug = l === 'tr' ? 'tercuman' : 'translator'
  return `${SITE_URL}/${l}/${slug}`
}

export { GOOGLE_REVIEW_URL, SITE_URL }
