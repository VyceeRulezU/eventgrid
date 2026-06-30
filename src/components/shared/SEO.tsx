import { Helmet } from 'react-helmet-async'

const SITE_URL = import.meta.env.VITE_APP_URL || 'https://naligrid.com'
const SITE_IMAGE = `${SITE_URL}/og-image-ng.png`
const DEFAULT_TITLE = 'NaliGrid — Event Management Platform'
const DEFAULT_DESC = 'The premium event management platform built for event planners, coordinators, vendors, and clients.'
const DEFAULT_KEYWORDS = 'event planning, event management, nigeria events, wedding coordinator, corporate event planner, budget tracker, live board, paystack, korapay'

interface Breadcrumb {
  name: string
  url?: string
}

interface FAQItem {
  question: string
  answer: string
}

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
  breadcrumbs?: Breadcrumb[]
  faq?: FAQItem[]
}

export function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  image = SITE_IMAGE,
  url,
  type = 'website',
  publishedTime,
  author,
  noindex = false,
  breadcrumbs,
  faq,
}: SEOProps) {
  const fullTitle = title.includes('NaliGrid') ? title : `${title} | NaliGrid`
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`

  const schemaOrg: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NaliGrid',
    url: SITE_URL,
    logo: `${SITE_URL}/ng-logo-wg.svg`,
    description: DEFAULT_DESC,
    sameAs: [],
  }

  const articleSchema = type === 'article' && publishedTime ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: fullTitle,
    description,
    image: imageUrl,
    datePublished: publishedTime,
    author: author ? {
      '@type': 'Person',
      name: author,
    } : {
      '@type': 'Organization',
      name: 'NaliGrid',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NaliGrid',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/ng-logo-wg.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  } : null

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Preconnect hints for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="NaliGrid" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content={image === SITE_IMAGE ? "579" : "630"} />
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
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: crumb.name,
              ...(crumb.url ? { item: `${SITE_URL}${crumb.url}` } : {}),
            })),
          })}
        </script>
      )}
      {faq && faq.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          })}
        </script>
      )}
    </Helmet>
  )
}
