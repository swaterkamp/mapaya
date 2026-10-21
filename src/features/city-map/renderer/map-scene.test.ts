import { expect, test } from 'vitest';
import {
  deleteMapObject,
  moveMapObject,
} from '../editor/map-object-operations.ts';
import { demoCityProject } from '../demo-city-project.ts';
import { createMapScene, syncMapObjects } from './map-scene.ts';

test('updates an existing graphic and removes only deleted objects', () => {
  const scene = createMapScene(demoCityProject);
  const existing = scene.objectGraphics.get('building-market-hall');
  expect(existing).toBeDefined();

  const moved = moveMapObject(demoCityProject, 'building-market-hall', {
    x: 32,
    y: 75,
  });
  syncMapObjects(scene, moved);
  expect(scene.objectGraphics.get('building-market-hall')).toBe(existing);
  expect(existing?.position.x).toBe(32);

  const changedAsset = structuredClone(moved);
  changedAsset.city.objects[0]!.assetId = 'asset-warehouse';
  syncMapObjects(scene, changedAsset);
  expect(scene.objectGraphics.get('building-market-hall')).not.toBe(existing);

  syncMapObjects(scene, deleteMapObject(changedAsset, 'building-market-hall'));
  expect(scene.objectGraphics.has('building-market-hall')).toBe(false);
  expect(scene.objectGraphics.has('building-missing-asset')).toBe(true);
  scene.world.destroy({ children: true });
});
