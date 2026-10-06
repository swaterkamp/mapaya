import { useEffect, useRef } from 'react'
import { Application, Container, Graphics } from 'pixi.js'
import type { CityProject, District, Point } from '../../domain/index.ts'
import type { Polygon } from '../../domain/geometry.ts'
import { getObjectAsset } from './demo-asset-library.ts'
import { demoCityProject } from './demo-city-project.ts'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const GRID_STEP = 10
const MAJOR_GRID_STEP = 100

const getNodePosition = (project: CityProject, nodeId: string): Point => {
  const node = project.city.districts.nodes.find((candidate) => candidate.id === nodeId)
  if (!node) throw new Error(`Missing district boundary node: ${nodeId}`)
  return node.position
}

const getBoundaryPoints = (project: CityProject, boundaryId: string, reversed: boolean): Point[] => {
  const boundary = project.city.districts.boundaries.find((candidate) => candidate.id === boundaryId)
  if (!boundary) throw new Error(`Missing district boundary: ${boundaryId}`)
  const start = getNodePosition(project, reversed ? boundary.endNodeId : boundary.startNodeId)
  const end = getNodePosition(project, reversed ? boundary.startNodeId : boundary.endNodeId)
  const path = reversed ? [...boundary.path.points].reverse() : boundary.path.points
  return [start, ...path, end]
}

const getDistrictPoints = (project: CityProject, district: District): Point[] =>
  district.boundaryLoop.flatMap((boundaryRef) => getBoundaryPoints(project, boundaryRef.boundaryId, boundaryRef.reversed))

const getRoadPoints = (project: CityProject, startNodeId: string, path: Point[], endNodeId: string): Point[] => {
  const nodes = project.city.roads.nodes
  const startNode = nodes.find((node) => node.id === startNodeId)
  const endNode = nodes.find((node) => node.id === endNodeId)
  if (!startNode || !endNode) throw new Error(`Missing road node: ${!startNode ? startNodeId : endNodeId}`)
  return [startNode.position, ...path, endNode.position]
}

const drawGrid = (graphics: Graphics, project: CityProject, step: number, color: number, alpha: number, width: number) => {
  const { minX, minY, maxX, maxY } = project.city.world.bounds
  for (let x = minX; x <= maxX; x += step) graphics.moveTo(x, minY).lineTo(x, maxY)
  for (let y = minY; y <= maxY; y += step) graphics.moveTo(minX, y).lineTo(maxX, y)
  graphics.stroke({ color, alpha, width })
}

const drawFootprint = (graphics: Graphics, footprint: Polygon) => {
  const points = footprint.outer.flatMap((point) => [point.x, point.y])
  graphics.poly(points).fill({ color: 0xf8fafc, alpha: 0.92 }).stroke({ color: 0x1e293b, width: 1.5 })
}

const drawMissingAsset = (graphics: Graphics) => {
  graphics.rect(-16, -12, 32, 24).fill({ color: 0xef4444, alpha: 0.9 }).stroke({ color: 0xfef2f2, width: 2 })
  graphics.moveTo(-10, -7).lineTo(10, 7).moveTo(10, -7).lineTo(-10, 7).stroke({ color: 0xfef2f2, width: 2 })
}

