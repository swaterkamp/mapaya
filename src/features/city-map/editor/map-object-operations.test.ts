import { describe, expect, test } from 'vitest';
import { demoCityProject } from '../demo-city-project.ts';
import {
  deleteMapObject,
  moveMapObject,
  rotateMapObject,
  rotationTowardPointer,
} from './map-object-operations.ts';

describe('map object edits', () => {
  test('moves one object without changing the source or its stable ID', () => {
    const source = structuredClone(demoCityProject);
    const moved = moveMapObject(source, 'building-market-hall', {
      x: -12,
      y: 42,
    });

    expect(moved.city.objects[0]?.transform.position).toEqual({
      x: -12,
      y: 42,
    });
    expect(moved.city.objects[0]?.id).toBe('building-market-hall');
    expect(moved.city.objects[0]?.provenance.userModified).toBe(true);
    expect(source.city.objects[0]?.transform.position).toEqual({
      x: 245,
      y: 390,
    });
    expect(moved.city.objects[1]).toBe(source.city.objects[1]);
  });

  test('rotates an object and leaves an unknown ID unchanged', () => {
    const rotated = rotateMapObject(
      demoCityProject,
      'building-market-hall',
      135,
    );
    expect(rotated.city.objects[0]?.transform.rotation).toBe(135);
    expect(demoCityProject.city.objects[0]?.transform.rotation).toBe(0);
    expect(
      moveMapObject(demoCityProject, 'unknown', { x: 1, y: 2 }).city.objects,
    ).toEqual(demoCityProject.city.objects);
  });

  test('deletes only the requested object', () => {
    const deleted = deleteMapObject(demoCityProject, 'building-market-hall');
    expect(deleted.city.objects).toHaveLength(
      demoCityProject.city.objects.length - 1,
    );
    expect(
      deleted.city.objects.some(object => object.id === 'building-market-hall'),
    ).toBe(false);
    expect(demoCityProject.city.objects).toHaveLength(6);
  });

  test('maps cursor direction to the editor rotation convention', () => {
    expect(rotationTowardPointer({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe(-90);
    expect(rotationTowardPointer({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(-0);
  });
});
