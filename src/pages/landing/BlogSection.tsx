import { Link } from 'react-router-dom'
import { STATIC_POSTS } from '@/pages/info/blogPosts'

const BLOG_STYLES: Record<string, React.CSSProperties> = {
  section: {
    padding: '80px 0',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
  },
  header: {
    marginBottom: 48,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: '#d4a017',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.14em',
    display: 'block',
    marginBottom: 12,
  },
  title: {
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: 300,
    color: '#f9fafb',
    margin: 0,
    lineHeight: 1.2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    overflow: 'hidden',
    textDecoration: 'none',
    transition: 'border-color 250ms ease, transform 250ms ease',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardImg: {
    width: '100%',
    height: 200,
    objectFit: 'cover' as const,
    display: 'block',
  },
  cardBody: {
    padding: 24,
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  cardCat: {
    fontSize: 11,
    fontWeight: 700,
    color: '#d4a017',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: '#f9fafb',
    lineHeight: 1.3,
    margin: 0,
  },
  cardExcerpt: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 1.6,
    margin: 0,
    flex: 1,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#6b7280',
  },
}

export default function BlogSection({ hideEyebrow }: { hideEyebrow?: boolean }) {
  const topPosts = STATIC_POSTS.slice(0, 3)

  return (
    <section style={BLOG_STYLES.section}>
      <div style={BLOG_STYLES.container}>
        <div style={BLOG_STYLES.header}>
          {!hideEyebrow && <span style={BLOG_STYLES.eyebrow}>From the Blog</span>}
          <h2 style={BLOG_STYLES.title}>
            Insights for Nigerian event professionals
          </h2>
        </div>
        <div style={BLOG_STYLES.grid}>
          {topPosts.map((post) => (
            <Link
              key={post._id}
              to={`/blog/${post.slug.current}`}
              style={BLOG_STYLES.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,160,23,0.3)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {post.featuredImage?.placeholderUrl && (
                <img src={post.featuredImage.placeholderUrl} alt="" style={BLOG_STYLES.cardImg} loading="lazy" />
              )}
              <div style={BLOG_STYLES.cardBody}>
                <span style={BLOG_STYLES.cardCat}>{post.category}</span>
                <h3 style={BLOG_STYLES.cardTitle}>{post.title}</h3>
                <p style={BLOG_STYLES.cardExcerpt}>{post.excerpt}</p>
                <div style={BLOG_STYLES.cardMeta}>
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
