/** A world-space coordinate. One world unit represents one meter. */
export interface Point {
  x: number;
  y: number;
}

/** A v1 polyline. The path does not imply a closed ring. */
export interface Path {
  points: Point[];
}

/** A v1 polygon with one implicitly closed outer ring and no holes. */
export interface Polygon {
  outer: Point[];
}

export type Geometry = Path | Polygon;
