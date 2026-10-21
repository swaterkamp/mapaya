import type { Point } from '../../../domain/index.ts';
import { Container } from 'pixi.js';
import type { MapBounds } from '../../../domain/index.ts';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

/** Fits the project bounds in the canvas using an inverted world Y axis. */
export const fitCamera = (
  world: Container,
  bounds: MapBounds,
  width: number,
  height: number,
): number => {
  const worldWidth = bounds.maxX - bounds.minX;
  const worldHeight = bounds.maxY - bounds.minY;
  const zoom = Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      Math.min(width / worldWidth, height / worldHeight) * 0.82,
    ),
  );
  world.scale.set(zoom, -zoom);
  world.position.set(
    (width - worldWidth * zoom) / 2 - bounds.minX * zoom,
    (height - worldHeight * zoom) / 2 + bounds.minY * zoom,
  );
  return zoom;
};

/** Zooms toward a canvas point and keeps its world coordinate under the cursor. */
export const zoomCamera = (
  world: Container,
  zoom: number,
  pointer: Point,
  wheelDelta: number,
): number => {
  const worldX = (pointer.x - world.position.x) / zoom;
  const worldY = (pointer.y - world.position.y) / -zoom;
  const nextZoom = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, zoom * Math.pow(1.0015, -wheelDelta)),
  );
  world.scale.set(nextZoom, -nextZoom);
  world.position.set(
    pointer.x - worldX * nextZoom,
    pointer.y + worldY * nextZoom,
  );
  return nextZoom;
};

/** Converts a client pointer position into world coordinates. */
export const pointerToWorld = (
  world: Container,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Point => {
  const bounds = canvas.getBoundingClientRect();
  return world.toLocal({ x: clientX - bounds.left, y: clientY - bounds.top });
};
