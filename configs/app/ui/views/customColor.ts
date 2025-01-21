import { getEnvValue, parseEnvJson } from 'configs/app/utils';

interface ColorConfig {
  brightThemeColor?: string;
  darkThemeColor?: string;
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

const handleCustomColor = (() => {
  const customColorJSON = parseEnvJson<ColorConfig | null>(getEnvValue(process.env.NEXT_PUBLIC_CUSTOM_COLOR));
  const defaultCustomColor = {
    panelBtn: '',
    panelBtnDark: '',
    basicLink: '',
    dailyTxs: '',
    dailyTxsArea: '',
    basicHover: '',
  };

  if (!customColorJSON || !customColorJSON.brightThemeColor) {
    return Object.freeze(defaultCustomColor);
  }

  if (!customColorJSON.darkThemeColor) {
    customColorJSON.darkThemeColor = customColorJSON.brightThemeColor;
  }

  const {
    brightThemeColor: themeColor,
    darkThemeColor: darkTheme,
    textColor,
    textHoverColor,
    buttonColor,
    lineOfCurveGraphColor: lineColor,
    shadowOfCurveGraphColor: shadowColor,
  } = customColorJSON;

  const rgbFormatRegex = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/;

  const baseRgb = hexToRgb('#3182CE');
  const baseRgbDark = hexToRgb('#3182CE');
  const customRgb = rgbFormatRegex.test(themeColor) ? rgbToObject(themeColor) : hexToRgb(themeColor);
  const customRgbDark = rgbFormatRegex.test(darkTheme) ? rgbToObject(darkTheme) : hexToRgb(darkTheme);

  let adjustRgb: { r: number; g: number; b: number };

  adjustRgb = adjustColor(customRgb, baseRgb, '#EBF8FF');
  if (buttonColor) {
    defaultCustomColor.panelBtn = rgbFormatRegex.test(buttonColor) ? buttonColor :
      `rgb(${ hexToRgb(buttonColor).r }, ${ hexToRgb(buttonColor).g }, ${ hexToRgb(buttonColor).b })`;
  } else {
    defaultCustomColor.panelBtn = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
  }

  adjustRgb = adjustColor(customRgbDark, baseRgbDark, '#2A4365');
  if (buttonColor) {
    defaultCustomColor.panelBtnDark = rgbFormatRegex.test(buttonColor) ? buttonColor :
      `rgb(${ hexToRgb(buttonColor).r }, ${ hexToRgb(buttonColor).g }, ${ hexToRgb(buttonColor).b })`;
  } else {
    defaultCustomColor.panelBtnDark = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
  }

  adjustRgb = adjustColor(customRgb, baseRgb, '#2B6CB0');
  if (textColor) {
    defaultCustomColor.basicLink = rgbFormatRegex.test(textColor) ? textColor :
      `rgb(${ hexToRgb(textColor).r }, ${ hexToRgb(textColor).g }, ${ hexToRgb(textColor).b })`;
  } else {
    defaultCustomColor.basicLink = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
  }

  adjustRgb = adjustColor(customRgb, baseRgb, '#3182CE');
  if (lineColor) {
    defaultCustomColor.dailyTxs = rgbFormatRegex.test(lineColor) ? lineColor :
      `rgb(${ hexToRgb(lineColor).r }, ${ hexToRgb(lineColor).g }, ${ hexToRgb(lineColor).b })`;
  } else {
    defaultCustomColor.dailyTxs = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
  }

  adjustRgb = adjustColor(customRgb, baseRgb, '#3182CE');
  if (shadowColor) {
    defaultCustomColor.dailyTxsArea = rgbFormatRegex.test(shadowColor) ? shadowColor :
      `rgb(${ hexToRgb(shadowColor).r }, ${ hexToRgb(shadowColor).g }, ${ hexToRgb(shadowColor).b })`;
  } else {
    defaultCustomColor.dailyTxsArea = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
  }

  adjustRgb = adjustColor(customRgb, baseRgb, '#4299E1');
  if (textHoverColor) {
    defaultCustomColor.basicHover = rgbFormatRegex.test(textHoverColor) ? textHoverColor :
      `rgb(${ hexToRgb(textHoverColor).r }, ${ hexToRgb(textHoverColor).g }, ${ hexToRgb(textHoverColor).b })`;
  } else {
    defaultCustomColor.basicHover = `rgb(${ adjustRgb.r }, ${ adjustRgb.g }, ${ adjustRgb.b })`;
  }

  return Object.freeze(defaultCustomColor);

})();

export default handleCustomColor;
