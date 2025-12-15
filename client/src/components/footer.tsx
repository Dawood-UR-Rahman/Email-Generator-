import { Link } from "wouter";
import { Mail, Twitter, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">TempMail</span>
            </Link>
            <p className="text-sm text-background/70 mb-4">
              Free temporary email addresses for protecting your privacy online. 
              No registration required.
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="hover:bg-background/10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-background/10">
                <Github className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-background/10">
                <Linkedin className="h-4 w-4" />
              </Button>
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
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your email" 
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50"
                data-testid="input-newsletter-email"
              />
              <Button data-testid="button-subscribe">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/70">
            {new Date().getFullYear()} TempMail. All rights reserved.
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
