# City Map: Aufbau des Editors

`Layout` hält das aktuelle `CityProject` und speichert Änderungen. `CityMapEditor` reicht das Projekt an `MapCanvas` weiter. `MapCanvas` zeigt nur die Karte und das Modus-Symbol an.

## Datenfluss

```text
CityProject → useMapCanvas → map-scene → Pixi-Grafiken
                    ↓
                map-input → map-object-operations → neues CityProject → Layout
```

- `renderer/map-scene.ts` zeichnet Raster, Stadtviertel, Straßen und Gebäude. Eine Zuordnung zwischen Objekt-ID und Pixi-Grafik erlaubt gezielte Aktualisierungen. Selektionsrahmen und fehlende Assets werden hier dargestellt.
- `renderer/map-camera.ts` enthält die Umrechnung zwischen Bildschirm- und Weltkoordinaten sowie Fit und Cursor-Zoom. Die Domänenkoordinaten bleiben unverändert.
- `editor/map-input.ts` verarbeitet die Gesten. Erster Klick wählt ein Gebäude im Verschiebemodus; Ziehen führt den aktiven Modus aus; ein weiterer Klick ohne Ziehen schaltet den Modus um. Mittlere Maustaste verschiebt die Kamera. Die Steuerung gibt alle Event-Listener beim Schließen frei.
- `editor/map-object-operations.ts` liefert neue Projektdaten für Verschieben, Drehen und Löschen. Andere Objekte behalten ihre Identität und vorhandene Provenance-Daten; geänderte Objekte erhalten `userModified: true`.
- `use-map-canvas.ts` initialisiert Pixi, verbindet Eingaben mit dem aktuellen Projekt und gibt die Ressourcen frei.

## Entscheidung

Ziel war, `MapCanvas.tsx` klein zu halten und Projektmodell, Eingaben und Pixi-Ressourcen getrennt nachvollziehbar zu machen. Eine einzige große Komponente würde weiter wachsen; ein allgemeines Renderer-Interface oder Event-Bus wäre für diese eine Karte unnötige Vorarbeit. Die Module kapseln vorhandene Aufgaben ohne neue Bibliothek und ohne Änderung des JSON-Formats. Objektänderungen aktualisieren die bestehenden Pixi-Grafiken; Pan und Zoom bauen die Szene nicht neu auf.
