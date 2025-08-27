// Utility functions for handling overlay data
import type { OverlayData } from '@/types';

/**
 * Get the numeric value from overlay data, handling both old format (number) and new format (OverlayPoint)
 */
export const getOverlayValue = (overlayData: OverlayData, nucleotideId: number): number => {
  const data = overlayData[nucleotideId];
  if (data === undefined || data === null) return 0;
  if (typeof data === 'number') return data;
  return data.value;
};

/**
 * Get the variant ID from overlay data if available
 */
export const getOverlayVariantId = (overlayData: OverlayData, nucleotideId: number): string | undefined => {
  const data = overlayData[nucleotideId];
  if (!data || typeof data === 'number') return undefined;
  return data.variantId;
};

/**
 * Check if overlay data exists for a nucleotide
 */
export const hasOverlayData = (overlayData: OverlayData, nucleotideId: number): boolean => {
  return overlayData[nucleotideId] !== undefined;
};

/**
 * Convert legacy overlay format to new OverlayPoint format
 */
export const convertLegacyOverlay = (legacyData: { [key: number]: number }): OverlayData => {
  const converted: OverlayData = {};
  for (const [key, value] of Object.entries(legacyData)) {
    converted[parseInt(key)] = { value };
  }
  return converted;
};