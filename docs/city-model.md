# Mapaya – Fachliches Stadtmodell

## Status dieses Dokuments

Dieses Dokument beschreibt das fachliche Modell des City Map Editors und
City Generators von Mapaya.

Es definiert die grundlegenden Begriffe, Beziehungen und Regeln, nach denen
eine Stadt aufgebaut, generiert und bearbeitet wird.

Es ist ausdrücklich **keine vollständige technische Spezifikation** des
persistierten Datenmodells.

Die konkrete Struktur von `CityProject v1`, TypeScript-Typen, JSON-Format,
Geometriealgorithmen und weitere Implementierungsdetails werden separat
festgelegt.

---

# 1. Ziel

Mapaya soll einen browserbasierten Editor und Generator für detaillierte
Fantasy- und mittelalterlich inspirierte Städte bereitstellen.

Der Generator soll Städte erzeugen können, die unter anderem enthalten:

- Landschaft und Terrain
- Flüsse und andere Gewässer
- Stadtgrenzen
- Distrikte
- Straßen und Gassen
- Stadtmauern, Tore und Brücken
- Baublöcke
- Grundstücke
- Gebäude
- Vegetation
- Dekorationen
- beschriftete und semantisch kategorisierte Orte

Die Generierung soll durch optionale Parameter beeinflusst werden können,
beispielsweise:

- Einwohnerzahl
- gewünschte Stadtgröße
- Fluss vorhanden
- Stadtmauer vorhanden
- weitere spätere Parameter

Generierte Städte müssen anschließend mit denselben Werkzeugen bearbeitet
werden können wie manuell erstellte Städte.

Generator und Editor arbeiten daher auf demselben fachlichen Stadtmodell.

---

# 2. Grundprinzip

Mapaya speichert nicht lediglich eine gerenderte Karte.

Das Projekt beschreibt eine strukturierte Stadt.

Grundsätzlich gilt:

> Persistente Daten beschreiben die Stadt.
> Algorithmen bearbeiten und generieren die Stadt.
> Der Renderer stellt die Stadt dar.

React, PixiJS oder andere Framework- und Rendererobjekte sind nicht Teil des
fachlichen Stadtmodells.

---

# 3. Weltkoordinaten und Darstellung

Die Stadt wird in einem auflösungsunabhängigen Weltkoordinatensystem
beschrieben.

Positionen innerhalb der Stadt sind keine Bildschirm- oder Bildpixel.

Beispielsweise beschreibt

    x = 2450
    y = 1832

eine Position innerhalb der Welt und nicht Pixel 2450/1832 eines Bildes.

Die Kamera bzw. der Renderer übersetzt Weltkoordinaten in
Bildschirmkoordinaten.

Dadurch sind voneinander unabhängig:

- Größe der Welt
- Größe des Browserfensters
- aktueller Zoom
- Bildschirmauflösung
- Exportauflösung

Die konkrete Maßeinheit des Weltkoordinatensystems ist noch nicht festgelegt.

---

# 4. Grundstruktur einer Stadt

Das fachliche Modell besteht derzeit aus folgenden wesentlichen Bereichen:

    CityProject
    │
    ├── Metadata
    ├── GenerationSettings
    │
    ├── Map
    │   ├── Terrain
    │   └── CityBoundary
    │
    ├── CityStructure
    │   ├── DistrictTopology
    │   ├── RoadNetwork
    │   ├── Infrastructure
    │   ├── Blocks
    │   └── Plots
    │
    ├── MapObjects
    │
    └── Project / Editor Metadata

Assets selbst gehören grundsätzlich nicht zur Stadt.

Sie befinden sich in einer separaten Asset Library und werden über stabile
Asset-IDs referenziert.

---

# 5. Terrain

Terrain beschreibt die natürliche Umgebung der Stadt.

Dazu können unter anderem gehören:

- Flüsse
- Seen
- Küsten
- Wälder
- Höhenzüge
- Berge
- andere natürliche oder nicht bebaubare Flächen

Terrain ist nicht lediglich grafische Dekoration.

Terrain besitzt fachliche Bedeutung.

Beispiele:

