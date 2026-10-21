import type { CityProject } from '../../domain/city-project.ts';
import {
  parseCityProject,
  serializeCityProject,
} from '../../domain/city-project-serialization.ts';

const STORAGE_KEY = 'mapaya.city-project.v1';

/** Reads the last locally saved city project. */
export const loadStoredCityProject = (): CityProject | null => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return parseCityProject(stored);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

/** Persists the current project in browser storage. */
export const storeCityProject = (project: CityProject): void => {
  window.localStorage.setItem(STORAGE_KEY, serializeCityProject(project));
};
