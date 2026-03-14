import { classifyChannel } from '../channel-classifier';

describe('classifyChannel', () => {
  it('gclid presente → GOOGLE_ADS', () => {
    expect(classifyChannel({ gclid: '123' })).toBe('GOOGLE_ADS');
  });

  it('fbclid presente → META_ADS', () => {
    expect(classifyChannel({ fbclid: 'abc' })).toBe('META_ADS');
  });

  it('utmMedium=cpc + source=google → GOOGLE_ADS', () => {
    expect(classifyChannel({ utmMedium: 'cpc', utmSource: 'google' })).toBe('GOOGLE_ADS');
  });

  it('utmSource=google + medium=organic → GOOGLE_ORGANIC', () => {
    expect(classifyChannel({ utmSource: 'google', utmMedium: 'organic' })).toBe('GOOGLE_ORGANIC');
  });

  it('utmSource=facebook → META_ORGANIC', () => {
    expect(classifyChannel({ utmSource: 'facebook' })).toBe('META_ORGANIC');
  });

  it('referrer sem UTM → REFERRAL', () => {
    expect(classifyChannel({ referrer: 'https://site.com' })).toBe('REFERRAL');
  });

  it('sem nada → DIRECT', () => {
    expect(classifyChannel({})).toBe('DIRECT');
  });
});
