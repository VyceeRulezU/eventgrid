import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import styles from './InfoPages.module.css'

const POSTS = [
  {
    title: 'The Future of Escrow Payments in Event Sourcing',
    excerpt: 'How securing vendor contract amounts prevents late deliveries and ensures deposit clarity for premium planners.',
    category: 'Fintech & Security',
    date: 'June 2, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop'
  },
  {
    title: 'Checklist Blueprint: How to Coordinate Event Day Flawlessly',
    excerpt: 'A comprehensive checklist layout template for planners managing on-site vendor check-ins and stage cues.',
    category: 'Coordination',
    date: 'May 28, 2026',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&q=80&auto=format&fit=crop'
  },
  {
    title: 'Reconciling Aftermath Reports: 5 Financial Mistakes Planners Make',
    excerpt: 'Avoid invoice anomalies. Learn how to reconcile cash advances, vendor checklists, and seat layouts.',
    category: 'Analytics',
    date: 'May 15, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&auto=format&fit=crop'
  }
]

export function BlogPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="NaliGrid Blog — Event Management Insights"
        description="Tips on escrow payments, event day coordination, aftermath reports, and more for Nigerian event planners and coordinators."
        url="/blog"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Editorial Blog"
        title="NaliGrid Insights & Resources"
        subtitle="Proactive tips, architectural advice, and execution strategies compiled by top event coordinators and designers."
      />

      {/* Blog Posts Grid */}
      <section className={styles.postsSection} aria-label="Blog posts list">
        <div className={styles.container}>
          <div className={styles.postsGrid}>
            {POSTS.map((post) => (
              <article key={post.title} className={styles.postCard}>
                <div className={styles.postImgWrap}>
                  <img src={post.image} alt="" className={styles.postImg} />
                  <span className={styles.postCat}>{post.category}</span>
                </div>
                <div className={styles.postBody}>
                  <div className={styles.postMeta}>
                    <span>{post.date}</span>
                    <span className={styles.metaDot}>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className={styles.postTitle}>{post.title}</h2>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'General',
            items: [
              {
                question: 'How often is the blog updated?',
                answer: 'We publish new articles every week covering event planning strategies, vendor management tips, and platform updates.'
              },
              {
                question: 'Can I contribute to the blog?',
                answer: 'We welcome guest posts from event professionals. Reach out to our editorial team with your pitch.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about our blog and content."
      />

      <LandingCTA
        title="Stay updated on event execution tips."
        description="Subscribe to our monthly newsletter and get planning blueprint models sent straight to your inbox."
        primaryText="Subscribe Now"
      />

      <Footer />
    </div>
  )
}
