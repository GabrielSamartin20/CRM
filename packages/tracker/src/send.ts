import { getSessionId } from './fingerprint';
import { getStoredAttribution } from './utm';

export interface TrackerConfig {
  workspaceToken: string;
  apiUrl: string;
}

let currentConfig: TrackerConfig | null = null;

export const setTrackerConfig = (config: TrackerConfig): void => {
  currentConfig = config;
};

export const sendAttribution = (identify?: { phone?: string; email?: string; name?: string }): void => {
  if (!currentConfig) return;

  const attr = getStoredAttribution();
  if (!attr && !identify?.phone && !identify?.email && !identify?.name) return;

  const payload = {
    ...attr,
    ...identify,
    sessionId: getSessionId()
  };

  const url = `${currentConfig.apiUrl.replace(/\/$/, '')}/api/v1/attribution`;
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    void fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-Token': currentConfig.workspaceToken
      },
      body,
      keepalive: true
    }).catch((error: unknown) => {
      console.error('[CRMTracker] send failed', error);
    });
  } catch (error) {
    console.error('[CRMTracker] send failed', error);
  }
};
