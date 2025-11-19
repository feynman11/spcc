"use client";

import { trpc } from "@/lib/trpc/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { PaidMemberOverlay } from "@/components/PaidMemberOverlay";
import { MemberProfileOverlay } from "@/components/MemberProfileOverlay";

interface GPXData {
  name: string;
  distance: number;
  elevation: number;
  coordinates: [number, number][];
  startPoint: [number, number];
  endPoint: [number, number];
}

export default function Routes() {
  const utils = trpc.useUtils();
  const { data: currentMember, isLoading: memberLoading } = trpc.members.getCurrentMember.useQuery();
  const { data: allRoutes, isLoading: routesLoading } = trpc.routes.getAllRoutes.useQuery();
  
  // Check if member is paid (admins are always allowed)
  const { data: currentUser } = trpc.members.getCurrentUser.useQuery();
  const isPaid = currentMember?.isPaid ?? false;
  const isAdmin = currentUser?.role === "admin";
  const showPaidOverlay = currentMember !== undefined && currentMember !== null && !isPaid && !isAdmin;
  const showMemberProfileOverlay = !memberLoading && currentMember === null;
  const createRoute = trpc.routes.createRoute.useMutation({
    onSuccess: () => {
      toast.success("Route created successfully!");
      utils.routes.getAllRoutes.invalidate();
      setShowForm(false);
      setGpxData(null);
      setShowMap(false);
      setParsing(false);
      setFormData({
        name: "",
        description: "",
        distance: "",
        elevation: "",
        difficulty: "moderate",
        startLocation: "",
        endLocation: "",
        routeType: "road",
        tags: "",
        gpxFile: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create route");
    },
  });
  
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterType, setFilterType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    distance: "",
    elevation: "",
    difficulty: "moderate" as "easy" | "moderate" | "hard" | "expert",
    startLocation: "",
    endLocation: "",
    routeType: "road" as "road" | "mountain" | "gravel" | "mixed",
    tags: "",
    gpxFile: null as File | null,
  });

  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [showMap, setShowMap] = useState(false);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const parseGPX = (gpxContent: string): GPXData | null => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxContent, "text/xml");
      
      // Get track name
      const nameElement = xmlDoc.querySelector("trk name") || xmlDoc.querySelector("name");
      const name = nameElement?.textContent || "Unnamed Route";
      
      // Get track points
      const trackPoints = Array.from(xmlDoc.querySelectorAll("trkpt"));
      
      if (trackPoints.length === 0) {
        throw new Error("No track points found in GPX file. Please ensure your GPX file contains track data.");
      }
      
      const coordinates: [number, number][] = [];
      let totalDistance = 0;
      let minElevation = Infinity;
      let maxElevation = -Infinity;
      
      trackPoints.forEach((point, index) => {
        const lat = parseFloat(point.getAttribute("lat") || "0");
        const lon = parseFloat(point.getAttribute("lon") || "0");
        
        if (isNaN(lat) || isNaN(lon)) {
          return; // Skip invalid coordinates
        }
        const eleElement = point.querySelector("ele");
        const elevation = eleElement ? parseFloat(eleElement.textContent || "0") : 0;
        
        coordinates.push([lat, lon]);
        
        if (elevation !== 0) {
          minElevation = Math.min(minElevation, elevation);
          maxElevation = Math.max(maxElevation, elevation);
        }
        
        // Calculate distance between consecutive points
        if (index > 0) {
          const prevPoint = coordinates[index - 1];
          const distance = calculateDistance(prevPoint[0], prevPoint[1], lat, lon);
          totalDistance += distance;
        }
      });
      
      if (coordinates.length === 0) {
        throw new Error("No valid coordinates found in GPX file");
      }
      
      const elevationGain = maxElevation === -Infinity ? 0 : Math.round(maxElevation - minElevation);
      const startPoint = coordinates[0];
      const endPoint = coordinates[coordinates.length - 1];
      
      return {
        name,
        distance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
        elevation: elevationGain,
        coordinates,
        startPoint,
        endPoint
      };
    } catch (error) {
      console.error("Error parsing GPX:", error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.gpx')) {
        setFormData({ ...formData, gpxFile: file });
        setParsing(true);
        
        // Parse GPX file
        const reader = new FileReader();
        reader.onload = (event) => {
          const gpxContent = event.target?.result as string;
          const parsed = parseGPX(gpxContent);
          
          if (parsed) {
            setGpxData(parsed);
            setFormData(prev => ({
              ...prev,
              name: parsed.name,
              distance: parsed.distance.toString(),
              elevation: parsed.elevation.toString()
            }));
            setShowMap(true);
            toast.success(`GPX file parsed successfully! Found ${parsed.coordinates.length} GPS points.`);
          } else {
            toast.error("Failed to parse GPX file. Please ensure it's a valid GPX file with track data.");
          }
          setParsing(false);
        };
        
        reader.onerror = () => {
          toast.error("Error reading GPX file. Please try again.");
          setParsing(false);
        };
        reader.readAsText(file);
      } else {
        toast.error("Please select a GPX file");
        e.target.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gpxFile || !gpxData) {
      toast.error("Please select and parse a valid GPX file");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    if (!formData.startLocation.trim()) {
      toast.error("Please enter a start location");
      return;
    }

    setUploading(true);
    
    try {
      // Step 1: Upload GPX file to MinIO
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", formData.gpxFile);
      
      const uploadResponse = await fetch("/api/upload/gpx", {
        method: "POST",
        body: formDataToUpload,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload GPX file");
      }
      
      const { objectName, fileName } = await uploadResponse.json();
      
      // Step 2: Save the route to the database
      createRoute.mutate({
        name: formData.name,
        description: formData.description || undefined,
        distance: parseFloat(formData.distance),
        elevation: parseInt(formData.elevation),
        difficulty: formData.difficulty,
        gpxObjectName: objectName,
        gpxFileName: fileName,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation || undefined,
        routeType: formData.routeType,
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : undefined,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create route";
      toast.error(errorMessage);
      console.error("Route creation error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (routesLoading || memberLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Filter routes
  const routesArray = Array.isArray(allRoutes) ? allRoutes : [];
  const filteredRoutes = routesArray.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.startLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || route.difficulty === filterDifficulty;
    const matchesType = !filterType || route.routeType === filterType;
    
    return matchesSearch && matchesDifficulty && matchesType;
  });

  const content = (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600 mt-2">Discover and share amazing cycling routes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Route
        </button>
      </div>

      {/* Create Route Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Route</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GPX File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPX File *
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> your GPX file
                    </p>
                    <p className="text-xs text-gray-500">GPX files only</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gpx"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>
              </div>
              {formData.gpxFile && (
                <div className="mt-2 flex items-center">
                  {parsing ? (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm">Parsing GPX file...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">
                      ✓ {formData.gpxFile.name} selected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Route Information (Auto-filled from GPX) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Type *
                </label>
                <select
                  required
                  value={formData.routeType}
                  onChange={(e) => setFormData({ ...formData, routeType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="road">Road</option>
                  <option value="mountain">Mountain</option>
                  <option value="gravel">Gravel</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Elevation Gain (m) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.elevation}
                  onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  required
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.startLocation}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Location
                </label>
                <input
                  type="text"
                  value={formData.endLocation}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="scenic, challenging, family-friendly"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Route Preview Info */}
            {showMap && gpxData && (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">Route Preview</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {gpxData.name}</p>
                  <p><strong>Distance:</strong> {gpxData.distance}km</p>
                  <p><strong>Elevation Gain:</strong> {gpxData.elevation}m</p>
                  <p><strong>GPS Points:</strong> {gpxData.coordinates.length}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={uploading || parsing || createRoute.isPending}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading..." : parsing ? "Processing..." : createRoute.isPending ? "Creating..." : "Create Route"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setGpxData(null);
                  setShowMap(false);
                  setParsing(false);
                }}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search routes..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="road">Road</option>
              <option value="mountain">Mountain</option>
              <option value="gravel">Gravel</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterDifficulty("");
                setFilterType("");
              }}
              className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map((route) => (
          <div key={route.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-semibold text-gray-900">{route.name}</h4>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                route.difficulty === "easy" ? "bg-green-100 text-green-800" :
                route.difficulty === "moderate" ? "bg-yellow-100 text-yellow-800" :
                route.difficulty === "hard" ? "bg-orange-100 text-orange-800" :
                "bg-red-100 text-red-800"
              }`}>
                {route.difficulty}
              </span>
            </div>
            
            {route.description && (
              <p className="text-gray-600 text-sm mb-4">{route.description}</p>
            )}
            
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Distance
                </span>
                <span className="font-medium">{route.distance}km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-6m0 0l5 6m-5-6v18" />
                  </svg>
                  Elevation
                </span>
                <span className="font-medium">{route.elevation}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Start
                </span>
                <span className="font-medium">{route.startLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Type
                </span>
                <span className="font-medium capitalize">{route.routeType}</span>
              </div>
            </div>
            
            {route.tags && route.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {route.tags.map((tag, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex gap-3">
              <Link
                href={`/routes/${route.id}`}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-center font-medium text-sm"
              >
                View Route
              </Link>
              {route.gpxObjectName && (
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/upload/gpx/url?objectName=${encodeURIComponent(route.gpxObjectName!)}`);
                      const { url } = await response.json();
                      window.open(url, '_blank');
                    } catch (error) {
                      toast.error("Failed to get download URL");
                    }
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Download GPX"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              Added by {route.uploaderName} • {route.eventCount} events
            </div>
          </div>
        ))}
      </div>
      
      {filteredRoutes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No routes found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or add a new route!</p>
        </div>
      )}
    </div>
  );

  if (showMemberProfileOverlay) {
    return <MemberProfileOverlay>{content}</MemberProfileOverlay>;
  }

  if (showPaidOverlay) {
    return <PaidMemberOverlay>{content}</PaidMemberOverlay>;
  }

  return content;
}
