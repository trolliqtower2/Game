import React, { useState, useEffect, useCallback } from 'react';
import { TrackingLink, OpenerVisit } from './types/tracker';
import { RadarMap } from './components/RadarMap';
import { OpenerFeed } from './components/OpenerFeed';
import { StatsOverview } from './components/StatsOverview';
import { OpenerModal } from './components/OpenerModal';
import { LinkManagerModal } from './components/LinkManagerModal';
import { EmbedSnippetModal } from './components/EmbedSnippetModal';
import { OpenerLanding } from './components/OpenerLanding';
import { soundManager } from './utils/audio';
import { collectDeviceTelemetry, fetchIpGeoLocation, requestGpsLocation } from './utils/geo';
import {
  Radio,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  Code,
  Crosshair,
  Link as LinkIcon,
  Shield,
  Zap,
  Globe,
  Bell,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  const [openerSlug, setOpenerSlug] = useState<string | null>(null);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [visits, setVisits] = useState<OpenerVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<OpenerVisit | null>(null);
  const [modalVisit, setModalVisit] = useState<OpenerVisit | null>(null);
  const [showLinkManager, setShowLinkManager] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Check URL parameters on mount to determine if this is an opener or the owner dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t') || params.get('track');
    if (t) {
      setOpenerSlug(t);
    } else {
      const match = window.location.pathname.match(/^\/t\/(.+)/);
      if (match && match[1]) {
        setOpenerSlug(match[1]);
      }
    }
  }, []);

  // Fetch Links
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (err) {
      console.error('Failed to fetch links:', err);
    }
  }, []);

  // Fetch Visits
  const fetchVisits = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const res = await fetch('/api/visits');
        if (res.ok) {
          const data: OpenerVisit[] = await res.json();
          // Detect new visits and play sonar alert
          setVisits((prev) => {
            if (prev.length > 0 && data.length > prev.length) {
              const newest = data[0];
              soundManager.playRadarPing();
              setLastAlert(`New opener detected from ${newest.geo.city || 'Unknown'}, ${newest.geo.country}!`);
              setTimeout(() => setLastAlert(null), 6000);
            }
            return data;
          });
        }
      } catch (err) {
        console.error('Failed to fetch visits:', err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLinks();
    fetchVisits();
  }, [fetchLinks, fetchVisits]);

  // Polling interval
  useEffect(() => {
    if (!autoRefresh || openerSlug) return;
    const interval = setInterval(() => {
      fetchVisits(true);
      fetchLinks();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, openerSlug, fetchVisits, fetchLinks]);

  // Toggle audio
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    if (next) soundManager.playRadarPing();
  };

  // Create link
  const handleCreateLink = async (payload: {
    title: string;
    targetUrl: string;
    customSlug?: string;
    decoyType: 'instant' | 'verify' | 'cloud_file' | 'meeting' | 'status';
    customPromptMessage?: string;
  }) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchLinks();
      soundManager.playAlertChime();
    }
  };

  // Delete link
  const handleDeleteLink = async (id: string) => {
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchLinks();
    }
  };

  // Clear visits
  const handleClearVisits = async () => {
    if (window.confirm('Clear all recorded opener logs?')) {
      await fetch('/api/visits', { method: 'DELETE' });
      await fetchVisits();
      setSelectedVisit(null);
      setModalVisit(null);
    }
  };

  // Seed sample data
  const handleSeedSample = async () => {
    await fetch('/api/visits/seed', { method: 'POST' });
    await fetchLinks();
    await fetchVisits();
    soundManager.playRadarPing();
  };

  // Simulate Opener / Test current device
  const handleTestSelfLocation = async (link?: TrackingLink) => {
    try {
      setIsSimulating(true);
      const targetLink = link || links[0];
      const telemetry = await collectDeviceTelemetry();
      const ipGeo = await fetchIpGeoLocation();

      // Attempt high precision GPS if user permits
      let finalGeo = { ...ipGeo };
      try {
        const gps = await requestGpsLocation(6000);
        finalGeo = {
          ...finalGeo,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          isGps: true,
        };
      } catch {
        // Fallback to IP Geo
      }

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkSlug: targetLink ? targetLink.slug : 'test-link',
          geo: finalGeo,
          device: telemetry,
          referrer: 'Owner Self-Test Simulation',
          notes: finalGeo.isGps ? 'Owner test: Real GPS coordinates' : 'Owner test: IP Geolocation',
        }),
      });

      await fetchVisits();
      await fetchLinks();
      soundManager.playRadarPing();
      setLastAlert(`Test Opener logged! Positioned at ${finalGeo.city}, ${finalGeo.country}`);
      setTimeout(() => setLastAlert(null), 5000);
    } finally {
      setIsSimulating(false);
    }
  };

  // If URL indicates this is an opener clicking a trackable link
  if (openerSlug) {
    return (
      <OpenerLanding
        slug={openerSlug}
        onReturnToDashboard={() => {
          setOpenerSlug(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-xl px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Crosshair className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider text-white">GeoRadar</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Owner Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Live Opener & Visitor Location Tracking
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Mute radar sonar sounds' : 'Enable radar sonar sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                autoRefresh
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle 8-second live polling"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <span className="hidden md:inline">{autoRefresh ? 'Live Sync' : 'Paused'}</span>
            </button>

            {/* Embed code button */}
            <button
              onClick={() => setShowEmbedModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Embed Snippet</span>
            </button>

            {/* Test My Device Location button */}
            <button
              onClick={() => handleTestSelfLocation()}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Test opener location detection on your current device"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSimulating ? 'Detecting...' : 'Test as Opener'}</span>
            </button>

            {/* Manage Links button */}
            <button
              onClick={() => setShowLinkManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Tracking Links ({links.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Alert Toast */}
      {lastAlert && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-cyan-950 border border-cyan-500/50 rounded-2xl shadow-2xl text-cyan-100 text-xs font-semibold backdrop-blur-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{lastAlert}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* 1. Stats and Metrics */}
        <StatsOverview
          visits={visits}
          links={links}
          onClearVisits={handleClearVisits}
          onSeedSample={handleSeedSample}
        />

        {/* 2. Interactive Map Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Geographic Radar</h2>
              <span className="text-xs text-slate-400">
                • Click any marker or circle to inspect coordinates and telemetry
              </span>
            </div>
            {selectedVisit && (
              <button
                onClick={() => setSelectedVisit(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Map Focus
              </button>
            )}
          </div>

          <RadarMap
            visits={visits}
            selectedVisit={selectedVisit}
            onSelectVisit={(visit) => {
              setSelectedVisit(visit);
              setModalVisit(visit);
            }}
          />
        </section>

        {/* 3. Live Opener Feed and Telemetry Table */}
        <section className="space-y-2">
          <OpenerFeed
            visits={visits}
            links={links}
            selectedVisit={selectedVisit}
            onSelectVisit={(v) => setSelectedVisit(v)}
            onViewModal={(v) => setModalVisit(v)}
          />
        </section>
      </main>

      {/* Modals */}
      <OpenerModal visit={modalVisit} onClose={() => setModalVisit(null)} />

      {showLinkManager && (
        <LinkManagerModal
          links={links}
          onClose={() => setShowLinkManager(false)}
          onCreateLink={handleCreateLink}
          onDeleteLink={handleDeleteLink}
          onTestOpener={(link) => {
            setShowLinkManager(false);
            handleTestSelfLocation(link);
          }}
        />
      )}

      {showEmbedModal && (
        <EmbedSnippetModal links={links} onClose={() => setShowEmbedModal(false)} />
      )}
    </div>
  );
}
