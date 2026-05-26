"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix broken default marker icons in Next.js / webpack */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function goldIcon(num: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:#C9A84C;color:#080808;
      display:flex;align-items:center;justify-content:center;
      font-family:''TT Fors', sans-serif;font-weight: 300;font-size:15px;
      border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 3px 12px rgba(0,0,0,0.6);
    ">${num}</div>`,
    iconSize:   [34, 34],
    iconAnchor: [17, 17],
    popupAnchor:[0, -20],
  });
}

/* Real lat/lng for every destination id */
const COORDS: Record<string, [number, number]> = {
  colombo:       [6.9271,  79.8612],
  galle:         [6.0535,  80.2210],
  mirissa:       [5.9483,  80.4716],
  tangalle:      [6.0240,  80.7929],
  yala:          [6.3728,  81.5168],
  "arugam-bay":  [6.8395,  81.8355],
  ella:          [6.8667,  81.0466],
  "nuwara-eliya":[6.9497,  80.7891],
  kandy:         [7.2906,  80.6337],
  sigiriya:      [7.9570,  80.7603],
  trincomalee:   [8.5874,  81.2152],
  jaffna:        [9.6615,  80.0255],
};

interface DestItem { id: string; name: string; }
export interface TransferPoint { name: string; coords: [number, number] }

function transferIcon(type: "start" | "end") {
  const bg = type === "start" ? "#27ae60" : "#e74c3c";
  const label = type === "start" ? "S" : "E";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${bg};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;font-family:Inter,sans-serif;
      border:2.5px solid rgba(255,255,255,0.85);
      box-shadow:0 3px 14px rgba(0,0,0,0.65);
    ">${label}</div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
    popupAnchor:[0, -22],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) { map.setView(positions[0], 10); return; }
    map.fitBounds(L.latLngBounds(positions), { padding: [52, 52], maxZoom: 11 });
  }, [positions, map]);
  return null;
}

export default function LeafletMap({
  route, pickup, dropoff,
}: {
  route: DestItem[];
  pickup?: TransferPoint | null;
  dropoff?: TransferPoint | null;
}) {
  const destPositions = route.map(d => COORDS[d.id]).filter(Boolean) as [number, number][];

  /* Full polyline: pickup → stops → dropoff */
  const linePoints: [number, number][] = [
    ...(pickup ? [pickup.coords] : []),
    ...destPositions,
    ...(dropoff && dropoff.name !== pickup?.name ? [dropoff.coords] : dropoff ? [dropoff.coords] : []),
  ];

  const allPoints = [
    ...(pickup ? [pickup.coords] : []),
    ...destPositions,
    ...(dropoff ? [dropoff.coords] : []),
  ] as [number, number][];

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(201,168,76,0.25)" }}>
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={7}
        style={{ height: 420, width: "100%" }}
        zoomControl
        scrollWheelZoom={false}
      >
        {/* CartoDB Dark Matter — matches luxury dark aesthetic perfectly */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Dashed gold route line */}
        {linePoints.length > 1 && (
          <Polyline
            positions={linePoints}
            pathOptions={{ color: "#C9A84C", weight: 2.5, dashArray: "8 5", opacity: 0.85 }}
          />
        )}

        {/* START marker */}
        {pickup && (
          <Marker position={pickup.coords} icon={transferIcon("start")}>
            <Popup><strong style={{ fontFamily: "TT Fors, sans-serif", fontSize: 15 }}>🟢 Pickup: {pickup.name}</strong></Popup>
          </Marker>
        )}

        {/* Gold numbered destination markers */}
        {route.map((d, i) => {
          const pos = COORDS[d.id];
          if (!pos) return null;
          return (
            <Marker key={d.id} position={pos} icon={goldIcon(i + 1)}>
              <Popup>
                <strong style={{ fontFamily: "TT Fors, sans-serif", fontSize: 15 }}>
                  {i + 1}. {d.name}
                </strong>
              </Popup>
            </Marker>
          );
        })}

        {/* END marker */}
        {dropoff && (
          <Marker position={dropoff.coords} icon={transferIcon("end")}>
            <Popup><strong style={{ fontFamily: "TT Fors, sans-serif", fontSize: 15 }}>🔴 Drop-off: {dropoff.name}</strong></Popup>
          </Marker>
        )}

        {allPoints.length > 0 && <FitBounds positions={allPoints} />}
      </MapContainer>
    </div>
  );
}
