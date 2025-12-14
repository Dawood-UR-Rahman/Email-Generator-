import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { EmailGenerator } from "@/components/email-generator";
import { Inbox } from "@/components/inbox";
import { StatsSection } from "@/components/stats-section";
import { FeaturesSection } from "@/components/features-section";
import { FAQSection } from "@/components/faq-section";
import { BlogSection } from "@/components/blog-section";
import { Footer } from "@/components/footer";
import { AdDisplay } from "@/components/ad-display";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <EmailGenerator />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <AdDisplay position="sidebar" className="hidden lg:block w-[160px] flex-shrink-0" />
            
            <div className="flex-1">
              <Inbox />
            </div>
            
            <AdDisplay position="sidebar" className="hidden lg:block w-[160px] flex-shrink-0" />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdDisplay position="content" className="w-full" />
        </div>
        
        <StatsSection />
        <FeaturesSection />
        <FAQSection />
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
