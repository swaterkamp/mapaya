import type { CityProject } from '../../domain/city-project.ts';
import { MapCanvas } from './MapCanvas';

const MAIN = `
  h-full
  w-full
  overflow-hidden
  touch-none
  select-none
  bg-background
`;

export type CityMapEditorProps = {
  project: CityProject;
  onProjectChange: (project: CityProject) => void;
};

export const CityMapEditor = ({
  project,
  onProjectChange,
}: CityMapEditorProps) => (
  <main className={MAIN} aria-label="City map editor">
    <MapCanvas project={project} onProjectChange={onProjectChange} />
  </main>
);
