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

  return `/assets/${fileName}.${fileExtension}`;
};

type ColorOption = 'panelBtn' | 'basicLink' | 'dailyTxs' | 'dailyTxs_area' | 'basicHover';
const defaultColor = ['#3182CE', '#6BD425', '#A28FE6'];
const defaultColorDict = {
  '#3182CE': {
    'basicLink': '#2B6CB0',
    'basicHover': '#4299E1',
    'panelBtn': '#EBF8FF',
    'panelBtnDark': '#2A4365',
    'dailyTxs': '#3182CE',
    'dailyTxs_area': '#3182CE'
  },
  "#6BD425": {
    'basicLink': '#46A705',
    'basicHover': '#3C9600',
    'panelBtn': '#F5F6F4',
    'panelBtnDark': '#1D1F22',
    'dailyTxs': '#6BD425',
    'dailyTxs_area': '#72D82E'
  },
  '#A28FE6': {
    'basicLink': '#A370E5',
    'basicHover': '#9557E5',
    'panelBtn': '#F5F6F4',
    'panelBtnDark': '#1D1F22',
    'dailyTxs': '#A28FE6',
    'dailyTxs_area': '#9D94E4'
  },
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
    b: bigint & 255
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

      return `#${hexR}${hexG}${hexB}`;
  }
  return ""
}

