import { describe, expect, test } from 'vitest';
import {
  parseCityProject,
  serializeCityProject,
} from '../city-project-serialization';
import { demoCityProject } from '../../features/city-map/demo-city-project';

describe('CityProject JSON serialization', () => {
  test('round-trips the current project including transforms', () => {
    const project = structuredClone(demoCityProject);
    project.city.objects[0]!.transform.position.x = 321;
    project.city.objects[0]!.transform.rotation = 47;

    const parsed = parseCityProject(serializeCityProject(project));

    expect(parsed.city.objects[0]?.transform).toEqual({
      position: { x: 321, y: 390 },
      rotation: 47,
    });
  });

  test('rejects invalid or unsupported project data', () => {
    expect(() => parseCityProject('{"formatVersion":2}')).toThrow();
    expect(() => parseCityProject('not json')).toThrow();
  });
});
