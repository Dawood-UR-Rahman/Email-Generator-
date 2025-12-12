import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Mail, Globe, Inbox, Bell, Settings, LogOut, 
  Plus, Trash2, RefreshCw, Check, X, Copy, 
  ChevronRight, AlertCircle, CheckCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useEmail } from "@/lib/email-context";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Domain, Notification } from "@shared/schema";

const domainSchema = z.object({
  name: z.string().min(3, "Domain name is required").regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});

type DomainForm = z.infer<typeof domainSchema>;

function DomainCard({ domain, onDelete }: { domain: Domain; onDelete: (id: string) => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{domain.name}</p>
            <p className="text-sm text-muted-foreground">
              Added {new Date(domain.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {domain.isVerified ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onDelete(domain._id)}
            data-testid={`button-delete-domain-${domain._id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {!domain.isVerified && domain.verificationTxt && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Add this TXT record to your DNS:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background p-2 rounded font-mono overflow-x-auto">
              {domain.verificationTxt}
            </code>
            <Button size="icon" variant="ghost">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const iconMap = {
    info: <Bell className="h-4 w-4 text-blue-500" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <X className="h-4 w-4 text-red-500" />,
  };

  return (
    <div className={`p-4 border-b border-border ${!notification.isRead ? "bg-primary/5" : ""}`}>
      <div className="flex items-start gap-3">
        {iconMap[notification.type]}
        <div className="flex-1">
          <p className="font-medium">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { currentEmail, messages, domains, generateEmail, refreshInbox, isSyncing } = useEmail();
  const { toast } = useToast();
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [userDomains, setUserDomains] = useState<Domain[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const form = useForm<DomainForm>({
    resolver: zodResolver(domainSchema),
    defaultValues: { name: "" },
  });

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const customDomains = domains.filter(d => d.type === "custom" && d.userId === user?._id);

  const handleAddDomain = async (data: DomainForm) => {
    try {
      const response = await fetch("/api/domain/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to add domain");

      const newDomain = await response.json();
      setUserDomains([...userDomains, newDomain]);
      setShowAddDomain(false);
      form.reset();
      toast({
        title: "Domain added!",
        description: "Please configure your DNS to verify the domain.",
      });
    } catch (error) {
      toast({
        title: "Failed to add domain",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await fetch(`/api/domain/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setUserDomains(userDomains.filter(d => d._id !== id));
      toast({ title: "Domain removed" });
    } catch {
      toast({ title: "Failed to remove domain", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
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
              <div className="text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{user?.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your custom domains, temporary inboxes, and account settings
          </p>
        </div>

        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 gap-1">
            <TabsTrigger value="domains" data-testid="tab-domains">
              <Globe className="h-4 w-4 mr-2 hidden sm:inline" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              <Inbox className="h-4 w-4 mr-2 hidden sm:inline" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="h-4 w-4 mr-2 hidden sm:inline" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2 hidden sm:inline" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Custom Domains</h2>
                <p className="text-sm text-muted-foreground">
                  Add your own domains to create personalized temporary emails
                </p>
              </div>
              <Dialog open={showAddDomain} onOpenChange={setShowAddDomain}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-domain">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Domain</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddDomain)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="example.com" 
                                data-testid="input-domain-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" data-testid="button-submit-domain">
                        Add Domain
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">How to Connect Your Domain</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">1</span>
                  <span>Add your domain using the form above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">2</span>
                  <span>Copy the TXT verification record provided</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">3</span>
                  <span>Add the TXT record to your domain's DNS settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">4</span>
                  <span>Add an MX record pointing to our mail server</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">5</span>
                  <span>Wait for verification (usually within 24 hours)</span>
                </li>
              </ol>
            </Card>

            {customDomains.length > 0 || userDomains.length > 0 ? (
              <div className="space-y-4">
                {[...customDomains, ...userDomains].map((domain) => (
                  <DomainCard 
                    key={domain._id} 
                    domain={domain} 
                    onDelete={handleDeleteDomain} 
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No custom domains yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your own domain to create personalized temporary emails
                </p>
                <Button onClick={() => setShowAddDomain(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Domain
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inbox" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Inbox</h2>
                <p className="text-sm text-muted-foreground">
                  {currentEmail || "Generate an email to start receiving messages"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => refreshInbox()}
                  disabled={isSyncing}
                  data-testid="button-refresh-dashboard-inbox"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button onClick={() => generateEmail()} data-testid="button-generate-dashboard-email">
                  <Plus className="h-4 w-4 mr-2" />
                  New Email
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              {messages.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Inbox is empty</h3>
                  <p className="text-muted-foreground">
                    Messages sent to your temporary email will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  {messages.map((message) => (
                    <div 
                      key={message._id}
                      className="p-4 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{message.from}</p>
                          <p className="text-sm text-muted-foreground truncate">{message.subject}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Stay updated with your account activity
              </p>
            </div>

            <Card className="overflow-hidden">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    You're all caught up! Notifications will appear here.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  {notifications.map((notification) => (
                    <NotificationItem key={notification._id} notification={notification} />
                  ))}
                </ScrollArea>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Account Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your profile and preferences
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Username</label>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Account Type</label>
                    <p className="font-medium capitalize">{user?.role}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Security</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
