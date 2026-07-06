import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/pages/landing/HeroSection'
import PartnersSection from '@/pages/landing/PartnersSection'
import MobileAppFeature from '@/pages/landing/MobileAppFeature'
import StepsSection from '@/pages/landing/StepsSection'
import ProblemSection from '@/pages/landing/ProblemSection'
import BentoFeaturesSection from '@/pages/landing/BentoFeaturesSection'
import FeatureSpotlightA from '@/pages/landing/FeatureSpotlightA'
import FeatureSpotlightB from '@/pages/landing/FeatureSpotlightB'
import FeatureSpotlightC from '@/pages/landing/FeatureSpotlightC'
import FeatureSpotlightD from '@/pages/landing/FeatureSpotlightD'
import RoleSection from '@/pages/landing/RoleSection'
import BlogSection from '@/pages/landing/BlogSection'
import { FaqSection } from '@/components/shared/FaqSection'
import TestimonialsSection from '@/pages/landing/TestimonialsSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import styles from './LandingPage.module.css'

export function LandingPage() {
  return (
    <div className={styles.page}>
      <SEO 
        title="NaliGrid — Software for Event Pros" 
        description="The premium event management platform built for Nigerian planners, coordinators, vendors, and clients." 
      />

      <Navbar landing />
      
      <main>
        {/* SECTION: Hero */}
        <HeroSection />

        {/* SECTION: Partners Logo Section */}
        <PartnersSection />

        {/* SECTION: Steps Section */}
        <StepsSection />

        {/* SECTION: Problem Statement */}
        <ProblemSection />

        {/* SECTION: Bento Feature Grid */}
        <BentoFeaturesSection />

        {/* SECTION: Mobile App Feature */}
        <MobileAppFeature />

        {/* SECTION: Feature Spotlight Group */}
        <div className={styles.spotlightGroup}>
          <FeatureSpotlightA />
          <FeatureSpotlightB />
          <FeatureSpotlightC />
          <FeatureSpotlightD />
        </div>

        {/* SECTION: Role Selector */}
        <RoleSection />

        {/* SECTION: Blog */}
        <BlogSection />

        {/* DARK ZONE: FAQ + Testimonials + CTA + Footer share the same bg */}
        <div className={styles.darkZone}>
          <div className={styles.faqTestimonialsWrap}>
            <FaqSection
              items={[
                {
                  category: 'Getting Started',
                  items: [
                    {
                      question: 'What is NaliGrid?',
                      answer: 'NaliGrid is a premium, multi-role event management workspace. We help planners, venue coordinators, and vendors collaborate in real-time, trace phase milestones, and manage secure contract payouts.'
                    },
                    {
                      question: 'How do I get started?',
                      answer: 'Register a free account, create your first event, and invite your team. The first activation takes about 5 minutes. No credit card required.'
                    }
                  ]
                },
                {
                  category: 'Platform',
                  items: [
                    {
                      question: 'Can I try NaliGrid before paying?',
                      answer: 'Yes. We offer a free draft account that lets you explore the workspace and invite up to 2 coordinators. Pricing tiers launching Q3 2026.'
                    },
                    {
                      question: 'Is my data secure?',
                      answer: 'Extremely secure. All event activations are verified server-to-server via our API. Payment status variables are protected from client-side direct database write modifications using database constraints.'
                    }
                  ]
                }
              ]}
              header="Frequently Asked Questions"
              summary="Quick answers to common questions about NaliGrid."
            />
            <TestimonialsSection />
          </div>
          <LandingCTA
            eyebrow="Start today. Pay per event."
            title="No more chaos. Just coordinated events."
            description="Works for planners, coordinators, and their entire team. First activation takes 5 minutes. Nigerian Naira pricing."
            primaryText="Create your first event"
            primaryHref="/register"
            secondaryText="See how it works"
            secondaryHref="#how-it-works"
            secondaryOnClick={() => {
              document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
          <Footer />
        </div>
      </main>
    </div>
  )
}
export default LandingPage
