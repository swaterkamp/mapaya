import { useEffect, useRef, useState } from 'react';
import {
  ArrowClockwiseIcon,
  ArrowsOutCardinalIcon,
} from '@phosphor-icons/react';
import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Polygon as PixiPolygon,
  Rectangle,
} from 'pixi.js';
import type {
  CityProject,
  District,
  MapObject,
  Point,
} from '../../domain/index.ts';
import type { Polygon } from '../../domain/geometry.ts';
import { getObjectAsset } from './demo-asset-library.ts';

type MapScene = {
  objects: Container;
  selection: Graphics;
  objectGraphics: Map<string, Graphics>;
};

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const GRID_STEP = 10;
const MAJOR_GRID_STEP = 100;

const getNodePosition = (project: CityProject, nodeId: string): Point => {
  const node = project.city.districts.nodes.find(
    candidate => candidate.id === nodeId,
  );
  if (!node) throw new Error(`Missing district boundary node: ${nodeId}`);
  return node.position;
};

const getBoundaryPoints = (
  project: CityProject,
  boundaryId: string,
  reversed: boolean,
): Point[] => {
  const boundary = project.city.districts.boundaries.find(
    candidate => candidate.id === boundaryId,
  );
  if (!boundary) throw new Error(`Missing district boundary: ${boundaryId}`);
  const start = getNodePosition(
    project,
    reversed ? boundary.endNodeId : boundary.startNodeId,
  );
  const end = getNodePosition(
    project,
    reversed ? boundary.startNodeId : boundary.endNodeId,
  );
  const path = reversed
    ? [...boundary.path.points].reverse()
    : boundary.path.points;
  return [start, ...path, end];
};

const getDistrictPoints = (project: CityProject, district: District): Point[] =>
  district.boundaryLoop.flatMap(boundaryRef =>
    getBoundaryPoints(project, boundaryRef.boundaryId, boundaryRef.reversed),
  );

const getRoadPoints = (
  project: CityProject,
  startNodeId: string,
  path: Point[],
  endNodeId: string,
): Point[] => {
  const nodes = project.city.roads.nodes;
  const startNode = nodes.find(node => node.id === startNodeId);
  const endNode = nodes.find(node => node.id === endNodeId);
  if (!startNode || !endNode)
    throw new Error(
      `Missing road node: ${!startNode ? startNodeId : endNodeId}`,
    );
  return [startNode.position, ...path, endNode.position];
};

const drawGrid = (
  graphics: Graphics,
  project: CityProject,
  step: number,
  color: number,
  alpha: number,
  width: number,
) => {
  const { minX, minY, maxX, maxY } = project.city.world.bounds;
  for (let x = minX; x <= maxX; x += step)
    graphics.moveTo(x, minY).lineTo(x, maxY);
  for (let y = minY; y <= maxY; y += step)
    graphics.moveTo(minX, y).lineTo(maxX, y);
  graphics.stroke({ color, alpha, width });
};

const drawFootprint = (graphics: Graphics, footprint: Polygon) => {
  const points = footprint.outer.flatMap(point => [point.x, point.y]);
  graphics
    .poly(points)
    .fill({ color: 0xf8fafc, alpha: 0.92 })
    .stroke({ color: 0x1e293b, width: 1.5 });
};

