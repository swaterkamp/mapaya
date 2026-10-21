import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Header } from './Header';
import { Sidebar, SidebarContent, SidebarProvider } from '../ui/sidebar';
import { CityMapEditor } from '../../features/city-map/CityMapEditor';
import type { CityProject } from '../../domain/city-project.ts';
import {
  parseCityProject,
  serializeCityProject,
} from '../../domain/city-project-serialization.ts';
import { demoCityProject } from '../../features/city-map/demo-city-project';
import {
  loadStoredCityProject,
  storeCityProject,
} from '../../features/city-map/city-project-storage';

const LAYOUT = `
  flex
  h-screen
  w-screen
  flex-col
  bg-background
  text-foreground
`;
const WORKSPACE = `
  relative
  flex
  min-h-0
  flex-1
`;
const SIDEBAR = `
  top-14
  h-[calc(100svh-3.5rem)]
  border-r
  border-sidebar-border
  bg-sidebar
`;
const SIDEBAR_CONTENT = `
  bg-sidebar
  p-3
`;
const EDITOR_HOST = `
  absolute
  inset-0
`;

/** Owns the active project and connects editor actions to the header. */
const Layout = () => {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );
  const [project, setProject] = useState<CityProject>(
    () => loadStoredCityProject() ?? structuredClone(demoCityProject),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  /** Downloads the current project as a JSON file. */
  const handleExportProject = () => {
    const blob = new Blob([serializeCityProject(project)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mapaya-city-project.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  /** Opens the browser's JSON file chooser. */
  const handleImportProject = () => fileInputRef.current?.click();
  /** Validates a chosen file before replacing the current project. */
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const project = parseCityProject(await file.text());
      setProject(project);
      storeCityProject(project);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Projekt konnte nicht geladen werden.',
      );
    }
  };

  return (
    <SidebarProvider>
      <div className={LAYOUT}>
        <Header
          cityName={project.metadata.name}
          isDark={isDark}
          onToggleTheme={() => setIsDark(value => !value)}
          onExportProject={handleExportProject}
          onImportProject={handleImportProject}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className={WORKSPACE}>
          <Sidebar className={SIDEBAR}>
            <SidebarContent className={SIDEBAR_CONTENT}>
              Testcontent
            </SidebarContent>
          </Sidebar>
          <div className={EDITOR_HOST}>
            <CityMapEditor
              project={project}
              onProjectChange={nextProject => {
                setProject(nextProject);
                storeCityProject(nextProject);
              }}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
