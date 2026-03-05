// Common color names mapped to hex codes
const COLOR_MAP = {
  // Reds
  red: '#FF0000',
  crimson: '#DC143C',
  darkred: '#8B0000',
  firebrick: '#B22222',
  scarlet: '#FF2400',
  
  // Pinks
  pink: '#FFC0CB',
  hotpink: '#FF69B4',
  deeppink: '#FF1493',
  lightpink: '#FFB6C1',
  palevioletred: '#DB7093',
  
  // Oranges
  orange: '#FFA500',
  darkorange: '#FF8C00',
  orangered: '#FF4500',
  coral: '#FF7F50',
  tomato: '#FF6347',
  
  // Yellows
  yellow: '#FFFF00',
  gold: '#FFD700',
  khaki: '#F0E68C',
  lightyellow: '#FFFFE0',
  lemonchiffon: '#FFFACD',
  
  // Greens
  green: '#008000',
  darkgreen: '#006400',
  lightgreen: '#90EE90',
  lime: '#00FF00',
  limegreen: '#32CD32',
  forestgreen: '#228B22',
  seagreen: '#2E8B57',
  mediumseagreen: '#3CB371',
  springgreen: '#00FF7F',
  palegreen: '#98FB98',
  darkseagreen: '#8FBC8F',
  
  // Cyans
  cyan: '#00FFFF',
  aqua: '#00FFFF',
  darkcyan: '#008B8B',
  lightcyan: '#E0FFFF',
  mediumturquoise: '#48D1CC',
  turquoise: '#40E0D0',
  
  // Blues
  blue: '#0000FF',
  darkblue: '#00008B',
  navy: '#000080',
  lightblue: '#ADD8E6',
  skyblue: '#87CEEB',
  deepskyblue: '#00BFFF',
  dodgerblue: '#1E90FF',
  cornflowerblue: '#6495ED',
  royalblue: '#4169E1',
  mediumblue: '#0000CD',
  
  // Purples
  purple: '#800080',
  darkviolet: '#9400D3',
  violet: '#EE82EE',
  mediumvioletred: '#C71585',
  mediumpurple: '#9370DB',
  blueviolet: '#8A2BE2',
  indigo: '#4B0082',
  
  // Browns
  brown: '#A52A2A',
  saddlebrown: '#8B4513',
  maroon: '#800000',
  darkbrown: '#654321',
  chocolate: '#D2691E',
  tan: '#D2B48C',
  peru: '#CD853F',
  
  // Grays/Whites
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',
  darkgray: '#A9A9A9',
  darkgrey: '#A9A9A9',
  silver: '#C0C0C0',
  lightgray: '#D3D3D3',
  lightgrey: '#D3D3D3',
  darkslategray: '#2F4F4F',
  slategray: '#708090',
  gainsboro: '#DCDCDC',
  whitesmoke: '#F5F5F5',
  ghostwhite: '#F8F8FF',
  
  // Others
  beige: '#F5F5DC',
  cream: '#FFFDD0',
  ivory: '#FFFFF0',
  linen: '#FAF0E6',
  wheat: '#F5DEB3',
  lavender: '#E6E6FA',
  mint: '#98FF98',
  salmon: '#FA8072',
  peach: '#FFDAB9',
};

export const convertColorNameToHex = (colorName) => {
  if (!colorName) return '';
  
  // Check if it's already a hex code
  if (/^#[0-9A-F]{6}$/i.test(colorName.trim())) {
    return colorName.trim().toUpperCase();
  }
  
  // Convert to lowercase and remove spaces
  const normalized = colorName.trim().toLowerCase().replace(/\s+/g, '');
  
  // Look up in color map
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }
  
  // If not found, return empty string
  return '';
};

export const isValidColorInput = (colorName) => {
  if (!colorName) return false;
  
  // Check if it's a valid hex code
  if (/^#[0-9A-F]{6}$/i.test(colorName.trim())) {
    return true;
  }
  
  // Check if it's a known color name
  const normalized = colorName.trim().toLowerCase().replace(/\s+/g, '');
  return !!COLOR_MAP[normalized];
};