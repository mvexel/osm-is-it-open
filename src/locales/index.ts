export type OpeningHoursMessages = {
  open_now: string
  open_until: string
  closed: string
  closed_opens: string
  opens_at: string
  until: string
  unknown: string
}

const TRANSLATIONS: Record<string, OpeningHoursMessages> = {
  en: {
    open_now: 'Open now',
    open_until: 'Open until {time}',
    closed: 'Closed',
    closed_opens: 'Closed • opens {time}',
    opens_at: 'opens {time}',
    until: 'until {time}',
    unknown: 'Hours unavailable',
  },
  fr: {
    open_now: 'Ouvert',
    open_until: "Ouvert jusqu'à {time}",
    closed: 'Fermé',
    closed_opens: 'Fermé • ouvre {time}',
    opens_at: 'ouvre {time}',
    until: "jusqu'à {time}",
    unknown: 'Horaires indisponibles',
  },
  de: {
    open_now: 'Geöffnet',
    open_until: 'Geöffnet bis {time}',
    closed: 'Geschlossen',
    closed_opens: 'Geschlossen • öffnet {time}',
    opens_at: 'öffnet {time}',
    until: 'bis {time}',
    unknown: 'Öffnungszeiten unbekannt',
  },
  es: {
    open_now: 'Abierto',
    open_until: 'Abierto hasta {time}',
    closed: 'Cerrado',
    closed_opens: 'Cerrado • abre {time}',
    opens_at: 'abre {time}',
    until: 'hasta {time}',
    unknown: 'Horario no disponible',
  },
  it: {
    open_now: 'Aperto',
    open_until: 'Aperto fino alle {time}',
    closed: 'Chiuso',
    closed_opens: 'Chiuso • apre {time}',
    opens_at: 'apre {time}',
    until: 'fino alle {time}',
    unknown: 'Orari non disponibili',
  },
  nl: {
    open_now: 'Open',
    open_until: 'Open tot {time}',
    closed: 'Gesloten',
    closed_opens: 'Gesloten • opent {time}',
    opens_at: 'opent {time}',
    until: 'tot {time}',
    unknown: 'Openingstijden onbekend',
  },
  pt: {
    open_now: 'Aberto',
    open_until: 'Aberto até {time}',
    closed: 'Fechado',
    closed_opens: 'Fechado • abre {time}',
    opens_at: 'abre {time}',
    until: 'até {time}',
    unknown: 'Horário indisponível',
  },
  sv: {
    open_now: 'Öppet',
    open_until: 'Öppet till {time}',
    closed: 'Stängt',
    closed_opens: 'Stängt • öppnar {time}',
    opens_at: 'öppnar {time}',
    until: 'till {time}',
    unknown: 'Öppettider okända',
  },
  ja: {
    open_now: '営業中',
    open_until: '{time} まで営業',
    closed: '休業中',
    closed_opens: '{time} に営業開始',
    opens_at: '{time} に営業開始',
    until: '{time} まで',
    unknown: '営業時間不明',
  },
  'zh-CN': {
    open_now: '营业中',
    open_until: '营业至 {time}',
    closed: '休息中',
    closed_opens: '休息 • {time} 营业',
    opens_at: '{time} 营业',
    until: '至 {time}',
    unknown: '营业时间未知',
  },
}

export function getLocaleStrings(locale: string): OpeningHoursMessages {
  const base = locale?.split('-')[0]?.toLowerCase() ?? 'en'
  return TRANSLATIONS[locale] ?? TRANSLATIONS[base] ?? TRANSLATIONS.en
}
