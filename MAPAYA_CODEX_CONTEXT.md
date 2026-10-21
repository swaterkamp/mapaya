# Mapaya – Projektkontext und Entwicklungsplan für Codex

> Stand: 21. Oktober 2026. Diese Datei fasst die bisherigen Architekturgespräche und die vom Benutzer gemeldeten Implementierungsergebnisse zusammen. **Der aktuelle Repository-Code und die vorhandenen Dokumente sind für den tatsächlichen Implementierungsstand maßgeblich.** Bei Abweichungen nachfragen statt stillschweigend Architekturentscheidungen zu ändern.

## 1. Ziel und Produktidee

**Mapaya** ist eine browserbasierte Toolbox für Spielleiter von Pen-&-Paper-Rollenspielen (insbesondere D&D). Zuerst entsteht ein **Stadtkarten-Editor mit Generator**; später sind weitere Werkzeuge denkbar: Spielerinformationen, Initiative-Tracker und eine separate, vom Spielleiter steuerbare Spieleranzeige im Browser.

Die Stadtkartenfunktion soll die Lücke zwischen detailreichen Kleindorf-Generatoren und großflächigen, aber undetaillierten Stadtgeneratoren schließen. Ziel sind plausible mittelalterliche Städte mit **Tausenden von Objekten**, Straßen, Stadtvierteln, Gebäuden und Gelände. Generierte Karten sollen **vollständig manuell editierbar** sein. Generierte und manuell angelegte Inhalte nutzen **dasselbe Stadtmodell**.

Langfristig gewünschte Fähigkeiten:
- Generierung anhand von Parametern (z. B. Bevölkerung, Fluss, Mauern, Gebäudearten/Anzahlen).
- Plausibles Straßennetz und Gebäudeanordnung, nicht nur Zufallsstreuung.
- Stadtviertel mit gemeinsamen Grenzen; Grenzen verschieben und betroffene Bereiche lokal neu berechnen.
- Objekte hinzufügen, verschieben, löschen, sperren, beschriften und mit Tags versehen; Suche nach Tags (z. B. Bäckereien).
- Straßen, Gelände, Bezirke und andere Elemente bearbeiten.
- Hochauflösender Export (HD, 4K, später benutzerdefiniert), Projekt speichern/laden (JSON).
- Gute Performance bei Tausenden bis Zehntausenden Kartenobjekten.

**Priorität:** kleine, sichtbare, überprüfbare Entwicklungsschritte. Keine vorzeitige Generalisierung und keine aufwendige Infrastruktur ohne konkreten Bedarf. Der Benutzer möchte regelmäßig sichtbare Fortschritte im Editor.

## 2. Umgebung und Entwicklungsworkflow

- Ubuntu, VS Code mit offizieller OpenAI-Codex-Erweiterung.
- Repository: `https://github.com/swaterkamp/mapaya.git` (Git via SSH).
- Lokaler Pfad laut bisherigen Berichten: `/home/steffen/source/Mapaya/`.
- Node.js v24.21.0 via nvm, npm 11.19.0, Git 2.43.0.
- React 19, TypeScript 6 (strict), Vite 8, ESLint 10, PixiJS 8; Tailwind CSS ist für UI-Styling vorgesehen.
- Terminal-Git-Workflow bevorzugt (`git status`, `git add`, `git commit`, `git push`), kein GitHub CLI erforderlich.
- Benutzer verwendet ChatGPT Plus und möchte den Entwicklungsdialog künftig **direkt in Codex/VS Code** führen.
- Bestehende `AGENTS.md` im Repository ist verbindlich und muss vor Änderungen gelesen werden.

Qualitätsprüfungen nach passenden Änderungen:
```bash
npm run lint
npx tsc -b --pretty false --noEmit
git diff --check
```
Tests ergänzen, wenn Infrastruktur vorhanden oder Bedarf begründet; nicht für triviale Schritte ein großes Testframework einführen.

## 3. Architekturgrundsätze

**Persistente Daten beschreiben die Stadt. Algorithmen bearbeiten/generieren die Stadt. PixiJS stellt die Stadt dar.**

