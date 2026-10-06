import { MapCanvas } from './MapCanvas';

const MAIN = "h-screen w-screen overflow-hidden bg-slate-950 touch-none select-none"

export const CityMapEditor = () => (
  <main
    className={MAIN}
    aria-label="City map editor"
  >
    <MapCanvas />
  </main>
);
