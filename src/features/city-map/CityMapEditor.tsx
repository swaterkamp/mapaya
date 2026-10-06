import { MapCanvas } from './MapCanvas';

export const CityMapEditor = () => (
  <main
    className="h-screen w-screen overflow-hidden bg-slate-950 touch-none select-none"
    aria-label="City map editor"
  >
    <MapCanvas />
  </main>
);