- Gebäude dürfen nicht ohne Weiteres in Wasser platziert werden.
- Straßen können Gewässer nur an geeigneten Stellen überqueren.
- Brücken können Straßen über Flüsse führen.
- Höhenunterschiede können später Straßenführung und Bebauung beeinflussen.
- Städte können bevorzugt an Flüssen oder anderen geeigneten Orten entstehen.

Terrain gehört zu den dauerhaft gespeicherten Projektdaten.

---

# 6. CityBoundary

Die `CityBoundary` beschreibt das eigentliche Stadtgebiet.

Die Größe der gesamten Karte und die Größe der Stadt sind voneinander
unabhängig.

Beispielsweise kann eine große Landschaftskarte nur in einem kleinen Bereich
eine Stadt enthalten.

Die CityBoundary ist nicht identisch mit einer Stadtmauer.

Eine Stadt kann:

- keine Stadtmauer besitzen,
- nur teilweise befestigt sein,
- außerhalb ihrer Mauer Vorstädte besitzen,
- später mehrere historische Mauerringe besitzen.

Stadtgebiet und Befestigung müssen deshalb getrennt modelliert werden.

---

# 7. Districts und DistrictTopology

Eine Stadt kann in Distrikte unterteilt werden.

Beispiele:

- Marktviertel
- Hafenviertel
- Handwerkerviertel
- Wohnviertel
- Adelsviertel
- Tempelbezirk

Ein District besitzt eine tatsächliche geometrische Fläche.

Zusätzlich kann ein District fachliche Eigenschaften besitzen, beispielsweise:

- Name
- optionale Farbe
- Tags
- später möglicherweise ein Generierungsprofil

Ein Generierungsprofil könnte beispielsweise beeinflussen:

- Gebäudedichte
- Grundstücksgröße
- Häufigkeit bestimmter Gebäudetypen
- Straßenstruktur
- Anteil von Freiflächen

## Gemeinsame Grenzen

Benachbarte Districts sollen langfristig nicht als vollständig unabhängige,
sich zufällig berührende Polygone verstanden werden.

Stattdessen soll die Stadt eine gemeinsame topologische Unterteilung besitzen.

Eine gemeinsame Grenze zwischen zwei Districts existiert konzeptionell nur
einmal.

Wird diese Grenze verschoben:

- wird District A beispielsweise größer,
- während District B entsprechend kleiner wird.

Dadurch können keine unbeabsichtigten Lücken oder Überlappungen zwischen
benachbarten Districts entstehen.

Eine gemeinsame Boundary kann mit einem physischen Feature zusammenfallen,
beispielsweise:

- Straße
- Fluss
- Stadtmauer

Sie muss dies jedoch nicht.

Nicht jede Districtgrenze ist zwangsläufig eine Straße.

---

# 8. RoadNetwork

Straßen gehören nicht einzelnen Districts.

Die Stadt besitzt ein gemeinsames, stadtweites `RoadNetwork`.

Dieses besteht konzeptionell aus:

- RoadNodes
- Roads

Eine Road besitzt einen Verlauf und verbindet Teile des Straßennetzes.

Mögliche spätere Straßentypen sind beispielsweise:

- Hauptstraße
- Straße
- Gasse
- Weg

Eine Straße kann:

- vollständig innerhalb eines Districts liegen,
- mehrere Districts durchqueren,
- entlang einer Districtgrenze verlaufen,
- zu einem Stadttor führen,
- über eine Brücke einen Fluss überqueren.

Dadurch entsteht kein Sonderfall einer "Grenzstraße", die zwei Districts
gehören müsste.

## Anschluss benachbarter Districts

Districts besitzen keine voneinander isolierten Straßennetze.

Bei der Generierung oder Neugenerierung eines Districts müssen bestehende
Anschlüsse an das stadtweite Straßennetz als Randbedingungen berücksichtigt
werden.

Straßen eines neu generierten Bereichs müssen sinnvoll an bestehende Straßen
benachbarter Bereiche anschließen.

Bestehende wichtige Straßen, Tore, Brücken und gesperrte Straßen können dabei
zusätzliche Randbedingungen darstellen.

---

