import { Link } from "wouter";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">TempMail</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild className="text-background">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-privacy-title">Privacy Policy</h1>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to TempMail. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our temporary email service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p className="text-muted-foreground">
                Our service is designed with privacy in mind. We collect minimal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Temporary email addresses generated during your session</li>
                <li>Email content received at temporary addresses (automatically deleted)</li>
                <li>Basic usage analytics (non-personally identifiable)</li>
                <li>Account information if you choose to register (optional)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use the collected information solely for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Providing and maintaining the temporary email service</li>
                <li>Improving our service quality and user experience</li>
                <li>Preventing abuse and ensuring platform security</li>
                <li>Communicating important service updates (registered users only)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
              <p className="text-muted-foreground">
                Temporary emails and their contents are automatically deleted according to our retention policy. For anonymous users, data is typically deleted within 24 hours. Registered users may have extended retention periods based on their account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure server infrastructure, and regular security audits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Third-Party Services</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or share your personal information with third parties for marketing purposes. We may use third-party services for analytics and infrastructure, which are bound by their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal data. For registered users, these options are available in your account settings. For any privacy-related inquiries, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
              </p>
            </section>

            <p className="text-sm text-muted-foreground mt-8 pt-4 border-t">
              Last updated: December 2024
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