- **Domain/CityProject:** reine serialisierbare TypeScript-Daten, ohne PixiJS-, DOM- oder Runtime-Objekte.
- **Generator/Editor-Operationen:** möglichst frameworkunabhängige TS-Funktionen, die mit Domain-Entitäten und stabilen IDs arbeiten.
- **Renderer:** PixiJS/WebGL für Karteninhalt; React für UI, Steuerung und App-State, **nicht** für Tausende DOM-Kartenobjekte.
- **AssetLibrary:** außerhalb von `CityProject`, Auflösung stabiler Asset-IDs.
- **Runtime-/Editor-State:** Auswahl, Hover, Drag, aktives Werkzeug, Undo/Redo, Konflikte, Dirty-State, Caches und Pixi-Ressourcen gehören nicht in das persistierte Stadtmodell.
- **Projektbezogene Editor-Einstellungen:** z. B. Viewport-Zentrum/Zoom dürfen gespeichert werden.
- **Benutzereinstellungen:** Theme/Layout unabhängig vom Projekt.

Abhängigkeitsrichtung: Domain kennt Pixi nicht; Renderer darf Domain lesen. **Noch kein spekulatives `IRenderer`-Interface** oder generische Infrastruktur bauen. Editoraktionen verwenden Entity-IDs und Weltkoordinaten, keine Pixi-Sprites.

Codekonventionen: striktes TS, kein `any`, einfache explizite Typen, keine unnötigen Utility Types oder Abstraktionsschichten, klar benannte kleine Module. React-Komponenten mit expliziten App-Props. Tailwind bevorzugt; keine unnötigen Inline-Styles, wiederverwendete Klassen nahe der Komponente definieren. `App.tsx` soll App-Einstieg/Komposition bleiben, nicht Pixi-Implementierung enthalten.

### Rendering-Performance

Tausende Objekte sollen effizient gerendert werden; langfristig ggf. Batching, Culling, räumliche Indizes, Texturcache und inkrementelle Aktualisierung. **Nicht alles jetzt implementieren.** Kein vollständiger Szenen-Neuaufbau für jede kleine Änderung als langfristiges Designziel.

## 4. Persistentes Stadtmodell (CityProject v1)

Konzeptionelle Struktur:
```text
CityProject
├── formatVersion
├── metadata (id, name, createdAt, updatedAt)
├── city
│   ├── world (unit: meter, bounds)
│   ├── generation? (seed, generatorVersion)
│   ├── terrain
│   ├── cityBoundary
│   ├── districtTopology
│   ├── roadNetwork
│   ├── infrastructure
│   ├── blocks
│   ├── plots
│   └── mapObjects
└── editor (z. B. viewport.center, viewport.zoom)
```
Exakte Typen stehen in `src/domain/` und `docs/city-project-v1.md`. Diese Übersicht ist keine alternative verbindliche Schema-Definition.

### Koordinaten und Geometrie – verbindlich

- **1 World Unit = 1 Meter**; Dezimalwerte und negative Koordinaten erlaubt.
- **+X nach rechts/Osten, +Y nach oben/Norden** (kartesisches Domain-System).
- Rotation **in Grad**, positiv **gegen den Uhrzeigersinn**: 0° +X, 90° +Y.
- Lokale Asset-Koordinaten verwenden dieselbe Konvention.
- Pixi-/Screen-+Y nach unten ist **ausschließlich Renderer-/Camera-Angelegenheit**. Keine Y-Invertierung in persistenten Daten.
- `MapBounds`: minX Westen, maxX Osten, minY Süden, maxY Norden.
- `Point {x,y}`, `Path {points: Point[]}`, `Polygon {outer: Point[]}` (v1 nur äußerer Ring, implizit geschlossen, Startpunkt nicht wiederholen). Keine verpflichtende CW-/CCW-Reihenfolge beim Speichern.
- Kein Bézier-Zwang, keine Löcher im Polygon-v1; Erweiterbarkeit später.
- `Transform` hat Position und Rotation, **keine freie Skalierung**.
- Welt theoretisch unbegrenzt; MapBounds definieren Projekt-/Exportbereich; CityBoundary ist die eigentliche Stadtgrenze und unabhängig von MapBounds oder Mauern.

### Terrain und CityBoundary