# 9. Glaubwürdige Straßenstruktur

Der Generator soll Straßen nicht lediglich zufällig verteilen.

Eine Stadt soll nach Möglichkeit wie eine historisch gewachsene
mittelalterliche bzw. Fantasy-Stadt wirken.

Die Generierung soll daher wichtige Orte und natürliche Bedingungen
berücksichtigen.

Beispiele für wichtige Punkte:

- Stadttore
- Markt
- Brücken
- Hafen
- Tempel
- Burg
- wichtige öffentliche Gebäude

Hauptverkehrsachsen können solche Orte miteinander verbinden.

Aus diesen Hauptachsen können anschließend kleinere Straßen und Gassen
entstehen.

Eine mögliche konzeptionelle Generierungsreihenfolge ist:

    Terrain
        ↓
    natürliche Hindernisse
        ↓
    wichtige Orte
        ↓
    Hauptverkehrsachsen
        ↓
    Stadtgrenze / Befestigungen
        ↓
    Districts
        ↓
    Nebenstraßen
        ↓
    Blocks
        ↓
    Plots
        ↓
    Gebäude
        ↓
    Vegetation / Dekoration

Diese Reihenfolge ist noch keine verbindliche technische Implementierung.

---

# 10. Infrastructure

Bestimmte menschengemachte Strukturen haben Auswirkungen auf mehrere
fachliche Systeme und werden deshalb nicht lediglich als normale MapObjects
betrachtet.

Dazu gehören zunächst:

- Walls
- Gates
- Bridges

Später können weitere Infrastrukturtypen hinzukommen.

## Walls

Eine Stadtmauer besitzt einen geometrischen Verlauf.

Sie ist von der CityBoundary unabhängig.

## Gates

Ein Tor liegt an einer Befestigung und besitzt gleichzeitig Bedeutung für
das RoadNetwork.

Straßen können gezielt auf Tore zulaufen.

Ein Tor besitzt außerdem eine visuelle Darstellung über ein Asset.

## Bridges

Eine Brücke verbindet Teile des RoadNetwork und überquert gleichzeitig ein
TerrainFeature, beispielsweise einen Fluss.

Dadurch ist fachlich bekannt, warum eine Straße ein Gewässer überqueren darf.

---

# 11. Blocks

Ein Block ist eine zusammenhängende Fläche, die hauptsächlich durch Straßen,
Stadtgrenzen, Terrain oder andere relevante Strukturen begrenzt wird.

Beispiel:

    Straße
    ═══════════════
           │
     Block │ Block
       A   │   B
           │
    ═══════╧═══════
         Straße

Blocks sind überwiegend abgeleitete Stadtstruktur.

Sie entstehen aus übergeordneten geometrischen Strukturen und können bei
deren Änderung neu berechnet werden.

Ein Block kann unter anderem Beziehungen besitzen zu:

- angrenzenden Straßen
- einem District
- seiner geometrischen Grenze

---

# 12. Plots

Ein Plot ist ein Grundstück innerhalb eines Blocks.

Ein Block kann in mehrere Plots aufgeteilt werden.

Ein Plot kann unter anderem beschreiben:

- Grundstücksgrenze
- zugehörigen Block
- an Straßen angrenzende Kanten
- mögliche spätere Nutzungsinformationen

Die Kenntnis der Straßenkante ist insbesondere für die Platzierung von
Gebäuden wichtig.

Dadurch kann der Generator beispielsweise ein Gebäude so platzieren, dass
sein Eingang zur Straße zeigt.

Plots sind grundsätzlich abgeleitete Stadtstruktur.

Es soll jedoch möglich bleiben, später manuell bearbeitete oder geschützte
Plots zu unterstützen.

---

# 13. MapObjects

MapObjects sind konkrete platzierte Objekte innerhalb der Stadt.

Beispiele:

- Gebäude
- Bäume
- Brunnen
- Marktstände
- Statuen
- Dekorationen

Ein MapObject beschreibt unter anderem:

- stabile ID
- referenzierte Asset-ID
- Position
- Rotation
- Skalierung
- optionale Beziehungen zu Plot und District
- optionales Label
- Tags
- Informationen über Herkunft und manuelle Bearbeitung

