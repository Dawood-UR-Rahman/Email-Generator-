import { Link, useLocation } from "wouter";
import { Mail, Menu, X, Home, FileText, MessageSquare, LogIn, UserPlus, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

export function Header() {
  const [location] = useLocation();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/blog", label: "Blog", icon: FileText },
    { href: "/contact", label: "Contact Us", icon: MessageSquare },
  ];

  const siteName = siteSettings?.siteName || "TempMail";
  const headerLogo = siteSettings?.headerLogo || siteSettings?.siteLogo;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            {headerLogo ? (
              <img src={headerLogo} alt={siteName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-xl hidden sm:block">{siteName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" data-testid="link-admin">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" data-testid="link-dashboard">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout} data-testid="button-logout">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" data-testid="link-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="link-register">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={location === link.href ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Button>
                </Link>
              ))}
              
              <div className="border-t border-border pt-2 mt-2">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link href="/admin">
                        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Button>
                      </Link>
                    )}
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                      <LogOut className="h-4 w-4" />
                      <span>Logout ({user?.username})</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full mt-2 gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <UserPlus className="h-4 w-4" />
                        <span>Sign Up</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
