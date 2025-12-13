import { useState, useMemo } from "react";
import { Copy, RefreshCw, Trash2, ChevronDown, QrCode, Check, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";

function generateQRCodeDataURL(text: string, size: number = 200): string {
  const qrModules = generateQRMatrix(text);
  const moduleCount = qrModules.length;
  const cellSize = Math.floor(size / moduleCount);
  const actualSize = cellSize * moduleCount;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${actualSize}" height="${actualSize}" viewBox="0 0 ${moduleCount} ${moduleCount}">`;
  svg += `<rect width="${moduleCount}" height="${moduleCount}" fill="white"/>`;
  
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrModules[row][col]) {
        svg += `<rect x="${col}" y="${row}" width="1" height="1" fill="black"/>`;
      }
    }
  }
  svg += `</svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function generateQRMatrix(text: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);
  
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  const bytes = new TextEncoder().encode(text);
  let bitIndex = 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        if (!isReserved(x, row, size)) {
          const byteIndex = Math.floor(bitIndex / 8);
          const bitOffset = 7 - (bitIndex % 8);
          if (byteIndex < bytes.length) {
            matrix[row][x] = ((bytes[byteIndex] >> bitOffset) & 1) === 1;
          }
          bitIndex++;
        }
      }
    }
  }
  
  return matrix;
}

function addFinderPattern(matrix: boolean[][], startRow: number, startCol: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isEdge = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[startRow + r][startCol + c] = isEdge || isInner;
    }
  }
}

function isReserved(x: number, y: number, size: number): boolean {
  if ((x < 8 && y < 8) || (x < 8 && y >= size - 8) || (x >= size - 8 && y < 8)) return true;
  if (x === 6 || y === 6) return true;
  return false;
}

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
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customName, setCustomName] = useState("");

  const handleCopy = async () => {
    const success = await copyEmail();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateCustomEmail = () => {
    if (customName.trim()) {
      const sanitized = customName.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
      if (sanitized.length >= 3) {
        generateEmail(currentDomain, sanitized);
        setShowCustomEmail(false);
        setCustomName("");
      }
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

  const qrCodeDataUrl = useMemo(() => {
    if (currentEmail) {
      return generateQRCodeDataURL(`mailto:${currentEmail}`, 200);
    }
    return "";
  }, [currentEmail]);

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
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <Button 
                    size="lg" 
                    onClick={() => generateEmail()}
                    data-testid="button-generate-email"
                  >
                    Generate Email Address
                  </Button>
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomEmail(true)}
                      data-testid="button-custom-email"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Choose custom name
                    </Button>
                  </div>
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
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code for email address" 
                className="w-48 h-48 mb-4"
                data-testid="img-qr-code"
              />
            ) : (
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-32 w-32 text-muted-foreground" />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center font-mono">
              {currentEmail}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomEmail} onOpenChange={setShowCustomEmail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Custom Email Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="yourname"
                className="flex-1"
                data-testid="input-custom-email-name"
              />
              <span className="text-muted-foreground">@{currentDomain || "tempmail.io"}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use only letters, numbers, dots, hyphens, and underscores. Minimum 3 characters.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomEmail(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateCustomEmail}
              disabled={customName.trim().length < 3}
              data-testid="button-confirm-custom-email"
            >
              Create Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
