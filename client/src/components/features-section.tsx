import { Shield, Zap, Globe, Clock, Lock, Infinity } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "100% Safe & Private",
    description: "Protect your privacy by keeping spam and trackers out of your personal inbox.",
  },
  {
    icon: Zap,
    title: "Instant Access, Real-Time Updates",
    description: "Receive emails instantly with real-time inbox updates - no refresh needed.",
  },
  {
    icon: Globe,
    title: "Custom Domains Available",
    description: "Choose from multiple domain options or use your own custom domain.",
  },
  {
    icon: Clock,
    title: "Simple & Free Forever",
    description: "Create disposable emails in a few clicks with no registration. The service is always free.",
  },
  {
    icon: Infinity,
    title: "Unlimited & Unrestricted",
    description: "Generate as many temporary addresses as you need. No limits, no expiration until you delete.",
  },
  {
    icon: Lock,
    title: "Save Your Favorites",
    description: "Star important messages to save them. Access temporary emails anytime from your dashboard.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Our Temp Mail?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the features that make our temporary email service fast, secure, and easy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-shadow"
              data-testid={`feature-card-${index}`}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
