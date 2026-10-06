import { useEffect, useState } from 'react';
import { Header } from './Header';
import { Sidebar, SidebarContent, SidebarProvider } from '../ui/sidebar';
import { CityMapEditor } from '../../features/city-map/CityMapEditor';

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

const Layout = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.theme === 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <SidebarProvider>
      <div className={LAYOUT}>
        <Header isDark={isDark} onToggleTheme={() => setIsDark(value => !value)} />
        <div className={WORKSPACE}>
          <Sidebar className={SIDEBAR}>
            <SidebarContent className={SIDEBAR_CONTENT}>
              Testcontent
            </SidebarContent>
          </Sidebar>
          <div className={EDITOR_HOST}>
            <CityMapEditor />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
