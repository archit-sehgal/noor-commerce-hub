import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import NewArrivals from "@/components/home/NewArrivals";
import BestSellers from "@/components/home/BestSellers";
import FeatureBanner from "@/components/home/FeatureBanner";
import Newsletter from "@/components/home/Newsletter";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeatureBanner />
        <FeaturedCategories />
        <NewArrivals />
        <BestSellers />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
