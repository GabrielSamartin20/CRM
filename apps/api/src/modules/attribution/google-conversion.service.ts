import { env } from '../../lib/env';
import { attributionStore, AttributionService } from './attribution.service';

export class GoogleConversionService {
  constructor(private readonly attributionService: AttributionService = new AttributionService()) {}

  async onDealWon(input: { workspaceId: string; contactId: string; conversionName: string; conversionValue: number; conversionTime: string }): Promise<void> {
    const attribution = attributionStore.attributionByContact.get(`${input.workspaceId}:${input.contactId}`);
    if (!attribution || attribution.channel !== 'GOOGLE_ADS' || !env.GOOGLE_ADS_CONVERSION_ID) {
      return;
    }

    await fetch(`https://googleads.googleapis.com/v14/customers/${env.GOOGLE_ADS_CUSTOMER_ID}:uploadClickConversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GOOGLE_ADS_REFRESH_TOKEN}`,
        'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN
      },
      body: JSON.stringify({
        conversionAction: env.GOOGLE_ADS_CONVERSION_ID,
        conversions: [
          {
            gclid: attribution.gclid,
            conversionAction: input.conversionName,
            conversionDateTime: input.conversionTime,
            conversionValue: input.conversionValue
          }
        ],
        partialFailure: false
      })
    }).catch(() => undefined);

    await this.attributionService.setConversionSent(input.workspaceId, input.contactId);
  }
}
