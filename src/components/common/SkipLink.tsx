import { useI18n } from '@/hooks/useI18n'

/** İçeriğe atlama linki (a11y §25). Tab ile ilk odaklanılan öğe. */
export function SkipLink() {
  const { dict } = useI18n()
  return (
    <a href="#main" className="skip-link">
      {dict.common.actions.skipToContent}
    </a>
  )
}
