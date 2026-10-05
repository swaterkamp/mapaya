import type { CityProject, Point } from '../../domain/index.ts'

const manualProvenance = {
  origin: 'manual' as const,
  userModified: false,
  locked: false,
}

const point = (x: number, y: number): Point => ({ x, y })

export const demoCityProject: CityProject = {
  formatVersion: 1,
  metadata: { id: 'demo-city', name: 'Mapaya Demo City', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  city: {
    world: { unit: 'meter', bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 } },
    terrain: { features: [] },
    cityBoundary: { geometry: { outer: [point(50, 50), point(950, 50), point(950, 950), point(50, 950)] }, provenance: manualProvenance },
    districts: {
      nodes: [
        { id: 'node-nw', position: point(50, 50) }, { id: 'node-center-north', position: point(500, 50) }, { id: 'node-ne', position: point(950, 50) },
        { id: 'node-sw', position: point(50, 950) }, { id: 'node-center-south', position: point(500, 950) }, { id: 'node-se', position: point(950, 950) },
      ],
      boundaries: [
        { id: 'boundary-north-west', startNodeId: 'node-nw', endNodeId: 'node-center-north', path: { points: [] }, provenance: manualProvenance },
        { id: 'boundary-shared', startNodeId: 'node-center-north', endNodeId: 'node-center-south', path: { points: [] }, provenance: manualProvenance },
        { id: 'boundary-south-west', startNodeId: 'node-center-south', endNodeId: 'node-sw', path: { points: [] }, provenance: manualProvenance },
        { id: 'boundary-west', startNodeId: 'node-sw', endNodeId: 'node-nw', path: { points: [] }, provenance: manualProvenance },
        { id: 'boundary-north-east', startNodeId: 'node-center-north', endNodeId: 'node-ne', path: { points: [] }, provenance: manualProvenance },
        { id: 'boundary-east', startNodeId: 'node-ne', endNodeId: 'node-se', path: { points: [] }, provenance: manualProvenance },
        { id: 'boundary-south-east', startNodeId: 'node-se', endNodeId: 'node-center-south', path: { points: [] }, provenance: manualProvenance },
      ],
      items: [
        { id: 'district-market', name: 'Market Quarter', boundaryLoop: [{ boundaryId: 'boundary-north-west', reversed: false }, { boundaryId: 'boundary-shared', reversed: false }, { boundaryId: 'boundary-south-west', reversed: false }, { boundaryId: 'boundary-west', reversed: false }], color: '#d97706', tags: ['market'], provenance: manualProvenance },
        { id: 'district-harbor', name: 'Harbor Quarter', boundaryLoop: [{ boundaryId: 'boundary-north-east', reversed: false }, { boundaryId: 'boundary-east', reversed: false }, { boundaryId: 'boundary-south-east', reversed: false }, { boundaryId: 'boundary-shared', reversed: true }], color: '#0891b2', tags: ['harbor'], provenance: manualProvenance },
      ],
    },
    roads: {
      nodes: [
        { id: 'road-node-main-west', position: point(80, 500) }, { id: 'road-node-main-east', position: point(920, 500) },
        { id: 'road-node-main-north', position: point(500, 80) }, { id: 'road-node-main-south', position: point(500, 920) },
        { id: 'road-node-market-start', position: point(130, 250) }, { id: 'road-node-market-end', position: point(450, 330) },
        { id: 'road-node-harbor-start', position: point(590, 720) }, { id: 'road-node-harbor-end', position: point(880, 820) },
      ],
      roads: [
        { id: 'road-main-east-west', startNodeId: 'road-node-main-west', endNodeId: 'road-node-main-east', path: { points: [point(80, 500), point(920, 500)] }, width: 24, type: 'main', provenance: manualProvenance },
        { id: 'road-main-north-south', startNodeId: 'road-node-main-north', endNodeId: 'road-node-main-south', path: { points: [point(500, 80), point(500, 920)] }, width: 18, type: 'main', provenance: manualProvenance },
        { id: 'road-market', startNodeId: 'road-node-market-start', endNodeId: 'road-node-market-end', path: { points: [point(130, 250), point(410, 250), point(450, 330)] }, width: 12, type: 'street', provenance: manualProvenance },
        { id: 'road-harbor', startNodeId: 'road-node-harbor-start', endNodeId: 'road-node-harbor-end', path: { points: [point(590, 720), point(820, 720), point(880, 820)] }, width: 12, type: 'street', provenance: manualProvenance },
      ],
    },
    infrastructure: { walls: [], gates: [], bridges: [] }, blocks: [], plots: [],
    objects: [
      { id: 'building-market-hall', assetId: 'placeholder-building', transform: { position: point(245, 390), rotation: 0 }, districtId: 'district-market', label: 'Market Hall', tags: ['market'], provenance: manualProvenance },
      { id: 'building-watch-house', assetId: 'placeholder-building', transform: { position: point(670, 300), rotation: 18 }, districtId: 'district-harbor', label: 'Watch House', tags: ['guard'], provenance: manualProvenance },
      { id: 'building-warehouse', assetId: 'placeholder-building', transform: { position: point(760, 820), rotation: -12 }, districtId: 'district-harbor', label: 'Warehouse', tags: ['storage'], provenance: manualProvenance },
      { id: 'building-bakery', assetId: 'placeholder-building', transform: { position: point(300, 720), rotation: 8 }, districtId: 'district-market', label: 'Bakery', tags: ['food'], provenance: manualProvenance },
      { id: 'building-townhouse', assetId: 'placeholder-building', transform: { position: point(690, 570), rotation: 90 }, districtId: 'district-harbor', label: 'Townhouse', tags: ['residential'], provenance: manualProvenance },
    ],
  },
  editor: { viewport: { center: point(500, 500), zoom: 1 } },
}
