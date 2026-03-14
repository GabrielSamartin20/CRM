import { getSessionId } from './fingerprint';
import { sendAttribution, setTrackerConfig, TrackerConfig } from './send';
import { captureUtm } from './utm';

declare global {
  interface Window {
    CRMTracker?: {
      init(config: TrackerConfig): void;
      identify(data: { phone?: string; email?: string; name?: string }): void;
    };
  }
}

const init = (config: TrackerConfig): void => {
  setTrackerConfig(config);
  captureUtm();
  getSessionId();
};

const identify = (data: { phone?: string; email?: string; name?: string }): void => {
  sendAttribution(data);
};

window.CRMTracker = { init, identify };

export { init, identify };
