"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trpc } from "@/lib/trpc/client";

interface GPXData {
  name: string;
  distance: number;
  elevation: number;
  coordinates: [number, number][];
  startPoint: [number, number];
  endPoint: [number, number];
}

interface RouteMapProps {
  gpxObjectName?: string | null;
  routeName?: string;
  routeDistance?: number;
  routeElevation?: number;
  height?: string;
}

export function RouteMap({
  gpxObjectName,
  routeName,
  routeDistance,
  routeElevation,
  height = "h-96",
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [gpxData, setGpxData] = useState<GPXData | null>(null);

  // Fetch GPX content from server
  const { data: gpxContentData, isLoading: loadingGpx } = trpc.routes.getGpxContent.useQuery(
    { objectName: gpxObjectName || "" },
    { enabled: !!gpxObjectName }
  );

  // Fix Leaflet default icon issue
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);

  useEffect(() => {
    if (gpxContentData?.content) {
      // Parse the GPX file content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxContentData.content, "text/xml");

      const trackPoints = Array.from(xmlDoc.querySelectorAll("trkpt"));
      const coordinates: [number, number][] = [];

      trackPoints.forEach((point) => {
        const lat = parseFloat(point.getAttribute("lat") || "0");
        const lon = parseFloat(point.getAttribute("lon") || "0");
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lat, lon]);
        }
      });

      if (coordinates.length > 0) {
        setGpxData({
          name: routeName || "Route",
          distance: routeDistance || 0,
          elevation: routeElevation || 0,
          coordinates,
          startPoint: coordinates[0],
          endPoint: coordinates[coordinates.length - 1],
        });
      }
    }
  }, [gpxContentData, routeName, routeDistance, routeElevation]);

  useEffect(() => {
    if (gpxData && mapRef.current && !mapInstanceRef.current) {
      // Initialize the map
      const map = L.map(mapRef.current).setView(gpxData.startPoint, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Add route polyline
      const polyline = L.polyline(gpxData.coordinates, { color: "red", weight: 3 }).addTo(map);

      // Add start and end markers
      L.marker(gpxData.startPoint)
        .addTo(map)
        .bindPopup("Start")
        .openPopup();

      L.marker(gpxData.endPoint).addTo(map).bindPopup("End");

      // Fit map to route bounds
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpxData]);

  if (!gpxObjectName) {
    return (
      <div className={`${height} w-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg`}>
        <p>No route map available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loadingGpx && (
        <div className="mb-2 text-sm text-gray-500">Loading route data...</div>
      )}
      {gpxData ? (
        <div ref={mapRef} className={`${height} w-full rounded-lg`} />
      ) : (
        <div className={`${height} w-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg`}>
          {loadingGpx ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          ) : (
            <p>No route map available</p>
          )}
        </div>
      )}
    </div>
  );
}

