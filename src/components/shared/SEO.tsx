import { Helmet } from 'react-helmet-async'

const SITE_URL = import.meta.env.VITE_APP_URL || 'https://eventgrid.ng'
const DEFAULT_TITLE = 'EventGrid — Event Management Platform'
const DEFAULT_DESC = 'The premium event management platform built for event planners, coordinators, vendors, and clients.'
const DEFAULT_KEYWORDS = 'event planning, event management, nigeria events, wedding coordinator, corporate event planner, budget tracker, live board, paystack, flutterwave'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  publishedTime?: string
  author?: string
  noindex?: boolean
}

export function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  image = '/EventGrid-logo.svg',
  url,
  type = 'website',
  publishedTime,
  author,
  noindex = false,
}: SEOProps) {
  const fullTitle = title.includes('EventGrid') ? title : `${title} | EventGrid`
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EventGrid',
    url: SITE_URL,
    logo: `${SITE_URL}/EventGrid-logo.svg`,
    description: DEFAULT_DESC,
    sameAs: [],
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Favicon */}
      <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="EventGrid" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_NG" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrg)}
      </script>
    </Helmet>
  )
}
