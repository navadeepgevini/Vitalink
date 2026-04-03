"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function ClinicMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[300px] bg-white/5 rounded-2xl animate-pulse" />;

  return (
    <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-white/10 z-0">
      <MapContainer center={[13.0827, 80.2707]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[13.0827, 80.2707]} icon={icon}>
          <Popup>
            <strong>Chennai Central Clinic</strong><br/>Dr. Priya Sharma<br/>Cardiology
          </Popup>
        </Marker>
        <Marker position={[13.06, 80.25]} icon={icon}>
          <Popup>
            <strong>Apollo Specialists</strong><br/>Dr. Verma<br/>Neurology
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
