import type { CityProject } from '../../domain/city-project.ts';
import {
  parseCityProject,
  serializeCityProject,
} from '../../domain/city-project-serialization.ts';

const STORAGE_KEY = 'mapaya.city-project.v1';

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

export const storeCityProject = (project: CityProject): void => {
  window.localStorage.setItem(STORAGE_KEY, serializeCityProject(project));
};
