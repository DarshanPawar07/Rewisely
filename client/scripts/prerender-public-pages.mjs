import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const clientRoot = process.cwd();
const require = createRequire(path.join(clientRoot, 'package.json'));
const distRoot = path.join(clientRoot, 'dist');
const siteUrl = 'https://www.rewisely.online';
const template = await readFile(path.join(distRoot, 'index.html'), 'utf8');
const bundle = await build({
  absWorkingDir: clientRoot,
  entryPoints: ['scripts/prerender-entry.tsx'],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  packages: 'bundle',
  external: ['react', 'react-dom', 'react-dom/server'],
  loader: { '.css': 'empty' },
  logLevel: 'silent',
});
const serverModule = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(require, serverModule, serverModule.exports);
const { renderPublicPage, guides } = serverModule.exports;

  const pages = [
    {
      path: '/',
      title: 'Study Planner & Revision Tracker for Exam Prep | Rewisely',
      description: 'Plan study sessions, schedule revisions, and track subjects and chapters in one study planner. Build a routine for JEE, NEET, UPSC, MPSC, or any exam.',
    },
    {
      path: '/guides',
      title: 'Study Guides for Better Revision and Planning | Rewisely',
      description: 'Practical guides to exam study planning, spaced revision, active recall, managing a study backlog, and balancing subjects in a realistic week.',
    },
    ...guides.map(guide => ({
      path: `/guides/${guide.slug}`,
      title: `${guide.title} | Rewisely Study Guides`,
      description: guide.description,
    })),
  ];

  for (const page of pages) {
    const markup = renderPublicPage(page.path);
    const html = withHead(template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`), page);
    const outputPath = page.path === '/'
      ? path.join(distRoot, 'index.html')
      : path.join(distRoot, page.path.slice(1), 'index.html');
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
    console.log(`Prerendered ${page.path}`);
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map(page => `  <url><loc>${siteUrl}${page.path}</loc></url>`),
    '</urlset>',
  ].join('\n');
  await writeFile(path.join(distRoot, 'sitemap.xml'), `${sitemap}\n`);
function withHead(html, { path: route, title, description }) {
  const canonical = `${siteUrl}${route}`;
  const structuredData = route === '/'
    ? [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Rewisely', alternateName: ['Rewisely Online', 'rewisely.online'], url: `${siteUrl}/` },
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'Rewisely', url: `${siteUrl}/`, logo: `${siteUrl}/rewisely-icon.png` },
      ]
    : route.startsWith('/guides/')
      ? [
          { '@context': 'https://schema.org', '@type': 'Article', headline: title, description, mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Rewisely' }, publisher: { '@type': 'Organization', name: 'Rewisely', logo: { '@type': 'ImageObject', url: `${siteUrl}/rewisely-icon.png` } } },
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Study Guides', item: `${siteUrl}/guides` },
            { '@type': 'ListItem', position: 3, name: title, item: canonical },
          ] },
        ]
      : [];
  const tags = [
    `<meta name="description" content="${escapeAttribute(description)}" />`,
    '<meta name="robots" content="index,follow" />',
    '<meta property="og:type" content="' + (route.startsWith('/guides/') ? 'article' : 'website') + '" />',
    '<meta property="og:site_name" content="Rewisely" />',
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${siteUrl}/rewisely-icon.png" />`,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    `<meta name="twitter:image" content="${siteUrl}/rewisely-icon.png" />`,
    `<link rel="canonical" href="${canonical}" />`,
    ...(structuredData.length ? [`<script type="application/ld+json" data-rewisely-schema>${JSON.stringify(structuredData)}</script>`] : []),
  ].join('\n    ');

  return html
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta name="robots"[^>]*>/, '')
    .replace(/\s*<meta property="og:[^"]+"[^>]*>/g, '')
    .replace(/\s*<meta name="twitter:[^"]+"[^>]*>/g, '')
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeText(title)}</title>`)
    .replace('</head>', `    ${tags}\n  </head>`);
}

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
