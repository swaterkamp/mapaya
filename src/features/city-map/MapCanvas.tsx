import {
  ArrowClockwiseIcon,
  ArrowsOutCardinalIcon,
} from '@phosphor-icons/react';
import type { CityProject } from '../../domain/index.ts';
import { useMapCanvas } from './use-map-canvas.ts';

export type MapCanvasProps = {
  project: CityProject;
  onProjectChange: (project: CityProject) => void;
};

const MAP_HOST = `
  relative
  h-full
  w-full
`;
const MODE_INDICATOR = `
  pointer-events-none
  absolute
  z-10
  -translate-x-1/2
  -translate-y-full
  rounded-full
  border
  border-primary
  bg-slate-900/90
  p-1
  text-primary
  shadow-lg
`;

/** Displays the Pixi canvas and the selected object's current editing mode. */
export const MapCanvas = ({ project, onProjectChange }: MapCanvasProps) => {
  const { hostRef, canvasState } = useMapCanvas(project, onProjectChange);
  const IndicatorIcon =
    canvasState.mode === 'rotate' ? ArrowClockwiseIcon : ArrowsOutCardinalIcon;

  return (
    <div ref={hostRef} className={MAP_HOST}>
      {canvasState.error && <p role="alert">{canvasState.error}</p>}
      {canvasState.selectedId && (
        <div
          className={MODE_INDICATOR}
          style={{
            left: canvasState.indicator.x,
            top: canvasState.indicator.y - 16,
          }}
          aria-label={
            canvasState.mode === 'rotate' ? 'Rotationsmodus' : 'Verschiebemodus'
          }
        >
          <IndicatorIcon size={20} weight="bold" />
        </div>
      )}
    </div>
  );
};
