"use client";
import { useEffect, useRef, useState } from "react";

export type LatLng = [number, number]; // [lat, lng]

interface Props {
  lat: number;
  lng: number;
  radius: number;
  zone?: LatLng[] | null;
  onChange: (lat: number, lng: number, radius: number, zone?: LatLng[] | null) => void;
}

export function MapPicker({ lat, lng, radius, zone, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const circleRef = useRef<unknown>(null);
  const polygonRef = useRef<unknown>(null);
  const initializedRef = useRef(false);
  const [mode, setMode] = useState<"circle" | "polygon">(zone && zone.length > 2 ? "polygon" : "circle");
  const [hasZone, setHasZone] = useState(!!(zone && zone.length > 2));

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((containerRef.current as any)._leaflet_id) return;
    initializedRef.current = true;

    const center: [number, number] = [lat || -34.6037, lng || -58.3816];

    Promise.all([
      import("leaflet"),
      import("@geoman-io/leaflet-geoman-free"),
    ]).then(([L]) => {
      if (!containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center, zoom: 18, maxZoom: 22, zoomControl: true,
      });

      L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        attribution: "Google", maxZoom: 22, maxNativeZoom: 21,
      }).addTo(map);
      L.tileLayer("https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}", {
        maxZoom: 22, maxNativeZoom: 21, opacity: 0.8,
      }).addTo(map);

      // Marcador central (siempre visible)
      const marker = L.marker(center, { draggable: true }).addTo(map);

      // Círculo de radio
      const circle = L.circle(center, {
        radius, color: "#8296E3", fillColor: "#8296E3", fillOpacity: 0.15, weight: 2,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        onChange(pos.lat, pos.lng, radius, null);
      });

      // Si ya hay zona guardada, dibujarla
      if (zone && zone.length > 2) {
        const poly = L.polygon(zone, {
          color: "#8296E3", fillColor: "#8296E3", fillOpacity: 0.2, weight: 2,
        }).addTo(map);
        polygonRef.current = poly;
        circle.setStyle({ opacity: 0, fillOpacity: 0 });
      }

      // Configurar Geoman
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).pm.setGlobalOptions({ snappable: true, snapDistance: 10 });

      // Evento: polígono creado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("pm:create", (e: any) => {
        // Eliminar polígonos anteriores
        if (polygonRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).removeLayer(polygonRef.current);
        }
        polygonRef.current = e.layer;
        circle.setStyle({ opacity: 0, fillOpacity: 0 });

        const latlngs = e.layer.getLatLngs()[0] as { lat: number; lng: number }[];
        const coords: LatLng[] = latlngs.map(p => [p.lat, p.lng]);
        setHasZone(true);

        const bounds = e.layer.getBounds().getCenter();
        marker.setLatLng(bounds);
        circle.setLatLng(bounds);
        onChange(bounds.lat, bounds.lng, radius, coords);

        // Deshabilitar dibujo después de crear
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).pm.disableDraw();
        setMode("polygon");
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
        polygonRef.current = null;
        initializedRef.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar radio del círculo
  useEffect(() => {
    if (!circleRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (circleRef.current as any).setRadius(radius);
  }, [radius]);

  // Re-centrar cuando llega nueva dirección
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    import("leaflet").then(L => {
      const latlng = L.latLng(lat, lng);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any).setView(latlng, 18);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (markerRef.current as any)?.setLatLng(latlng);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (circleRef.current as any)?.setLatLng(latlng);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  function startDrawPolygon() {
    if (!mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapRef.current as any).pm.enableDraw("Polygon", {
      snappable: true,
      snapDistance: 10,
      allowSelfIntersection: false,
    });
    setMode("polygon");
  }

  function clearZone() {
    if (!mapRef.current) return;
    import("leaflet").then(() => {
      if (polygonRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (circleRef.current as any)?.setStyle({ opacity: 1, fillOpacity: 0.15 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any).pm.disableDraw();
      setHasZone(false);
      setMode("circle");
      onChange(lat, lng, radius, null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Controles */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={startDrawPolygon}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={mode === "polygon" && !hasZone
            ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff" }
            : { background: "rgba(130,150,227,0.12)", border: "1px solid rgba(130,150,227,0.3)", color: "#8296E3" }
          }
        >
          ✏️ Dibujar zona
        </button>
        {hasZone && (
          <button
            type="button"
            onClick={clearZone}
            className="flex-1 py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", color: "rgba(255,80,80,0.8)" }}
          >
            🗑 Borrar zona
          </button>
        )}
      </div>

      {/* Mapa */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: "280px", border: "1px solid rgba(255,255,255,0.1)" }}
      />

      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
        {hasZone
          ? "✓ Zona delimitada — tocá Dibujar para rehacerla"
          : mode === "polygon"
          ? "Hacé click en el mapa para trazar la zona · doble click para cerrar"
          : "Arrastrá el marcador · o usá Dibujar zona para un polígono personalizado"}
      </p>
    </div>
  );
}
