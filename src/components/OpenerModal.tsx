import React from 'react';
import { OpenerVisit } from '../types/tracker';
import {
  X,
  MapPin,
  ExternalLink,
  Shield,
  ShieldAlert,
  Smartphone,
  Laptop,
  Monitor,
  Battery,
  Cpu,
  Wifi,
  Globe,
  Clock,
  Compass,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface OpenerModalProps {
  visit: OpenerVisit | null;
  onClose: () => void;
}

export const OpenerModal: React.FC<OpenerModalProps> = ({ visit, onClose }) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!visit) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gmapsUrl = `https://www.google.com/maps?q=${visit.geo.latitude},${visit.geo.longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${visit.geo.latitude}&mlon=${visit.geo.longitude}#map=16/${visit.geo.latitude}/${visit.geo.longitude}`;

  const formatDwellTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                visit.geo.isGps
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {visit.geo.city || 'Unknown City'}, {visit.geo.country}
                </h3>
                {visit.isOnline && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Online Now
                  </span>
                )}
                {visit.geo.isGps && (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-700 px-2 py-0.5 rounded-full">
                    GPS Meter Precision
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Log ID: {visit.id} • Opened {new Date(visit.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Top Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/90">
              <span className="text-xs text-slate-400 font-medium block">IP Address</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-sm font-bold text-cyan-300">{visit.geo.ip}</span>
                <button
                  onClick={() => handleCopy(visit.geo.ip, 'ip')}
                  className="text-slate-400 hover:text-cyan-300"
                >
                  {copiedKey === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/90">
              <span className="text-xs text-slate-400 font-medium block">Device / OS</span>
              <span className="font-semibold text-sm text-slate-200 mt-1 block truncate">
                {visit.device.browser} • {visit.device.os}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/90">
              <span className="text-xs text-slate-400 font-medium block">Time on Site</span>
              <span className="font-semibold text-sm text-emerald-300 mt-1 block">
                {formatDwellTime(visit.dwellTimeSeconds)}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/90">
              <span className="text-xs text-slate-400 font-medium block">Link Campaign</span>
              <span className="font-semibold text-sm text-indigo-300 mt-1 block truncate" title={visit.linkTitle}>
                {visit.linkTitle}
              </span>
            </div>
          </div>

          {/* Section 1: Geolocation & Map Coordinates */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <MapPin className="w-4 h-4" />
                <span>Geographic Position & Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg transition-colors"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <span>OSM</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Coordinates (Lat, Lng):</span>
                <p className="font-mono text-slate-100 font-semibold mt-0.5">
                  {visit.geo.latitude.toFixed(6)}, {visit.geo.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Accuracy Radius:</span>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {visit.geo.accuracy ? `±${visit.geo.accuracy} meters` : 'City / ISP Estimated (~5km)'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Location Source:</span>
                <p className="font-semibold mt-0.5">
                  {visit.geo.isGps ? (
                    <span className="text-emerald-400 font-bold">● High-Accuracy GPS Sensor</span>
                  ) : (
                    <span className="text-cyan-400">● IP BGP Routing Geolocation</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Region & State:</span>
                <p className="text-slate-100 font-semibold mt-0.5">{visit.geo.region || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Postal / ZIP Code:</span>
                <p className="text-slate-100 font-semibold mt-0.5">{visit.geo.postal || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Opener Timezone:</span>
                <p className="text-slate-100 font-semibold mt-0.5">{visit.geo.timezone || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Section 2: ISP, ASN & Security Checks */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm border-b border-slate-800 pb-2">
              <Globe className="w-4 h-4" />
              <span>Network Carrier & Routing Intelligence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">ISP / Carrier:</span>
                <p className="text-slate-100 font-semibold mt-0.5">{visit.geo.isp || 'Unknown ISP'}</p>
              </div>
              <div>
                <span className="text-slate-400">Autonomous System (ASN):</span>
                <p className="text-slate-100 font-mono font-semibold mt-0.5">{visit.geo.asn || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">VPN / Datacenter / Proxy:</span>
                <p className="mt-0.5">
                  {visit.geo.isVpnOrProxy ? (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Detected / Datacenter IP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      Residential / Cellular Carrier
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Hardware & Device Fingerprint */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm border-b border-slate-800 pb-2">
              <Cpu className="w-4 h-4" />
              <span>Hardware & Browser Telemetry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Device Form:</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-100 mt-0.5">
                  {visit.device.deviceType === 'Mobile' ? (
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{visit.device.deviceType}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Screen Resolution:</span>
                <p className="font-semibold text-slate-100 mt-0.5">{visit.device.screenResolution}</p>
              </div>

              <div>
                <span className="text-slate-400">CPU Concurrency:</span>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {visit.device.cpuCores ? `${visit.device.cpuCores} Virtual Cores` : 'Unknown'}
                </p>
              </div>

              <div>
                <span className="text-slate-400">RAM / Memory:</span>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {visit.device.deviceMemoryGb ? `${visit.device.deviceMemoryGb} GB` : 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Battery Status:</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-100 mt-0.5">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {visit.device.batteryLevel !== undefined
                      ? `${visit.device.batteryLevel}% ${visit.device.isCharging ? '(Charging)' : ''}`
                      : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Network Type:</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-100 mt-0.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{visit.device.connectionType || 'Broadband'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400">System Language:</span>
                <p className="font-semibold text-slate-100 mt-0.5">{visit.device.language}</p>
              </div>

              <div>
                <span className="text-slate-400">Orientation:</span>
                <p className="font-semibold text-slate-100 mt-0.5">{visit.device.orientation || 'Landscape'}</p>
              </div>
            </div>

            {/* GPU Renderer */}
            {visit.device.gpuRenderer && (
              <div className="pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">Graphics GPU Renderer:</span>
                <p className="font-mono text-cyan-300 mt-0.5 break-all">{visit.device.gpuRenderer}</p>
              </div>
            )}

            {/* User Agent */}
            <div className="pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Full Raw User-Agent:</span>
                <button
                  onClick={() => handleCopy(visit.device.userAgent, 'ua')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300"
                >
                  {copiedKey === 'ua' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy UA</span>
                </button>
              </div>
              <div className="p-2 bg-slate-950 font-mono text-[11px] text-slate-300 rounded border border-slate-800/90 break-all select-all">
                {visit.device.userAgent}
              </div>
            </div>
          </div>

          {/* Section 4: Session & Referrer */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
            <span className="text-slate-400 font-semibold block">Referrer & Destination:</span>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <span className="text-slate-500">HTTP Referrer:</span>
                <p className="font-mono text-slate-200 mt-0.5">{visit.referrer || 'Direct entry'}</p>
              </div>
              <div className="flex-1">
                <span className="text-slate-500">Destination Redirect:</span>
                <p className="font-mono text-indigo-300 mt-0.5 truncate">
                  {visit.destinationUrl || 'None / Decoy View'}
                </p>
              </div>
            </div>
            {visit.notes && (
              <div className="pt-2 text-slate-400 italic">
                <span>Note: </span>
                {visit.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
