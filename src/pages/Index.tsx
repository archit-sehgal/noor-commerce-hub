import { lazy, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import OfferMarquee from "@/components/home/OfferMarquee";

// Lazy load below-the-fold sections
const FeaturedCategories = lazy(() => import("@/components/home/FeaturedCategories"));
const NewArrivals = lazy(() => import("@/components/home/NewArrivals"));
const BestSellers = lazy(() => import("@/components/home/BestSellers"));
const FeatureBanner = lazy(() => import("@/components/home/FeatureBanner"));
const Newsletter = lazy(() => import("@/components/home/Newsletter"));
const FlashSale = lazy(() => import("@/components/home/FlashSale"));
const TrustBadges = lazy(() => import("@/components/home/TrustBadges"));
const Testimonials = lazy(() => import("@/components/home/Testimonials"));

const Index = () => {
  return (
    <div className="min-h-screen">
      <OfferMarquee />
      <Navbar />
      <main>
        <HeroSection />
        <Suspense fallback={null}>
          <FlashSale />
          <FeatureBanner />
          <FeaturedCategories />
          <NewArrivals />
          <TrustBadges />
          <BestSellers />
          <Testimonials />
          <Newsletter />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
