import L from 'leaflet';
import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

interface Location {
  lat: number;
  lng: number;
}

interface DriverDetails {
  id: string;
  name: string;
  vehicleType: string;
  plateNumber: string;
  phone: string;
}

interface MapProps {
  pickup: Location;
  dropoff: Location;
  setPickup?: (location: Location) => void;
  setDropoff?: (location: Location) => void;
  driverLocation: Location | null;
  driverDetails?: DriverDetails | null;
  clickEnabled?: boolean;
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
  driverDetails,
  clickEnabled = true,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  // Define default center coordinates for India
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Approximate center of India
  const defaultZoom = 5; // Adjust this value to get the desired initial view

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!clickEnabled || !setPickup || !setDropoff) return;

    const { lat, lng } = e.latlng;
    if (pickup.lat === 0 && pickup.lng === 0) {
      setPickup({ lat, lng });
    } else if (dropoff.lat === 0 && dropoff.lng === 0) {
      setDropoff({ lat, lng });
    }
  };

  useEffect(() => {
    if (
      mapRef.current &&
      pickup.lat !== 0 &&
      pickup.lng !== 0 &&
      dropoff.lat !== 0 &&
      dropoff.lng !== 0
    ) {
      mapRef.current.fitBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]);
    }
  }, [pickup, dropoff]);

  useEffect(() => {
    if (mapRef.current && driverLocation) {
      if (!driverMarkerRef.current) {
        const driverIcon = L.icon({
          iconUrl: '/leaflet/car.png', // Update this path to your car icon
          iconSize: [50, 30], // Adjust size as needed
          iconAnchor: [25, 15], // Adjust anchor as needed
        });

        driverMarkerRef.current = L.marker(
          [driverLocation.lat, driverLocation.lng],
          { icon: driverIcon }
        ).addTo(mapRef.current);
      } else {
        driverMarkerRef.current.setLatLng([
          driverLocation.lat,
          driverLocation.lng,
        ]);
      }

      if (driverDetails) {
        driverMarkerRef.current.bindPopup(`
          <b>Driver: ${driverDetails.name}</b><br>
          Vehicle: ${driverDetails.vehicleType}<br>
          Plate: ${driverDetails.plateNumber}<br>
          Phone: ${driverDetails.phone}
        `);
      }
    }
  }, [driverLocation, driverDetails]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {clickEnabled && setPickup && setDropoff && (
        <MapEvents onClick={handleMapClick} />
      )}
      {pickup.lat !== 0 && pickup.lng !== 0 && (
        <Marker position={[pickup.lat, pickup.lng]}>
          <Popup>Pickup Location</Popup>
        </Marker>
      )}
      {dropoff.lat !== 0 && dropoff.lng !== 0 && (
        <Marker position={[dropoff.lat, dropoff.lng]}>
          <Popup>Dropoff Location</Popup>
        </Marker>
      )}
      {driverLocation && driverDetails && (
        <Marker
          position={[driverLocation.lat, driverLocation.lng]}
          icon={L.icon({
            iconUrl: '/leaflet/car.png', // Ensure this icon exists
            iconSize: [50, 30],
            iconAnchor: [25, 15],
          })}
        >
          <Popup>
            <div>
              <h3>Driver: {driverDetails.name}</h3>
              <p>Vehicle: {driverDetails.vehicleType}</p>
              <p>Plate: {driverDetails.plateNumber}</p>
              <p>Phone: {driverDetails.phone}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;
