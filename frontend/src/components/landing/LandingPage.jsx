'use client';

import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import PlatformMarquee from './PlatformMarquee';
import FeaturesBento from './FeaturesBento';
import AiShowcase from './AiShowcase';
import HowItWorks from './HowItWorks';
import SocialProof from './SocialProof';
import PricingSection from './PricingSection';
import CtaBanner from './CtaBanner';
import LandingFooter from './LandingFooter';

export default function LandingPage() {
    return (
        <div className="landing min-h-screen bg-white antialiased">
            <LandingNav />
            <main>
                <HeroSection />
                <PlatformMarquee />
                <FeaturesBento />
                <AiShowcase />
                <HowItWorks />
                <SocialProof />
                <PricingSection />
                <CtaBanner />
            </main>
            <LandingFooter />
        </div>
    );
}
