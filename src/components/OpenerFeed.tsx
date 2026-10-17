import React, { useState } from 'react';
import { OpenerVisit, TrackingLink } from '../types/tracker';
import {
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Smartphone,
  Monitor,
  Laptop,
  Compass,
  Clock,
  ShieldAlert,
  Radio,
  ChevronRight,
} from 'lucide-react';

interface OpenerFeedProps {
  visits: OpenerVisit[];
  links: TrackingLink[];
  selectedVisit: OpenerVisit | null;
  onSelectVisit: (visit: OpenerVisit) => void;
  onViewModal: (visit: OpenerVisit) => void;
}

export const OpenerFeed: React.FC<OpenerFeedProps> = ({
  visits,
  links,
  selectedVisit,
  onSelectVisit,
  onViewModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'gps' | 'online' | 'vpn'>('all');

  const filteredVisits = visits.filter((v) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      v.geo.ip.toLowerCase().includes(term) ||
      v.geo.city.toLowerCase().includes(term) ||
      v.geo.country.toLowerCase().includes(term) ||
      v.linkTitle.toLowerCase().includes(term) ||
      v.device.browser.toLowerCase().includes(term) ||
      v.device.os.toLowerCase().includes(term);

    // Campaign
    const matchesCampaign = selectedCampaign === 'all' || v.linkId === selectedCampaign;

    // Filter Type
    let matchesType = true;
    if (filterType === 'gps') matchesType = v.geo.isGps;
    else if (filterType === 'online') matchesType = v.isOnline;
    else if (filterType === 'vpn') matchesType = Boolean(v.geo.isVpnOrProxy);

    return matchesSearch && matchesCampaign && matchesType;
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Tablet':
        return <Laptop className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const formatRelativeTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const min = Math.floor(diff / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-800/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base">Live Opener Log</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredVisits.length} of {visits.length}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('online')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'online'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online</span>
            </button>
            <button
              onClick={() => setFilterType('gps')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'gps'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GPS Only
            </button>
            <button
              onClick={() => setFilterType('vpn')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'vpn'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VPN/Datacenter
            </button>
          </div>
        </div>

        {/* Search bar and Campaign selector */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by IP, city, country, browser, OS..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Link Campaigns</option>
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
        {filteredVisits.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No opener visits match the current filter criteria.
          </div>
        ) : (
          filteredVisits.map((v) => {
            const isSelected = selectedVisit?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => onSelectVisit(v)}
                className={`p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 ${
                  isSelected ? 'bg-cyan-950/20 border-l-4 border-l-cyan-400' : ''
                }`}
              >
                {/* Left Opener Main Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      v.geo.isGps
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {v.geo.city || 'Unknown City'}, {v.geo.country}
                      </span>

                      {v.isOnline && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/90 border border-emerald-800/80 px-2 py-0.2 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          Online
                        </span>
                      )}

                      {v.geo.isGps ? (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.2 rounded-full">
                          GPS Accuracy {v.geo.accuracy ? `±${v.geo.accuracy}m` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.2 rounded-full">
                          IP Geo
                        </span>
                      )}

                      {v.geo.isVpnOrProxy && (
                        <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.2 rounded-full flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          VPN/Hosting
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="font-mono text-cyan-300 font-medium">{v.geo.ip}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(v.device.deviceType)}
                        <span>
                          {v.device.browser} on {v.device.os}
                        </span>
                      </div>
                      <span>•</span>
                      <span className="text-indigo-300 truncate max-w-[180px]">
                        {v.linkTitle}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500">
                      Coordinates: {v.geo.latitude.toFixed(4)}, {v.geo.longitude.toFixed(4)}
                      {v.geo.isp && ` • Carrier: ${v.geo.isp}`}
                    </div>
                  </div>
                </div>

                {/* Right Details & Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                  <div className="text-right">
                    <span className="text-xs text-slate-300 font-medium block">
                      {formatRelativeTime(v.timestamp)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Dwell: {v.dwellTimeSeconds}s
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewModal(v);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-cyan-900/60 text-slate-200 hover:text-cyan-300 rounded-xl text-xs font-semibold border border-slate-700/80 hover:border-cyan-600 transition-all"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
