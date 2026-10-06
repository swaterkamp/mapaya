import type { Polygon } from './geometry.ts';

export type ObjectAssetCategory =
  'building' | 'vegetation' | 'structure' | 'prop';

export interface ObjectAsset {
  id: string;
  category: ObjectAssetCategory;
  footprint?: Polygon;
  tags: string[];
}
