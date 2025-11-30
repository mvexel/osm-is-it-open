import { useEffect, useRef, useState } from 'react'
import { Map as MapGL, MapRef, Marker } from 'react-map-gl/maplibre'
import type { ViewStateChangeEvent } from 'react-map-gl/maplibre'
import { POI } from '../types/poi'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapProps {
  pois: POI[]
  onBoundsChange: (bbox: [number, number, number, number]) => void
}

const INITIAL_VIEW_STATE = {
  latitude: 40.7128,
  longitude: -74.0060,
  zoom: 13,
}

const getMarkerColor = (openStatus: POI['openStatus']): string => {
  switch (openStatus) {
    case 'open':
      return '#10b981' // green
    case 'closed':
      return '#6b7280' // grey
    case 'unknown':
      return '#ef4444' // red
  }
}

function Map({ pois, onBoundsChange }: MapProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (map && map.isStyleLoaded()) {
      const bounds = map.getBounds()
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]
      onBoundsChange(bbox)
    }
  }, [])

  const handleMoveEnd = (evt: ViewStateChangeEvent) => {
    const map = evt.target
    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    onBoundsChange(bbox)
  }

  return (
    <MapGL
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          latitude={poi.lat}
          longitude={poi.lon}
          anchor="bottom"
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: getMarkerColor(poi.openStatus) }}
            title={poi.name || 'Unnamed POI'}
          />
        </Marker>
      ))}
    </MapGL>
  )
}

export default Map
