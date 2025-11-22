"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface ElevationProfileProps {
  gpxObjectName?: string | null;
  height?: string;
}

interface ElevationPoint {
  distance: number; // in km
  elevation: number; // in meters
}

export function ElevationProfile({
  gpxObjectName,
  height = "h-64",
}: ElevationProfileProps) {
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
  const { data: gpxContentData, isLoading: loadingGpx } = trpc.routes.getGpxContent.useQuery(
    { objectName: gpxObjectName || "" },
    { enabled: !!gpxObjectName }
  );

  useEffect(() => {
    if (gpxContentData?.content) {
      // Parse the GPX file content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxContentData.content, "text/xml");

      const trackPoints = Array.from(xmlDoc.querySelectorAll("trkpt"));
      const profile: ElevationPoint[] = [];
      let cumulativeDistance = 0;

      // Helper function to calculate distance between two points
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      let prevLat: number | null = null;
      let prevLon: number | null = null;

      trackPoints.forEach((point) => {
        const lat = parseFloat(point.getAttribute("lat") || "0");
        const lon = parseFloat(point.getAttribute("lon") || "0");
        const eleElement = point.querySelector("ele");
        const elevation = eleElement ? parseFloat(eleElement.textContent || "0") : null;

        if (!isNaN(lat) && !isNaN(lon) && elevation !== null) {
          if (prevLat !== null && prevLon !== null) {
            const distance = calculateDistance(prevLat, prevLon, lat, lon);
            cumulativeDistance += distance;
          }

          profile.push({
            distance: cumulativeDistance,
            elevation: elevation,
          });

          prevLat = lat;
          prevLon = lon;
        }
      });

      setElevationData(profile);
    }
  }, [gpxContentData]);

  if (!gpxObjectName) {
    return (
      <div className={`${height} w-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg`}>
        <p>No elevation data available</p>
      </div>
    );
  }

  if (loadingGpx) {
    return (
      <div className={`${height} w-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (elevationData.length === 0) {
    return (
      <div className={`${height} w-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg`}>
        <p>No elevation data found in GPX file</p>
      </div>
    );
  }

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };

  const maxDistance = Math.max(...elevationData.map((p) => p.distance));
  const minElevation = Math.min(...elevationData.map((p) => p.elevation));
  const maxElevation = Math.max(...elevationData.map((p) => p.elevation));
  const elevationRange = maxElevation - minElevation || 1;

  // Scale factors
  const xScale = (distance: number) =>
    padding.left + (distance / maxDistance) * (chartWidth - padding.left - padding.right);
  const yScale = (elevation: number) =>
    padding.top +
    (chartHeight - padding.top - padding.bottom) *
      (1 - (elevation - minElevation) / elevationRange);

  // Generate path for elevation profile
  const pathData = elevationData
    .map((point, index) => {
      const x = xScale(point.distance);
      const y = yScale(point.elevation);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Generate area path (for filled area under the line)
  const areaPath = `${pathData} L ${xScale(maxDistance)} ${yScale(minElevation)} L ${padding.left} ${yScale(minElevation)} Z`;

  // Generate grid lines and labels
  const gridLines = [];
  const numGridLines = 5;

  // Horizontal grid lines (elevation)
  for (let i = 0; i <= numGridLines; i++) {
    const elevation = minElevation + (elevationRange * i) / numGridLines;
    const y = yScale(elevation);
    gridLines.push(
      <line
        key={`h-${i}`}
        x1={padding.left}
        y1={y}
        x2={chartWidth - padding.right}
        y2={y}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
    gridLines.push(
      <text
        key={`h-label-${i}`}
        x={padding.left - 10}
        y={y + 4}
        textAnchor="end"
        fontSize="10"
        fill="#6b7280"
      >
        {Math.round(elevation)}m
      </text>
    );
  }

  // Vertical grid lines (distance)
  for (let i = 0; i <= numGridLines; i++) {
    const distance = (maxDistance * i) / numGridLines;
    const x = xScale(distance);
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={padding.top}
        x2={x}
        y2={chartHeight - padding.bottom}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
    gridLines.push(
      <text
        key={`v-label-${i}`}
        x={x}
        y={chartHeight - padding.bottom + 20}
        textAnchor="middle"
        fontSize="10"
        fill="#6b7280"
      >
        {distance.toFixed(1)}km
      </text>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ minHeight: "200px" }}
      >
        {/* Grid lines */}
        {gridLines}

        {/* Filled area under the line */}
        <path
          d={areaPath}
          fill="url(#elevationGradient)"
          opacity={0.3}
        />

        {/* Elevation profile line */}
        <path
          d={pathData}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

