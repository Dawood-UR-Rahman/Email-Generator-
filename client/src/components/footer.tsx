import { Link } from "wouter";
import { Mail, Twitter, Github, Linkedin, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings, SocialLinks } from "@shared/schema";
import { isValidEmail } from "@/lib/validation";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  { label: "Dashboard", href: "/dashboard" },
];

const resourceLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "FAQ", href: "/#faq" },
];

export function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/newsletter/subscribe", { email });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Subscription failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "Please check your email to confirm your subscription.",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const val = email.trim();
    if (!val) {
      setEmailError("Email is required");
      return;
    }
    if (!isValidEmail(val)) {
      setEmailError("Invalid email address");
      return;
    }
    setEmailError(null);
    subscribeMutation.mutate(val);
  };

  const siteName = siteSettings?.siteName || "TempMail";
  const footerLogo = siteSettings?.footerLogo || siteSettings?.siteLogo;
  const footerText = siteSettings?.footerText || "Free temporary email addresses for protecting your privacy online. No registration required.";
  const copyrightText = siteSettings?.copyrightText || `${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const socialLinks: Partial<SocialLinks> = siteSettings?.socialLinks || {};

  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              {footerLogo ? (
                <img src={footerLogo} alt={siteName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <span className="font-bold text-xl">{siteName}</span>
            </Link>
            <p className="text-sm text-background/70 mb-4">
              {footerText}
            </p>
            <div className="flex gap-2">
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Twitter className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {socialLinks.github && (
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Github className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Facebook className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {!socialLinks.twitter && !socialLinks.github && !socialLinks.linkedin && !socialLinks.facebook && (
                <>
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-background hover:bg-background/10">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Newsletter</h4>
            <p className="text-sm text-background/70 mb-4">
              Subscribe to get updates on privacy tips and new features.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input 
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value && !isValidEmail(e.target.value)) {
                      setEmailError("Invalid email address");
                    } else {
                      setEmailError(null);
                    }
                  }}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/50"
                  data-testid="input-newsletter-email"
                  aria-invalid={!!emailError}
                  aria-describedby="newsletter-email-error"
                  required
                />
                {emailError && (
                  <p id="newsletter-email-error" className="text-sm text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={subscribeMutation.isPending || !!emailError}
                data-testid="button-subscribe"
              >
                {subscribeMutation.isPending ? "..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/70">
            {copyrightText}
          </p>
          <div className="flex items-center gap-4 text-sm text-background/70">
            <Link href="/privacy" className="hover:text-background transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-background transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-background transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