Terrain enthält semantische natürliche Merkmale (Fluss, See, Wald, Höhen/Gebirge etc.), nicht fertige Bilder. Generatoren berücksichtigen Hindernisse. `CityBoundary` ist die fachliche Stadtfläche; Mauern können fehlen, anders verlaufen oder nur Teile umfassen. Terrainänderungen sollen später lokale Konflikte erkennen statt alles unkontrolliert zu überschreiben.

### Bezirke und gemeinsame Grenzen

`DistrictTopology` enthält BoundaryNodes, DistrictBoundaries und Districts. Benachbarte Bezirke referenzieren **dieselbe** gemeinsame Boundary-Kante (`BoundaryRef` mit Richtungsflag), statt unabhängige Polygonkopien zu speichern. Grenzverschiebung ändert dadurch beide Bezirke konsistent.

`DistrictBoundary`: Start- und End-Node-ID plus `path.points` **nur für Zwischenpunkte**. Keine gespeicherten `leftDistrictId/rightDistrictId`; Beziehungen später zur Laufzeit ableiten. Bezirksgrenzen sind **nicht automatisch Straßen**: Sie können mit Straße, Fluss, Mauer oder nichts zusammenfallen. Straßen-Grenz-Beziehungen zunächst geometrisch ableiten. Straßen entlang einer verschobenen Grenze **nicht automatisch mitverschieben**.

Districts haben u. a. ID, Name, BoundaryLoop, optionale Farbe, Tags, optionale Generationseinstellungen und Provenance. Lokale Neugenerierung soll Straßenverbindungen und benachbarte Bereiche respektieren.

### Straßen

Globales `RoadNetwork` mit RoadNodes und Roads, **nicht pro Bezirk getrennt**. Road mit Start-/End-Node-ID, `path`, Breite, Typ und Provenance. **Road.path.points enthält ausschließlich Zwischenpunkte**; vollständiger Verlauf = StartNode + Zwischenpunkte + EndNode. Gerade Straße: `points: []`.

Straßen können Bezirke queren, entlang Grenzen verlaufen oder mit Toren/Brücken verbunden sein. `bridge` ist keine RoadType-Variante, sondern fachliche Infrastruktur. Die exakte RoadType-Union ist noch nicht abschließend festgelegt.

### Infrastruktur

Mauern, Tore und Brücken sind semantische Entitäten, nicht nur Sprites. Mauern besitzen Pfade, Tore verknüpfen Mauern/Straßen, Brücken verbinden Straßen mit überquerten Hindernissen. Einzelheiten siehe Domain-Dokumentation.

### Blocks, Plots, MapObjects

- **Block:** aus Straßen/Bezirken/Gelände abgeleitete bebaubare Fläche; gespeichert, aber nicht direkt editierbar; **keine Provenance**.
- **Plot:** Parzelle innerhalb eines Blocks, gespeichert und direkt editierbar (teilen, zusammenlegen, umformen); StreetEdges helfen bei plausibler Gebäudeausrichtung; **mit Provenance**.
- **MapObject:** platzierte Instanz, mit stabiler `id`, `assetId`, `transform`, optional Plot-/District-Referenzen, `label`, `tags`, `provenance`. Assetgeometrie wird nicht in das MapObject kopiert.
- Gebäudeausrichtung muss zu Straßen plausibel sein, aber **keine pauschale Regel „lange Seite zur Straße“**. Türen/Fassaden/Entrances sind aktuell nicht modelliert.

### Provenance und lokale Regeneration

`Provenance`: `origin: generated | manual`, `userModified: boolean`, `locked: boolean`.
- **Locked:** automatische Regeneration darf weder entfernen noch geometrisch ändern; bei Konflikt melden.
- **Manual/userModified:** möglichst erhalten; bei Unvereinbarkeit Konflikt statt stiller Überschreibung.
- **Generated + unmodified:** am ehesten automatisch neu erzeugbar.

Provenance für TerrainFeature, CityBoundary, DistrictBoundary, District, Road, Infrastruktur, Plot und MapObject; **nicht** Block.

Datenklassen: (A) autoritativ: Terrain, CityBoundary, DistrictTopology, RoadNetwork, Infrastructure; (B) abgeleitet aber editierbar: Plots, MapObjects; (C) rein abgeleitet: Blocks, räumliche Indizes, Schnittpunkte etc.

