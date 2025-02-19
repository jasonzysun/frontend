import type { Feature } from './types';
import { SUPPORTED_AD_BANNER_PROVIDERS } from 'types/client/ad';
import type { AdTextProviders } from 'types/client/ad';

import { getEnvValue } from '../utils';

const provider: AdTextProviders = (() => {
  const envValue = getEnvValue('NEXT_PUBLIC_AD_TEXT_PROVIDER') as AdTextProviders;
  return envValue && SUPPORTED_AD_BANNER_PROVIDERS.includes(envValue) ? envValue : 'coinzilla';
})();

const title = 'Text ads';

const config: Feature<{ provider: AdTextProviders }> = (() => {
  if (provider !== 'none') {
    return Object.freeze({
      title,
      isEnabled: true,
      provider,
    });
  }

  return Object.freeze({
    title,
    isEnabled: false,
  });
})();

export default config;