const drawProject = (project: CityProject, world: Container) => {
  const background = new Graphics()
  const fineGrid = new Graphics()
  const majorGrid = new Graphics()
  const districts = new Graphics()
  const roads = new Graphics()
  const objects = new Graphics()
  const boundary = new Graphics()
  const origin = new Graphics()
  const { minX, minY, maxX, maxY } = project.city.world.bounds

  background.rect(minX, minY, maxX - minX, maxY - minY).fill({ color: 0x172235 })
  drawGrid(fineGrid, project, GRID_STEP, 0x41617e, 0.3, 1)
  drawGrid(majorGrid, project, MAJOR_GRID_STEP, 0x9ab5d1, 0.62, 2)

  for (const district of project.city.districts.items) {
    const points = getDistrictPoints(project, district).flatMap((point) => [point.x, point.y])
    districts.poly(points).fill({ color: district.color ?? '#64748b', alpha: 0.23 })
  }
  for (const road of project.city.roads.roads) {
    const roadGraphic = new Graphics()
    const [firstPoint, ...remainingPoints] = getRoadPoints(project, road.startNodeId, road.path.points, road.endNodeId)
    if (!firstPoint) continue
    roadGraphic.moveTo(firstPoint.x, firstPoint.y)
    for (const point of remainingPoints) roadGraphic.lineTo(point.x, point.y)
    roadGraphic.stroke({ color: 0xe2c18a, alpha: 0.9, width: road.width })
    roads.addChild(roadGraphic)
  }
  for (const mapObject of project.city.objects) {
    const { position, rotation } = mapObject.transform
    const building = new Graphics()
    const asset = getObjectAsset(mapObject.assetId)
    if (asset?.footprint) drawFootprint(building, asset.footprint)
    else drawMissingAsset(building)
    building.position.set(position.x, position.y)
    building.rotation = (-rotation * Math.PI) / 180
    objects.addChild(building)
  }

  boundary.rect(minX, minY, maxX - minX, maxY - minY).stroke({ color: 0xf8fafc, alpha: 0.95, width: 6 })
  origin.moveTo(-18, 0).lineTo(18, 0).moveTo(0, -18).lineTo(0, 18).stroke({ color: 0xf97316, width: 4 })
  world.addChild(background, fineGrid, majorGrid, districts, roads, objects, boundary, origin)
}

export const MapCanvas = () => {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const application = new Application()
    const world = new Container()
    let zoom = 1
    let isPanning = false
    let lastPointerX = 0
    let lastPointerY = 0
    let isDisposed = false
    let isInitialized = false

    const centerWorld = () => {
      const { minX, minY, maxX, maxY } = demoCityProject.city.world.bounds
      const width = maxX - minX
      const height = maxY - minY
      zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(host.clientWidth / width, host.clientHeight / height) * 0.82))
      world.scale.set(zoom, -zoom)
      world.position.set((host.clientWidth - width * zoom) / 2 - minX * zoom, (host.clientHeight - height * zoom) / 2 + minY * zoom)
    }
    const resize = () => application.renderer.resize(host.clientWidth, host.clientHeight)
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const bounds = application.canvas.getBoundingClientRect()
      const pointerX = event.clientX - bounds.left
      const pointerY = event.clientY - bounds.top
      const worldX = (pointerX - world.position.x) / zoom
      const worldY = (pointerY - world.position.y) / -zoom
      zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * Math.pow(1.0015, -event.deltaY)))
      world.scale.set(zoom, -zoom)
      world.position.set(pointerX - worldX * zoom, pointerY + worldY * zoom)
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 1) return
      isPanning = true
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      application.canvas.setPointerCapture(event.pointerId)
      application.canvas.style.cursor = 'grabbing'
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (!isPanning) return
      world.position.x += event.clientX - lastPointerX
      world.position.y += event.clientY - lastPointerY
      lastPointerX = event.clientX
      lastPointerY = event.clientY
    }
    const stopPanning = () => {
      isPanning = false
      application.canvas.style.cursor = 'grab'
    }
    const initialize = async () => {
      await application.init({ background: '#0b1120', resizeTo: host })
      if (isDisposed) {
        application.destroy(true)
        return
      }
      isInitialized = true
      host.appendChild(application.canvas)
      application.canvas.className = 'map-canvas'
      application.canvas.style.cursor = 'grab'
      drawProject(demoCityProject, world)
      application.stage.addChild(world)
      centerWorld()
      application.canvas.addEventListener('wheel', handleWheel, { passive: false })
      application.canvas.addEventListener('pointerdown', handlePointerDown)
      application.canvas.addEventListener('pointermove', handlePointerMove)
      application.canvas.addEventListener('pointerup', stopPanning)
      application.canvas.addEventListener('pointercancel', stopPanning)
      window.addEventListener('resize', resize)
    }
    void initialize()
    return () => {
      isDisposed = true
      window.removeEventListener('resize', resize)
      if (!isInitialized) return
      application.canvas.removeEventListener('wheel', handleWheel)
      application.canvas.removeEventListener('pointerdown', handlePointerDown)
      application.canvas.removeEventListener('pointermove', handlePointerMove)
      application.canvas.removeEventListener('pointerup', stopPanning)
      application.canvas.removeEventListener('pointercancel', stopPanning)
      application.destroy(true, { children: true, texture: true, textureSource: true })
    }
  }, [])

  return <div ref={hostRef} className="h-full w-full" />
}
