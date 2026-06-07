import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
}

export function SEO({
  title = 'EventGrid — Event Management Platform',
  description = 'The premium event management platform built for event planners, coordinators, vendors, and clients.',
  keywords = 'event planning, event management, nigeria events, wedding coordinator, corporate event planner, budget tracker, live board, paystack, flutterwave',
}: SEOProps) {
  const fullTitle = title.includes('EventGrid') ? title : `${title} | EventGrid`

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Favicon configuration to ensure it matches across all pages */}
      <link rel="icon" type="image/svg+xml" href="/EventGrid-favicon.svg" />
      <link rel="shortcut icon" href="/EventGrid-favicon.svg" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="EventGrid" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
