import type { Geometry, Path, Point, Polygon } from './geometry.ts';

export type EntityId = string;
export type Origin = 'generated' | 'manual';

export interface Provenance {
  origin: Origin;
  userModified: boolean;
  locked: boolean;
}

export interface CityProject {
  formatVersion: 1;
  metadata: ProjectMetadata;
  city: CityData;
  editor: ProjectEditorSettings;
}

export interface ProjectMetadata {
  id: EntityId;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CityData {
  world: World;
  generation?: CityGeneration;
  terrain: TerrainData;
  cityBoundary: CityBoundary;
  districts: DistrictTopology;
  roads: RoadNetwork;
  infrastructure: Infrastructure;
  blocks: Block[];
  plots: Plot[];
  objects: MapObject[];
}

export interface World {
  unit: 'meter';
  bounds: MapBounds;
}

export interface MapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CityGeneration {
  seed: string;
  generatorVersion: string;
}

export interface TerrainData {
  features: TerrainFeature[];
}

export interface TerrainFeature {
  id: EntityId;
  type: string;
  geometry: Geometry;
  provenance: Provenance;
}

export interface CityBoundary {
  geometry: Polygon;
  provenance: Provenance;
}

export interface DistrictTopology {
  nodes: BoundaryNode[];
  boundaries: DistrictBoundary[];
  items: District[];
}

export interface BoundaryNode {
  id: EntityId;
  position: Point;
}

export interface DistrictBoundary {
  id: EntityId;
  startNodeId: EntityId;
  endNodeId: EntityId;
  path: Path;
  provenance: Provenance;
}

export interface District {
  id: EntityId;
  name: string;
  boundaryLoop: BoundaryRef[];
  color?: string;
  tags: string[];
  generation?: DistrictGeneration;
  provenance: Provenance;
}

export interface BoundaryRef {
  boundaryId: EntityId;
  reversed: boolean;
}

export interface DistrictGeneration {
  profileId: string;
  variation: number;
}

export interface RoadNetwork {
  nodes: RoadNode[];
  roads: Road[];
}

export interface RoadNode {
  id: EntityId;
  position: Point;
}

export interface Road {
  id: EntityId;
  startNodeId: EntityId;
  endNodeId: EntityId;
  path: Path;
  width: number;
  type: string;
  provenance: Provenance;
}

export interface Infrastructure {
  walls: Wall[];
  gates: Gate[];
  bridges: Bridge[];
}

export interface Wall {
  id: EntityId;
  path: Path;
  width: number;
  assetId?: EntityId;
  provenance: Provenance;
}

export interface Gate {
  id: EntityId;
  wallId: EntityId;
  position: Point;
  assetId?: EntityId;
  connectedRoadIds: EntityId[];
  provenance: Provenance;
}

export interface Bridge {
  id: EntityId;
  roadId: EntityId;
  crossedTerrainId?: EntityId;
  geometry: Path;
  assetId?: EntityId;
  provenance: Provenance;
}

export interface Block {
  id: EntityId;
  geometry: Polygon;
  districtId?: EntityId;
  borderingRoadIds: EntityId[];
}

export interface Plot {
  id: EntityId;
  geometry: Polygon;
  blockId: EntityId;
  streetEdges: StreetEdge[];
  provenance: Provenance;
}

export interface StreetEdge {
  path: Path;
  roadId?: EntityId;
}

export interface MapObject {
  id: EntityId;
  assetId: EntityId;
  transform: Transform;
  plotId?: EntityId;
  districtId?: EntityId;
  label?: string;
  tags: string[];
  provenance: Provenance;
}

export interface Transform {
  position: Point;
  rotation: number;
}

export interface ProjectEditorSettings {
  viewport: Viewport;
}

export interface Viewport {
  center: Point;
  zoom: number;
}
