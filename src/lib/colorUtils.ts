// src/lib/colorUtils.ts
export const getColorForValue = (value: number, min = 0, max = 1): string => {
  const intensity = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const red = 255;
  const green = Math.floor(255 * (1 - intensity));
  const blue = Math.floor(255 * (1 - intensity));
  
  return `rgb(${red}, ${green}, ${blue})`;
};