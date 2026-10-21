import type { CityProject, Point } from '../../../domain/index.ts';

/** Returns a project with one object's position changed by stable ID. */
export const moveMapObject = (
  project: CityProject,
  id: string,
  position: Point,
): CityProject => ({
  ...project,
  city: {
    ...project.city,
    objects: project.city.objects.map(object =>
      object.id === id
        ? {
            ...object,
            transform: { ...object.transform, position },
            provenance: { ...object.provenance, userModified: true },
          }
        : object,
    ),
  },
});

/** Returns a project with one object's rotation changed by stable ID. */
export const rotateMapObject = (
  project: CityProject,
  id: string,
  rotation: number,
): CityProject => ({
  ...project,
  city: {
    ...project.city,
    objects: project.city.objects.map(object =>
      object.id === id
        ? {
            ...object,
            transform: { ...object.transform, rotation },
            provenance: { ...object.provenance, userModified: true },
          }
        : object,
    ),
  },
});

/** Removes a map object by stable ID without changing other objects. */
export const deleteMapObject = (
  project: CityProject,
  id: string,
): CityProject => ({
  ...project,
  city: {
    ...project.city,
    objects: project.city.objects.filter(object => object.id !== id),
  },
});

/** Converts a world-space cursor direction to the stored rotation angle. */
export const rotationTowardPointer = (center: Point, pointer: Point): number =>
  -(Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI;
