import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import type { CityProject, Point } from '../../domain/index.ts';
import { attachMapInput } from './editor/map-input.ts';
import type {
  InteractionMode,
  MapInputController,
} from './editor/map-input.ts';
import { createMapScene } from './renderer/map-scene.ts';

type CanvasState = {
  selectedId: string | null;
  mode: InteractionMode;
  indicator: Point;
  error: string | null;
};

/** Initializes Pixi once and connects project props to the map interaction. */
export const useMapCanvas = (
  project: CityProject,
  onProjectChange: (project: CityProject) => void,
) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef(project);
  const changeRef = useRef(onProjectChange);
  const inputRef = useRef<MapInputController | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedId: null,
    mode: 'move',
    indicator: { x: 0, y: 0 },
    error: null,
  });

  useEffect(() => {
    projectRef.current = project;
    changeRef.current = onProjectChange;
    inputRef.current?.updateProject(project);
  }, [project, onProjectChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const application = new Application();
    let disposed = false;
    let initialized = false;
    let destroyed = false;

    /** Releases the renderer and its owned scene exactly once. */
    const destroyApplication = () => {
      if (destroyed || !initialized) return;
      destroyed = true;
      inputRef.current?.dispose();
      inputRef.current = null;
      application.destroy(true, {
        children: true,
        texture: true,
        textureSource: true,
      });
    };

    /** Creates the scene after Pixi has initialized its renderer. */
    const initialize = async () => {
      try {
        await application.init({ backgroundAlpha: 0, resizeTo: host });
        initialized = true;
        if (disposed) {
          destroyApplication();
          return;
        }
        host.appendChild(application.canvas);
        application.canvas.className = 'map-canvas';
        application.canvas.style.cursor = 'grab';
        const scene = createMapScene(projectRef.current);
        application.stage.addChild(scene.world);
        inputRef.current = attachMapInput({
          application,
          scene,
          host,
          readProject: () => projectRef.current,
          onProjectChange: nextProject => {
            projectRef.current = nextProject;
            changeRef.current(nextProject);
          },
          onSelectionChange: (selectedId, mode) => {
            setCanvasState(current => ({ ...current, selectedId, mode }));
          },
          onIndicatorChange: indicator => {
            setCanvasState(current => ({ ...current, indicator }));
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Die Karte konnte nicht geöffnet werden.';
        if (!disposed)
          setCanvasState(current => ({ ...current, error: message }));
        destroyApplication();
      }
    };
    void initialize();

    return () => {
      disposed = true;
      destroyApplication();
    };
  }, []);

  return { hostRef, canvasState };
};
