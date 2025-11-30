import { useState } from 'react'
import Map from './components/Map'
import { POI } from './types/poi'

function App() {
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPOIs = async (bbox: [number, number, number, number]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/pois?bbox=${bbox.join(',')}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch POIs')
      }
      const data = await response.json()
      setPois(data.pois)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full relative">
      <Map pois={pois} onBoundsChange={fetchPOIs} />
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-10">
          {error}
        </div>
      )}
      {loading && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow-lg z-10">
          Loading POIs...
        </div>
      )}
    </div>
  )
}

export default App