function getClosestColor(color: string): number {
  if (color === "") return 0;
  if (color.indexOf('rgb') !== -1) {
    color = rgbToHex(color)
  }
  function colorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}
  let closestColorRgb: { r: number; g: number; b: number } = hexToRgb(defaultColor[0]);
  let closestDistance = colorDistance(hexToRgb(color), hexToRgb(defaultColor[0]));
  let bestIndex = 0;

  for (let i = 1; i < defaultColor.length; i++) {
      const currentColor = hexToRgb(defaultColor[i]);
      const currentDistance = colorDistance(hexToRgb(color), currentColor);
      if (currentDistance < closestDistance) {
        bestIndex = i;
      }
  }

  return bestIndex;
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
function adjustColor(customColor: { r: number; g: number; b: number }, targetColor: { r: number; g: number; b: number }, baseColorStr: string): { r: number; g: number; b: number } {
  const baseColor = hexToRgb(baseColorStr);
  function calculateDiff(before: number, after: number) {
    // minium 0 maxinum 255
    if (before == after) { return 0 }
    if (after <= 0) return -1;
    if (255 <= after) return 1;
    if (before < after) {
      return (after - before) / (255 - before)
    } else {
      return (after - before) / before
    }
  }
  function calculateResult(base: number, diff: number) {
    if (diff === -1) return 0;
    if (diff === 0) return base;
    if (diff === 1) return 255;
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
 * @param colorOption - Specifies color configuration usage, of type `ColorOption` with values like `'panelBtn'`, etc., corresponding to different page elements.
 * @param bsIdx - index of defaultColor
 * @returns RGB format string for corresponding page element color setting.
 */ 
function getUserColorConfig(colorOption: ColorOption, bsIdx: number): string {
  const customColor = process.env.NEXT_PUBLIC_CUSTOM_COLOR;
  if (!customColor) {
    console.log("****NEXT_PUBLIC_CUSTOM_COLOR environment variable is not set.");
    return "";
  }
  const hexFormatRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
  const rgbFormatRegex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
  if (!hexFormatRegex.test(customColor) && !rgbFormatRegex.test(customColor)) {
    console.log("****NEXT_PUBLIC_CUSTOM_COLOR fail to pass hexFormatRegex or rgbFormatRegex.");
    return "";
  }
  let baseRgb: { r: number; g: number; b: number };
  if (hexFormatRegex.test(customColor)) {
    baseRgb = hexToRgb(customColor);
  } else {
    // extract rgb value
    const rgbMatch = customColor.match(rgbFormatRegex);
    if (rgbMatch) {
      baseRgb = {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    } else {
      console.log("****NEXT_PUBLIC_CUSTOM_COLOR fail to match rgb value")
      return "";
    }
  }

  let targetRgb: { r: number; g: number; b: number };
  const defaultColorList = defaultColorDict[`${defaultColor[bsIdx]}`as '#3182CE' | '#6BD425' | '#A28FE6']
  switch (colorOption) {
    case 'panelBtn':
      targetRgb = hexToRgb(defaultColorList['panelBtn']);
      break;
    case 'basicLink':
      targetRgb = hexToRgb(defaultColorList['basicLink']);
      break;
    case 'dailyTxs':
      targetRgb = hexToRgb(defaultColorList['dailyTxs']);
      break;
    case 'dailyTxs_area':
      targetRgb = hexToRgb(defaultColorList['dailyTxs_area']);
      break;
    case 'basicHover':
      targetRgb = hexToRgb(defaultColorList['basicHover']);
      break;
    default:
      console.log(`Invalid color option: ${colorOption}`);
      return "";
  }

  const adjustedRgb = adjustColor(baseRgb, targetRgb, defaultColor[bsIdx] as '#3182CE' | '#6BD425' | '#A28FE6');
  return `rgb(${adjustedRgb.r}, ${adjustedRgb.g}, ${adjustedRgb.b})`;
}

function getUserBlackColorConfig(colorOption: ColorOption, bsIdx: number): string {
  const customColor = process.env.NEXT_PUBLIC_CUSTOM_COLOR_BLACK;
  if (!customColor) {
    console.log("****NEXT_PUBLIC_CUSTOM_COLOR_BLACK environment variable is not set.");
    return "";
  }
  if (!customColor) {
    console.log("****NEXT_PUBLIC_CUSTOM_COLOR_BLACK environment variable is not set.");
    return "";
  }
  const hexFormatRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
  const rgbFormatRegex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
  if (!hexFormatRegex.test(customColor) && !rgbFormatRegex.test(customColor)) {
    console.log("****NEXT_PUBLIC_CUSTOM_COLOR_BLACK fail to pass hexFormatRegex or rgbFormatRegex.");
    return "";
  }
  let baseRgb: { r: number; g: number; b: number };
  if (hexFormatRegex.test(customColor)) {
    baseRgb = hexToRgb(customColor);
  } else {
    // extract rgb value
    const rgbMatch = customColor.match(rgbFormatRegex);
    if (rgbMatch) {
      baseRgb = {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    } else {
      console.log("****NEXT_PUBLIC_CUSTOM_COLOR_BLACK fail to match rgb value")
      return "";
    }
  }
  let targetRgb: { r: number; g: number; b: number };
  const defaultColorList = defaultColorDict[`${defaultColor[bsIdx]}`as '#3182CE' | '#6BD425' | '#A28FE6']
  console.log("defaultColorList",defaultColorList)
  switch (colorOption) {
    case 'panelBtn':
      targetRgb = hexToRgb(defaultColorList['panelBtnDark']);
      break;
    case 'basicLink':
      targetRgb = hexToRgb(defaultColorList['basicLink']);
      break;
    default:
      return "";
  }

  const adjustedRgb = adjustColor(baseRgb, targetRgb, defaultColor[bsIdx] as '#3182CE' | '#6BD425' | '#A28FE6');
  return `rgb(${adjustedRgb.r}, ${adjustedRgb.g}, ${adjustedRgb.b})`;
}

export function getUserConfigColorForHomePage(colorOption: ColorOption): string[] {
  const customColor = process.env.NEXT_PUBLIC_CUSTOM_COLOR;
  const customColorBlack = process.env.NEXT_PUBLIC_CUSTOM_COLOR_BLACK;
  // Determine the selected color change model based on the theme color.
  const bsIdx = getClosestColor(customColor || "");
  const bsIdxBlack = getClosestColor(customColorBlack || "");
  if (colorOption == "dailyTxs_area") {
    return [rgbToHex(getUserColorConfig(colorOption, bsIdx)),rgbToHex(getUserBlackColorConfig(colorOption, bsIdxBlack))]
  }
  return [getUserColorConfig(colorOption, bsIdx), getUserBlackColorConfig(colorOption, bsIdxBlack)]
}
