# AGENTS.md

## Projektziel

Dieses Projekt ist eine browserbasierte Dungeon-Master-Toolbox für Dungeons & Dragons. Der erste und wichtigste Bestandteil ist ein interaktiver City Map Editor für mittelgroße bis große Fantasy-Städte mit mehreren tausend sichtbaren Objekten.

Städte müssen sowohl prozedural generiert als auch vollständig manuell bearbeitet werden können. Eine generierte Stadt wird anschließend mit denselben Werkzeugen und über dasselbe Datenmodell wie eine manuell erstellte Stadt bearbeitet.

Langfristig soll die Anwendung zusätzlich Spielerinformationen, einen Initiative-Tracker und ein separates Player Display für einen zweiten Bildschirm unterstützen.

## Technische Grundlage

- React und TypeScript bleiben die Basis der Anwendung.
- TypeScript wird strikt und ohne `any` verwendet. Unsichere externe Daten werden an klar abgegrenzten Grenzen validiert und typisiert.
- React ist für UI, Steuerung und Application State zuständig, nicht für das direkte Rendern tausender Kartenobjekte.
- Die Kartenansicht wird über PixiJS/WebGL bzw. WebGPU gerendert.
- Fachlogik, Zustandsmodell und Rendering bleiben voneinander getrennt.
- Keine neue Library ohne konkreten, dokumentierten technischen Grund.
- Größere Architekturänderungen müssen vor der Umsetzung begründet werden, insbesondere hinsichtlich Performance, Wartbarkeit und Alternativen.
- Externe Bibliotheken müssen Open Source sein (gerne MIT license) und am besten Commercial Use erlauben

## Zielarchitektur

### CityProject als zentrale Domäne

Generator, manueller Editor, Import/Export und Renderer arbeiten mit demselben serialisierbaren `CityProject`-Datenmodell.

Das Datenmodell enthält fachliche Daten, nicht gerenderte Bilder oder Framework-Objekte. Eine globale Asset-Bibliothek ist kein notwendiger Bestandteil eines `CityProject`. Kartenobjekte referenzieren Assets primär über stabile Asset-IDs. Projektspezifische Asset-Metadaten dürfen nur im Projekt gespeichert werden, wenn sie für dieses Projekt tatsächlich erforderlich sind. Die Architektur soll spätere benutzerdefinierte Assets ermöglichen, ohne dafür bereits eine konkrete technische Lösung oder Speicherstrategie festzuschreiben. Es darf keine Pixi-Container, Texturen, Canvas-Elemente, DOM-Knoten oder andere Laufzeitobjekte im persistierten Modell geben.

Ein `CityProject` sollte fachlich mindestens klar trennen zwischen:

- Projektmetadaten und Versionierung
- Stadtgröße, Koordinatensystem und Layern
- Kartenobjekten und deren IDs
- benötigte Asset-IDs sowie nur bei Bedarf projektspezifische Asset-Metadaten
- optionalen Generatorparametern und Herkunftsinformationen
- Editor- bzw. Szenario-Metadaten, sofern diese nicht für das Rendering benötigt werden

Das Format muss JSON-Import und -Export unterstützen. Importierte JSON-Daten gelten als untrusted input und müssen validiert, versioniert und bei Bedarf migriert werden. Änderungen am Datenmodell benötigen eine Strategie für Rückwärtskompatibilität oder eine explizite Migrationsroutine.

### Rendering

- Das Rendering ist eine eigene Schicht und konsumiert fachliche Projektdaten über klar definierte Adapter.
- Kartenobjekte werden über Instanzen, Batching, Culling, Spatial Indexing oder vergleichbare geeignete Techniken effizient dargestellt.
- Asset-Texturen werden über einen zentralen Asset-/Texture-Cache wiederverwendet und niemals pro Objektinstanz erneut geladen.
- Renderer-Laufzeitobjekte bleiben außerhalb von React State und außerhalb des `CityProject`.
- Änderungen einzelner Kartenobjekte dürfen nicht zu vollständigen React-Re-Renders oder einem vollständigen Neuaufbau der Render-Szene führen.
- Pan, Zoom, Selektion und Dragging müssen auch bei vielen Objekten performant bleiben.
- Messbare Performance-Probleme werden profiliert und mit konkreten Beobachtungen behoben; Optimierungen werden nicht nur vermutet.

### State und Fachlogik

- React State enthält UI-relevanten Zustand und orchestriert Application State.
- Fachlogik wie Generatoren, Geometrie, Selektion, Validierung, Import/Export, Migrationen und Undo/Redo wird möglichst frameworkunabhängig in TypeScript-Modulen implementiert.
- Renderer-State, Cache-Zustände und temporäre Interaktionsdaten werden nicht unnötig global oder persistent gemacht.
- Komponenten bleiben klein und haben eine klar erkennbare Verantwortung.
- Domänenobjekte erhalten stabile IDs. Array-Positionen dürfen nicht als dauerhafte Identität verwendet werden.
- Mutationen am Projektmodell müssen nachvollziehbar und für Undo/Redo sowie spätere Kollaboration erweiterbar bleiben.

