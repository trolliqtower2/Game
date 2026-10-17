import React from 'react';
import { OpenerVisit, TrackingLink } from '../types/tracker';
import {
  Users,
  Crosshair,
  Radio,
  Globe,
  Compass,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface StatsOverviewProps {
  visits: OpenerVisit[];
  links: TrackingLink[];
  onClearVisits: () => void;
  onSeedSample: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  visits,
  links,
  onClearVisits,
  onSeedSample,
}) => {
  const totalVisits = visits.length;
  const uniqueIps = new Set(visits.map((v) => v.geo.ip)).size;
  const activeNow = visits.filter((v) => v.isOnline).length;
  const gpsVisits = visits.filter((v) => v.geo.isGps).length;
  const gpsPercentage = totalVisits > 0 ? Math.round((gpsVisits / totalVisits) * 100) : 0;

  // Top country
  const countryCounts: Record<string, number> = {};
  visits.forEach((v) => {
    const c = v.geo.country || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(visits, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `georadar-opener-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCsv = () => {
    const headers = [
      'Timestamp',
      'IP',
      'City',
      'Region',
      'Country',
      'Latitude',
      'Longitude',
      'Accuracy_Meters',
      'Is_GPS',
      'ISP',
      'Device_Type',
      'OS',
      'Browser',
      'Campaign',
      'Dwell_Seconds',
      'Referrer',
    ];

    const rows = visits.map((v) => [
      `"${v.timestamp}"`,
      `"${v.geo.ip}"`,
      `"${v.geo.city || ''}"`,
      `"${v.geo.region || ''}"`,
      `"${v.geo.country || ''}"`,
      v.geo.latitude,
      v.geo.longitude,
      v.geo.accuracy || '',
      v.geo.isGps ? 'true' : 'false',
      `"${v.geo.isp || ''}"`,
      `"${v.device.deviceType}"`,
      `"${v.device.os}"`,
      `"${v.device.browser}"`,
      `"${v.linkTitle}"`,
      v.dwellTimeSeconds,
      `"${v.referrer || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `georadar-openers-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Visits */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Openers</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalVisits}</span>
            <span className="text-xs text-slate-500">({uniqueIps} unique IPs)</span>
          </div>
        </div>

        {/* Card 2: Active Online Now */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Live Active Now</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl relative">
              {activeNow > 0 && <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-60 animate-ping"></span>}
              <Radio className="w-4 h-4 relative" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{activeNow}</span>
            <span className="text-xs text-slate-500">browsing page</span>
          </div>
        </div>

        {/* Card 3: GPS Pinpoint Rate */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">GPS Pinpoint Rate</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Crosshair className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-300 font-mono">{gpsPercentage}%</span>
            <span className="text-xs text-slate-500">({gpsVisits} exact GPS)</span>
          </div>
        </div>

        {/* Card 4: Top Region */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Top Opener Country</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-100 truncate block">{topCountry}</span>
          </div>
        </div>
      </div>

      {/* Action Bar for Exports and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSeedSample}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Load demonstration visits across various continents"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Sample Data</span>
          </button>
          <button
            onClick={onClearVisits}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
