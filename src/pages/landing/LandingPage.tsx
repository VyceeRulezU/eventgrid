import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/pages/landing/HeroSection'
import PartnersSection from '@/pages/landing/PartnersSection'
import StepsSection from '@/pages/landing/StepsSection'
import ProblemSection from '@/pages/landing/ProblemSection'
import BentoFeaturesSection from '@/pages/landing/BentoFeaturesSection'
import FeatureSpotlightA from '@/pages/landing/FeatureSpotlightA'
import FeatureSpotlightB from '@/pages/landing/FeatureSpotlightB'
import FeatureSpotlightC from '@/pages/landing/FeatureSpotlightC'
import FeatureSpotlightD from '@/pages/landing/FeatureSpotlightD'
import RoleSection from '@/pages/landing/RoleSection'
import TestimonialsSection from '@/pages/landing/TestimonialsSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import BackToTop from '@/components/shared/BackToTop'
import styles from './LandingPage.module.css'

export function LandingPage() {
  return (
    <div className={styles.page}>
      <SEO 
        title="EventGrid — Software for Event Pros" 
        description="The premium event management platform built for Nigerian planners, coordinators, vendors, and clients." 
      />

      <Navbar />
      
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

        {/* SECTION: Feature Spotlight Group */}
        <div className={styles.spotlightGroup}>
          <FeatureSpotlightA />
          <FeatureSpotlightB />
          <FeatureSpotlightC />
          <FeatureSpotlightD />
        </div>

        {/* SECTION: Role Selector */}
        <RoleSection />

        {/* DARK ZONE: Testimonials + CTA + Footer share the same bg */}
        <div className={styles.darkZone}>
          <TestimonialsSection />
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

      <BackToTop />
    </div>
  )
}
export default LandingPage