Ein MapObject enthält nicht die eigentliche Grafik.

Die Grafik wird über die Asset Library referenziert.

---

# 14. Asset Library

Assets und platzierte Objekte sind getrennte Konzepte.

Beispiel:

    Asset
    "house-stone-03"
          │
          ├── MapObject 17
          ├── MapObject 81
          ├── MapObject 104
          └── ...

Viele MapObjects können dasselbe Asset verwenden.

Dies ist sowohl fachlich als auch für effizientes Rendering wichtig.

Assets können später zusätzliche Informationen enthalten, beispielsweise:

- Grafik / Textur
- physische Abmessungen
- Footprint / Kollisionsfläche
- Position von Eingängen
- Asset-Typ
- Tags oder andere Metadaten

Insbesondere Eingänge und Footprints sind für automatische
Gebäudeplatzierung relevant.

---

# 15. Gebäudeplatzierung

Gebäude sollen nicht lediglich zufällig auf freien Koordinaten platziert
werden.

Die Platzierung soll langfristig unter anderem berücksichtigen:

- Grundstücksgrenzen
- Straßenlage
- Eingangsposition des Assets
- Nachbargebäude
- Kollisionen
- District
- Gebäudetyp
- weitere Generierungsregeln

Ziele sind unter anderem:

- keine überlappenden Gebäude
- sinnvolle Abstände
- Ausrichtung von Eingängen zu Straßen
- plausible Bebauungsdichte
- Orientierung an benachbarten Gebäuden

---

# 16. Labels und Tags

MapObjects können ein sichtbares Label besitzen.

Beispiel:

    "Bäckerei zum goldenen Laib"

Labels dienen der Darstellung auf der Karte.

Zusätzlich können MapObjects technische Tags besitzen.

Beispiel:

    building
    bakery
    shop
    food

Tags sind nicht zwingend sichtbar.

Sie ermöglichen unter anderem Suche, Filterung und Hervorhebung.

Beispielsweise soll der Benutzer später alle Bäckereien einer Stadt suchen
und hervorheben können.

Labels und Tags können sowohl manuell vergeben als auch optional durch den
Generator erzeugt werden.

District-Zugehörigkeit soll nicht ausschließlich über Tags modelliert werden,
da sie strukturelle Bedeutung besitzt.

---

# 17. Gerichtete Änderungshierarchie

Ein zentrales Prinzip von Mapaya ist die gerichtete Auswirkung von
Änderungen.

Eine Änderung beeinflusst grundsätzlich ihre eigene Ebene und abhängige
untergeordnete Ebenen.

Untergeordnete Änderungen verändern nicht automatisch übergeordnete
Strukturen.

Vereinfacht:

    District
       ↓
    Road
       ↓
    Block
       ↓
    Plot
       ↓
    MapObject

Das tatsächliche Modell ist kein reiner Baum, da beispielsweise Terrain,
RoadNetwork und Infrastructure zusätzliche Beziehungen besitzen.

Die Hierarchie beschreibt deshalb vor allem die Richtung der Autorität bei
Änderungen.

## Beispiel: District ändern

    District geändert
          ↓
    betroffene Straßen anpassen
          ↓
    betroffene Blocks neu berechnen
          ↓
    betroffene Plots neu berechnen
          ↓
    betroffene MapObjects prüfen / regenerieren

## Beispiel: Straße ändern

    District bleibt unverändert
          ↓
    Road geändert
          ↓
    betroffene Blocks neu berechnen
          ↓
    betroffene Plots neu berechnen
          ↓
    betroffene MapObjects prüfen / regenerieren

## Beispiel: Plot ändern

District, Straßen und Block bleiben unverändert.

Nur der Plot und davon abhängige MapObjects werden verändert.

## Beispiel: MapObject ändern

Übergeordnete Stadtstruktur bleibt unverändert.

---

# 18. Abhängigkeiten statt vollständiger Neugenerierung

Mapaya soll Änderungen möglichst lokal verarbeiten.

Eine kleine Änderung darf nicht automatisch die gesamte Stadt neu
generieren.

