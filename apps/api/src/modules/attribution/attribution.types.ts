export type Channel =
  | 'GOOGLE_ADS'
  | 'GOOGLE_ORGANIC'
  | 'META_ADS'
  | 'META_ORGANIC'
  | 'REFERRAL'
  | 'DIRECT'
  | 'EMAIL'
  | 'SMS'
  | 'OTHER';

export interface AttributionInput {
  phone?: string;
  email?: string;
  name?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  sessionId?: string;
  touchType?: 'first' | 'last';
}

export interface GeoData {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface AttributionRecord extends AttributionInput {
  id: string;
  workspaceId: string;
  contactId: string;
  channel: Channel;
  createdAt: Date;
  updatedAt: Date;
  geo?: GeoData;
  conversionSent?: boolean;
}

export interface AttributionEventRecord extends AttributionInput {
  id: string;
  workspaceId: string;
  contactId: string | null;
  channel: Channel;
  createdAt: Date;
  geo?: GeoData;
}
