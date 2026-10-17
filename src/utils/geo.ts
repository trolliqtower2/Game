import { DeviceTelemetry, GeoLocation } from '../types/tracker';

/**
 * Extracts deep client-side device, browser, and hardware telemetry
 */
export async function collectDeviceTelemetry(): Promise<DeviceTelemetry> {
  const ua = navigator.userAgent;
  let deviceType: DeviceTelemetry['deviceType'] = 'Desktop';
  if (/iPad|Tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // OS Detection
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([0-9_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/iPhone OS ([0-9_]+)/i.test(ua)) {
    const match = ua.match(/iPhone OS ([0-9_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Android ([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Android ([0-9.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser Detection
  let browser = 'Unknown Browser';
  let browserVersion = '';
  if (/Edg\/([0-9.]+)/i.test(ua)) {
    browser = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || '';
  } else if (/Chrome\/([0-9.]+)/i.test(ua) && !/Edg/i.test(ua)) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
  } else if (/Version\/([0-9.]+).*Safari/i.test(ua)) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
  }

  // WebGL GPU Renderer Detection
  let gpuRenderer: string | undefined;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const dbgRenderInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (dbgRenderInfo) {
        gpuRenderer = (gl as WebGLRenderingContext).getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch {
    // Ignore WebGL restriction
  }

  // Battery Detection
  let batteryLevel: number | undefined;
  let isCharging: boolean | undefined;
  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (typeof nav.getBattery === 'function') {
      const battery = await nav.getBattery();
      batteryLevel = Math.round(battery.level * 100);
      isCharging = battery.charging;
    }
  } catch {
    // Battery API unsupported or blocked
  }

  // Network Connection Type
  let connectionType: string | undefined;
  const navConn = (navigator as unknown as { connection?: { effectiveType?: string; type?: string } }).connection;
  if (navConn?.effectiveType) {
    connectionType = `${navConn.effectiveType.toUpperCase()}${navConn.type ? ` (${navConn.type})` : ''}`;
  }

  const screenResolution = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio || 1}x DPR)`;

  return {
    deviceType,
    os,
    browser,
    browserVersion,
    screenResolution,
    colorDepth: window.screen.colorDepth,
    orientation: window.screen.orientation ? window.screen.orientation.type : undefined,
    language: navigator.language || 'en-US',
    languages: Array.isArray(navigator.languages) ? [...navigator.languages] : [navigator.language],
    batteryLevel,
    isCharging,
    cpuCores: navigator.hardwareConcurrency,
    deviceMemoryGb: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
    connectionType,
    gpuRenderer,
    userAgent: ua,
  };
}

/**
 * Obtains high-accuracy GPS coordinates via HTML5 Geolocation API
 */
export function requestGpsLocation(timeoutMs = 10000): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Resolves public IP address and IP Geolocation using public JSON endpoints
 */
export async function fetchIpGeoLocation(): Promise<GeoLocation> {
  // Strategy 1: ipwho.is (fast, free, returns ISP, city, lat, long, timezone)
  try {
    const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success !== false && data.latitude && data.longitude) {
        return {
          ip: data.ip,
          country: data.country || 'Unknown',
          countryCode: data.country_code || 'UN',
          region: data.region || '',
          city: data.city || 'Unknown City',
          postal: data.postal || '',
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          isGps: false,
          timezone: data.timezone?.id || Intl.DateTimeFormat().resolvedOptions().timeZone,
          isp: data.connection?.isp || data.connection?.org || '',
          org: data.connection?.org || '',
          asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
          isVpnOrProxy: Boolean(data.security?.proxy || data.security?.vpn || data.security?.tor),
        };
      }
    }
  } catch {
    // try fallback
  }

  // Strategy 2: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          ip: data.ip,
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'UN',
          region: data.region || '',
          city: data.city || 'Unknown City',
          postal: data.postal || '',
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          isGps: false,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          isp: data.org || '',
          org: data.org || '',
          asn: data.asn || undefined,
          isVpnOrProxy: false,
        };
      }
    }
  } catch {
    // fallback
  }

  // Strategy 3: local timezone estimate if offline / blocked
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    ip: '127.0.0.1 (Local)',
    country: 'Local Network',
    countryCode: 'XX',
    region: 'Local Region',
    city: 'Local Area',
    latitude: 51.5074, // Default London anchor
    longitude: -0.1278,
    isGps: false,
    timezone: tz,
    isp: 'Local ISP',
  };
}
