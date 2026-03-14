import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { redis } from '../../lib/redis';
import { authStore, AuthService } from '../auth/auth.service';
import { classifyChannel } from './channel-classifier';
import { AttributionEventRecord, AttributionInput, AttributionRecord, Channel, GeoData } from './attribution.types';

interface ContactRecord {
  id: string;
  workspaceId: string;
  phone?: string;
  email?: string;
  name?: string;
  status: 'LEAD' | 'CUSTOMER';
}

interface DealRecord {
  id: string;
  workspaceId: string;
  contactId: string;
  stage: 'Lead' | 'Qualificado' | 'Proposta' | 'Ganho';
  value: number;
}

export const attributionStore = {
  contacts: new Map<string, ContactRecord>(),
  attributionByContact: new Map<string, AttributionRecord>(),
  attributionEvents: new Array<AttributionEventRecord>(),
  deals: new Array<DealRecord>()
};

export class AttributionService {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  async resolveWorkspaceByPublicToken(token: string | undefined): Promise<string> {
    if (!token) throw new AppError({ statusCode: 401, code: 'MISSING_WORKSPACE_TOKEN', message: 'X-Workspace-Token ausente' });
    const workspaceId = authStore.workspacePublicTokens.get(token);
    if (!workspaceId) throw new AppError({ statusCode: 401, code: 'INVALID_WORKSPACE_TOKEN', message: 'X-Workspace-Token inválido' });
    return workspaceId;
  }

