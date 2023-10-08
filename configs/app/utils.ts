import isBrowser from 'lib/isBrowser';
import * as regexp from 'lib/regexp';

export const replaceQuotes = (value: string | undefined) => value?.replaceAll('\'', '"');

export const getEnvValue = (envName: string) => {
  const envs = isBrowser() ? window.__envs : process.env;

  if (isBrowser() && envs.NEXT_PUBLIC_APP_INSTANCE === 'pw') {
    const storageValue = localStorage.getItem(envName);

    if (typeof storageValue === 'string') {
      return storageValue;
    }
  }

  return replaceQuotes(envs[envName]);
};

export const parseEnvJson = <DataType>(env: string | undefined): DataType | null => {
  try {
    return JSON.parse(env || 'null') as DataType | null;
  } catch (error) {
    return null;
  }
};

export const getExternalAssetFilePath = (envName: string) => {
  const parsedValue = getEnvValue(envName);

  if (!parsedValue) {
    return;
  }

  if (process.env.NEXT_PUBLIC_DISABLE_DOWNLOAD_AT_RUN_TIME) {
    return parsedValue;
  }

  return buildExternalAssetFilePath(envName, parsedValue);
};

export const buildExternalAssetFilePath = (name: string, value: string) => {
  const fileName = name.replace(/^NEXT_PUBLIC_/, '').replace(/_URL$/, '').toLowerCase();
  const fileExtension = value.match(regexp.FILE_EXTENSION)?.[1];

  return `/assets/${ fileName }.${ fileExtension }`;
};
