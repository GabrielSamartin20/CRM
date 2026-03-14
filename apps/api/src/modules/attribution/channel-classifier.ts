import { Channel } from './attribution.types';

const normalize = (value?: string): string => (value ?? '').trim().toLowerCase();

export function classifyChannel(params: {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  gclid?: string;
  fbclid?: string;
}): Channel {
  const source = normalize(params.utmSource);
  const medium = normalize(params.utmMedium);
  const referrer = normalize(params.referrer);

  if (params.gclid) return 'GOOGLE_ADS';
  if (params.fbclid) return 'META_ADS';

  if (['cpc', 'ppc', 'paid', 'paid_social'].includes(medium)) {
    if (['google'].includes(source)) return 'GOOGLE_ADS';
    if (['facebook', 'instagram', 'meta'].includes(source)) return 'META_ADS';
    return 'OTHER';
  }

  if (source === 'google' && ['organic', 'seo'].includes(medium)) return 'GOOGLE_ORGANIC';
  if (['facebook', 'instagram', 'meta'].includes(source)) return 'META_ORGANIC';
  if (source) return 'REFERRAL';
  if (referrer) return 'REFERRAL';
  return 'DIRECT';
}