Beispiel:

    Road 417 geändert
          ↓
    Blocks 12 und 13 betroffen
          ↓
    14 Plots betroffen
          ↓
    27 Gebäude betroffen

Nur die betroffenen Bereiche sollen invalidiert und neu berechnet werden.

Dieses Prinzip ist sowohl für Benutzerkontrolle als auch für Performance
zentral.

---

# 19. Herkunft, manuelle Änderungen und Locking

Mapaya muss unterscheiden können, welche Elemente automatisch erzeugt und
welche bewusst vom Benutzer erstellt oder verändert wurden.

Konzeptionell werden mindestens folgende Informationen benötigt:

    origin
        generated | manual

    userModified
        true | false

    locked
        true | false

Die konkrete technische Darstellung ist noch nicht festgelegt.

## Regenerationsregel

Automatisch generierte und unveränderte Inhalte dürfen bei Bedarf
automatisch neu erzeugt werden.

Vom Benutzer veränderte Inhalte sollen nach Möglichkeit erhalten bleiben.

Manuell erstellte Inhalte sollen ebenfalls geschützt behandelt werden.

## Locked

`locked` ist unabhängig von Herkunft und Bearbeitungsstatus.

Ein gesperrtes Element stellt bei automatischer Regeneration eine feste
Randbedingung dar.

Beispiel:

    District verändert
          +
    bestehende locked Road
          ↓
    neue Struktur muss die Straße berücksichtigen

Dasselbe Prinzip kann beispielsweise für ein wichtiges Gebäude gelten.

Ein Lock bedeutet damit fachlich mehr als lediglich "kann nicht mit der Maus
verschoben werden".

---

# 20. Konflikte

Nicht jede Änderung kann automatisch sinnvoll aufgelöst werden.

Beispiel:

Ein District wird verkleinert und ein manuell platziertes oder gesperrtes
Gebäude liegt anschließend außerhalb der gültigen Fläche.

Mapaya soll solche Situationen nicht durch unbemerkte destruktive Änderungen
auflösen.

Stattdessen soll ein Konflikt erkannt werden.

Spätere mögliche Benutzerentscheidungen können beispielsweise sein:

- automatisch neu platzieren
- an Position behalten
- entfernen
- Änderung rückgängig machen

Die genaue Konfliktbehandlung wird später definiert.

---

# 21. Generatorparameter und generiertes Ergebnis

Generatorparameter und das daraus entstandene Ergebnis sind unterschiedliche
Dinge.

Beispielsweise:

    population = 8000
    river = true

sind Anforderungen an eine Generierung.

Der tatsächlich erzeugte Fluss ist anschließend ein normales TerrainFeature
der Stadt.

Dadurch kann der Benutzer generierte Inhalte später unabhängig von den
ursprünglichen Generatorparametern bearbeiten.

Eine generierte Stadt wird nach ihrer Erzeugung zu einer normalen,
editierbaren Stadt.

Der Generator darf nicht die alleinige Quelle des aktuellen Stadtzustands
sein.

Ein Seed und relevante Generatorinformationen sollen voraussichtlich
gespeichert werden, um Herkunft und gegebenenfalls reproduzierbare
Generierung zu ermöglichen.

---

# 22. Fachliche Daten und Rendering

Das persistierte Stadtmodell ist unabhängig von PixiJS.

PixiJS-Laufzeitobjekte wie beispielsweise:

- Container
- Sprite
- Texture
- Graphics
- RenderTexture

gehören nicht in `CityProject`.

Der Renderer konsumiert fachliche Daten und erzeugt daraus eine Darstellung.

React ist primär für UI, Lifecycle und Anwendungssteuerung zuständig.

PixiJS ist für die effiziente Darstellung der Karte zuständig.

Generator-, Geometrie-, Validierungs- und Regenerationslogik soll möglichst
frameworkunabhängig implementiert werden.

---

# 23. Fachliche Layer und Render-Layer

Fachliche Kategorien und Render-Layer sind nicht dasselbe.

Fachlich existieren beispielsweise:

- Terrain
- Roads
- Districts
- Infrastructure
- MapObjects
- Labels

