import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../Header';
import { SidebarProvider } from '../../ui/sidebar';

test('renders the brand and theme toggle', () => {
  render(
    createElement(
      SidebarProvider,
      null,
      createElement(Header, {
        isDark: false,
        onToggleTheme: () => undefined,
        onExportProject: () => undefined,
        onImportProject: () => undefined,
      }),
    ),
  );

  expect(screen.getByAltText('Mapaya')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Dark theme' }),
  ).toBeInTheDocument();
});
