# CityProject: Fachliches Stadtmodell

Dieses Dokument beschreibt das fachliche Modell einer Mapaya-Stadt und die Architekturprinzipien für Entwickler und Coding Agents.

## Grundprinzip

Mapaya speichert keine gerenderte Karte, sondern eine strukturierte Stadt. Persistente Daten beschreiben die Stadt, Algorithmen generieren und verändern sie, und PixiJS stellt sie dar. Generator und manueller Editor verwenden dasselbe Domain Model. Eine generierte Stadt wird vollständig editierbar und bleibt nicht dauerhaft an Generatorparameter gebunden.

React ist für UI und Anwendungssteuerung zuständig. PixiJS ist der Renderer. Domainlogik darf weder von React noch von PixiJS abhängen.

## Weltkoordinaten

Eine Mapaya World Unit entspricht einem Meter. Domain-Geometrie wird in Metern gespeichert, nicht in Pixeln. Koordinaten dürfen dezimal und negativ sein und sollen nicht unnötig gerundet werden. Die Welt besitzt keine fachliche feste `5000x5000`-Grenze.

- **World:** theoretischer Koordinatenraum.
- **MapBounds:** aktuell relevanter Bereich mit `minX`, `minY`, `maxX`, `maxY`; später erweiterbar.
- **CityBoundary:** tatsächliche, normalerweise unregelmäßige Stadtfläche; unabhängig von MapBounds und Stadtmauern.

Eine Stadt kann keine Mauer, Vorstädte außerhalb einer Mauer oder mehrere Mauerringe besitzen. Pixel existieren ausschließlich auf Rendering-/Exportebene. Export Area und Pixel Resolution sind unabhängig; dieselbe Stadt kann in Full HD, 4K oder größer exportiert werden. Große Exporte können später tiled rendering verwenden.

## Fachliche Hauptstruktur

Ein CityProject trennt Projektmetadaten/Versionierung, City Data und Project Editor Settings. City Data enthält konzeptionell World/MapBounds, Generation Settings, Terrain, CityBoundary, DistrictTopology, RoadNetwork, Infrastructure, Blocks, Plots und MapObjects. Die AssetLibrary ist kein Bestandteil des CityProject.

## Terrain und CityBoundary

Terrain besteht aus semantischen Features mit stabiler ID und Geometrie, etwa Flüssen, Seen/Küste, Wald und Höhen-/Bergbereichen. Terrain ist fachliche Information, nicht bloß Grafik. Generatoren können daraus Constraints wie Bauverbote im Wasser, Brücken bei Straßenquerungen und Umgehungen von Hindernissen ableiten. Terrainänderungen sollen lokale Konflikte/Invalidierungen auslösen und nicht ungefragt die gesamte Stadt neu erzeugen.

CityBoundary beschreibt eigenständig das tatsächliche Stadtgebiet. Sie ist weder MapBounds noch automatisch eine Stadtmauer und bleibt in v1 eine eigene Geometrie.

## DistrictTopology

Districts sind semantische Stadtbereiche wie Hafen, Markt, Handwerk, Wohnviertel oder Adelsviertel. Benachbarte Districts teilen gemeinsame Grenzen statt redundante Polygonkopien zu speichern.

Das v1-Modell besteht aus `BoundaryNodes`, `DistrictBoundaries` und `Districts`. Ein BoundaryNode hat stabile ID und Position. Eine DistrictBoundary hat stabile ID, `startNodeId`, `endNodeId`, `path` und verpflichtende Provenance. Ein District hat ID, Name, Boundary Loop aus BoundaryRefs, optionale Farbe, Tags, optionale Generation-Konfiguration und verpflichtende Provenance. Eine BoundaryRef enthält `boundaryId` und `reversed`.