Der Renderer kann daraus eine andere Zeichenreihenfolge ableiten.

Beispielsweise:

    ground
    terrain
    roads
    buildings
    vegetation
    district overlay
    selection overlay
    labels
    editor UI

Diese Renderstruktur darf das persistierte fachliche Modell nicht unnötig
bestimmen.

---

# 24. District-Farben

Districts können optional eine Farbe besitzen.

Diese Farbe ist Teil der fachlichen Districtdaten.

Ob Districtfarben aktuell angezeigt werden, ist dagegen eine
Darstellungs-/Editorentscheidung.

Dadurch kann Mapaya beispielsweise zwischen einer normalen Kartenansicht und
einer District-Analyseansicht wechseln.

---

# 25. Performanceprinzipien

Mapaya soll auch große Städte mit vielen tausend Objekten bearbeiten können.

Wichtige Grundprinzipien sind:

1. Stadtlogik und Rendering bleiben getrennt.
2. Änderungen invalidieren nur tatsächlich betroffene Bereiche.
3. Die gesamte Stadt wird nicht bei jeder Änderung neu berechnet.
4. Assets und Texturen werden wiederverwendet.
5. Große Objektmengen werden nicht als tausende React-DOM-Elemente gerendert.
6. PixiJS übernimmt die GPU-beschleunigte Kartendarstellung.
7. Optimierungen sollen anhand tatsächlicher Messungen vorgenommen werden.
8. Spatial Indexing, Culling und ähnliche Verfahren können bei Bedarf später
   ergänzt werden.

Aufwendige Generator- und Geometrieberechnungen können später in Web Worker
ausgelagert werden.

Web Worker sind derzeit eine vorgesehene Optimierungsmöglichkeit, aber noch
keine verpflichtende Implementierungsentscheidung.

---

# 26. Export

Die Exportauflösung ist unabhängig von der Weltgröße und von der aktuellen
Browserdarstellung.

Eine Stadt kann beispielsweise im Browser in einem kleinen Fenster angezeigt
und trotzdem als 4K-Bild exportiert werden.

Langfristig sollen unterschiedliche Exportauflösungen möglich sein,
beispielsweise:

- Full HD
- 4K
- benutzerdefinierte Auflösung

Mögliche Exportbereiche:

- gesamte Stadt
- aktuelle Ansicht
- Auswahl

Sehr große Exporte sollen perspektivisch als gekachelter / tiled Export
möglich sein.

Dadurch muss nicht vorausgesetzt werden, dass die GPU eine extrem große
RenderTexture in einem einzigen Schritt erzeugen kann.

---

# 27. Autoritative und abgeleitete Daten

Nicht alle Stadtinformationen besitzen dieselbe Bedeutung.

## Autoritative Daten

Autoritative Daten repräsentieren bewusste Vorgaben oder relevante
Projektentscheidungen und dürfen nicht beliebig neu berechnet werden.

Dazu gehören insbesondere:

- Terrain
- CityBoundary
- Districtstruktur
- bewusste Änderungen am RoadNetwork
- manuell erstellte oder geschützte Inhalte
- Generatorparameter

## Abgeleitete Daten

Andere Strukturen können aus übergeordneten Informationen berechnet werden.

Dazu gehören insbesondere:

- Blocks
- Plots
- automatisch platzierte, unveränderte MapObjects
- bestimmte berechnete geometrische Beziehungen

Die Grenze zwischen autoritativ und abgeleitet kann durch manuelle
Bearbeitung oder Locking beeinflusst werden.

Eine ursprünglich generierte Struktur kann durch bewusste Bearbeitung des
Benutzers schützenswert werden.

---

# 28. Aktuelles konzeptionelles Abhängigkeitsmodell

Vereinfacht ergibt sich derzeit:

                     Terrain
                    ╱       ╲
                   ▼         ▼
           CityBoundary   RoadNetwork
                 │            │
                 ▼            │
        DistrictTopology ◄────┘
                 │            │
                 └─────┬──────┘
                       ▼
                     Blocks
                       │
                       ▼
                      Plots
                       │
                       ▼
                   MapObjects

