import {
  Container,
  Graphics,
  Polygon as PixiPolygon,
  Rectangle,
} from 'pixi.js';
import type {
  CityProject,
  District,
  MapObject,
  Point,
  Polygon,
} from '../../../domain/index.ts';
import { getObjectAsset } from '../demo-asset-library.ts';

export type MapScene = {
  world: Container;
  objects: Container;
  selection: Graphics;
  objectGraphics: Map<string, Graphics>;
  graphicIds: Map<Graphics, string>;
  renderedObjects: Map<string, MapObject>;
};

/** Resolves a shared district boundary node to its world position. */
const getBoundaryNode = (project: CityProject, id: string): Point => {
  const node = project.city.districts.nodes.find(
    candidate => candidate.id === id,
  );
  if (!node) throw new Error(`Missing district boundary node: ${id}`);
  return node.position;
};

/** Reconstructs a district edge from its nodes and intermediate points. */
const getBoundaryPoints = (
  project: CityProject,
  id: string,
  reversed: boolean,
): Point[] => {
  const boundary = project.city.districts.boundaries.find(
    candidate => candidate.id === id,
  );
  if (!boundary) throw new Error(`Missing district boundary: ${id}`);
  const start = getBoundaryNode(
    project,
    reversed ? boundary.endNodeId : boundary.startNodeId,
  );
  const end = getBoundaryNode(
    project,
    reversed ? boundary.startNodeId : boundary.endNodeId,
  );
  const path = reversed
    ? [...boundary.path.points].reverse()
    : boundary.path.points;
  return [start, ...path, end];
};

/** Joins the district's referenced edges into a drawable polygon. */
const getDistrictPoints = (
  project: CityProject,
  district: District,
): number[] =>
  district.boundaryLoop.flatMap(ref =>
    getBoundaryPoints(project, ref.boundaryId, ref.reversed).flatMap(point => [
      point.x,
      point.y,
    ]),
  );

/** Adds the road's referenced endpoints to its intermediate path. */
const getRoadPoints = (
  project: CityProject,
  startId: string,
  path: Point[],
  endId: string,
): Point[] => {
  const nodes = project.city.roads.nodes;
  const start = nodes.find(node => node.id === startId);
  const end = nodes.find(node => node.id === endId);
  if (!start || !end)
    throw new Error(`Missing road node: ${!start ? startId : endId}`);
  return [start.position, ...path, end.position];
};

/** Draws a world-aligned grid inside the project bounds. */
const drawGrid = (
  graphics: Graphics,
  project: CityProject,
  step: number,
  color: number,
  alpha: number,
  width: number,
): void => {
  const { minX, minY, maxX, maxY } = project.city.world.bounds;
  for (let x = minX; x <= maxX; x += step)
    graphics.moveTo(x, minY).lineTo(x, maxY);
  for (let y = minY; y <= maxY; y += step)
    graphics.moveTo(minX, y).lineTo(maxX, y);
  graphics.stroke({ color, alpha, width });
};

/** Converts a local asset footprint into Pixi's flat polygon format. */
const footprintPoints = (footprint: Polygon): number[] =>
  footprint.outer.flatMap(point => [point.x, point.y]);

/** Draws a visible placeholder when an asset ID cannot be resolved. */
const drawMissingAsset = (graphics: Graphics): void => {
  graphics
    .rect(-16, -12, 32, 24)
    .fill({ color: 0xef4444, alpha: 0.9 })
    .stroke({ color: 0xfef2f2, width: 2 });
  graphics
    .moveTo(-10, -7)
    .lineTo(10, 7)
    .moveTo(10, -7)
    .lineTo(-10, 7)
    .stroke({ color: 0xfef2f2, width: 2 });
};

/** Applies the domain transform while accounting for Pixi's inverted world Y. */
const positionGraphic = (graphic: Graphics, object: MapObject): void => {
  graphic.position.set(
    object.transform.position.x,
    object.transform.position.y,
  );
  graphic.rotation = (-object.transform.rotation * Math.PI) / 180;
};

/** Creates one interactive drawing for an object and its asset footprint. */
const createObjectGraphic = (object: MapObject): Graphics => {
  const graphic = new Graphics();
  const footprint = getObjectAsset(object.assetId)?.footprint;
  if (footprint) {
    const points = footprintPoints(footprint);
    graphic
      .poly(points)
      .fill({ color: 0xf8fafc, alpha: 0.92 })
      .stroke({ color: 0x1e293b, width: 1.5 });
    graphic.hitArea = new PixiPolygon(points);
  } else {
    drawMissingAsset(graphic);
    graphic.hitArea = new Rectangle(-16, -12, 32, 24);
  }
  positionGraphic(graphic, object);
  graphic.eventMode = 'static';
  graphic.cursor = 'pointer';
  return graphic;
};

