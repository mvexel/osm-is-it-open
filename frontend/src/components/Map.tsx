import { useEffect, useRef, useState } from 'react'
import { Map as MapGL, MapRef, Marker } from 'react-map-gl/maplibre'
import type { ViewStateChangeEvent } from 'react-map-gl/maplibre'
import { POI } from '../types/poi'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapProps {
  pois: POI[]
  onBoundsChange: (bbox: [number, number, number, number], zoom: number) => void
}

const MIN_ZOOM = 16

const INITIAL_VIEW_STATE = {
  latitude: 40.7128,
  longitude: -74.0060,
  zoom: MIN_ZOOM,
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
      const zoom = map.getZoom()
      if (zoom < MIN_ZOOM) return
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]
      onBoundsChange(bbox, zoom)
    }
  }, [])

  const handleMoveEnd = (evt: ViewStateChangeEvent) => {
    const map = evt.target
    const zoom = map.getZoom()
    if (zoom < MIN_ZOOM) return
    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    onBoundsChange(bbox, zoom)
  }

  return (
    <div className="relative w-full h-full">
      <MapGL
        ref={mapRef}
        {...viewState}
        minZoom={MIN_ZOOM}
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
      {viewState.zoom < MIN_ZOOM && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 transform bg-white/90 text-gray-800 px-4 py-2 rounded shadow-lg">
          Zoom to level 16+ to load POIs
        </div>
      )}
    </div>
  )
}

export default Map