## Coding-Regeln

- Bestehende Konventionen und die vorhandene Projektstruktur zuerst prüfen, bevor neue Abstraktionen eingeführt werden.
- Aussagekräftige Namen für Domänenbegriffe verwenden; generische Namen wie `data`, `item` oder `manager` nur mit klarer Einschränkung verwenden.
- Öffentliche Funktionen, Datenmodelle und komplexe Algorithmen mit kurzen Kommentaren oder JSDoc dokumentieren, wenn ihre Invarianten nicht aus dem Code hervorgehen.
- Kleine, fokussierte Module bevorzugen. Keine monolithischen Komponenten, God-Objects oder versteckten Singleton-Zustände einführen.
- Seiteneffekte an klaren Grenzen halten und bei Initialisierung, Ressourcenfreigabe sowie Fehlerfällen berücksichtigen.
- Fehler nicht verschlucken. Import-, Generator- und Rendering-Fehler müssen für die Anwendung sinnvoll behandelbar und für Entwicklung/Debugging nachvollziehbar sein.
- Keine impliziten globalen Zustände, keine unkontrollierten `any`-Casts und keine Deaktivierung von TypeScript-/ESLint-Regeln ohne konkrete Begründung.
- Bei KI-generiertem Code besonders auf doppelte Logik, erfundene APIs, unnötige Abhängigkeiten, unvollständige Fehlerbehandlung und unbeabsichtigte Re-Renders prüfen.
- Änderungen möglichst klein und thematisch geschlossen halten. Keine opportunistischen Refactorings ohne Bezug zur aktuellen Aufgabe.
- Tailwind CSS für das Styling verwenden. Längere, wiederverwendete oder semantisch zusammengehörige Klassenlisten als benannte Konstanten oberhalb der Komponente definieren. Inline-Styles vermeiden; dynamische Werte, die sich nicht sinnvoll mit statischen Tailwind-Klassen ausdrücken lassen, sind ausgenommen.
- Typescript Types sollen einfach gehalten werden, vermeide, wenn möglich, Utility-Types
- Keine impliziten Props. Alle appinternen Props einer Komponente sollen explizit gelistet werden. Darunter fallen keine Standard-Props für reine html Elemente, wenn diese nicht explizit von der App genutzt werden.
- Bevor neue Abstraktionen, Helper, Hooks, Services oder Wrapper erstellt werden, prüfen, ob sie tatsächlich mehrfach benötigt werden oder eine komplexe Verantwortung sinnvoll kapseln. Keine Abstraktionen ausschließlich für hypothetische zukünftige Anforderungen erstellen. Einfachen, direkt verständlichen Code gegenüber vorschneller Generalisierung bevorzugen.
- Verwende Arrow-Notation für Funktionen


## Arbeitsablauf für Änderungen

1. Relevante Dateien, Datenflüsse und bestehende Konventionen vor der Änderung lesen.
2. Bei Architekturentscheidungen Ziel, Problem, Alternativen und erwartete Auswirkungen kurz dokumentieren.
3. Domänenmodell und Renderer-Schnittstellen zuerst stabilisieren, bevor UI-Details darauf aufbauen.
4. Änderungen in kleinen, überprüfbaren Schritten umsetzen.
5. Nach jeder Änderung mindestens TypeScript-Prüfung und ESLint ausführen.
6. Betroffene Tests und bei Performance-relevanten Änderungen geeignete Messungen ausführen.
7. Keine bestehenden Tests ohne konkrete Begründung entfernen, abschwächen oder durch triviale Tests ersetzen.

## Qualitätssicherung

Die Standardprüfungen sind:

```bash
npm run lint
npx tsc -b --pretty false --noEmit
```

Wenn Tests vorhanden sind, müssen sie ebenfalls ausgeführt werden. Für neue oder geänderte Fachlogik sind Tests für Normalfälle, Grenzfälle und ungültige Eingaben vorzusehen. Besonders wichtig sind Tests für:

- JSON-Import, Export und Versionierung
- stabile Objekt- und Asset-IDs
- Generatorausgaben und deren anschließende Bearbeitbarkeit
- Selektion und Änderungen einzelner Objekte
- korrekte Behandlung fehlender oder ungültiger Assets
- große Objektmengen und relevante Performance-Regressionsfälle

## Änderungsgrenzen

- Ohne ausdrücklichen Auftrag keine Dateien außerhalb des aktuellen Aufgabenbereichs ändern.
- Keine Konfigurations-, Dependency- oder Architekturänderung nur aus Stilgründen.
- Neue Libraries erst nach Prüfung, ob vorhandene Mittel ausreichen, und mit dokumentiertem Nutzen nach Human-in-the-loop einführen.
- Persistierte Formate und öffentliche Schnittstellen vorsichtig ändern; Auswirkungen auf bestehende Projekte und Importe berücksichtigen.
- Vor dem Abschluss den Diff prüfen und sicherstellen, dass keine generierten Dateien, Debug-Ausgaben oder Zugangsdaten eingecheckt wurden.
