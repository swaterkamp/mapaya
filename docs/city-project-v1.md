# CityProject Format v1

Dieses Dokument beschreibt die geplante persistente Struktur des CityProject-Formats Version 1. Es ist eine technische Spezifikation, aber keine Aufforderung, TypeScript-Typen zu implementieren.

## Root und Versionierung

```text
CityProject
- formatVersion
- metadata
- city
- editor
```

`formatVersion` ist Pflicht und für v1 `1`. Die Formatversion ist unabhängig von der App-Version. Zukünftige Änderungen erfolgen über explizite Migrationen.

`metadata` enthält zunächst `id`, `name`, `createdAt` und `updatedAt`. Weitere Metadaten werden erst bei konkretem Bedarf ergänzt.

## city

`city` enthält ausschließlich fachliche Stadtinformationen:

```text
city
- world
- generation
- terrain
- cityBoundary
- districts
- roads
- infrastructure
- blocks
- plots
- objects
```

`generation` ist optional, damit manuell erstellte Städte ohne Generatorhistorie First-Class Citizens sind.

### city.world

```text
unit: "meter"
bounds:
- minX
- minY
- maxX
- maxY
```

Koordinaten dürfen negativ und dezimal sein. Bounds beschreiben MapBounds, nicht die theoretische Weltgrenze.

### city.generation

Die City-Generation ist optional. Wenn sie vorhanden ist, enthält sie ausschließlich die derzeit bekannten Felder `seed` und `generatorVersion`. Unbekannte Generatorparameter werden nicht über leere Settings-Interfaces oder eine beliebige unvalidierte JSON-Property-Bag vorweggenommen.

### city.terrain und city.cityBoundary

Terrain ist eine Liste semantischer TerrainFeatures mit konzeptionell `id`, `type`, `geometry` und `provenance`. `TerrainFeatureType` wird noch nicht als vollständige Union festgelegt; die konkreten Terrainarten bleiben offen. Ein unstrukturiertes `properties`-Feld ist nicht Bestandteil von v1.

`cityBoundary` ist eine eigenständige Stadtflächen-Geometrie mit konzeptionell `geometry` und `provenance`; sie ist weder MapBounds noch Wall.

### city.districts

```text
districts
- nodes[]
- boundaries[]
- items[]
```

Ein `BoundaryNode` enthält `id` und `position`. Eine `DistrictBoundary` enthält `id`, `startNodeId`, `endNodeId`, `path` und verpflichtend `provenance`. Die Punkte in `path` enthalten die Start- und Endnodes nicht nochmals. Ein `District` enthält `id`, `name`, `boundaryLoop[]`, optional `color`, `tags[]`, optional `generation` und `provenance`. Ein BoundaryRef enthält `boundaryId` und `reversed`.

Für v1 gibt es zunächst einen äußeren Loop je District; Löcher sind nicht Bestandteil von v1. `DistrictGeneration` ist optional und enthält derzeit nur `profileId` und `variation`. Districts ohne Generation sind gleichwertige First-Class Citizens für manuell erstellte Städte.

### city.roads

```text
roads
- nodes[]
- roads[]
```

Ein `RoadNode` enthält `id` und `position`. Eine `Road` enthält `id`, `startNodeId`, `endNodeId`, `path`, `width`, `type` und `provenance`. Ein verpflichtendes `districtId` gibt es nicht. `RoadType` wird noch nicht als vollständige Union festgelegt; insbesondere ist `bridge` kein RoadType.

### city.infrastructure

```text
infrastructure
- walls[]
- gates[]
- bridges[]
```

Eine Wall enthält `id`, `path`, `width`, optionale Asset-/Style-Referenz und `provenance`. Ein Gate enthält `id`, `wallId`, `position`, optionale `assetId`, `connectedRoadIds[]` und `provenance`. Eine Bridge enthält `id`, `roadId`, optional `crossedTerrainId`, `geometry`, optional `assetId` und `provenance`. Details dürfen bei der jeweiligen Feature-Implementierung präzisiert werden.

### city.blocks

Blocks sind persistierte Derived Data:

```text
Block
- id
- geometry
- districtId?
- borderingRoadIds[]
```

Blocks sind nicht direkt editierbar und müssen aus autoritativeren Strukturen neu berechenbar sein.

### city.plots

Plots werden trotz abgeleitetem Charakter persistiert und bleiben editierbar:

```text
Plot
- id
- geometry
- blockId
- streetEdges
- provenance
```

Die genaue Repräsentation von `streetEdges` ist offen.

### city.objects

