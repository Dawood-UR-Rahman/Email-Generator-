import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { EmailGenerator } from "@/components/email-generator";
import { Inbox } from "@/components/inbox";
import { StatsSection } from "@/components/stats-section";
import { FeaturesSection } from "@/components/features-section";
import { FAQSection } from "@/components/faq-section";
import { BlogSection } from "@/components/blog-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <EmailGenerator />
        <Inbox />
        <StatsSection />
        <FeaturesSection />
        <FAQSection />
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
