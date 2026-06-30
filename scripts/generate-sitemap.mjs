import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SITE_URL = 'https://naligrid.com'

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/login', priority: '0.6', changefreq: 'monthly' },
  { path: '/register', priority: '0.8', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
  { path: '/planners', priority: '0.7', changefreq: 'monthly' },
  { path: '/coordinators', priority: '0.7', changefreq: 'monthly' },
  { path: '/vendors-landing', priority: '0.7', changefreq: 'monthly' },
  { path: '/features/pipeline', priority: '0.6', changefreq: 'monthly' },
  { path: '/features/live-board', priority: '0.6', changefreq: 'monthly' },
  { path: '/features/client-portal', priority: '0.6', changefreq: 'monthly' },
  { path: '/features/vendor-tracker', priority: '0.6', changefreq: 'monthly' },
  { path: '/features/aftermath-reports', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/blog', priority: '0.6', changefreq: 'weekly' },
  { path: '/careers', priority: '0.4', changefreq: 'monthly' },
  { path: '/press', priority: '0.4', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies', priority: '0.3', changefreq: 'yearly' },
  { path: '/security', priority: '0.3', changefreq: 'yearly' },
  { path: '/data-deletion', priority: '0.3', changefreq: 'yearly' },
]

// Extract blog post slugs from the TS file using a simple regex
function getBlogSlugs() {
  const blogPostsPath = resolve(ROOT, 'src', 'pages', 'info', 'blogPosts.ts')
  const content = readFileSync(blogPostsPath, 'utf-8')
  const slugs = []
  const regex = /slug:\s*\{\s*current:\s*['"]([^'"]+)['"]\s*\}/g
  let match
  while ((match = regex.exec(content)) !== null) {
    slugs.push(match[1])
  }
  return slugs
}

function generate() {
  const slugs = getBlogSlugs()
  const urls = [
    ...STATIC_ROUTES.map((r) => ({
      loc: `${SITE_URL}${r.path}`,
      changefreq: r.changefreq,
      priority: r.priority,
    })),
    ...slugs.map((slug) => ({
      loc: `${SITE_URL}/blog/${slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

  const outPath = resolve(ROOT, 'public', 'sitemap.xml')
  writeFileSync(outPath, xml, 'utf-8')
  console.log(`Generated sitemap.xml with ${urls.length} URLs → public/sitemap.xml`)
}

generate()
