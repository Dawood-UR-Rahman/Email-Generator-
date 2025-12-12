import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Mail, Settings, Users, Globe, Inbox, FileText, 
  Save, TestTube, Check, X, Send, Trash2, RefreshCw,
  LogOut, AlertCircle, CheckCircle, Eye, EyeOff
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { imapSettingsSchema, smtpSettingsSchema, type InsertImapSettings, type InsertSmtpSettings, type User, type Domain, type Log } from "@shared/schema";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingImap, setTestingImap] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const imapForm = useForm<InsertImapSettings>({
    resolver: zodResolver(imapSettingsSchema),
    defaultValues: {
      host: "",
      port: 993,
      user: "",
      password: "",
      tls: true,
    },
  });

  const smtpForm = useForm<InsertSmtpSettings>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: "",
      port: 587,
      user: "",
      password: "",
      secure: true,
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleSaveImap = async (data: InsertImapSettings) => {
    try {
      const response = await fetch("/api/admin/settings/imap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save IMAP settings");
      toast({ title: "IMAP settings saved successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to save IMAP settings", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleSaveSmtp = async (data: InsertSmtpSettings) => {
    try {
      const response = await fetch("/api/admin/settings/smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save SMTP settings");
      toast({ title: "SMTP settings saved successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to save SMTP settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleTestImap = async () => {
    setTestingImap(true);
    try {
      const response = await fetch("/api/admin/test/imap", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (!response.ok) throw new Error("IMAP connection failed");
      toast({ title: "IMAP connection successful!" });
    } catch (error) {
      toast({ 
        title: "IMAP test failed",
        description: error instanceof Error ? error.message : "Connection failed",
        variant: "destructive" 
      });
    } finally {
      setTestingImap(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const response = await fetch("/api/admin/test/smtp", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (!response.ok) throw new Error("SMTP connection failed");
      toast({ title: "SMTP connection successful!" });
    } catch (error) {
      toast({ 
        title: "SMTP test failed",
        description: error instanceof Error ? error.message : "Connection failed",
        variant: "destructive" 
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleApproveDomain = async (domainId: string) => {
    try {
      await fetch(`/api/admin/domains/${domainId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setDomains(domains.map(d => d._id === domainId ? { ...d, isVerified: true } : d));
      toast({ title: "Domain approved" });
    } catch {
      toast({ title: "Failed to approve domain", variant: "destructive" });
    }
  };

  const handleRejectDomain = async (domainId: string) => {
    try {
      await fetch(`/api/admin/domains/${domainId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setDomains(domains.filter(d => d._id !== domainId));
      toast({ title: "Domain rejected" });
    } catch {
      toast({ title: "Failed to reject domain", variant: "destructive" });
    }
  };

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ isActive }),
      });
      toast({ title: isActive ? "User enabled" : "User disabled" });
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

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
              <Badge variant="secondary" className="ml-2">Admin</Badge>
            </Link>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-sm text-background/70">
                {user?.username}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-background hover:bg-background/10"
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage system settings, users, domains, and email configurations
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-5 gap-1">
            <TabsTrigger value="settings" data-testid="admin-tab-settings">
              <Settings className="h-4 w-4 mr-2 hidden sm:inline" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">
              <Users className="h-4 w-4 mr-2 hidden sm:inline" />
              Users
            </TabsTrigger>
            <TabsTrigger value="domains" data-testid="admin-tab-domains">
              <Globe className="h-4 w-4 mr-2 hidden sm:inline" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="emails" data-testid="admin-tab-emails">
              <Inbox className="h-4 w-4 mr-2 hidden sm:inline" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="admin-tab-logs">
              <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  IMAP Configuration
                </h3>
                <Form {...imapForm}>
                  <form onSubmit={imapForm.handleSubmit(handleSaveImap)} className="space-y-4">
                    <FormField
                      control={imapForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IMAP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="imap.example.com" data-testid="input-imap-host" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={imapForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="993" 
                              data-testid="input-imap-port"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={imapForm.control}
                      name="user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" data-testid="input-imap-user" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={imapForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showImapPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                data-testid="input-imap-password"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowImapPassword(!showImapPassword)}
                              >
                                {showImapPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={imapForm.control}
                      name="tls"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Use TLS</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" data-testid="button-save-imap">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestImap}
                        disabled={testingImap}
                        data-testid="button-test-imap"
                      >
                        <TestTube className={`h-4 w-4 mr-2 ${testingImap ? "animate-spin" : ""}`} />
                        Test
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  SMTP Configuration
                </h3>
                <Form {...smtpForm}>
                  <form onSubmit={smtpForm.handleSubmit(handleSaveSmtp)} className="space-y-4">
                    <FormField
                      control={smtpForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.example.com" data-testid="input-smtp-host" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="587"
                              data-testid="input-smtp-port"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" data-testid="input-smtp-user" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showSmtpPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                data-testid="input-smtp-password"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                              >
                                {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="secure"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Use Secure Connection</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" data-testid="button-save-smtp">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestSmtp}
                        disabled={testingSmtp}
                        data-testid="button-test-smtp"
                      >
                        <TestTube className={`h-4 w-4 mr-2 ${testingSmtp ? "animate-spin" : ""}`} />
                        Test
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">User Management</h2>
                <p className="text-sm text-muted-foreground">
                  View and manage all registered users
                </p>
              </div>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isVerified ? "default" : "secondary"}>
                            {u.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Send className="h-4 w-4" />
                            </Button>
                            <Switch 
                              checked={u.isVerified}
                              onCheckedChange={(checked) => handleToggleUser(u._id, checked)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Domain Management</h2>
                <p className="text-sm text-muted-foreground">
                  Approve or reject custom domain requests
                </p>
              </div>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No domains found
                      </TableCell>
                    </TableRow>
                  ) : (
                    domains.map((domain) => (
                      <TableRow key={domain._id}>
                        <TableCell className="font-medium">{domain.name}</TableCell>
                        <TableCell>
                          <Badge variant={domain.type === "system" ? "default" : "secondary"}>
                            {domain.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {domain.isVerified ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!domain.isVerified && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleApproveDomain(domain._id)}
                                >
                                  <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleRejectDomain(domain._id)}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Email System</h2>
                <p className="text-sm text-muted-foreground">
                  Monitor email logs and force resync
                </p>
              </div>
              <Button data-testid="button-force-sync">
                <RefreshCw className="h-4 w-4 mr-2" />
                Force IMAP Resync
              </Button>
            </div>

            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Logs</h3>
              <p className="text-muted-foreground">
                Email activity logs will appear here once IMAP is configured
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">System Logs</h2>
                <p className="text-sm text-muted-foreground">
                  View system activity and error logs
                </p>
              </div>
            </div>

            <Card className="overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No logs yet</h3>
                  <p className="text-muted-foreground">
                    System activity logs will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  {logs.map((log) => (
                    <div key={log._id} className="p-4 border-b border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={log.level === "error" ? "destructive" : log.level === "warning" ? "secondary" : "default"}>
                          {log.level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium">{log.action}</p>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