Nodes existieren primär, wo Segmente zusammentreffen; Biegungen innerhalb eines Segments gehören zur Path-Geometrie. Zwei Districts können dieselbe Boundary entgegengesetzt verwenden. `leftDistrict`/`rightDistrict` werden nicht redundant gespeichert, sondern aus Referenzen abgeleitet und bei Bedarf indiziert.

Für v1 ist keine vollständige Half-Edge-/GIS-Struktur vorgesehen. Zunächst gibt es einen äußeren Loop je District; Löcher sind in v1 nicht Bestandteil. Die genaue Path-/Polygonrepräsentation bleibt bis zur Auswahl der Geometrieoperationen offen. Validierung benötigt geschlossene Loops, passende Nodes, keine ungültigen Selbstüberschneidungen oder unzulässigen Überlappungen, innere Boundaries normalerweise mit höchstens zwei Districts und äußere gegebenenfalls mit nur einem District. CityBoundary muss keine Boundary-Objekte wiederverwenden.

## RoadNetwork

Straßen gehören zum globalen RoadNetwork, niemals zwingend zu genau einem District. Es besteht aus RoadNodes und Roads. Ein RoadNode hat ID und Position. Eine Road hat ID, `startNodeId`, `endNodeId`, `path`, `width`, `type` und Provenance, aber kein verpflichtendes `districtId`.

Straßen können Districts durchqueren, an Grenzen verlaufen oder Gates und Bridges verbinden. Road und DistrictBoundary bleiben unterschiedliche fachliche Objekte, auch bei gleicher Geometrie. Beziehungen wie Schnitt, District-Eintritt oder paralleler Verlauf werden zunächst bevorzugt geometrisch abgeleitet. Bei lokaler District-Regeneration bleiben stadtweite Straßenanschlüsse Constraints.

Straßengenerierung soll hierarchisch und plausibel aus Ankern wie Gates, Bridges/Furten, Markt, Hafen und wichtigen Gebäuden entstehen. Der konkrete Algorithmus ist offen.

## Infrastructure

Infrastructure umfasst zunächst semantische Walls, Gates und Bridges, nicht bloße MapObject-Sprites. Eine Wall besitzt einen eigenen Pfad und ist unabhängig von CityBoundary. Ein Gate gehört zu einer Wall und kann mit dem RoadNetwork verbunden sein. Eine Bridge gehört funktional zum RoadNetwork und quert typischerweise Wasserterrain. Weitere Infrastrukturtypen können später ergänzt werden.

## Blocks, Plots und MapObjects

Ein Block ist eine zusammenhängende bebaubare Fläche, die aus Straßen, Grenzen und Terrain entsteht. Blocks sind rein abgeleitet, nicht direkt editierbar und müssen regenerierbar sein; Persistenz ist aus Performancegründen erlaubt.

Ein Plot ist ein Grundstück innerhalb eines Blocks. Plots sind abgeleitet, aber direkt editierbar: Grenzen können verändert und Grundstücke zusammengelegt werden, ohne das RoadNetwork zu ändern. Plots werden persistiert und können Street Edges für Gebäudezugänge kennen.

MapObjects sind konkrete sichtbare Objekte wie Gebäude, Brunnen, Bäume, Marktstände und Dekoration. Sie besitzen konzeptionell stabile ID, `assetId`, Position, Rotation, optionale `plotId`/`districtId`, Label, Tags und Provenance. MapObject und Asset bleiben getrennt.

## AssetLibrary, visuelle Ressourcen, Labels und Tags

Fachliche Geometrie und visuelle Darstellung sind getrennt. Das CityProject beschreibt fachliche Geometrie und referenziert visuelle Ressourcen ausschließlich über stabile semantische IDs. Domain-Objekte enthalten keine direkten PNG-, SVG-, WebP- oder sonstigen Dateipfade.

Die Asset-/Style-Library liegt außerhalb des CityProject. Das CityProject enthält stabile Referenzen; Dateiformat und Rendererimplementierung bleiben davon getrennt. Für visuelle Ressourcen werden konzeptionell mehrere Kategorien unterschieden:

- **Object Assets:** einzelne platzierbare Objekte wie Gebäude, Bäume, Brunnen und Marktstände. Sie können neben ihrer Grafik später fachlich relevante Angaben wie physische Größe, Footprint, Collision-Geometrie sowie Entrance-/Anchor-Informationen besitzen.
- **Surface Styles:** Darstellung von Flächen wie Pflaster, Erde, Wasser oder Waldboden.
- **Edge/Path Styles:** Darstellung entlang von Konturen oder Pfaden, etwa Straßenrandsteine, Flussufer oder Mauern.
- **Composite Styles:** Kombination mehrerer Darstellungsbestandteile, zum Beispiel eine Straße aus Surface, Edge und Details.

Diese Kategorien sind zunächst konzeptionell. Daraus wird noch keine allgemeine TypeScript-Style-Hierarchie abgeleitet.

Die Pixelgröße einer Grafik ist nicht die physische Objektgröße; ein 512x768-Pixel-Asset kann etwa 8x12 Meter darstellen. Custom Assets und portable Projektpakete sind offen.

Labels sind sichtbare Namen, Tags semantische Suchinformationen wie `bakery`, `shop` und `food`. Districtzugehörigkeit ist strukturelle Information, kein Tag.

## Autorität, Provenance und Regeneration

Änderungen propagieren nach unten: DistrictBoundary → betroffene Roads → Blocks → Plots → MapObjects; Road → Blocks → Plots → MapObjects, ohne DistrictTopology automatisch zu verändern; Plot → MapObjects; MapObject verändert keine übergeordnete Struktur. RoadNetwork und DistrictTopology sind stadtweite Strukturen mit Beziehungen, keine einfache Parent-/Child-Hierarchie. Nur lokal betroffene Bereiche werden neu berechnet.

Strukturell autoritativ sind Terrain, CityBoundary, DistrictTopology, RoadNetwork und Infrastructure. Plots und MapObjects sind abgeleitet, aber editierbar. Blocks, Runtime-Indizes, Intersections und geometrisch berechnete Beziehungen sind rein abgeleitet.

Provenance besteht konzeptionell aus `origin` (`generated` oder `manual`), `userModified` und `locked`. `locked` ist eine harte Constraint: Automatische Regeneration darf ein gelocktes Element nicht entfernen oder geometrisch ändern. `manual` und `userModified` werden geschützt, sind ohne `locked` aber keine absolute Sperre. Priorität: locked, manual/userModified, generated untouched. Unvereinbare Constraints erzeugen einen Konflikt; geschützte Arbeit darf nicht stillschweigend zerstört werden. Sinnvoll ist Provenance für TerrainFeature, CityBoundary, DistrictBoundary, Road, Wall/Gate/Bridge, Plot und MapObject; Blocks benötigen keine editierbare Provenance.

District-Regeneration löscht nicht den District, sondern erzeugt lokal innerhalb von Boundary, Terrain, Road-Anschlüssen, Locks, manuellen/userModified Elementen und Infrastructure neu. Unveränderte generierte Elemente dürfen ersetzt werden. Runtime-RegenerationScope und Dirty-/Invalid-Zustände werden nicht persistiert.

GenerationSettings sind Präferenzen für zukünftige Generierung, nicht die fachliche Wahrheit. Eine City-Generation kann optional Seed und Generatorversion enthalten. Lokale District-Generation ist optional und enthält zunächst `profileId` und `variation`; konkrete weitere Parameter und Profile werden erst mit den Generatoren typisiert.

Lokale Zufallsgenerierung leitet aus City Seed, District-ID, Generatorstufe und Variation deterministische Seeds ab. Regenerieren behält Einstellungen/Variation; Neue Variante verändert den Variation-Wert. Feinere Variation pro Road/Plot/Object ist nicht v1.

## Rendering, Performance und State

