import React, { useState } from 'react';
import { X, Code, Copy, Check, Globe, Image as ImageIcon } from 'lucide-react';
import { TrackingLink } from '../types/tracker';

interface EmbedSnippetModalProps {
  links: TrackingLink[];
  onClose: () => void;
}

export const EmbedSnippetModal: React.FC<EmbedSnippetModalProps> = ({ links, onClose }) => {
  const [selectedLinkSlug, setSelectedLinkSlug] = useState<string>(
    links[0]?.slug || 'direct-access'
  );
  const [activeTab, setActiveTab] = useState<'script' | 'pixel'>('script');
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const scriptCode = `<!-- GeoRadar Website Opener & Location Tracker -->
<script>
(function() {
  var endpoint = "${origin}/api/track";
  var slug = "${selectedLinkSlug}";
  fetch("https://ipwho.is/")
    .then(function(r) { return r.json(); })
    .then(function(geo) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkSlug: slug,
          geo: {
            ip: geo.ip,
            country: geo.country,
            countryCode: geo.country_code,
            region: geo.region,
            city: geo.city,
            latitude: geo.latitude,
            longitude: geo.longitude,
            isp: geo.connection ? geo.connection.isp : "",
            isVpnOrProxy: !!(geo.security && geo.security.vpn)
          },
          device: {
            deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
            os: navigator.platform,
            browser: navigator.userAgent.indexOf("Chrome") > -1 ? "Chrome" : "Browser",
            screenResolution: screen.width + "x" + screen.height,
            language: navigator.language,
            userAgent: navigator.userAgent
          },
          referrer: document.referrer || "Direct External Site"
        })
      });
    }).catch(function(e) { console.error("GeoRadar tracker error", e); });
})();
</script>`;

  const pixelCode = `<!-- GeoRadar 1x1 Invisible Tracking Pixel (Works in Emails, Markdown & HTML) -->
<img src="${origin}/api/track/pixel/${selectedLinkSlug}.gif" width="1" height="1" alt="" style="display:none;" />`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Embed Tracker on Any Website</h3>
              <p className="text-xs text-slate-400">
                Track visitor locations from any external website, blog, or email newsletter
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

        <div className="p-6 space-y-5">
          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Link Campaign to Attribute Visits:
            </label>
            <select
              value={selectedLinkSlug}
              onChange={(e) => setSelectedLinkSlug(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {links.map((link) => (
                <option key={link.id} value={link.slug}>
                  {link.title} ({link.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'script'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>JavaScript Tag (Full Telemetry)</span>
            </button>
            <button
              onClick={() => setActiveTab('pixel')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'pixel'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>1x1 Tracking Pixel (Emails & HTML)</span>
            </button>
          </div>

          {/* Snippet box */}
          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {activeTab === 'script' ? scriptCode : pixelCode}
            </pre>
            <button
              onClick={() => handleCopy(activeTab === 'script' ? scriptCode : pixelCode)}
              className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-slate-200 block">How it works:</strong>
            <p>
              1. Paste this snippet right before the <code className="text-cyan-300">&lt;/body&gt;</code> tag of your website or inside an email.
            </p>
            <p>
              2. Whenever anyone opens your page, their coordinates, city, country, IP, and device telemetry stream live directly into your GeoRadar map!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
