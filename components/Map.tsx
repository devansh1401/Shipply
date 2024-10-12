import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
}

interface MapProps {
  pickup: Location;
  dropoff: Location;
  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
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
}) => {
  useEffect(() => {
    console.log('Map component mounted');
  }, []);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    console.log('Map clicked at:', lat, lng);
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
        eventHandlers={{
          tileloadstart: () => console.log('Tile load started'),
          tileload: () => console.log('Tile loaded'),
          tileerror: (error) => console.error('Tile error:', error),
        }}
      />
      <MapEvents onClick={handleMapClick} />
      {pickup.lat !== 0 && pickup.lng !== 0 && (
        <Marker position={[pickup.lat, pickup.lng]} />
      )}
      {dropoff.lat !== 0 && dropoff.lng !== 0 && (
        <Marker position={[dropoff.lat, dropoff.lng]} />
      )}
    </MapContainer>
  );
};

export default Map;