```text
MapObject
- id
- assetId
- transform
- plotId?
- districtId?
- label?
- tags[]
- provenance

Transform
- position
- rotation
```

Position liegt in Metern. Rotation soll menschenlesbar in Grad gespeichert werden, sofern später kein gewichtiger Grund dagegen spricht. Ein persistentes `scale`-Feld ist in v1 noch nicht Bestandteil des Formats.

## Gemeinsame Konzepte

### Provenance

```text
Provenance
- origin: generated | manual
- userModified: boolean
- locked: boolean
```

Provenance wird nicht blind an jeden Typ gehängt, sondern nur dort verwendet, wo Regeneration und Benutzeränderungen fachlich relevant sind. Für Districts und DistrictBoundaries ist sie in v1 verpflichtend.

### IDs

Alle eigenständig referenzierbaren Domain-Objekte besitzen stabile IDs. Referenzen verwenden IDs und niemals Array-Indizes. Für v1 ist `EntityId` konzeptionell ein einfacher `string`-Wert; branded IDs werden noch nicht eingeführt. Eine konkrete ID-Erzeugungstechnik, etwa UUID oder NanoID, ist offen.

### Geometry

Für v1 werden die Geometriekonzepte minimal festgelegt:

```text
Point
- x
- y

Path
- points: Point[]

Polygon
- outer: Point[]
```

`Path` ist zunächst ausschließlich eine Polyline. Ein Polygon besitzt in v1 nur den äußeren Ring `outer`, keine Löcher. Der Polygonring wird implizit geschlossen; der erste Punkt muss daher nicht am Ende wiederholt werden. Die Punkte eines `DistrictBoundary.path` enthalten die referenzierten Start- und Endnodes nicht nochmals. MultiPolygons, Kurven und weitere Geometrieformen bleiben offen.

## editor

Editorinformationen gehören nicht unter `city`, sondern auf Root-Ebene:

```text
editor
- viewport
```

Ein Viewport kann `center` und `zoom` enthalten, damit ein Projekt ungefähr am letzten Ort fortgesetzt wird. Visibility-Informationen werden erst ergänzt, wenn konkrete Visibility-Features existieren.

Ein persistentes `visibility`-Feld ist in v1 noch nicht Bestandteil des Formats.

Nicht persistent sind Selection, Hover, Drag State, Active Tool, Undo/Redo-Stack, Conflicts, Dirty State, Worker State, PixiJS-Runtime-Objekte, Texture Cache, Spatial Index und Render Cache. Für diese Zustände werden in diesem Planungsdokument noch keine Runtime-TypeScript-Typen implementiert; sie bilden eine klare Architekturgrenze außerhalb des persistierten CityProject-Modells.

## AssetLibrary und Runtime-Daten

Die AssetLibrary ist kein Bestandteil des CityProject. Das Projekt speichert stabile `assetId`-Referenzen; `EntityId` bleibt in v1 konzeptionell ein einfacher `string`-Wert, ohne branded IDs. Eingebettete Base64-Textures gibt es nicht. Custom Assets und portable Projekte bleiben offen.

Nicht persistent, sondern aus den Projektdaten aufzubauen, sind Boundary-zu-District-Index, Road/Boundary-Intersections, District Road Entry Points, Spatial Indices, Collision Cache, Render Bounds, Dirty-/Invalidation-Graph und RegenerationScope.

Ein normal gespeichertes CityProject beschreibt einen konsistenten fachlichen Zustand. Regenerationskonflikte und halbfertige Operationen werden in v1 nicht gespeichert.

## Bewusst offene Punkte

- konkrete TypeScript-Typen und Runtime-Typen
- konkrete JSON-Schema-Validierung
- konkrete ID-Technik
- endgültige Geometry-Repräsentation
- Auswahl einer Geometry Library
- konkrete Terrain-Typen
- konkrete Road Types
- konkrete GenerationSettings
- konkrete District Profiles und zukünftige Generation-Parameter
- genaue Street-Edges-Repräsentation
- Asset-Metadatenformat
- Custom Assets und portable Projekte
- Generatoralgorithmen
- Invalidation-/Dependency-Implementierung
- Conflict-UI
- Spatial Index
- Einsatz von Web Workers
- PixiJS-Rendering-, Culling- und Batching-Details
- Exportpipeline und tiled export

> **Planungsstatus:** Dieses Dokument definiert den aktuellen Planungsstand des CityProject-Formats v1. Als offen markierte Details dürfen bei der Implementierung nicht stillschweigend als endgültige Architekturentscheidung festgelegt werden.
