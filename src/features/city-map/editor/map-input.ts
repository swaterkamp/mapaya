import { Application, Graphics } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { CityProject, Point } from '../../../domain/index.ts';
import {
  fitCamera,
  pointerToWorld,
  zoomCamera,
} from '../renderer/map-camera.ts';
import { drawSelection, syncMapObjects } from '../renderer/map-scene.ts';
import type { MapScene } from '../renderer/map-scene.ts';
import {
  deleteMapObject,
  moveMapObject,
  rotateMapObject,
  rotationTowardPointer,
} from './map-object-operations.ts';

export type InteractionMode = 'move' | 'rotate';

export type MapInputController = {
  updateProject: (project: CityProject) => void;
  dispose: () => void;
};

type MapInputOptions = {
  application: Application;
  scene: MapScene;
  host: HTMLDivElement;
  readProject: () => CityProject;
  onProjectChange: (project: CityProject) => void;
  onSelectionChange: (id: string | null, mode: InteractionMode) => void;
  onIndicatorChange: (position: Point) => void;
};

const DRAG_THRESHOLD = 3;

/** Connects map gestures to camera movement and immutable object edits. */
export const attachMapInput = (
  options: MapInputOptions,
): MapInputController => {
  const {
    application,
    scene,
    host,
    readProject,
    onProjectChange,
    onSelectionChange,
    onIndicatorChange,
  } = options;
  const { world, objects } = scene;
  let zoom = fitCamera(
    world,
    readProject().city.world.bounds,
    host.clientWidth,
    host.clientHeight,
  );
  let selectedId: string | null = null;
  let mode: InteractionMode = 'move';
  let panPointerId: number | null = null;
  let activePointerId: number | null = null;
  let activeObjectId: string | null = null;
  let selectedOnPointerDown = false;
  let dragging = false;
  let pointerStart: Point = { x: 0, y: 0 };
  let panStart: Point = { x: 0, y: 0 };
  let dragOffset: Point = { x: 0, y: 0 };

  /** Moves the mode badge to the selected object's screen position. */
  const refreshIndicator = () => {
    if (!selectedId) return;
    const object = readProject().city.objects.find(
      candidate => candidate.id === selectedId,
    );
    if (!object) return;
    const position = world.toGlobal(object.transform.position);
    onIndicatorChange({ x: position.x, y: position.y });
  };

  /** Selects an object and starts it in move mode. */
  const selectObject = (id: string | null) => {
    selectedId = id;
    mode = 'move';
    drawSelection(scene, readProject(), id);
    onSelectionChange(id, mode);
    refreshIndicator();
  };

  /** Toggles the active operation after a plain click or keyboard shortcut. */
  const toggleMode = () => {
    mode = mode === 'move' ? 'rotate' : 'move';
    onSelectionChange(selectedId, mode);
  };

  /** Publishes an object edit and updates its Pixi drawing immediately. */
  const publishProject = (project: CityProject) => {
    onProjectChange(project);
    syncMapObjects(scene, project);
    drawSelection(scene, project, selectedId);
    const selected = project.city.objects.find(
      candidate => candidate.id === selectedId,
    );
    if (selected) {
      const position = world.toGlobal(selected.transform.position);
      onIndicatorChange({ x: position.x, y: position.y });
    }
  };

  /** Keeps the world coordinate under the wheel cursor fixed while zooming. */
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const bounds = application.canvas.getBoundingClientRect();
    zoom = zoomCamera(
      world,
      zoom,
      { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      event.deltaY,
    );
    refreshIndicator();
  };

  /** Captures the active pointer for panning or object dragging. */
  const handleCanvasPointerDown = (event: PointerEvent) => {
    if (event.button === 1) {
      panPointerId = event.pointerId;
      panStart = { x: event.clientX, y: event.clientY };
      application.canvas.setPointerCapture(event.pointerId);
      application.canvas.style.cursor = 'grabbing';
    } else if (event.button === 0 && activePointerId === event.pointerId) {
      application.canvas.setPointerCapture(event.pointerId);
    }
  };

  /** Pans the world or applies the selected object's current edit mode. */
  const handleCanvasPointerMove = (event: PointerEvent) => {
    if (panPointerId === event.pointerId) {
      world.position.x += event.clientX - panStart.x;
      world.position.y += event.clientY - panStart.y;
      panStart = { x: event.clientX, y: event.clientY };
      refreshIndicator();
      return;
    }
    if (activePointerId !== event.pointerId || !activeObjectId) return;
    const bounds = application.canvas.getBoundingClientRect();
    const screen = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    if (!dragging) {
      if (
        Math.hypot(screen.x - pointerStart.x, screen.y - pointerStart.y) <
        DRAG_THRESHOLD
      )
        return;
      dragging = true;
    }
    const project = readProject();
    const object = project.city.objects.find(
      candidate => candidate.id === activeObjectId,
    );
    if (!object) return;
    const pointer = pointerToWorld(
      world,
      application.canvas,
      event.clientX,
      event.clientY,
    );
    if (mode === 'move') {
      publishProject(
        moveMapObject(project, activeObjectId, {
          x: pointer.x + dragOffset.x,
          y: pointer.y + dragOffset.y,
        }),
      );
    } else {
      publishProject(
        rotateMapObject(
          project,
          activeObjectId,
          rotationTowardPointer(object.transform.position, pointer),
        ),
      );
    }
  };

  /** Completes a gesture and changes mode only after a click without dragging. */
  const finishPointer = (event: PointerEvent) => {
    if (panPointerId === event.pointerId) {
      panPointerId = null;
      application.canvas.style.cursor = 'grab';
    }
    if (activePointerId !== event.pointerId) return;
    if (event.type === 'pointerup' && !dragging && !selectedOnPointerDown)
      toggleMode();
    activePointerId = null;
    activeObjectId = null;
    dragging = false;
    application.canvas.style.cursor = 'grab';
  };

  /** Deletes the selection or toggles its edit mode using the keyboard. */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!selectedId) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      publishProject(deleteMapObject(readProject(), selectedId));
      selectObject(null);
    } else if (event.key.toLowerCase() === 'r') {
      toggleMode();
    }
  };

  /** Records which object was pressed and the offset used during dragging. */
  const handleObjectPointerDown = (event: FederatedPointerEvent) => {
    if (event.button !== 0 || !(event.target instanceof Graphics)) return;
    const id = scene.graphicIds.get(event.target);
    if (!id) return;
    event.stopPropagation();
    const object = readProject().city.objects.find(
      candidate => candidate.id === id,
    );
    if (!object) return;
    activeObjectId = id;
    activePointerId = event.pointerId;
    application.canvas.setPointerCapture(event.pointerId);
    dragging = false;
    selectedOnPointerDown = selectedId !== id;
    pointerStart = { x: event.global.x, y: event.global.y };
    const pointer = world.toLocal(event.global);
    dragOffset = {
      x: object.transform.position.x - pointer.x,
      y: object.transform.position.y - pointer.y,
    };
    if (selectedOnPointerDown) selectObject(id);
    application.canvas.style.cursor = mode === 'rotate' ? 'crosshair' : 'grab';
  };

  /** Clears the selection when the background receives a left click. */
  const handleWorldPointerDown = (event: FederatedPointerEvent) => {
    if (event.button === 0) selectObject(null);
  };

  /** Resizes the Pixi renderer to the host element. */
  const resize = () =>
    application.renderer.resize(host.clientWidth, host.clientHeight);

  objects.on('pointerdown', handleObjectPointerDown);
  world.on('pointerdown', handleWorldPointerDown);
  application.canvas.addEventListener('wheel', handleWheel, { passive: false });
  application.canvas.addEventListener('pointerdown', handleCanvasPointerDown);
  application.canvas.addEventListener('pointermove', handleCanvasPointerMove);
  application.canvas.addEventListener('pointerup', finishPointer);
  application.canvas.addEventListener('pointercancel', finishPointer);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resize);

  return {
    /** Synchronizes external project changes such as JSON imports. */
    updateProject: project => {
      syncMapObjects(scene, project);
      if (
        selectedId &&
        !project.city.objects.some(object => object.id === selectedId)
      )
        selectObject(null);
      drawSelection(scene, project, selectedId);
      refreshIndicator();
    },
    /** Unregisters all input handlers before the Pixi scene is destroyed. */
    dispose: () => {
      objects.off('pointerdown', handleObjectPointerDown);
      world.off('pointerdown', handleWorldPointerDown);
      application.canvas.removeEventListener('wheel', handleWheel);
      application.canvas.removeEventListener(
        'pointerdown',
        handleCanvasPointerDown,
      );
      application.canvas.removeEventListener(
        'pointermove',
        handleCanvasPointerMove,
      );
      application.canvas.removeEventListener('pointerup', finishPointer);
      application.canvas.removeEventListener('pointercancel', finishPointer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resize);
    },
  };
};
