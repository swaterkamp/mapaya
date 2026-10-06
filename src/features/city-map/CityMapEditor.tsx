import { MapCanvas } from './MapCanvas';

const MAIN = `
  h-full
  w-full
  overflow-hidden
  touch-none
  select-none
  bg-background
`;

export const CityMapEditor = () => (
  <main
    className={MAIN}
    aria-label="City map editor"
  >
    <MapCanvas />
  </main>
);
