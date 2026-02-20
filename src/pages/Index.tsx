import { lazy, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import OfferMarquee from "@/components/home/OfferMarquee";
import FlashSale from "@/components/home/FlashSale";
import TrustBadges from "@/components/home/TrustBadges";
import Testimonials from "@/components/home/Testimonials";
import UrgentHostingWarning from "@/components/UrgentHostingWarning";
import FeatureBanner from "@/components/home/FeatureBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import BestSellers from "@/components/home/BestSellers";
import Newsletter from "@/components/home/Newsletter";
import NewArrivals from "./NewArrivals";

const Index = () => {
  return (
    <div className="min-h-screen">
      <OfferMarquee />
      <Navbar />
      <main>
        {/* Remove After Cloud Payment */}
        <UrgentHostingWarning/>
        {/* Remove After Cloud Payment */}
        <HeroSection />
        <Suspense fallback={null}>
          <FlashSale />
          <FeatureBanner />
          <FeaturedCategories />
          <TrustBadges />
          <BestSellers />
          <Testimonials />
          {/* <Newsletter /> */}
          <NewArrivals />
        </Suspense>
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default Index;
