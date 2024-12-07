import * as regexp from 'lib/regexp';

export const getEnvValue = <T extends string>(env: T | undefined): T | undefined => env?.replaceAll('\'', '"') as T;

export const parseEnvJson = <DataType>(env: string | undefined): DataType | null => {
  try {
    return JSON.parse(env || 'null') as DataType | null;
  } catch (error) {
    return null;
  }
};

export const getExternalAssetFilePath = (envName: string, envValue: string | undefined) => {
  const parsedValue = getEnvValue(envValue);

  if (!parsedValue) {
    return;
  }

  if (process.env.NEXT_PUBLIC_DISABLE_DOWNLOAD_AT_RUN_TIME) {
    return parsedValue;
  }

  const fileName = envName.replace(/^NEXT_PUBLIC_/, '').replace(/_URL$/, '').toLowerCase();
  const fileExtension = parsedValue.match(regexp.FILE_EXTENSION)?.[1];

  return `/assets/${ fileName }.${ fileExtension }`;
};

type ColorOption = 'panelBtn' | 'basicLink' | 'dailyTxs' | 'dailyTxs_area' | 'basicHover';

interface ColorConfig {
  brightThemeColor?: string;
  darkTheneColor?: string;
  textColor?: string;
  textHoverColor?: string;
  buttonColor?: string;
  darkButtonColor?: string;
  lineOfCurveGraphColor?: string;
  shadowOfCurveGraphColor?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // replace #
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(rgb: string): string {
  // extract values of red, green and blue
  const rgbMatch = rgb.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    // transfer value to hexadecimal(x16), if less than two digits, add a '0'
    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');

    return `#${ hexR }${ hexG }${ hexB }`;
  }
  return '';
}

function rgbToObject(rgbString: string): { r: number; g: number; b: number } {
  const parts = rgbString.slice(4, -1).split(',');
  return {
    r: parseInt(parts[0].trim(), 10),
    g: parseInt(parts[1].trim(), 10),
    b: parseInt(parts[2].trim(), 10),
  };
}

/**
 * `adjustColor` adjusts color based on two colors (in `r`, `g`, `b` component objects).
 * It calculates the difference ratio of components and adjusts `customColor` values accordingly.
 * Returns the adjusted color (in `r`, `g`, `b` component object), aiming for a difference effect as per predefined logic vs. target color.
 * Ensures component values are within 0 - 255 (extreme cases need attention).
 *
 * @param customColor Base color (with `r`, `g`, `b` components).
 * @param targetColor Target reference color (with `r`, `g`, `b` components).
 * @returns Adjusted color (in `r`, `g`, `b` component object, 0 - 255 range).
 */
function adjustColor(customColor: { r: number; g: number; b: number }, targetColor: { r: number; g: number; b: number }, baseColorStr: string):
{ r: number; g: number; b: number } {
  const baseColor = hexToRgb(baseColorStr);
  function calculateDiff(before: number, after: number) {
    // minium 0 maxinum 255
    if (before === after) {
      return 0;
    }
    if (after <= 0) {
      return -1;
    }
    if (255 <= after) {
      return 1;
    }
    if (before < after) {
      return (after - before) / (255 - before);
    } else {
      return (after - before) / before;
    }
  }
  function calculateResult(base: number, diff: number) {
    if (diff === -1) {
      return 0;
    }
    if (diff === 0) {
      return base;
    }
    if (diff === 1) {
      return 255;
    }
    const _base = 255 - base;
    return diff < 0 ? (base * (1 + diff)) : (base + _base * diff);
  }
  const rDiff = calculateDiff(baseColor.r, targetColor.r);
  const gDiff = calculateDiff(baseColor.g, targetColor.g);
  const bDiff = calculateDiff(baseColor.b, targetColor.b);
  return {
    r: Math.floor(calculateResult(customColor.r, rDiff)),
    g: Math.floor(calculateResult(customColor.g, gDiff)),
    b: Math.floor(calculateResult(customColor.b, bDiff)),
  };
}

/**
 * Calculate and return RGB format color for page display based on passed parameter and configured theme color, following predefined logic.
 * Aims to make page element colors show predefined deviation style based on user-defined theme color.
 *
 * @param colorOption - Specifies color configuration usage, of type `ColorOption` with values like `'panelBtn'`, etc.,corresponding to different page elements.
 * @returns RGB format string for corresponding page element color setting.
 */
