import { Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';

type HeaderProps = {
  isDark: boolean;
  onToggleTheme: () => void;
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
const THEME_BUTTON_LABEL = (isDark: boolean) => (isDark ? 'Light theme' : 'Dark theme');

export const Header = ({ isDark, onToggleTheme }: HeaderProps) => (
  <header className={HEADER}>
    <div className={HEADER_BRAND}>
      <SidebarTrigger className={SIDEBAR_TRIGGER} />
      <img src="/mapaya-logo-horizontal.png" alt="Mapaya" className={LOGO} />
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleTheme}
      aria-label={THEME_BUTTON_LABEL(isDark)}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  </header>
);
