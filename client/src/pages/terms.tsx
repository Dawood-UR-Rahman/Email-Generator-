import { Link } from "wouter";
import { ArrowLeft, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Terms() {
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
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-terms-title">Terms of Service</h1>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using TempMail, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                TempMail provides temporary, disposable email addresses for users who wish to protect their privacy. These email addresses are designed for short-term use and are automatically deleted after a specified period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Acceptable Use</h2>
              <p className="text-muted-foreground">
                You agree to use TempMail only for lawful purposes. The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Using the service for illegal activities or fraud</li>
                <li>Sending spam or unsolicited bulk emails</li>
                <li>Attempting to bypass account restrictions or security measures</li>
                <li>Using the service to harass, threaten, or harm others</li>
                <li>Distributing malware, viruses, or harmful content</li>
                <li>Violating intellectual property rights of others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Service Availability</h2>
              <p className="text-muted-foreground">
                We strive to maintain high availability, but we do not guarantee uninterrupted access to the service. We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data and Content</h2>
              <p className="text-muted-foreground">
                Emails received through our service are temporary and will be automatically deleted. We are not responsible for any loss of data. Users should not rely on TempMail for storing important information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. User Accounts</h2>
              <p className="text-muted-foreground">
                If you create an account, you are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TempMail is provided "as is" without warranties of any kind. We shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modifications to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
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
