import * as regexp from 'lib/regexp';
import { after } from 'lodash';

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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // 去除#号
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
  // 使用正则表达式提取rgb格式中的红、绿、蓝分量值
  const rgbMatch = rgb.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/);
  if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);

      // 将每个分量值转换为十六进制字符串，并确保是两位（不足两位在前面补0）
      const hexR = r.toString(16).padStart(2, '0');
      const hexG = g.toString(16).padStart(2, '0');
      const hexB = b.toString(16).padStart(2, '0');

      return `#${hexR}${hexG}${hexB}`;
  }
  return ""
}

/**
 * The `adjustColor` function is used to adjust the color based on two given colors (represented in the form of objects containing `r`, `g`, and `b` components).
 * It calculates the difference ratio between each color component and adjusts the values of each component of the passed-in `customColor` based on this ratio.
 * Finally, it returns the adjusted color (also in the form of an object containing `r`, `g`, and `b` components), aiming to make the returned color visually show a difference effect that conforms to the predefined logic compared with the target color.
 * Meanwhile, the function has done certain processing on the color component values to try to ensure that they are within the legal range of 0 - 255 (but extreme cases still need attention).
 * 
 * @param customColor The base color to be adjusted, passed in as an object containing three numeric components `r`, `g`, and `b`.
 * @param targetColor The target reference color, also passed in as an object containing three numeric components `r`, `g`, and `b`, which is used to calculate the difference compared with the base color.
 * @returns Returns the adjusted color, in the format of an object containing three numeric components `r`, `g`, and `b`. The values of each component are theoretically within the range of 0 - 255 to comply with the RGB color representation specification.
 */
function adjustColor(customColor: { r: number; g: number; b: number }, targetColor: { r: number; g: number; b: number }): { r: number; g: number; b: number } {
  const baseColor = hexToRgb('#3182CE');
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
 * Calculate and return the corresponding color value (in the form of an RGB format string) for page display according to the passed-in parameter and the theme color configured in the system, following the predefined color deviation logic.
 * This function aims to make the colors of page elements present a color deviation style similar to the predefined one based on the user-defined theme color, ensuring the consistency and coordination of page color schemes.
 * 
 * @param colorOption - A parameter used to specify which specific usage of color configuration to obtain. Its type is `ColorOption`, and the optional values include `'panelBtn'`, `'basicLink'`, `'dailyTxs'`, `'dailyTxs_area'`, `'basicHover'`.
 * Different values correspond to different page elements (such as buttons, links, etc.). The corresponding color that conforms to the theme color deviation is calculated according to the color logic of these elements in the predefined examples.
 * @returns Returns an RGB format string representing the color value calculated based on the theme color and the passed-in parameter, which is suitable for the corresponding page element and used for the corresponding color setting on the page.
 */
function getUserConfigForHomepageColor(colorOption: ColorOption): string {
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
    // 提取rgb格式中的各分量值
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
  // const baseRgb = hexToRgb(customColor);

  let targetRgb: { r: number; g: number; b: number };
  switch (colorOption) {
    case 'panelBtn':
      targetRgb = hexToRgb('#EBF8FF');
      break;
    case 'basicLink':
      targetRgb = hexToRgb('#2B6CB0');
      break;
    case 'dailyTxs':
      targetRgb = hexToRgb('#3182CE');
      break;
    case 'dailyTxs_area':
      targetRgb = hexToRgb('#BEE3F8');
      break;
    case 'basicHover':
      targetRgb = hexToRgb('#4299E1');
      break;
    default:
      console.log(`Invalid color option: ${colorOption}`);
      return "";
  }

  const adjustedRgb = adjustColor(baseRgb, targetRgb);
  return `rgb(${adjustedRgb.r}, ${adjustedRgb.g}, ${adjustedRgb.b})`;
}

function getUserConfigForHomepageBlackColor(colorOption: ColorOption): string {
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
    // 提取rgb格式中的各分量值
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
  switch (colorOption) {
    case 'panelBtn':
      targetRgb = hexToRgb('#2A4365');
      break;
    case 'basicLink':
      targetRgb = hexToRgb('#63B3ED');
      break;
    default:
      return "";
  }

  const adjustedRgb = adjustColor(baseRgb, targetRgb);
  return `rgb(${adjustedRgb.r}, ${adjustedRgb.g}, ${adjustedRgb.b})`;
}

export function getUserConfigColorForHomePage(colorOption: ColorOption): string[] {
  if (colorOption == "dailyTxs_area") {
    return [rgbToHex(getUserConfigForHomepageColor(colorOption)),rgbToHex(getUserConfigForHomepageBlackColor(colorOption))]
  }
  return [getUserConfigForHomepageColor(colorOption), getUserConfigForHomepageBlackColor(colorOption)]
}