/** Reads the active theme color for Pixi's selection outline. */
const getPrimaryColor = (): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim() || '#F47C3C';

/** Redraws only the selected object's outline. */
export const drawSelection = (
  scene: MapScene,
  project: CityProject,
  id: string | null,
): void => {
  const graphic = scene.selection;
  graphic.clear();
  const object = project.city.objects.find(candidate => candidate.id === id);
  if (!object) return;
  positionGraphic(graphic, object);
  const footprint = getObjectAsset(object.assetId)?.footprint;
  if (footprint) {
    graphic
      .poly(footprintPoints(footprint))
      .stroke({ color: getPrimaryColor(), alpha: 1, width: 3 });
  } else {
    graphic
      .rect(-18, -14, 36, 28)
      .stroke({ color: getPrimaryColor(), alpha: 1, width: 3 });
  }
};

/** Builds the initial scene and keeps Pixi resources out of CityProject. */
export const createMapScene = (project: CityProject): MapScene => {
  const world = new Container();
  const fineGrid = new Graphics();
  const majorGrid = new Graphics();
  const districts = new Graphics();
  const roads = new Container();
  const objects = new Container();
  const selection = new Graphics();
  const boundary = new Graphics();
  const origin = new Graphics();
  const objectGraphics = new Map<string, Graphics>();
  const graphicIds = new Map<Graphics, string>();
  const renderedObjects = new Map<string, MapObject>();
  const { minX, minY, maxX, maxY } = project.city.world.bounds;

  drawGrid(fineGrid, project, 10, 0x41617e, 0.3, 1);
  drawGrid(majorGrid, project, 100, 0x9ab5d1, 0.62, 2);
  for (const district of project.city.districts.items) {
    districts
      .poly(getDistrictPoints(project, district))
      .fill({ color: district.color ?? '#64748b', alpha: 0.23 });
  }
  for (const road of project.city.roads.roads) {
    const roadGraphic = new Graphics();
    const [first, ...remaining] = getRoadPoints(
      project,
      road.startNodeId,
      road.path.points,
      road.endNodeId,
    );
    if (!first) continue;
    roadGraphic.moveTo(first.x, first.y);
    for (const point of remaining) roadGraphic.lineTo(point.x, point.y);
    roadGraphic.stroke({ color: 0xe2c18a, alpha: 0.9, width: road.width });
    roads.addChild(roadGraphic);
  }
  for (const object of project.city.objects) {
    const graphic = createObjectGraphic(object);
    objectGraphics.set(object.id, graphic);
    graphicIds.set(graphic, object.id);
    renderedObjects.set(object.id, object);
    objects.addChild(graphic);
  }
  boundary
    .rect(minX, minY, maxX - minX, maxY - minY)
    .stroke({ color: 0xf8fafc, alpha: 0.95, width: 6 });
  origin
    .moveTo(-18, 0)
    .lineTo(18, 0)
    .moveTo(0, -18)
    .lineTo(0, 18)
    .stroke({ color: 0xf97316, width: 4 });
  selection.eventMode = 'none';
  objects.eventMode = 'static';
  world.eventMode = 'static';
  world.hitArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);
  world.addChild(
    fineGrid,
    majorGrid,
    districts,
    roads,
    objects,
    selection,
    boundary,
    origin,
  );
  return {
    world,
    objects,
    selection,
    objectGraphics,
    graphicIds,
    renderedObjects,
  };
};

/** Applies object edits to existing Graphics without rebuilding the scene. */
export const syncMapObjects = (scene: MapScene, project: CityProject): void => {
  const currentIds = new Set(project.city.objects.map(object => object.id));
  for (const [id, graphic] of scene.objectGraphics) {
    if (currentIds.has(id)) continue;
    scene.objects.removeChild(graphic);
    graphic.destroy();
    scene.objectGraphics.delete(id);
    scene.graphicIds.delete(graphic);
    scene.renderedObjects.delete(id);
  }
  for (const object of project.city.objects) {
    let graphic = scene.objectGraphics.get(object.id);
    const previous = scene.renderedObjects.get(object.id);
    if (previous === object) continue;
    if (graphic && previous?.assetId !== object.assetId) {
      scene.objects.removeChild(graphic);
      scene.graphicIds.delete(graphic);
      graphic.destroy();
      scene.objectGraphics.delete(object.id);
      graphic = undefined;
    }
    if (!graphic) {
      graphic = createObjectGraphic(object);
      scene.objectGraphics.set(object.id, graphic);
      scene.graphicIds.set(graphic, object.id);
      scene.objects.addChild(graphic);
    }
    positionGraphic(graphic, object);
    scene.renderedObjects.set(object.id, object);
  }
};