Regeneration soll lokal und deterministisch sein. Keine einzige globale Zufallssequenz, bei der eine Änderung alles Folgende verschiebt. Stattdessen lokale Seeds aus CitySeed + stabiler Entity-ID + Stage + Variation. „Regenerieren“ (gleiche Variation unter neuen Constraints) und „Neue Variante“ (Variation ändern) später unterscheiden. `CityGeneration` vorerst minimal seed/generatorVersion; `DistrictGeneration` optional profileId/variation; keine leeren Settings-Placeholder.

## 5. Asset- und Visual-Architektur

### Grundidee

Globale `AssetLibrary` **außerhalb** des CityProject; eingebaute und benutzerdefinierte Assets grundsätzlich gleich behandeln. Assets langfristig in Packs organisierbar. Stabile packübergreifend eindeutige IDs, konkrete Syntax noch offen. CityProject enthält nur Referenzen, keine Grafikdateipfade oder eingebettete Grafiken. Normale Projekte verwenden die Library; später portabler Export mit benötigten Assets (Containerformat offen).

**Fehlende Assets dürfen ein Projekt nicht unöffnbar machen:** MapObject und `assetId` bleiben unverändert; sichtbarer Missing-Asset-Placeholder. Footprint nicht redundant ins Projekt kopieren. Assetversionierung ist später nötig, weil geänderte Footprints alte Projekte beeinflussen können; Strategie offen.

### ObjectAsset – aktueller minimaler Implementierungsstand

```ts
ObjectAsset {
  id: string
  category: 'building' | 'vegetation' | 'structure' | 'prop'
  footprint?: Polygon
  tags: string[]
}
```
Exakte Deklaration im Code prüfen. `footprint` ist ein **lokales Polygon in Metern** für physisch belegte Grundfläche/Platzierung; nicht identisch mit der sichtbaren Grafik. Dächer können visuell darüber hinausragen. Für reine Dekoration optional. Kein Entrance, keine Tür, kein Anchor, keine Clearance-Polygonhierarchie, keine bevorzugte Straßenseite und keine freie MapObject-Skalierung.

Kategorie beschreibt grobe Art; Tags Stil/Eignung. **Asset-Semantik ≠ Nutzung der konkreten MapObject-Instanz**: Ein Fachwerkhaus kann Wohnhaus, Bäckerei oder Schneiderei sein; tatsächliche Nutzung steht an der Instanz (Tags/Label). Keine geometrisch ableitbaren Informationen wie Breite/Größe zusätzlich als Tags duplizieren. Keine riesige Kategorien-/Tag-Taxonomie. Generator kann später nach Kategorie, Eignungs-Tags, Footprint und Plot filtern; konkrete Logik offen.

### Visuals – dokumentiert, noch nicht implementiert

Später Visual Variants mit grafischer Quelle und **Visual Bounds** in lokalen Metern (unabhängig vom Footprint). PNG, SVG, WebP oder anderes denkbar; Formatentscheidung offen. Ein Asset kann mehrere visuell unterschiedliche, geometrisch kompatible Varianten haben (z. B. Dachfarbe/Alterung). Unterschiedlicher physischer Footprint → anderes ObjectAsset. Variantenauswahl später reproduzierbar; Persistenz/Overrides offen. Noch kein LOD, Multi-Resolution, Layering, Schatten-/Tint-System.

### Straßen-/Flächenstile – konzeptionell dokumentiert

Unterscheide Object Assets, Surface Styles, Edge/Path Styles, ggf. Composite Styles. Straßen sind **nicht** starre Bildkacheln. Aus Straßenmittelachsen + Breiten werden zur Laufzeit zusammenhängende Straßenflächen/Kreuzungen und deren echte Außenkonturen abgeleitet. Oberflächenmaterial wird auf Flächen gerendert; Randsteine nur an äußeren Kanten, nicht mitten durch Kreuzungen. Diese Geometrie ist abgeleitet und gehört **nicht** in CityProject. Unterschiedliche Straßenmaterialien und später organische Übergänge sollen möglich bleiben, konkrete Polygon-/Meshing-/Shader-Verfahren offen. Ähnliche Prinzipien könnten später Flüsse, Wälder, Mauern unterstützen; keine universelle Abstraktion auf Vorrat.

