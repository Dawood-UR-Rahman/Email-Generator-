import { useState } from "react";
import { Copy, RefreshCw, Trash2, ChevronDown, QrCode, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEmail } from "@/lib/email-context";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EmailGenerator() {
  const {
    currentEmail,
    currentDomain,
    domains,
    isSyncing,
    syncProgress,
    generateEmail,
    copyEmail,
    deleteInbox,
    changeDomain,
    refreshInbox,
  } = useEmail();
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = async () => {
    const success = await copyEmail();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const systemDomains = domains.filter((d) => d.type === "system");
  const customDomains = domains.filter((d) => d.type === "custom" && d.isVerified);

  const availableDomains = isAuthenticated && customDomains.length > 0
    ? [...systemDomains, ...customDomains]
    : systemDomains;

  const defaultDomains = availableDomains.length > 0 
    ? availableDomains 
    : [{ _id: "1", name: "tempmail.io", type: "system" as const, isVerified: true, isActive: true, createdAt: new Date(), updatedAt: new Date() }];

  return (
    <div className="relative -mt-16 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 md:p-8 shadow-xl border-2 border-primary/20 relative overflow-hidden">
          {isSyncing && (
            <div className="absolute top-0 left-0 right-0">
              <Progress value={syncProgress} className="h-1 rounded-none" />
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Temporary Email Address</p>
              
              {currentEmail ? (
                <div 
                  className="bg-muted/50 rounded-lg p-4 font-mono text-xl md:text-2xl lg:text-3xl break-all cursor-pointer transition-colors hover:bg-muted"
                  onClick={handleCopy}
                  data-testid="text-current-email"
                >
                  {currentEmail}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4">
                  <Button 
                    size="lg" 
                    onClick={() => generateEmail()}
                    data-testid="button-generate-email"
                  >
                    Generate Email Address
                  </Button>
                </div>
              )}
            </div>

            {currentEmail && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant={copied ? "default" : "outline"}
                  onClick={handleCopy}
                  data-testid="button-copy-email"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => refreshInbox()}
                  disabled={isSyncing}
                  data-testid="button-refresh-inbox"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  onClick={deleteInbox}
                  data-testid="button-delete-inbox"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" data-testid="button-change-domain">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    {defaultDomains.filter(d => d.type === "system").map((domain) => (
                      <DropdownMenuItem
                        key={domain._id}
                        onClick={() => changeDomain(domain.name)}
                        className={currentDomain === domain.name ? "bg-accent" : ""}
                        data-testid={`menu-domain-${domain.name}`}
                      >
                        @{domain.name}
                      </DropdownMenuItem>
                    ))}
                    
                    {isAuthenticated && customDomains.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Your Custom Domains
                        </div>
                        {customDomains.map((domain) => (
                          <DropdownMenuItem
                            key={domain._id}
                            onClick={() => changeDomain(domain.name)}
                            className={currentDomain === domain.name ? "bg-accent" : ""}
                            data-testid={`menu-custom-domain-${domain.name}`}
                          >
                            @{domain.name}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQR(true)}
                  data-testid="button-show-qr"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
              <QrCode className="h-32 w-32 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center font-mono">
              {currentEmail}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
