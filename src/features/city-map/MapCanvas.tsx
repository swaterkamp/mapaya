import { useEffect, useRef } from 'react'
import { Application, Container, Graphics } from 'pixi.js'

const MAP_SIZE = 5000
const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const FINE_GRID_SIZE = 100
const MAJOR_GRID_SIZE = 500

export const MapCanvas = () => {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const application = new Application()
    const world = new Container()
    const fineGrid = new Graphics()
    const majorGrid = new Graphics()
    const boundary = new Graphics()
    const markers = new Graphics()
    let isPanning = false
    let lastPointerX = 0
    let lastPointerY = 0
    let zoom = 1
    let isDisposed = false
    let isInitialized = false

    const resize = () => {
      application.renderer.resize(host.clientWidth, host.clientHeight)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const bounds = application.canvas.getBoundingClientRect()
      const pointerX = event.clientX - bounds.left
      const pointerY = event.clientY - bounds.top
      const mapX = (pointerX - world.x) / zoom
      const mapY = (pointerY - world.y) / zoom
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoom * Math.pow(1.0015, -event.deltaY)),
      )

      world.scale.set(nextZoom)
      world.position.set(pointerX - mapX * nextZoom, pointerY - mapY * nextZoom)
      zoom = nextZoom
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

    const stopPanning = (event: PointerEvent) => {
      if (event.button !== 1 && !isPanning) return
      isPanning = false
      application.canvas.style.cursor = 'grab'
    }

    const drawGridLines = (graphics: Graphics, spacing: number) => {
      for (let offset = 0; offset <= MAP_SIZE; offset += spacing) {
        graphics.moveTo(offset, 0).lineTo(offset, MAP_SIZE)
        graphics.moveTo(0, offset).lineTo(MAP_SIZE, offset)
      }
    }

    const drawMap = () => {
      fineGrid.rect(0, 0, MAP_SIZE, MAP_SIZE).fill({ color: 0x172235 })
      drawGridLines(fineGrid, FINE_GRID_SIZE)
      fineGrid.stroke({ color: 0x6380a3, alpha: 0.5, width: 3 })

      drawGridLines(majorGrid, MAJOR_GRID_SIZE)
      majorGrid.stroke({ color: 0xb7c9df, alpha: 0.85, width: 7 })

      boundary.rect(0, 0, MAP_SIZE, MAP_SIZE)
      boundary.stroke({ color: 0xf8fafc, alpha: 1, width: 24 })

      markers.circle(650, 700, 90).fill({ color: 0xf97316 }).stroke({ color: 0xffedd5, width: 14 })
      markers.circle(2300, 1450, 140).fill({ color: 0x22d3ee }).stroke({ color: 0xecfeff, width: 14 })
      markers.rect(3550, 700, 260, 200).fill({ color: 0xa855f7 }).stroke({ color: 0xf3e8ff, width: 14 })
      markers.rect(1200, 3500, 320, 180).fill({ color: 0x84cc16 }).stroke({ color: 0xf7fee7, width: 14 })
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
      drawMap()
      world.addChild(fineGrid, majorGrid, boundary, markers)
      world.position.set((host.clientWidth - MAP_SIZE) / 2, (host.clientHeight - MAP_SIZE) / 2)
      application.stage.addChild(world)
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

  return <div ref={hostRef} className="map-canvas-host" />
}
