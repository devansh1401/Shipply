import L from 'leaflet';
import React from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

interface Location {
  lat: number;
  lng: number;
}

interface MapProps {
  pickup: Location;
  dropoff: Location;
  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
  driverLocation: Location | null;
}

const MapEvents: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void }> = ({
  onClick,
}) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const Map: React.FC<MapProps> = ({
  pickup,
  dropoff,
  setPickup,
  setDropoff,
  driverLocation,
}) => {
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    if (pickup.lat === 0 && pickup.lng === 0) {
      setPickup({ lat, lng });
    } else if (dropoff.lat === 0 && dropoff.lng === 0) {
      setDropoff({ lat, lng });
    }
  };

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapEvents onClick={handleMapClick} />
      {pickup.lat !== 0 && pickup.lng !== 0 && (
        <Marker position={[pickup.lat, pickup.lng]} />
      )}
      {dropoff.lat !== 0 && dropoff.lng !== 0 && (
        <Marker position={[dropoff.lat, dropoff.lng]} />
      )}
      {driverLocation && (
        <Marker
          position={[driverLocation.lat, driverLocation.lng]}
          icon={L.icon({
            iconUrl: '/leaflet/marker-icon-2x.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })}
        />
      )}
    </MapContainer>
  );
};

export default Map;
