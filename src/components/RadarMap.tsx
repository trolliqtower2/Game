import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { OpenerVisit } from '../types/tracker';
import { MapPin, Navigation, Eye, Crosshair, Layers, Radio } from 'lucide-react';

interface RadarMapProps {
  visits: OpenerVisit[];
  selectedVisit: OpenerVisit | null;
  onSelectVisit: (visit: OpenerVisit) => void;
}

export const RadarMap: React.FC<RadarMapProps> = ({
  visits,
  selectedVisit,
  onSelectVisit,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showSweep, setShowSweep] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30, 0],
      zoom: 2.2,
      minZoom: 1.8,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';
    let maxZoom = 19;

    if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = 'abc';
    } else if (mapStyle === 'streets') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
    }

    L.tileLayer(tileUrl, {
      subdomains,
      maxZoom,
    }).addTo(map);
  }, [mapStyle]);

  // Update Markers when visits or selectedVisit change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const circlesGroup = circlesLayerRef.current;
    if (!map || !markersGroup || !circlesGroup) return;

    markersGroup.clearLayers();
    circlesGroup.clearLayers();

    if (visits.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    visits.forEach((v) => {
      const lat = v.geo.latitude;
      const lng = v.geo.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      const isSelected = selectedVisit?.id === v.id;
      const isOnline = v.isOnline;
      const isGps = v.geo.isGps;

      // Pulse color
      const colorClass = isGps
        ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/50'
        : v.geo.isVpnOrProxy
        ? 'bg-rose-500 border-rose-300 shadow-rose-500/50'
        : 'bg-cyan-500 border-cyan-300 shadow-cyan-500/50';

      const ringClass = isGps ? 'bg-emerald-400' : 'bg-cyan-400';

      // Custom pulsing HTML marker
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isOnline
              ? `<div class="absolute -inset-2.5 rounded-full ${ringClass} opacity-75 animate-ping"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center w-6 h-6 rounded-full border-2 text-white font-mono text-[9px] font-bold shadow-lg transition-transform duration-200 group-hover:scale-125 ${
            isSelected ? 'scale-125 ring-4 ring-indigo-400' : ''
          } ${colorClass}">
            ${isGps ? 'GPS' : 'IP'}
          </div>
          <div class="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-slate-100 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-slate-700 z-50">
            ${v.geo.city || 'Unknown'}, ${v.geo.countryCode}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-radar-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectVisit(v);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="font-size: 13px;">${v.geo.city || 'Unknown City'}, ${v.geo.country}</strong>
            <span style="font-size: 10px; background: ${isGps ? '#10b981' : '#06b6d4'}; color: white; padding: 1px 6px; border-radius: 9999px;">
              ${isGps ? 'GPS Precision' : 'IP Geo'}
            </span>
          </div>
          <div style="margin-bottom: 3px;"><strong>IP:</strong> <span style="font-family: monospace;">${v.geo.ip}</span></div>
          <div style="margin-bottom: 3px;"><strong>Device:</strong> ${v.device.browser} on ${v.device.os}</div>
          <div style="margin-bottom: 3px;"><strong>Link:</strong> ${v.linkTitle}</div>
          <div style="margin-bottom: 6px;"><strong>Status:</strong> ${isOnline ? '<span style="color:#059669;font-weight:bold;">● Active Now</span>' : 'Offline'}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>
      `);

      marker.addTo(markersGroup);

      // Draw accuracy circle if accuracy is known
      if (v.geo.accuracy && v.geo.accuracy > 0) {
        const circle = L.circle([lat, lng], {
          radius: Math.min(v.geo.accuracy, 5000),
          color: isGps ? '#10b981' : '#06b6d4',
          fillColor: isGps ? '#10b981' : '#06b6d4',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: isGps ? undefined : '4, 4',
        });
        circle.addTo(circlesGroup);
      }
    });

    // If a visit is explicitly selected, smoothly pan to it
    if (selectedVisit && selectedVisit.geo.latitude && selectedVisit.geo.longitude) {
      map.flyTo([selectedVisit.geo.latitude, selectedVisit.geo.longitude], 12, {
        duration: 1.2,
      });
    }
  }, [visits, selectedVisit, onSelectVisit]);

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || visits.length === 0) return;
    const validCoords: L.LatLngTuple[] = visits
      .filter((v) => typeof v.geo.latitude === 'number' && typeof v.geo.longitude === 'number')
      .map((v) => [v.geo.latitude, v.geo.longitude] as L.LatLngTuple);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  };

  const handleResetWorld = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([30, 0], 2.2, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-[460px] md:h-[540px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* High-tech Radar Sweep Animation Overlay (optional visual radar effect) */}
      {showSweep && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-cyan-500/40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-cyan-500/30"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full border border-cyan-500/20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] origin-center animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_310deg,rgba(6,182,212,0.35)_360deg)] rounded-full"></div>
        </div>
      )}

      {/* Top Map HUD Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs font-mono text-slate-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-semibold text-slate-200">RADAR HUD</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">{visits.length}</span> openers logged
        </div>

        {/* Style selector */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-xl p-0.5 border border-slate-700/80 shadow-lg text-xs">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === 'dark'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dark Grid
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === 'satellite'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === 'streets'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Street Map
          </button>
        </div>
      </div>

      {/* Right Map Action Buttons */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={handleFitAll}
          title="Zoom to fit all opener locations"
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center justify-center"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={handleResetWorld}
          title="Reset to World View"
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center justify-center"
        >
          <Navigation className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setShowSweep(!showSweep)}
          title="Toggle Radar Sweep Animation"
          className={`p-2.5 rounded-xl backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center justify-center border ${
            showSweep
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
          }`}
        >
          <Radio className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-3 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30"></span>
          <span>High-Accuracy GPS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30"></span>
          <span>IP Geolocation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-rose-500/30"></span>
          <span>VPN / Datacenter</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-400 font-medium">Online Live</span>
        </div>
      </div>
    </div>
  );
};
