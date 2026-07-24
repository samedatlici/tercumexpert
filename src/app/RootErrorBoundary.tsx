import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

// Bu hata sınırı I18nProvider'ın DIŞINDA çalışır (dict'e erişemez). Bu yüzden
// 14 dil için küçük bir yerel sözlük tutulur; dil, URL'nin ilk parçasından okunur.
const EB: Record<string, { title: string; desc: string; retry: string }> = {
  tr: { title: 'Bir şeyler ters gitti', desc: 'Lütfen sayfayı yenileyin.', retry: 'Yenile' },
  en: { title: 'Something went wrong', desc: 'Please refresh the page.', retry: 'Refresh' },
  fr: { title: "Une erreur s'est produite", desc: 'Veuillez actualiser la page.', retry: 'Actualiser' },
  de: { title: 'Etwas ist schiefgelaufen', desc: 'Bitte laden Sie die Seite neu.', retry: 'Neu laden' },
  nl: { title: 'Er is iets misgegaan', desc: 'Vernieuw de pagina.', retry: 'Vernieuwen' },
  es: { title: 'Algo salió mal', desc: 'Actualice la página.', retry: 'Actualizar' },
  ar: { title: 'حدث خطأ ما', desc: 'يُرجى تحديث الصفحة.', retry: 'تحديث' },
  ru: { title: 'Что-то пошло не так', desc: 'Пожалуйста, обновите страницу.', retry: 'Обновить' },
  az: { title: 'Nə isə səhv oldu', desc: 'Zəhmət olmasa, səhifəni yeniləyin.', retry: 'Yenilə' },
  pl: { title: 'Coś poszło nie tak', desc: 'Prosimy odświeżyć stronę.', retry: 'Odśwież' },
  bg: { title: 'Нещо се обърка', desc: 'Моля, опреснете страницата.', retry: 'Опресни' },
  pt: { title: 'Algo correu mal', desc: 'Por favor, atualize a página.', retry: 'Atualizar' },
  da: { title: 'Noget gik galt', desc: 'Genindlæs venligst siden.', retry: 'Genindlæs' },
  it: { title: 'Qualcosa è andato storto', desc: 'Aggiorni la pagina.', retry: 'Aggiorna' },
}
function ebStrings(): { title: string; desc: string; retry: string } {
  let seg = 'tr'
  try {
    seg = (window.location.pathname.split('/')[1] || 'tr').toLowerCase()
  } catch {
    /* SSR/edge güvenliği */
  }
  return EB[seg] ?? EB.tr
}

/** En üst seviye hata sınırı. (React'ta hata sınırı hâlâ class gerektirir.) */
export class RootErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Uygulama hatası:', error, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const s = ebStrings()
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-semibold">{s.title}</h1>
          <p className="text-text-secondary">{s.desc}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            {s.retry}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
