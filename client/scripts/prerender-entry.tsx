import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../src/pages/LandingPage';
import { AboutPage, ContactPage, GuideArticlePage, GuideIndexPage, guides } from '../src/pages/GuidePages';

export { guides };
export { AboutPage, ContactPage };

export function renderPublicPage(path: string) {
  const element = path === '/'
    ? <MemoryRouter initialEntries={['/']}><LandingPage theme="light" onToggleTheme={() => {}} /></MemoryRouter>
    : path === '/about'
      ? <MemoryRouter initialEntries={['/about']}><AboutPage /></MemoryRouter>
      : path === '/contact'
        ? <MemoryRouter initialEntries={['/contact']}><ContactPage /></MemoryRouter>
    : <MemoryRouter initialEntries={[path]}><Routes>
      <Route path="/guides" element={<GuideIndexPage />} />
      <Route path="/guides/:slug" element={<GuideArticlePage />} />
    </Routes></MemoryRouter>;
  return renderToString(element);
}
