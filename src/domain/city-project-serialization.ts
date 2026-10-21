import type { CityProject } from './city-project.ts';

type JsonRecord = { [key: string]: unknown };

/** Checks whether an untrusted value has object fields. */
const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Checks the shape of a serialized world point. */
const isPoint = (value: unknown): boolean =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';

/** Checks the shape of a serialized object transform. */
const isTransform = (value: unknown): boolean =>
  isRecord(value) &&
  isPoint(value.position) &&
  typeof value.rotation === 'number';

/** Checks the fields needed to edit a serialized map object. */
const isMapObject = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.assetId === 'string' &&
  isTransform(value.transform) &&
  Array.isArray(value.tags) &&
  value.tags.every(tag => typeof tag === 'string') &&
  isRecord(value.provenance) &&
  (value.provenance.origin === 'generated' ||
    value.provenance.origin === 'manual') &&
  typeof value.provenance.userModified === 'boolean' &&
  typeof value.provenance.locked === 'boolean';

/** Checks the supported project version and required root fields. */
const isCityProject = (value: unknown): value is CityProject => {
  if (!isRecord(value) || value.formatVersion !== 1) return false;
  if (!isRecord(value.metadata) || typeof value.metadata.id !== 'string')
    return false;
  if (!isRecord(value.city) || !isRecord(value.city.world)) return false;
  if (!isRecord(value.city.world.bounds)) return false;
  const bounds = value.city.world.bounds;
  if (
    typeof bounds.minX !== 'number' ||
    typeof bounds.minY !== 'number' ||
    typeof bounds.maxX !== 'number' ||
    typeof bounds.maxY !== 'number'
  )
    return false;
  if (
    !Array.isArray(value.city.objects) ||
    !value.city.objects.every(isMapObject)
  )
    return false;
  if (!isRecord(value.editor) || !isRecord(value.editor.viewport)) return false;
  return (
    isPoint(value.editor.viewport.center) &&
    typeof value.editor.viewport.zoom === 'number'
  );
};

/** Parses and validates a v1 CityProject received from an external JSON source. */
export const parseCityProject = (json: string): CityProject => {
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.');
  }
  if (!isCityProject(value)) {
    throw new Error(
      'Die Datei entspricht nicht dem unterstützten CityProject-v1-Format.',
    );
  }
  return value;
};

/** Serializes the active project for storage or download. */
export const serializeCityProject = (project: CityProject): string =>
  JSON.stringify(project, null, 2);
