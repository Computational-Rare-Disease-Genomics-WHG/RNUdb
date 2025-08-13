declare module 'dom-to-image-more' {
  interface Options {
    filter?: (node: Node) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: any;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  export function toPng(node: Node, options?: Options): Promise<string>;
  export function toJpeg(node: Node, options?: Options): Promise<string>;
  export function toSvg(node: Node, options?: Options): Promise<string>;
  export function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
  export function toBlob(node: Node, options?: Options): Promise<Blob>;
}

declare module '@gnomad/track-genes' {
  interface Gene {
    gene_id: string;
    symbol: string;
    start: number;
    stop: number;
    strand: string;
    transcript?: any;
    exons?: any[];
    gene_name?: string;
    gene_type?: string;
  }

  interface GenesTrackProps {
    genes?: Gene[];
    renderGene?: (gene: Gene) => React.ReactElement;
    renderGeneLabel?: (gene: Gene) => React.ReactElement;
    onGeneClick?: (gene: Gene) => void;
    strand?: string;
    title?: string;
  }

  export const GenesTrack: React.ComponentType<GenesTrackProps>;
}

declare module '@gnomad/track-variants' {
  interface Variant {
    variant_id: string;
    pos: number;
    allele_freq?: number;
    consequence?: string;
    clinical_significance?: string | null;
    isHighlighted?: boolean;
  }

  interface VariantTrackProps {
    variants?: Variant[];
    variantColor?: (variant: Variant) => string;
    onVariantClick?: (variant: Variant) => void;
    height?: number;
    title?: string;
  }

  const VariantTrack: React.ComponentType<VariantTrackProps>;
  export default VariantTrack;
}

declare module '@gnomad/region-viewer' {
  import React from 'react';
  interface Region {
    start: number;
    stop: number;
  }

  interface RegionViewerProps {
    children: React.ReactNode;
    regions: Region[];
    width: number;
    leftPanelWidth?: number;
    rightPanelWidth?: number;
    padding?: number;
    onClick?: (position: number | null) => void;
    renderCursor?: (x: number) => React.ReactElement;
  }

  interface CursorProps {
    children?: React.ReactNode;
    onClick?: (position: number | null) => void;
    onDrag?: (start: number, end: number) => void;
    renderCursor?: (x: number) => React.ReactElement;
  }

  interface TrackProps {
    children: (props: { scalePosition: (pos: number) => number; width: number }) => React.ReactNode;
    height?: number;
    leftPanelWidth?: number;
    rightPanelWidth?: number;
    title?: string;
  }

  export const Cursor: React.ComponentType<CursorProps>;
  export const PositionAxisTrack: React.ComponentType<{}>;
  export const RegionViewer: React.ComponentType<RegionViewerProps>;
  export const Track: React.ComponentType<TrackProps>;
}