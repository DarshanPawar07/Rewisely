import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const clientRoot = process.cwd();
const require = createRequire(path.join(clientRoot, 'package.json'));
const distRoot = path.join(clientRoot, 'dist');
const siteUrl = 'https://rewisely-eta.vercel.app';
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
      title: 'Rewisely — Plan revisions and build better study habits',
      description: 'Plan spaced revision, organise study tasks, and track your progress across subjects with Rewisely, a calmer study-planning workspace.',
    },
    {
      path: '/guides',
      title: 'Study Guides for Better Revision and Planning | Rewisely',
      description: 'Practical, student-friendly guides to spaced revision, active recall, and planning a study week you can stick to.',
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
function withHead(html, { path: route, title, description }) {
  const canonical = `${siteUrl}${route}`;
  const tags = [
    `<meta name="description" content="${escapeAttribute(description)}" />`,
    '<meta name="robots" content="index,follow" />',
    '<meta property="og:type" content="' + (route.startsWith('/guides/') ? 'article' : 'website') + '" />',
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${siteUrl}/rewisely-icon.png" />`,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    `<meta name="twitter:image" content="${siteUrl}/rewisely-icon.png" />`,
    `<link rel="canonical" href="${canonical}" />`,
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
