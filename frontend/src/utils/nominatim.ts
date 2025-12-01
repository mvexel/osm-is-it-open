const NOMINATIM_URL =
  (import.meta.env.VITE_NOMINATIM_URL as string | undefined) ||
  'https://nominatim.openstreetmap.org/reverse'

const cache = new Map<string, string | undefined>()

export async function reverseGeocodeCountry(
  lat: number,
  lon: number,
): Promise<string | undefined> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
  if (cache.has(key)) return cache.get(key)

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('zoom', '5')
  url.searchParams.set('addressdetails', '1')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requests a descriptive User-Agent; browsers disallow setting UA, but this header can help identify the app.
        'Accept': 'application/json',
      },
    })
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`)
    const data = await res.json()
    const code: string | undefined = data?.address?.country_code
    cache.set(key, code)
    return code
  } catch {
    cache.set(key, undefined)
    return undefined
  }
}
