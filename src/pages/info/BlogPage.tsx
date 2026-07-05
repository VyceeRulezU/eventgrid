import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import { Pagination } from '@/components/shared/Pagination'
import { STATIC_POSTS } from './blogPosts'
import type { StaticPost } from './blogPosts'
import styles from './InfoPages.module.css'

function getPostImage(post: StaticPost): string {
  return post.featuredImage?.placeholderUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop'
}

export function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6

  const totalPages = Math.ceil(STATIC_POSTS.length / postsPerPage)
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = STATIC_POSTS.slice(indexOfFirstPost, indexOfLastPost)

  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="NaliGrid Blog — Event Management Insights"
        description="Tips on escrow payments, event day coordination, aftermath reports, and more for Nigerian event planners and coordinators."
        url="/blog"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Blog' },
        ]}
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Editorial Blog"
        title="NaliGrid Insights & Resources"
        subtitle="Proactive tips, architectural advice, and execution strategies compiled by top event coordinators and designers."
      />

      <section className={styles.postsSection} aria-label="Blog posts list">
        <div className={styles.container}>
          <div className={styles.postsGrid}>
            {currentPosts.map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug.current}`}
                className={styles.postCard}
                style={{ textDecoration: 'none' }}
              >
                <div className={styles.postImgWrap}>
                  <img src={getPostImage(post)} alt="" className={styles.postImg} onLoad={(e) => { e.currentTarget.dataset.loaded = 'true' }} />
                  <span className={styles.postCat}>{post.category}</span>
                </div>
                <div className={styles.postBody}>
                  <div className={styles.postMeta}>
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className={styles.metaDot}>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className={styles.postTitle}>{post.title}</h2>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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
