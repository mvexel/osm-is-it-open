/**
 * Returns a copy of date with time set to 00:00:00.000 in local time.
 *
 * @param date source date
 * @returns new Date at start of day (local time)
 */
export function startOfDayLocal(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Returns start of day for a given date, adjusted for timezone if provided.
 *
 * @param date source date
 * @param timeZone IANA timezone string (e.g., 'America/New_York')
 * @returns new Date at start of day in specified timezone
 */
export function startOfDay(date: Date, timeZone?: string): Date {
    if (!timeZone) return startOfDayLocal(date)

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date)

    const year = Number(parts.find((p) => p.type === 'year')?.value)
    const month = Number(parts.find((p) => p.type === 'month')?.value)
    const day = Number(parts.find((p) => p.type === 'day')?.value)
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/** Returns number of full days between two dates. */
export function daySpan(start: Date, end: Date): number {
    return Math.floor((startOfDayLocal(end).getTime() - startOfDayLocal(start).getTime()) / (24 * 60 * 60 * 1000))
}