  private async geoFromIp(ip: string): Promise<GeoData | undefined> {
    if (!ip) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
      if (!response.ok) return undefined;
      const payload = (await response.json()) as {
        city?: string;
        region?: string;
        country_name?: string;
        latitude?: number;
        longitude?: number;
      };
      return {
        city: payload.city,
        region: payload.region,
        country: payload.country_name,
        latitude: payload.latitude,
        longitude: payload.longitude
      };
    } catch (_error) {
      return undefined;
    } finally {
      clearTimeout(timer);
    }
  }

  private findContact(workspaceId: string, input: AttributionInput): ContactRecord | null {
    if (!input.phone && !input.email) return null;
    const contacts = Array.from(attributionStore.contacts.values());
    return (
      contacts.find(
        (contact) =>
          contact.workspaceId === workspaceId && ((input.phone && contact.phone === input.phone) || (input.email && contact.email === input.email))
      ) ?? null
    );
  }

  async ingest(input: {
    workspaceId: string;
    payload: AttributionInput;
    ip: string;
  }): Promise<{ contactId: string | null; channel: Channel; isNewContact: boolean }> {
    const channel = classifyChannel({
      utmSource: input.payload.utmSource,
      utmMedium: input.payload.utmMedium,
      utmCampaign: input.payload.utmCampaign,
      referrer: input.payload.referrer,
      gclid: input.payload.gclid,
      fbclid: input.payload.fbclid
    });

    const geo = await this.geoFromIp(input.ip);

    let contact = this.findContact(input.workspaceId, input.payload);
    let isNewContact = false;

    if (!contact && (input.payload.phone || input.payload.email)) {
      contact = {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        phone: input.payload.phone,
        email: input.payload.email,
        name: input.payload.name,
        status: 'LEAD'
      };
      attributionStore.contacts.set(contact.id, contact);
      isNewContact = true;
    }

    if (contact) {
      const key = `${input.workspaceId}:${contact.id}`;
      const existing = attributionStore.attributionByContact.get(key);
      const touchType = input.payload.touchType ?? 'first';
      const shouldWrite = !existing || touchType === 'last';

      if (shouldWrite) {
        attributionStore.attributionByContact.set(key, {
          id: existing?.id ?? randomUUID(),
          workspaceId: input.workspaceId,
          contactId: contact.id,
          channel,
          ...input.payload,
          geo,
          createdAt: existing?.createdAt ?? new Date(),
          updatedAt: new Date(),
          conversionSent: existing?.conversionSent ?? false
        });
      }
    }

    attributionStore.attributionEvents.push({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      contactId: contact?.id ?? null,
      channel,
      ...input.payload,
      geo,
      createdAt: new Date()
    });

    return { contactId: contact?.id ?? null, channel, isNewContact };
  }

  getByContact(workspaceId: string, contactId: string): { attribution: AttributionRecord | null; events: AttributionEventRecord[] } {
    const key = `${workspaceId}:${contactId}`;
    const attribution = attributionStore.attributionByContact.get(key) ?? null;
    const events = attributionStore.attributionEvents.filter((event) => event.workspaceId === workspaceId && event.contactId === contactId);
    return { attribution, events };
  }

  async analytics(workspaceId: string, query: { from?: string; to?: string; channel?: string; campaignName?: string }): Promise<Record<string, unknown>> {
    const cacheKey = `analytics:${workspaceId}:${query.from ?? 'na'}:${query.to ?? 'na'}:${query.channel ?? 'all'}:${query.campaignName ?? 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Record<string, unknown>;

    const fromDate = query.from ? new Date(query.from) : null;
    const toDate = query.to ? new Date(query.to) : null;

    const events = attributionStore.attributionEvents.filter((event) => {
      if (event.workspaceId !== workspaceId) return false;
      if (query.channel && event.channel !== query.channel) return false;
      if (query.campaignName && event.utmCampaign !== query.campaignName) return false;
      if (fromDate && event.createdAt < fromDate) return false;
      if (toDate && event.createdAt > toDate) return false;
      return true;
    });

    const byChannelMap = new Map<string, { leads: number; conversions: number; revenue: number }>();
    for (const event of events) {
      const current = byChannelMap.get(event.channel) ?? { leads: 0, conversions: 0, revenue: 0 };
      current.leads += 1;
      byChannelMap.set(event.channel, current);
    }

    for (const deal of attributionStore.deals.filter((item) => item.workspaceId === workspaceId && item.stage === 'Ganho')) {
      const attr = attributionStore.attributionByContact.get(`${workspaceId}:${deal.contactId}`);
      if (!attr) continue;
      const row = byChannelMap.get(attr.channel) ?? { leads: 0, conversions: 0, revenue: 0 };
      row.conversions += 1;
      row.revenue += deal.value;
      byChannelMap.set(attr.channel, row);
    }

    const byChannel = Array.from(byChannelMap.entries()).map(([channel, values]) => ({ channel, ...values }));

    const byDayMap = new Map<string, { date: string; channel: string; leads: number }>();
    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const key = `${date}:${event.channel}`;
      const current = byDayMap.get(key) ?? { date, channel: event.channel, leads: 0 };
      current.leads += 1;
      byDayMap.set(key, current);
    }

    const topCampaignMap = new Map<string, { campaign: string; channel: string; leads: number; conversions: number; revenue: number }>();
    for (const event of events) {
      const campaign = event.utmCampaign ?? '(not set)';
      const key = `${campaign}:${event.channel}`;
      const current = topCampaignMap.get(key) ?? { campaign, channel: event.channel, leads: 0, conversions: 0, revenue: 0 };
      current.leads += 1;
      topCampaignMap.set(key, current);
    }

    const funnel = ['Lead', 'Qualificado', 'Proposta', 'Ganho'].flatMap((stage) => {
      const rows = byChannel.map((row) => {
        const count = stage === 'Lead' ? row.leads : attributionStore.deals.filter((deal) => {
          if (deal.workspaceId !== workspaceId) return false;
          if (deal.stage !== stage) return false;
          const attr = attributionStore.attributionByContact.get(`${workspaceId}:${deal.contactId}`);
          return attr?.channel === row.channel;
        }).length;

        return { stage, channel: row.channel, count };
      });
      return rows;
    });

    const result = {
      byChannel,
      byDay: Array.from(byDayMap.values()),
      topCampaigns: Array.from(topCampaignMap.values()),
      funnel
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  async setConversionSent(workspaceId: string, contactId: string): Promise<void> {
    const key = `${workspaceId}:${contactId}`;
    const attr = attributionStore.attributionByContact.get(key);
    if (!attr) return;
    attributionStore.attributionByContact.set(key, { ...attr, conversionSent: true, updatedAt: new Date() });
  }
}