Persistierte Domain-Layer sind nicht Render-Layer. PixiJS entscheidet unabhängig über Draw Order, Container und Batching; mögliche Render-Layer sind ground, terrain background, roads, terrain details, buildings, vegetation, district overlay, selection overlay, labels und editor UI. Diese Struktur gehört nicht ins Domain Model.

Die Geometrie bestimmt die Form; der Style bestimmt das Aussehen. Dadurch bleiben beliebige Winkel, Straßenbreiten, Kurven und organische Verläufe möglich. Materialien können später wiederholbare Texturen mit definierter physischer Größe in World Units verwenden, statt ein einzelnes Bild über lange Strecken extrem zu dehnen.

Straßen werden langfristig nicht aus fertigen Straßenbildern oder einem starren Tileset zusammengesetzt. Grundlage bleiben RoadNetwork, Road-Geometrie und Road-Breite. Der Renderer kann daraus eine zusammenhängende Straßenfläche ableiten. Treffen Straßen aufeinander, werden ihre Flächen als zusammenhängende Geometrie behandelt. Randdarstellungen wie Randsteine werden nur entlang tatsächlich sichtbarer Außenkanten gerendert und laufen nicht durch Kreuzungen oder Einmündungen hindurch.

Abgeleitete Surface-, Junction- und Edge-Geometrie ist Runtime-/Renderdata und wird nicht redundant im CityProject gespeichert. Unterschiedliche Styles sollen später aufeinandertreffen können, beispielsweise Kopfsteinpflasterstraße und Erdweg. Das konkrete Verfahren für organische Übergänge ist ausdrücklich offen; es wird jetzt keine Entscheidung über Shader, Alpha-Masken, Blend-Texturen oder andere Techniken getroffen.

Dieselben Renderingkonzepte können später auch bei Flüssen, Wäldern, Mauern und weiteren Strukturen nützlich sein. Daraus wird jetzt keine universelle Renderingabstraktion gebaut.

PixiJS rendert, generiert aber keine Stadt. Domain- und Geometrielogik bleibt frameworkunabhängig. Pan/Zoom regenerieren nichts. Lokale Invalidierung, vereinfachte Drag-Vorschau, Berechnung bei `pointerup`, Asset-/Texture-Reuse sowie später Culling, Batching, Spatial Indexing und LOD sind möglich. Web Workers werden erst nach Messungen eingeführt.

State wird in City Data, Project Editor Settings, Runtime State (Selection, Hover, Drag, Tool, Undo/Redo, Conflicts, Dirty State, Worker-/Pixi-State, Texture Cache) und projektunabhängige Mapaya User Preferences (Theme, UI-Layout) getrennt. Runtime State und Undo/Redo-Historie gehören nicht ins CityProject; nach normalem Speichern ist es konsistent.

## Leitprinzipien und Status

Generator und Editor verwenden dasselbe Modell; generierte Städte sind editierbar; Roads sind stadtweit; Districts teilen Boundaries; Änderungen propagieren nach unten; lokale Neuberechnung, Locks und manuelle Änderungen werden respektiert; Domainlogik bleibt unabhängig von React/PixiJS; Meter sind World Units; Pixel sind Rendererangelegenheit; Formate werden versioniert/migriert; keine vorsorgliche Komplexität; Optimierung erfolgt anhand von Messungen.

> **Planungsstatus:** Dieses Dokument definiert den aktuellen Planungsstand. Als offen markierte Details dürfen bei der Implementierung nicht stillschweigend als endgültige Architekturentscheidung festgelegt werden.

### Ausdrücklich offene Asset- und Visual-Entscheidungen

- PNG, SVG, WebP oder andere Grafikformate
- konkretes AssetLibrary-Format
- konkrete Style-Typen
- Road-Meshing- und Polygonalgorithmen
- Texture Tiling
- Material Blending
- Shader
- Custom Assets und Paketierung
- konkrete PixiJS-Umsetzung
