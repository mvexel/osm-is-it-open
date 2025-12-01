export type OpeningHoursMessages = {
  open_now: string
  open_until: string
  closed: string
  closed_opens: string
  unknown: string
}

const TRANSLATIONS: Record<string, OpeningHoursMessages> = {
  en: {
    open_now: 'Open now',
    open_until: 'Open until {time}',
    closed: 'Closed',
    closed_opens: 'Closed • opens {time}',
    unknown: 'Hours unavailable',
  },
  fr: {
    open_now: 'Ouvert',
    open_until: 'Ouvert jusqu’à {time}',
    closed: 'Fermé',
    closed_opens: 'Fermé • ouvre {time}',
    unknown: 'Horaires indisponibles',
  },
  de: {
    open_now: 'Geöffnet',
    open_until: 'Geöffnet bis {time}',
    closed: 'Geschlossen',
    closed_opens: 'Geschlossen • öffnet {time}',
    unknown: 'Öffnungszeiten unbekannt',
  },
  es: {
    open_now: 'Abierto',
    open_until: 'Abierto hasta {time}',
    closed: 'Cerrado',
    closed_opens: 'Cerrado • abre {time}',
    unknown: 'Horario no disponible',
  },
  it: {
    open_now: 'Aperto',
    open_until: 'Aperto fino alle {time}',
    closed: 'Chiuso',
    closed_opens: 'Chiuso • apre {time}',
    unknown: 'Orari non disponibili',
  },
  nl: {
    open_now: 'Open',
    open_until: 'Open tot {time}',
    closed: 'Gesloten',
    closed_opens: 'Gesloten • opent {time}',
    unknown: 'Openingstijden onbekend',
  },
  pt: {
    open_now: 'Aberto',
    open_until: 'Aberto até {time}',
    closed: 'Fechado',
    closed_opens: 'Fechado • abre {time}',
    unknown: 'Horário indisponível',
  },
  sv: {
    open_now: 'Öppet',
    open_until: 'Öppet till {time}',
    closed: 'Stängt',
    closed_opens: 'Stängt • öppnar {time}',
    unknown: 'Öppettider okända',
  },
  ja: {
    open_now: '営業中',
    open_until: '{time} まで営業',
    closed: '休業中',
    closed_opens: '{time} に営業開始',
    unknown: '営業時間不明',
  },
  'zh-CN': {
    open_now: '营业中',
    open_until: '营业至 {time}',
    closed: '休息中',
    closed_opens: '休息 • {time} 营业',
    unknown: '营业时间未知',
  },
}

export function getLocaleStrings(locale: string): OpeningHoursMessages {
  const base = locale?.split('-')[0]?.toLowerCase() ?? 'en'
  return TRANSLATIONS[locale] ?? TRANSLATIONS[base] ?? TRANSLATIONS.en
}
