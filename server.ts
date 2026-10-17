import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Storage directory
const DATA_DIR = path.resolve(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredData {
  links: Array<{
    id: string;
    slug: string;
    title: string;
    targetUrl: string;
    decoyType: string;
    customPromptMessage?: string;
    createdAt: string;
    visitsCount: number;
    lastVisitAt?: string;
    active: boolean;
  }>;
  visits: Array<{
    id: string;
    linkId: string;
    linkTitle: string;
    timestamp: string;
    lastPingTimestamp?: string;
    dwellTimeSeconds: number;
    isOnline: boolean;
    geo: {
      ip: string;
      country: string;
      countryCode: string;
      region: string;
      city: string;
      postal?: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      isGps: boolean;
      timezone?: string;
      isp?: string;
      org?: string;
      asn?: string;
      isVpnOrProxy?: boolean;
    };
    device: {
      deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
      os: string;
      osVersion?: string;
      browser: string;
      browserVersion?: string;
      screenResolution: string;
      colorDepth?: number;
      orientation?: string;
      language: string;
      languages?: string[];
      batteryLevel?: number;
      isCharging?: boolean;
      cpuCores?: number;
      deviceMemoryGb?: number;
      connectionType?: string;
      gpuRenderer?: string;
      userAgent: string;
    };
    referrer: string;
    destinationUrl?: string;
    notes?: string;
  }>;
}

// Initial seed data with realistic visitor entries
const INITIAL_DATA: StoredData = {
  links: [
    {
      id: 'lnk_doc_preview',
      slug: 'project-specs',
      title: 'Confidential Project Specs 2026',
      targetUrl: 'https://docs.google.com',
      decoyType: 'verify',
      customPromptMessage: 'Verify location identity to decrypt document cache',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      visitsCount: 4,
      lastVisitAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      active: true,
    },
    {
      id: 'lnk_zoom_invite',
      slug: 'meeting-room-7',
      title: 'Executive Sync Video Bridge',
      targetUrl: 'https://zoom.us',
      decoyType: 'meeting',
      customPromptMessage: 'Waiting for host to authenticate regional room...',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      visitsCount: 2,
      lastVisitAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      active: true,
    },
    {
      id: 'lnk_cloud_transfer',
      slug: 'download-archive',
      title: 'Encrypted Media Asset Archive.zip',
      targetUrl: 'https://drive.google.com',
      decoyType: 'cloud_file',
      customPromptMessage: 'Connecting to closest CDN edge server...',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      visitsCount: 5,
      lastVisitAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      active: true,
    },
  ],
  visits: [
    {
      id: 'v_lon_01',
      linkId: 'lnk_doc_preview',
      linkTitle: 'Confidential Project Specs 2026',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      lastPingTimestamp: new Date(Date.now() - 1000 * 15).toISOString(),
      dwellTimeSeconds: 165,
      isOnline: true,
      geo: {
        ip: '185.199.108.153',
        country: 'United Kingdom',
        countryCode: 'GB',
        region: 'England',
        city: 'London',
        postal: 'EC1A 1BB',
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 12,
        isGps: true,
        timezone: 'Europe/London',
        isp: 'British Telecommunications PLC',
        org: 'BT Internet',
        asn: 'AS2856',
        isVpnOrProxy: false,
      },
      device: {
        deviceType: 'Desktop',
        os: 'macOS 15.1',
        browser: 'Safari',
        browserVersion: '18.1',
        screenResolution: '2560x1440 (2x DPR)',
        colorDepth: 30,
        orientation: 'landscape-primary',
        language: 'en-GB',
        languages: ['en-GB', 'en-US'],
        batteryLevel: 94,
        isCharging: true,
        cpuCores: 10,
        deviceMemoryGb: 16,
        connectionType: '4G (WiFi)',
        gpuRenderer: 'Apple M3 Pro',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
      },
      referrer: 'https://mail.google.com/',
      destinationUrl: 'https://docs.google.com',
      notes: 'GPS permission allowed (high precision pinpoint)',
    },
    {
      id: 'v_nyc_02',
      linkId: 'lnk_doc_preview',
      linkTitle: 'Confidential Project Specs 2026',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      lastPingTimestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      dwellTimeSeconds: 180,
      isOnline: false,
      geo: {
        ip: '172.56.42.89',
        country: 'United States',
        countryCode: 'US',
        region: 'New York',
        city: 'New York',
        postal: '10001',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 18,
        isGps: true,
        timezone: 'America/New_York',
        isp: 'T-Mobile USA, Inc.',
        org: 'T-Mobile Cellular',
        asn: 'AS21928',
        isVpnOrProxy: false,
      },
      device: {
        deviceType: 'Mobile',
        os: 'iOS 18.2',
        browser: 'Safari',
        browserVersion: '18.2',
        screenResolution: '393x852 (3x DPR)',
        colorDepth: 24,
        orientation: 'portrait-primary',
        language: 'en-US',
        batteryLevel: 68,
        isCharging: false,
        cpuCores: 6,
        connectionType: '5G',
        gpuRenderer: 'Apple A18 Pro GPU',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
      },
      referrer: 'https://t.co/xyz99',
      destinationUrl: 'https://docs.google.com',
    },
    {
      id: 'v_tok_03',
      linkId: 'lnk_cloud_transfer',
      linkTitle: 'Encrypted Media Asset Archive.zip',
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      lastPingTimestamp: new Date(Date.now() - 1000 * 60 * 94).toISOString(),
      dwellTimeSeconds: 62,
      isOnline: false,
      geo: {
        ip: '133.242.18.9',
        country: 'Japan',
        countryCode: 'JP',
        region: 'Tokyo',
        city: 'Minato City',
        postal: '105-0011',
        latitude: 35.6586,
        longitude: 139.7454,
        isGps: false,
        timezone: 'Asia/Tokyo',
        isp: 'SAKURA Internet Inc.',
        org: 'SAKURA Cloud',
        asn: 'AS9370',
        isVpnOrProxy: true,
      },
      device: {
        deviceType: 'Desktop',
        os: 'Windows 10/11',
        browser: 'Chrome',
        browserVersion: '131.0',
        screenResolution: '1920x1080 (1.25x DPR)',
        colorDepth: 24,
        language: 'ja-JP',
        batteryLevel: 100,
        isCharging: true,
        cpuCores: 16,
        deviceMemoryGb: 32,
        connectionType: '4G',
        gpuRenderer: 'NVIDIA GeForce RTX 4070 / PCIe',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      referrer: 'Direct / Messaging App',
      destinationUrl: 'https://drive.google.com',
      notes: 'Datacenter / VPN IP detected',
    },
  ],
};

// Database helper
function readData(): StoredData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading db file:', err);
  }
  writeData(INITIAL_DATA);
  return INITIAL_DATA;
}

