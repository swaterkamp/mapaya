import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Layout from '../Layout';

vi.mock('../../../features/city-map/CityMapEditor', () => ({
  CityMapEditor: () => createElement('main', { 'aria-label': 'City map editor' }),
}));

test('renders the header, sidebar toggle, and editor', () => {
  render(createElement(Layout));

  expect(screen.getByAltText('Mapaya')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Toggle Sidebar' })).toBeInTheDocument();
  expect(screen.getByRole('main', { name: 'City map editor' })).toBeInTheDocument();
});