## 6. Bereits implementiert (laut Codex-Berichten)

### Grundlagen

- Vite/React/TS/PixiJS-Projekt und Root-`AGENTS.md`.
- `docs/city-model.md`: konzeptionelles Modell einschließlich Asset-/Style-Konzept.
- `docs/city-project-v1.md`: persistentes v1-Modell.
- `src/domain/geometry.ts`, `src/domain/city-project.ts`, `src/domain/index.ts`: Domain-Typen.
- Nicht definierte Platzhalter wie `TerrainFeature.properties: unknown`, `Transform.scale: unknown`, `ProjectEditorSettings.visibility?: unknown` wurden bewusst entfernt. `TerrainFeature.type` und `Road.type` dürfen vorläufig Strings sein.

### Sichtbare Pixi-Demo

- `src/features/city-map/MapCanvas.tsx`, `demo-city-project.ts` und übergeordnete CityMapEditor/App-Komposition (Dateien im Repo prüfen).
- Kartenraster, MapBounds, zwei District-Flächen, Straßen, Gebäude-Platzhalter.
- Mittlere Maustaste verschiebt; Mausrad zoomt zur Cursorposition; ungefähr 10–400 % Zoom; Resize und initialer sinnvoller Viewport.
- Renderer invertiert Y zentral (negative Pixi-Y-Skalierung) und berücksichtigt die mathematische Rotationskonvention. Cursor-Zoom und Initial-Fit wurden entsprechend angepasst.
- Road-Demo-Daten verwenden jetzt ausschließlich Zwischenpunkte in `Road.path.points`; Renderer rekonstruiert vollständigen Verlauf aus Nodes.

### Minimaler Object-Asset-Vertical-Slice (zuletzt abgeschlossen)

Neue Dateien:
- `src/domain/assets.ts`
- `src/features/city-map/demo-asset-library.ts`

Geänderte Dateien:
- `src/domain/index.ts`
- `src/features/city-map/demo-city-project.ts`
- `src/features/city-map/MapCanvas.tsx`

Implementiert:
- `ObjectAsset` mit ID, kleiner Category-Union, optionalem Footprint und Tags.
- Statische In-Memory-Demo-Library mit `getObjectAsset(assetId)`.
- Vier Demo-Gebäude-Footprints: **8 × 12 m, 7 × 16 m, 12 × 14 m, 18 × 30 m**; lokale Rechtecke um `(0,0)` zentriert.
- Demo-MapObjects referenzieren verschiedene Assets über `assetId`; Renderer zeichnet **weiße Debug-Footprints in korrekter Größe, Position und Rotation**, statt eine hartcodierte Gebäudegröße zu nutzen.
- Ein absichtlich nicht auflösbares Demo-Asset wird **rot als Missing-Asset-Placeholder** dargestellt, ohne Daten zu verändern.
- Noch **keine** Visual Resources, Packs, Versionierung, Asset-Imports oder Asset-Auswahlalgorithmen.
- Letzter Codex-Bericht: `npm run lint`, `npx tsc -b --pretty false --noEmit`, `git diff --check` erfolgreich. Diese Prüfungen bei neuer Arbeit erneut ausführen.

## 7. Nächster konkret empfohlener Schritt: MapObject Selection

**Nicht direkt einen großen Asset-Manager oder Visual-Asset-Support bauen.** Der nächste kleine vertikale Schritt soll den Kartenbetrachter in Richtung echten Editor entwickeln:

1. Linksklick auf sichtbares Gebäude → MapObject auswählen.
2. Ausgewähltes MapObject sichtbar hervorheben (Selection-Rahmen oder Highlight).
3. Linksklick auf leere Kartenfläche → Auswahl aufheben.
4. Auswahl enthält **MapObject-ID, nicht Pixi-Sprite/-Graphics**.
5. Auswahl ist **flüchtiger Editor-/Runtime-State**, nicht Teil von CityProject.
6. Bestehendes Pan (mittlere Maustaste), Cursor-Zoom, Districts, Roads, Grid und Missing-Asset-Verhalten erhalten.
7. Noch **kein** Verschieben, Löschen, Properties-Panel, Undo/Redo, Multiselection oder komplexes Tool-System.

