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
import CTASection from '@/pages/landing/CTASection'
import Footer from '@/pages/landing/Footer'
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
          <CTASection />
          <Footer />
        </div>
      </main>
    </div>
  )
}
export default LandingPage