function writeData(data: StoredData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db file:', err);
  }
}

// Ensure DB is initialized
let store = readData();

// Extract client IP address from headers
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return req.socket.remoteAddress || '127.0.0.1';
}

// Transparent 1x1 GIF buffer for tracking pixels
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// --- API ENDPOINTS ---

// 1. Get all tracking links
app.get('/api/links', (_req: Request, res: Response) => {
  store = readData();
  res.json(store.links);
});

// 2. Create tracking link
app.post('/api/links', (req: Request, res: Response) => {
  const { title, targetUrl, decoyType, customPromptMessage, customSlug } = req.body;
  if (!title || !targetUrl) {
    return res.status(400).json({ error: 'Title and targetUrl are required' });
  }

  store = readData();
  const rawSlug = customSlug || Math.random().toString(36).substring(2, 9);
  const cleanSlug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const newLink = {
    id: `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    slug: cleanSlug,
    title: title.trim(),
    targetUrl: targetUrl.trim(),
    decoyType: decoyType || 'verify',
    customPromptMessage: customPromptMessage || '',
    createdAt: new Date().toISOString(),
    visitsCount: 0,
    active: true,
  };

  store.links.unshift(newLink);
  writeData(store);

  res.status(201).json(newLink);
});

// 3. Delete tracking link
app.delete('/api/links/:id', (req: Request, res: Response) => {
  store = readData();
  const { id } = req.params;
  store.links = store.links.filter((l) => l.id !== id);
  writeData(store);
  res.json({ success: true });
});

// 4. Get all opener visits
app.get('/api/visits', (req: Request, res: Response) => {
  store = readData();
  const { linkId, search } = req.query;

  let results = [...store.visits];
  // Calculate online status based on ping in the last 30 seconds
  const now = Date.now();
  results = results.map((v) => {
    const lastPing = v.lastPingTimestamp ? new Date(v.lastPingTimestamp).getTime() : new Date(v.timestamp).getTime();
    const isOnline = now - lastPing < 45000;
    return { ...v, isOnline };
  });

  if (linkId && typeof linkId === 'string') {
    results = results.filter((v) => v.linkId === linkId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (v) =>
        v.geo.ip.toLowerCase().includes(q) ||
        v.geo.city.toLowerCase().includes(q) ||
        v.geo.country.toLowerCase().includes(q) ||
        v.linkTitle.toLowerCase().includes(q) ||
        v.device.browser.toLowerCase().includes(q) ||
        v.device.os.toLowerCase().includes(q)
    );
  }

  // Sort descending by timestamp
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(results);
});

// 5. Record an opener visit (called by tracker landing or embed script)
app.post('/api/track', (req: Request, res: Response) => {
  store = readData();
  const serverIp = getClientIp(req);
  const { linkSlug, linkId, geo, device, referrer, destinationUrl, notes } = req.body;

  // Find corresponding link
  let matchedLink = store.links.find((l) => l.slug === linkSlug || l.id === linkId);

  // If link not found, create a generic direct visit link or associate with default
  if (!matchedLink) {
    matchedLink = store.links[0] || {
      id: 'lnk_direct',
      slug: 'direct-access',
      title: 'Direct Website Visitor',
      targetUrl: '/',
      decoyType: 'instant',
      createdAt: new Date().toISOString(),
      visitsCount: 0,
      active: true,
    };
  }

  // Use client geo if provided, otherwise resolve IP
  const finalGeo = {
    ip: geo?.ip || serverIp,
    country: geo?.country || 'Unknown',
    countryCode: geo?.countryCode || 'UN',
    region: geo?.region || '',
    city: geo?.city || 'Unknown City',
    postal: geo?.postal || '',
    latitude: geo?.latitude || 51.5074,
    longitude: geo?.longitude || -0.1278,
    accuracy: geo?.accuracy,
    isGps: Boolean(geo?.isGps),
    timezone: geo?.timezone || 'UTC',
    isp: geo?.isp || 'Internet Service Provider',
    org: geo?.org || '',
    asn: geo?.asn,
    isVpnOrProxy: Boolean(geo?.isVpnOrProxy),
  };

  const finalDevice = device || {
    deviceType: 'Unknown',
    os: 'Unknown',
    browser: 'Unknown',
    screenResolution: 'N/A',
    language: 'en-US',
    userAgent: req.headers['user-agent'] || 'Unknown',
  };

  const visitId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newVisit = {
    id: visitId,
    linkId: matchedLink.id,
    linkTitle: matchedLink.title,
    timestamp: nowIso,
    lastPingTimestamp: nowIso,
    dwellTimeSeconds: 0,
    isOnline: true,
    geo: finalGeo,
    device: finalDevice,
    referrer: referrer || (req.headers['referer'] as string) || 'Direct',
    destinationUrl: destinationUrl || matchedLink.targetUrl,
    notes: notes || (geo?.isGps ? 'GPS coordinates captured' : 'IP Geolocation captured'),
  };

  // Update visit count on link
  matchedLink.visitsCount = (matchedLink.visitsCount || 0) + 1;
  matchedLink.lastVisitAt = nowIso;

  store.visits.unshift(newVisit);
  // Cap at 1000 visits
  if (store.visits.length > 1000) {
    store.visits = store.visits.slice(0, 1000);
  }
  writeData(store);

  res.status(201).json({
    success: true,
    visitId,
    targetUrl: matchedLink.targetUrl,
    decoyType: matchedLink.decoyType,
    customPromptMessage: matchedLink.customPromptMessage,
  });
});

// 6. Opener heartbeat ping (tracks live dwell time)
app.post('/api/track/ping', (req: Request, res: Response) => {
  const { visitId, seconds } = req.body;
  if (!visitId) return res.status(400).json({ error: 'Missing visitId' });

  store = readData();
  const visit = store.visits.find((v) => v.id === visitId);
  if (visit) {
    visit.lastPingTimestamp = new Date().toISOString();
    visit.dwellTimeSeconds = typeof seconds === 'number' ? seconds : (visit.dwellTimeSeconds || 0) + 5;
    visit.isOnline = true;
    writeData(store);
  }
  res.json({ success: true });
});

// 7. Tracking pixel for email/external sites
app.get('/api/track/pixel/:slug.gif', (req: Request, res: Response) => {
  const { slug } = req.params;
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const ref = req.headers['referer'] || 'Email Client / Image Load';

  store = readData();
  const matchedLink = store.links.find((l) => l.slug === slug);
  const nowIso = new Date().toISOString();

  if (matchedLink) {
    matchedLink.visitsCount = (matchedLink.visitsCount || 0) + 1;
    matchedLink.lastVisitAt = nowIso;

    store.visits.unshift({
      id: `v_px_${Date.now()}`,
      linkId: matchedLink.id,
      linkTitle: matchedLink.title,
      timestamp: nowIso,
      dwellTimeSeconds: 1,
      isOnline: false,
      geo: {
        ip,
        country: 'Captured via Pixel',
        countryCode: 'PX',
        region: 'Image Request',
        city: 'Pending Lookup',
        latitude: 20 + Math.random() * 30,
        longitude: -40 + Math.random() * 80,
        isGps: false,
      },
      device: {
        deviceType: /Mobile|Android|iPhone/i.test(ua) ? 'Mobile' : 'Desktop',
        os: 'Detected from UA',
        browser: 'Email / Web Client',
        screenResolution: 'Pixel Tracking',
        language: 'en',
        userAgent: ua,
      },
      referrer: ref,
      destinationUrl: matchedLink.targetUrl,
      notes: 'Captured by 1x1 image pixel',
    });
    writeData(store);
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(PIXEL_GIF);
});

// 8. Lookup caller's public IP
app.get('/api/my-ip', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  res.json({ ip });
});

// 9. Clear visits / reset data
app.delete('/api/visits', (_req: Request, res: Response) => {
  store = readData();
  store.visits = [];
  writeData(store);
  res.json({ success: true, message: 'All visit records cleared' });
});

// 10. Seed sample data button
app.post('/api/visits/seed', (_req: Request, res: Response) => {
  store = INITIAL_DATA;
  writeData(store);
  res.json({ success: true, message: 'Sample dataset loaded' });
});

// Start server and mount Vite
async function start() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoRadar server operational on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
