import type { ObjectAsset } from '../../domain/assets.ts';
import type { Point } from '../../domain/geometry.ts';

/** Creates a local footprint coordinate. */
const point = (x: number, y: number): Point => ({ x, y });

/** Builds a centered rectangular demo footprint. */
const rectangleFootprint = (width: number, height: number) => ({
  outer: [
    point(-width / 2, -height / 2),
    point(width / 2, -height / 2),
    point(width / 2, height / 2),
    point(-width / 2, height / 2),
  ],
});

const demoObjectAssets: ObjectAsset[] = [
  {
    id: 'asset-small-building',
    category: 'building',
    footprint: rectangleFootprint(8, 12),
    tags: ['residential'],
  },
  {
    id: 'asset-townhouse',
    category: 'building',
    footprint: rectangleFootprint(7, 16),
    tags: ['residential'],
  },
  {
    id: 'asset-large-building',
    category: 'building',
    footprint: rectangleFootprint(12, 14),
    tags: ['commercial'],
  },
  {
    id: 'asset-warehouse',
    category: 'building',
    footprint: rectangleFootprint(18, 30),
    tags: ['warehouse'],
  },
];

const assetsById = new Map(demoObjectAssets.map(asset => [asset.id, asset]));

/** Resolves a demo object asset by stable ID. */
export const getObjectAsset = (assetId: string): ObjectAsset | undefined =>
  assetsById.get(assetId);