Infrastructure besitzt zusätzliche Beziehungen zu mehreren Ebenen:

    Wall   ↔ CityBoundary / DistrictTopology / Map
    Gate   ↔ Wall + RoadNetwork
    Bridge ↔ RoadNetwork + Terrain

Dieses Diagramm beschreibt keine vollständig festgelegte
Implementierungsreihenfolge.

Es verdeutlicht fachliche Beziehungen und Abhängigkeiten.

---

# 29. Noch nicht entschieden

Folgende Punkte sind ausdrücklich noch offen und dürfen nicht ohne weitere
fachliche Entscheidung als endgültige Architektur angenommen werden:

## Welt und Maße

- konkrete Maßeinheit der Weltkoordinaten
- typische Kartengrößen
- mögliche Größenbegrenzungen
- Zusammenhang zwischen Weltmaß und Assetmaßen

## Persistenz

- exakte Struktur von `CityProject v1`
- welche abgeleiteten Daten tatsächlich persistiert werden
- JSON-Schema
- Versionierung und Migration
- exakte Repräsentation von IDs

## Geometrie

- konkrete Polygonrepräsentation
- technische Repräsentation gemeinsamer Districtgrenzen
- verwendete Geometriebibliothek
- Polygon-Clipping
- Triangulation
- Spatial Index
- Kollisionsalgorithmen

## Generator

- konkreter Straßenalgorithmus
- Districtgenerierung
- Blockgenerierung
- Plotaufteilung
- Gebäudeplatzierungsalgorithmus
- Gewichtung von Generatorparametern
- konkrete Verwendung von Seeds

## Regeneration

- genauer Invalidierungsmechanismus
- Konfliktauflösung
- Verhalten von `userModified`
- genaue Locking-Semantik
- Umgang mit teilweise betroffenen Strukturen

## Rendering

- konkrete PixiJS-Architektur
- Culling-Strategie
- Batching
- Detailstufen / LOD
- Texture-Management
- maximale praktische Objektzahlen

## Parallelisierung

- ob und wann Web Worker eingesetzt werden
- Aufteilung zwischen Main Thread und Worker
- Datentransfer zwischen Worker und Renderer

## Export

- konkrete Exportpipeline
- maximale direkte Renderauflösung
- Tiled-Export-Verfahren
- Bildformate

Diese Entscheidungen sollen anhand konkreter Anforderungen und Messungen
getroffen werden und nicht vorsorglich durch unnötige Architektur
vorweggenommen werden.

---

# 30. Leitprinzipien

Für die weitere Entwicklung gelten derzeit folgende fachliche Leitprinzipien:

1. Generator und Editor arbeiten auf demselben Stadtmodell.

2. Eine generierte Stadt ist nach der Generierung vollständig editierbar.

3. Straßen bilden ein stadtweites Netzwerk und gehören nicht exklusiv zu
   einzelnen Districts.

4. Benachbarte Districts teilen gemeinsame Grenzen, statt unabhängige,
   potenziell widersprüchliche Grenzgeometrien zu besitzen.

5. Änderungen propagieren grundsätzlich abwärts durch die strukturellen
   Abhängigkeiten.

6. Untergeordnete Änderungen verändern übergeordnete Strukturen nicht
   automatisch.

7. Änderungen sollen möglichst lokal neu berechnet werden.

8. Manuelle Änderungen und gesperrte Elemente werden bei Regeneration
   respektiert.

9. Der Generator soll vorhandene Randbedingungen berücksichtigen, statt
   bestehende Benutzerarbeit unnötig zu zerstören.

10. Die Stadtlogik ist unabhängig von React und PixiJS.

11. Weltkoordinaten sind unabhängig von Pixeln und Bildschirmauflösung.

12. Exportauflösung ist unabhängig von Welt- und Bildschirmgröße.

13. Performanceoptimierungen werden ermöglicht, aber nicht ohne messbaren
    Bedarf vorzeitig implementiert.

14. Das Datenmodell soll zukünftige Anforderungen ermöglichen, ohne bereits
    hypothetische Features vollständig zu implementieren.

15. Persistierte Formate werden versioniert und spätere Änderungen müssen
    Migration bestehender Projekte berücksichtigen.