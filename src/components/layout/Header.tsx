import { Download, Moon, Sun, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type HeaderProps = {
  cityName: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
};

const HEADER = `
  flex
  h-14
  shrink-0
  items-center
  justify-between
  border-b
  border-border
  bg-surface
  px-4
  text-text-primary
`;
const HEADER_BRAND = `
  flex
  items-center
  gap-3
`;
const LOGO = 'h-10';
const SIDEBAR_TRIGGER = `
  text-text-primary
`;
/** Names the theme that the button will activate. */
const THEME_BUTTON_LABEL = (isDark: boolean) =>
  isDark ? 'Light theme' : 'Dark theme';

/** Displays the city name and application actions. */
export const Header = ({
  cityName,
  isDark,
  onToggleTheme,
  onExportProject,
  onImportProject,
}: HeaderProps) => (
  <header className={`${HEADER} relative`}>
    <div className={HEADER_BRAND}>
      <SidebarTrigger className={SIDEBAR_TRIGGER} />
      <img src="/mapaya-logo-horizontal.png" alt="Mapaya" className={LOGO} />
    </div>
    <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 truncate px-24 text-sm font-semibold text-text-primary">
      {cityName}
    </h1>
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExportProject}
            aria-label="Projekt speichern"
          >
            <Download />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Projekt als JSON speichern</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onImportProject}
            aria-label="Projekt laden"
          >
            <Upload />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Gespeichertes JSON-Projekt laden</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={THEME_BUTTON_LABEL(isDark)}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isDark ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
        </TooltipContent>
      </Tooltip>
    </div>
  </header>
);
