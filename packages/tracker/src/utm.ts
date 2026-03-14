export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  timestamp: number;
}

const STORAGE_KEY = 'crm_attribution';
const COOKIE_KEY = 'crm_attr';

const readCookie = (name: string): string | null => {
  const entry = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!entry) return null;
  return decodeURIComponent(entry.split('=').slice(1).join('='));
};

const writeCookie = (name: string, value: string): void => {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

const fromQuery = (): AttributionData | null => {
  const params = new URLSearchParams(window.location.search);
  const data: AttributionData = {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    utmTerm: params.get('utm_term') ?? undefined,
    gclid: params.get('gclid') ?? undefined,
    fbclid: params.get('fbclid') ?? undefined,
    referrer: document.referrer || undefined,
    landingPage: window.location.href,
    timestamp: Date.now()
  };

  const hasParams = Boolean(data.utmSource || data.utmMedium || data.utmCampaign || data.gclid || data.fbclid);
  return hasParams ? data : null;
};

export const captureUtm = (): AttributionData | null => {
  const queryData = fromQuery();
  if (queryData) {
    const json = JSON.stringify(queryData);
    localStorage.setItem(STORAGE_KEY, json);
    writeCookie(COOKIE_KEY, json);
    return queryData;
  }

  const stored = localStorage.getItem(STORAGE_KEY) ?? readCookie(COOKIE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AttributionData;
  } catch (_error) {
    return null;
  }
};

export const getStoredAttribution = (): AttributionData | null => {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local) as AttributionData;
    } catch (_error) {
      return null;
    }
  }

  const cookie = readCookie(COOKIE_KEY);
  if (!cookie) return null;
  try {
    return JSON.parse(cookie) as AttributionData;
  } catch (_error) {
    return null;
  }
};
