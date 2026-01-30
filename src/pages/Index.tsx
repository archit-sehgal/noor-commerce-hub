import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import NewArrivals from "@/components/home/NewArrivals";
import BestSellers from "@/components/home/BestSellers";
import FeatureBanner from "@/components/home/FeatureBanner";
import Newsletter from "@/components/home/Newsletter";
import OfferMarquee from "@/components/home/OfferMarquee";
import FlashSale from "@/components/home/FlashSale";
import TrustBadges from "@/components/home/TrustBadges";
import Testimonials from "@/components/home/Testimonials";

const Index = () => {
  return (
    <div className="min-h-screen">
      <OfferMarquee />
      <Navbar />
      <main>
        <HeroSection />
        <FlashSale />
        <FeatureBanner />
        <FeaturedCategories />
        <NewArrivals />
        <TrustBadges />
        <BestSellers />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