function getUserColorConfig(colorOption: ColorOption): string {
  const customColorJSON = parseEnvJson<ColorConfig | null>(getEnvValue(process.env.NEXT_PUBLIC_CUSTOM_COLOR));

  if (!customColorJSON || !customColorJSON.brightThemeColor) {
    /* eslint-disable-next-line no-console */
    console.log('****NEXT_PUBLIC_CUSTOM_COLOR environment variable has not been set.');
    return '';
  }

  const {
    brightThemeColor: themeColor,
    textColor,
    textHoverColor,
    buttonColor,
    lineOfCurveGraphColor: lineColor,
    shadowOfCurveGraphColor: shadowColor,
  } = customColorJSON;

  const rgbFormatRegex = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/;

  let result = '';
  const baseRgb = hexToRgb('#3182CE');
  const customRgb = rgbFormatRegex.test(themeColor) ? rgbToObject(themeColor) : hexToRgb(themeColor);
  let adjustRgb: { r: number; g: number; b: number };
  switch (colorOption) {
    case 'panelBtn':
      adjustRgb = adjustColor(customRgb, baseRgb, '#EBF8FF');
      if (buttonColor) {
        result = rgbFormatRegex.test(buttonColor) ? buttonColor :
          `rgb(${ hexToRgb(buttonColor).r }, ${ hexToRgb(buttonColor).g }, ${ hexToRgb(buttonColor).b })`;
      } else {
        result = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
      }
      break;
    case 'basicLink':
      adjustRgb = adjustColor(customRgb, baseRgb, '#2B6CB0');
      if (textColor) {
        result = rgbFormatRegex.test(textColor) ? textColor :
          `rgb(${ hexToRgb(textColor).r }, ${ hexToRgb(textColor).g }, ${ hexToRgb(textColor).b })`;
      } else {
        result = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
      }
      break;
    case 'dailyTxs':
      adjustRgb = adjustColor(customRgb, baseRgb, '#3182CE');
      if (lineColor) {
        result = rgbFormatRegex.test(lineColor) ? lineColor :
          `rgb(${ hexToRgb(lineColor).r }, ${ hexToRgb(lineColor).g }, ${ hexToRgb(lineColor).b })`;
      } else {
        result = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
      }
      break;
    case 'dailyTxs_area':
      adjustRgb = adjustColor(customRgb, baseRgb, '#3182CE');
      if (shadowColor) {
        result = rgbFormatRegex.test(shadowColor) ? shadowColor :
          `rgb(${ hexToRgb(shadowColor).r }, ${ hexToRgb(shadowColor).g }, ${ hexToRgb(shadowColor).b })`;
      } else {
        result = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
      }
      break;
    case 'basicHover':
      adjustRgb = adjustColor(customRgb, baseRgb, '#4299E1');
      if (textHoverColor) {
        result = rgbFormatRegex.test(textHoverColor) ? textHoverColor :
          `rgb(${ hexToRgb(textHoverColor).r }, ${ hexToRgb(textHoverColor).g }, ${ hexToRgb(textHoverColor).b })`;
      } else {
        result = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
      }
      break;
    default:
      /* eslint-disable-next-line no-console */
      console.log(`Invalid color option: `, colorOption);
      return '';
  }
  return result;
}

function getUserBlackColorConfig(colorOption: ColorOption): string {
  const customColorJSON = parseEnvJson<ColorConfig | null>(getEnvValue(process.env.NEXT_PUBLIC_CUSTOM_COLOR));

  if (!customColorJSON || !customColorJSON.darkTheneColor) {
    /* eslint-disable-next-line no-console */
    console.log('****NEXT_PUBLIC_CUSTOM_COLOR environment variable has not been set.');
    return '';
  }

  const {
    darkTheneColor: darkTheme,
    buttonColor,
  } = customColorJSON;

  const rgbFormatRegex = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/;

  let result = '';
  const baseRgb = hexToRgb('#3182CE');
  const customRgb = rgbFormatRegex.test(darkTheme) ? rgbToObject(darkTheme) : hexToRgb(darkTheme);
  let adjustRgb: { r: number; g: number; b: number };
  switch (colorOption) {
    case 'panelBtn':
      adjustRgb = adjustColor(customRgb, baseRgb, '#2A4365');
      if (buttonColor) {
        result = rgbFormatRegex.test(buttonColor) ? buttonColor :
          `rgb(${ hexToRgb(buttonColor).r }, ${ hexToRgb(buttonColor).g }, ${ hexToRgb(buttonColor).b })`;
      } else {
        result = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
      }
      break;
    default:
      /* eslint-disable-next-line no-console */
      console.log(`Invalid black color option:`, colorOption);
      return '';
  }
  return result;
}

export function getUserConfigColorForHomePage(colorOption: ColorOption): Array<string> {
  // Determine the selected color change model based on the theme color.
  if (colorOption === 'dailyTxs_area') {
    return [ rgbToHex(getUserColorConfig(colorOption)), rgbToHex(getUserBlackColorConfig(colorOption)) ];
  }
  return [ getUserColorConfig(colorOption), getUserBlackColorConfig(colorOption) ];
}