Konzeptionell:
```ts
type Selection = { type: 'mapObject'; id: string } | null
```

Ablauf: Pointer → Hit-Test → MapObject-ID → Editor-State → Renderer-Highlight. Für den kleinen Slice eine einfache Lösung wählen; nicht vorschnell räumlichen Index, Event Bus oder universelles Picking-System bauen. Die vorhandene Pixi-Implementierung zuerst lesen und ihre Event-/Transform-Konventionen respektieren.

**Danach mögliche kleine Schritte:** ausgewähltes Objekt verschieben → löschen → hinzufügen → einfache Properties → später Asset-Picker und echte Visual Resources. Diese Reihenfolge ist ein Vorschlag, keine starre Roadmap. Generierung, Blocks/Plots und Straßenflächen folgen iterativ; zuerst jeweils eine kleine überprüfbare Teilaufgabe definieren.

## 8. Noch offene Entscheidungen – nicht nebenbei festlegen

- Konkrete Asset-ID-Syntax, Packs, Library-Dateiformat, Import/Custom Assets, Versionierung, portable Paketformate.
- Visual Resources, Variantenwahl/Override, VisualBounds-Typ und konkrete Pixi-Texturstrategie.
- Konkrete Kategorien-/Tag-Taxonomie und Road-/Terrain-Type-Unions.
- Road-Surface-Union, Kreuzungspolygonisierung, Offset-/Konturverfahren, Materialien und organische Übergänge.
- Block-Extraktion aus beliebigen Straßennetzen (geometrisch anspruchsvoll), Plot-Unterteilung und lokale Regenerationsalgorithmen.
- Detailregeln für Gebäudepositionierung und optionale Orientierungshinweise für spezielle Assets.
- Exakte Import-/Export-Validierung, Projektmigrationen und Persistenzimplementierung; JSON-Validierung ist **derzeit nicht prioritär**.
- Hosting-Backend: vorerst statische React-App auf Host-Europe-Shared-Hosting möglich; Projekte zunächst lokal/JSON bzw. später IndexedDB. Cloud-Sync/Login/Server erst bei konkretem Bedarf.
- Export-Implementierung: Full HD/4K/Custom, ggf. später Kachelexport für sehr große Bilder.
- Theme und Branding: Mapaya-Papaya-Logo, Slogan **„From seed to city“**, erdige helle/dunkle Farbpalette, Header/Sidebar später. Farbwerte und Designquellen im Projekt prüfen, **keine Hexwerte erfinden**.

## 9. Arbeitsmodus für Codex

- **Zuerst** `AGENTS.md`, relevante `docs/` und tatsächlichen Code lesen.
- Diesen Kontext als Ziel-/Entscheidungsübersicht nutzen; bei Widersprüchen mit aktuellem Repo nicht raten, sondern klären.
- Bei größeren Aufgaben zunächst eine kleine konkrete Umsetzungsskizze und die zu ändernden Dateien nennen.
- In **kleinen, sichtbaren Vertical Slices** arbeiten. Keine neuen Libraries/Architekturen ohne begründeten konkreten Bedarf.
- Domain/Renderer/Editor-State strikt trennen. Keine Persistenz von Pixi-Objekten, Runtime-Caches oder Selection.
- Bereits entschiedene Semantik respektieren (Meter, Y oben, Rotation CCW, Road-Zwischenpunkte, Shared District Boundaries, Provenance, Asset-IDs).
- Nach jeder Umsetzung die drei Standardprüfungen ausführen und knapp berichten: Dateien, Verhalten, offene Fragen, Checks.
- Architekturentscheidungen in vorhandener Dokumentation **konsistent** nachführen, aber nicht unnötig offene Fragen als entschieden darstellen.
- Git-Commits/Pushes nur nach Abstimmung mit dem Benutzer, sofern nicht anders vereinbart.


---

**Merksatz:** Mapaya ist ein strukturierter, editierbarer Stadtgenerator und kein Bildgenerator. **Datenmodell = Stadt; Generator/Editor = Operationen; Pixi = Darstellung.** Kleine Schritte, sichtbare Fortschritte, keine unnötige Vorabkomplexität.