const drawMissingAsset = (graphics: Graphics) => {
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

const getFootprintPoints = (footprint: Polygon): number[] =>
  footprint.outer.flatMap(point => [point.x, point.y]);

const getPrimaryColor = (): string => {
  const primary = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim();
  return primary || '#F47C3C';
};

const drawSelection = (
  graphics: Graphics,
  mapObjectId: string | null,
  project: CityProject,
) => {
  graphics.clear();
  if (!mapObjectId) return;

  const mapObject = project.city.objects.find(
    candidate => candidate.id === mapObjectId,
  );
  if (!mapObject) return;

  const asset = getObjectAsset(mapObject.assetId);
  const primaryColor = getPrimaryColor();
  graphics.position.set(
    mapObject.transform.position.x,
    mapObject.transform.position.y,
  );
  graphics.rotation = (-mapObject.transform.rotation * Math.PI) / 180;
  if (asset?.footprint) {
    graphics
      .poly(getFootprintPoints(asset.footprint))
      .stroke({ color: primaryColor, alpha: 1, width: 3 });
    return;
  }

  graphics
    .rect(-18, -14, 36, 28)
    .stroke({ color: primaryColor, alpha: 1, width: 3 });
};

const createMapObjectGraphic = (mapObject: MapObject): Graphics => {
  const building = new Graphics();
  const asset = getObjectAsset(mapObject.assetId);
  if (asset?.footprint) {
    drawFootprint(building, asset.footprint);
    building.hitArea = new PixiPolygon(getFootprintPoints(asset.footprint));
  } else {
    drawMissingAsset(building);
    building.hitArea = new Rectangle(-16, -12, 32, 24);
  }
  building.position.set(
    mapObject.transform.position.x,
    mapObject.transform.position.y,
  );
  building.rotation = (-mapObject.transform.rotation * Math.PI) / 180;
  building.eventMode = 'static';
  building.cursor = 'pointer';
  return building;
};

const drawProject = (project: CityProject, world: Container): MapScene => {
  const fineGrid = new Graphics();
  const majorGrid = new Graphics();
  const districts = new Graphics();
  const roads = new Graphics();
  const objects = new Container();
  const selection = new Graphics();
  selection.eventMode = 'none';
  const objectGraphics = new Map<string, Graphics>();
  const boundary = new Graphics();
  const origin = new Graphics();
  const { minX, minY, maxX, maxY } = project.city.world.bounds;

  drawGrid(fineGrid, project, GRID_STEP, 0x41617e, 0.3, 1);
  drawGrid(majorGrid, project, MAJOR_GRID_STEP, 0x9ab5d1, 0.62, 2);

  for (const district of project.city.districts.items) {
    const points = getDistrictPoints(project, district).flatMap(point => [
      point.x,
      point.y,
    ]);
    districts
      .poly(points)
      .fill({ color: district.color ?? '#64748b', alpha: 0.23 });
  }
  for (const road of project.city.roads.roads) {
    const roadGraphic = new Graphics();
    const [firstPoint, ...remainingPoints] = getRoadPoints(
      project,
      road.startNodeId,
      road.path.points,
      road.endNodeId,
    );
    if (!firstPoint) continue;
    roadGraphic.moveTo(firstPoint.x, firstPoint.y);
    for (const point of remainingPoints) roadGraphic.lineTo(point.x, point.y);
    roadGraphic.stroke({ color: 0xe2c18a, alpha: 0.9, width: road.width });
    roads.addChild(roadGraphic);
  }
  for (const mapObject of project.city.objects) {
    const building = createMapObjectGraphic(mapObject);
    objectGraphics.set(mapObject.id, building);
    objects.addChild(building);
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
  return { objects, selection, objectGraphics };
};

export type MapCanvasProps = {
  project: CityProject;
  onProjectChange: (project: CityProject) => void;
};

export const MapCanvas = ({ project, onProjectChange }: MapCanvasProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [selectedMapObjectId, setSelectedMapObjectId] = useState<string | null>(
    null,
  );
  const [interactionMode, setInteractionMode] = useState<'move' | 'rotate'>(
    'move',
  );
  const [indicatorPosition, setIndicatorPosition] = useState({ x: 0, y: 0 });
  const projectRef = useRef(project);
  const projectChangeRef = useRef(onProjectChange);
  const sceneRef = useRef<MapScene | null>(null);
  const selectedMapObjectIdRef = useRef<string | null>(null);
  const worldRef = useRef<Container | null>(null);

  useEffect(() => {
    projectRef.current = project;
    projectChangeRef.current = onProjectChange;
  }, [onProjectChange, project]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const application = new Application();
    const world = new Container();
    worldRef.current = world;
    let zoom = 1;
    let isPanning = false;
    let isPointerDown = false;
    let isDragging = false;
    let didSelectObject = false;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let dragMode: 'move' | 'rotate' = 'move';
    let dragObjectId: string | null = null;
    let dragOffset: Point = { x: 0, y: 0 };
    let lastPointerX = 0;
    let lastPointerY = 0;
    let isDisposed = false;
    let isInitialized = false;

    const centerWorld = () => {
      const { minX, minY, maxX, maxY } = projectRef.current.city.world.bounds;
      const width = maxX - minX;
      const height = maxY - minY;
      zoom = Math.min(
        MAX_ZOOM,
        Math.max(
          MIN_ZOOM,
          Math.min(host.clientWidth / width, host.clientHeight / height) * 0.82,
        ),
      );
      world.scale.set(zoom, -zoom);
      world.position.set(
        (host.clientWidth - width * zoom) / 2 - minX * zoom,
        (host.clientHeight - height * zoom) / 2 + minY * zoom,
      );
      refreshIndicator();
    };
    const resize = () =>
      application.renderer.resize(host.clientWidth, host.clientHeight);
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = application.canvas.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const worldX = (pointerX - world.position.x) / zoom;
      const worldY = (pointerY - world.position.y) / -zoom;
      zoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoom * Math.pow(1.0015, -event.deltaY)),
      );
      world.scale.set(zoom, -zoom);
      world.position.set(pointerX - worldX * zoom, pointerY + worldY * zoom);
      refreshIndicator();
    };
    const updateProjectObject = (
      id: string,
      updater: (object: MapObject) => void,
    ) => {
      const nextProject = structuredClone(projectRef.current);
      const mapObject = nextProject.city.objects.find(
        object => object.id === id,
      );
      if (!mapObject) return;
      updater(mapObject);
      projectChangeRef.current(nextProject);
    };
    const updateSelection = (mapObjectId: string | null) => {
      selectedMapObjectIdRef.current = mapObjectId;
      setSelectedMapObjectId(mapObjectId);
      setInteractionMode('move');
      if (sceneRef.current)
        drawSelection(
          sceneRef.current.selection,
          selectedMapObjectIdRef.current,
          projectRef.current,
        );
      const mapObject = projectRef.current.city.objects.find(
        object => object.id === mapObjectId,
      );
      if (mapObject) {
        const position = world.toGlobal(mapObject.transform.position);
        setIndicatorPosition({ x: position.x, y: position.y });
      }
    };
    const refreshIndicator = () => {
      const mapObject = projectRef.current.city.objects.find(
        object => object.id === selectedMapObjectIdRef.current,
      );
      if (!mapObject) return;
      const position = world.toGlobal(mapObject.transform.position);
      setIndicatorPosition({ x: position.x, y: position.y });
    };
    const getWorldPointer = (event: PointerEvent): Point => {
      const bounds = application.canvas.getBoundingClientRect();
      return world.toLocal({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button === 1) {
        isPanning = true;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        application.canvas.setPointerCapture(event.pointerId);
        application.canvas.style.cursor = 'grabbing';
        return;
      }
      if (event.button !== 0 || !dragObjectId) return;
      application.canvas.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (isPanning) {
        world.position.x += event.clientX - lastPointerX;
        world.position.y += event.clientY - lastPointerY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        refreshIndicator();
        return;
      }
      if (!isPointerDown || !dragObjectId || !sceneRef.current) return;
      const bounds = application.canvas.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      if (!isDragging) {
        if (Math.hypot(pointerX - pointerDownX, pointerY - pointerDownY) < 3)
          return;
        isDragging = true;
      }
      const mapObject = projectRef.current.city.objects.find(
        object => object.id === dragObjectId,
      );
      if (!mapObject) return;
      const pointer = getWorldPointer(event);
      if (dragMode === 'move') {
        const nextPosition = {
          x: pointer.x + dragOffset.x,
          y: pointer.y + dragOffset.y,
        };
        updateProjectObject(dragObjectId, object => {
          object.transform.position = nextPosition;
        });
        const screenPosition = world.toGlobal(nextPosition);
        setIndicatorPosition({ x: screenPosition.x, y: screenPosition.y });
      } else {
        const dx = pointer.x - mapObject.transform.position.x;
        const dy = pointer.y - mapObject.transform.position.y;
        const rotation = -(Math.atan2(dy, dx) * 180) / Math.PI;
        updateProjectObject(dragObjectId, object => {
          object.transform.rotation = rotation;
        });
      }
    };
    const stopPointerInteraction = (event?: PointerEvent) => {
      if (event?.button === 1 || isPanning) {
        isPanning = false;
        application.canvas.style.cursor = 'grab';
      }
      if (isPointerDown && dragObjectId && !isDragging && !didSelectObject) {
        dragMode = dragMode === 'move' ? 'rotate' : 'move';
        setInteractionMode(dragMode);
        application.canvas.style.cursor =
          dragMode === 'rotate' ? 'crosshair' : 'grab';
      }
      if (isPointerDown) {
        isPointerDown = false;
        isDragging = false;
        dragObjectId = null;
        dragOffset = { x: 0, y: 0 };
        didSelectObject = false;
        application.canvas.style.cursor = 'grab';
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedMapObjectIdRef.current
      ) {
        const deletedId = selectedMapObjectIdRef.current;
        const nextProject = structuredClone(projectRef.current);
        nextProject.city.objects = nextProject.city.objects.filter(
          object => object.id !== deletedId,
        );
        updateSelection(null);
        projectChangeRef.current(nextProject);
      }
      if (event.key.toLowerCase() === 'r' && selectedMapObjectIdRef.current) {
        dragMode = dragMode === 'move' ? 'rotate' : 'move';
        setInteractionMode(dragMode);
        application.canvas.style.cursor =
          dragMode === 'rotate' ? 'crosshair' : 'grab';
      }
    };
    const initialize = async () => {
      await application.init({ backgroundAlpha: 0, resizeTo: host });
      if (isDisposed) {
        application.destroy(true);
        return;
      }
      isInitialized = true;
      host.appendChild(application.canvas);
      application.canvas.className = 'map-canvas';
      application.canvas.style.cursor = 'grab';
      sceneRef.current = drawProject(projectRef.current, world);
      application.stage.addChild(world);
      world.eventMode = 'static';
      world.hitArea = new Rectangle(
        projectRef.current.city.world.bounds.minX,
        projectRef.current.city.world.bounds.minY,
        projectRef.current.city.world.bounds.maxX -
          projectRef.current.city.world.bounds.minX,
        projectRef.current.city.world.bounds.maxY -
          projectRef.current.city.world.bounds.minY,
      );
      sceneRef.current.objects.eventMode = 'static';
      sceneRef.current.objects.on(
        'pointerdown',
        (event: FederatedPointerEvent) => {
          if (event.button !== 0) return;
          const objectEntry = [
            ...sceneRef.current!.objectGraphics.entries(),
          ].find(([, graphic]) => graphic === event.target);
          if (!objectEntry) return;
          event.stopPropagation();
          const [id] = objectEntry;
          dragObjectId = id;
          isPointerDown = true;
          isDragging = false;
          didSelectObject = selectedMapObjectIdRef.current !== id;
          pointerDownX = event.global.x;
          pointerDownY = event.global.y;
          application.canvas.setPointerCapture(event.pointerId);
          const mapObject = projectRef.current.city.objects.find(
            object => object.id === id,
          );
          if (mapObject) {
            const pointer = world.toLocal(event.global);
            dragOffset = {
              x: mapObject.transform.position.x - pointer.x,
              y: mapObject.transform.position.y - pointer.y,
            };
          }
          if (didSelectObject) {
            dragMode = 'move';
            setInteractionMode('move');
            updateSelection(id);
          }
          application.canvas.style.cursor =
            dragMode === 'rotate' ? 'crosshair' : 'grab';
        },
      );
      sceneRef.current.objects.on(
        'pointertap',
        (event: FederatedPointerEvent) => {
          event.stopPropagation();
        },
      );
      world.on('pointertap', (event: FederatedPointerEvent) => {
        if (event.button !== 0 || isDragging) return;
        const clickedObject = [
          ...sceneRef.current!.objectGraphics.values(),
        ].some(graphic => graphic === event.target);
        if (!clickedObject) updateSelection(null);
      });
      centerWorld();
      application.canvas.addEventListener('wheel', handleWheel, {
        passive: false,
      });
      application.canvas.addEventListener('pointerdown', handlePointerDown);
      application.canvas.addEventListener('pointermove', handlePointerMove);
      application.canvas.addEventListener('pointerup', stopPointerInteraction);
      application.canvas.addEventListener(
        'pointercancel',
        stopPointerInteraction,
      );
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', resize);
    };
    void initialize();
    return () => {
      isDisposed = true;
      window.removeEventListener('resize', resize);
      if (!isInitialized) return;
      application.canvas.removeEventListener('wheel', handleWheel);
      application.canvas.removeEventListener('pointerdown', handlePointerDown);
      application.canvas.removeEventListener('pointermove', handlePointerMove);
      application.canvas.removeEventListener(
        'pointerup',
        stopPointerInteraction,
      );
      application.canvas.removeEventListener(
        'pointercancel',
        stopPointerInteraction,
      );
      window.removeEventListener('keydown', handleKeyDown);
      application.destroy(true, {
        children: true,
        texture: true,
        textureSource: true,
      });
      sceneRef.current = null;
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const currentIds = new Set(project.city.objects.map(object => object.id));
    for (const [id, graphic] of scene.objectGraphics) {
      if (currentIds.has(id)) continue;
      scene.objects.removeChild(graphic);
      graphic.destroy();
      scene.objectGraphics.delete(id);
    }
    for (const mapObject of project.city.objects) {
      let graphic = scene.objectGraphics.get(mapObject.id);
      if (!graphic) {
        graphic = createMapObjectGraphic(mapObject);
        scene.objectGraphics.set(mapObject.id, graphic);
        scene.objects.addChild(graphic);
      }
      graphic.position.set(
        mapObject.transform.position.x,
        mapObject.transform.position.y,
      );
      graphic.rotation = (-mapObject.transform.rotation * Math.PI) / 180;
    }
    drawSelection(scene.selection, selectedMapObjectIdRef.current, project);
    const selectedObject = project.city.objects.find(
      object => object.id === selectedMapObjectIdRef.current,
    );
    if (selectedObject && worldRef.current) {
      const position = worldRef.current.toGlobal(
        selectedObject.transform.position,
      );
      setIndicatorPosition({ x: position.x, y: position.y });
    }
  }, [project]);

  const IndicatorIcon =
    interactionMode === 'rotate' ? ArrowClockwiseIcon : ArrowsOutCardinalIcon;

  return (
    <div ref={hostRef} className="relative h-full w-full">
      {selectedMapObjectId && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-full border border-sky-300 bg-slate-900/90 p-1 text-sky-300 shadow-lg"
          style={{ left: indicatorPosition.x, top: indicatorPosition.y - 16 }}
          aria-label={
            interactionMode === 'rotate' ? 'Rotationsmodus' : 'Verschiebemodus'
          }
        >
          <IndicatorIcon size={20} weight="bold" />
        </div>
      )}
    </div>
  );
};
