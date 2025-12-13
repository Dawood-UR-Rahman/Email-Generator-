import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Mail, Settings, Users, Globe, Inbox, FileText, 
  Save, TestTube, Check, X, Send, Trash2, RefreshCw,
  LogOut, AlertCircle, CheckCircle, Eye, EyeOff,
  Plus, Star, Edit, BookOpen, Layout, Megaphone
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
  FormDescription,
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
  DialogFooter,
  DialogClose,
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
import { 
  imapSettingsSchema, smtpSettingsSchema, insertDomainSchema, 
  insertBlogPostSchema, insertPageContentSchema, insertAdSnippetSchema, appSettingsSchema,
  type InsertImapSettings, type InsertSmtpSettings, type InsertDomain,
  type InsertBlogPost, type InsertPageContent, type InsertAdSnippet, type InsertAppSettings,
  type User, type Domain, type Log, type BlogPost, type PageContent, type AdSnippet, type AppSettings
} from "@shared/schema";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [ads, setAds] = useState<AdSnippet[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingImap, setTestingImap] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showAddDomainDialog, setShowAddDomainDialog] = useState(false);
  const [showBlogDialog, setShowBlogDialog] = useState(false);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [editingAd, setEditingAd] = useState<AdSnippet | null>(null);

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

  const domainForm = useForm<InsertDomain>({
    resolver: zodResolver(insertDomainSchema),
    defaultValues: {
      name: "",
    },
  });

  const blogForm = useForm<InsertBlogPost>({
    resolver: zodResolver(insertBlogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      isPublished: false,
    },
  });

  const pageForm = useForm<InsertPageContent>({
    resolver: zodResolver(insertPageContentSchema),
    defaultValues: {
      slug: "",
      title: "",
      content: "",
    },
  });

  const adForm = useForm<InsertAdSnippet>({
    resolver: zodResolver(insertAdSnippetSchema),
    defaultValues: {
      name: "",
      position: "content",
      code: "",
      isActive: true,
    },
  });

  const settingsForm = useForm<InsertAppSettings>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      defaultRetentionDays: 5,
      emailSyncIntervalSeconds: 10,
      soundNotificationsEnabled: true,
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setLocation("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, isAdmin, setLocation]);

  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    const headers = { "Authorization": `Bearer ${token}` };
    
    try {
      const [domainsRes, blogRes, pagesRes, adsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/domains", { headers }),
        fetch("/api/admin/blog", { headers }),
        fetch("/api/admin/pages", { headers }),
        fetch("/api/admin/ads", { headers }),
        fetch("/api/admin/settings", { headers }),
      ]);
      
      if (domainsRes.ok) {
        const data = await domainsRes.json();
        setDomains(data);
      }
      if (blogRes.ok) {
        const data = await blogRes.json();
        setBlogPosts(data);
      }
      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setPages(data);
      }
      if (adsRes.ok) {
        const data = await adsRes.json();
        setAds(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAppSettings(data);
        settingsForm.reset({
          defaultRetentionDays: data.defaultRetentionDays || 5,
          emailSyncIntervalSeconds: data.emailSyncIntervalSeconds || 10,
          soundNotificationsEnabled: data.soundNotificationsEnabled ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

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

  const handleSaveAppSettings = async (data: InsertAppSettings) => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save app settings");
      toast({ title: "App settings saved successfully" });
      fetchData();
    } catch (error) {
      toast({ 
        title: "Failed to save app settings",
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

  const handleAddDomain = async (data: InsertDomain) => {
    try {
      const response = await fetch("/api/admin/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add domain");
      toast({ title: "Domain added successfully" });
      setShowAddDomainDialog(false);
      domainForm.reset();
      fetchData();
    } catch (error) {
      toast({ 
        title: "Failed to add domain",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await fetch(`/api/admin/domains/${domainId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setDomains(domains.filter(d => d._id !== domainId));
      toast({ title: "Domain deleted" });
    } catch {
      toast({ title: "Failed to delete domain", variant: "destructive" });
    }
  };

  const handleSetDefaultDomain = async (domainId: string) => {
    try {
      await fetch(`/api/admin/domains/${domainId}/default`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setDomains(domains.map(d => ({ ...d, isDefault: d._id === domainId })));
      toast({ title: "Default domain updated" });
    } catch {
      toast({ title: "Failed to set default domain", variant: "destructive" });
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

  const handleSaveBlog = async (data: InsertBlogPost) => {
    try {
      const url = editingBlog ? `/api/admin/blog/${editingBlog._id}` : "/api/admin/blog";
      const method = editingBlog ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save blog post");
      toast({ title: editingBlog ? "Blog post updated" : "Blog post created" });
      setShowBlogDialog(false);
      setEditingBlog(null);
      blogForm.reset();
      fetchData();
    } catch (error) {
      toast({ 
        title: "Failed to save blog post",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      await fetch(`/api/admin/blog/${blogId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setBlogPosts(blogPosts.filter(b => b._id !== blogId));
      toast({ title: "Blog post deleted" });
    } catch {
      toast({ title: "Failed to delete blog post", variant: "destructive" });
    }
  };

  const handleSavePage = async (data: InsertPageContent) => {
    try {
      const slug = editingPage?.slug || data.slug;
      const response = await fetch(`/api/admin/pages/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save page");
      toast({ title: "Page content updated" });
      setShowPageDialog(false);
      setEditingPage(null);
      pageForm.reset();
      fetchData();
    } catch (error) {
      toast({ 
        title: "Failed to save page",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleSaveAd = async (data: InsertAdSnippet) => {
    try {
      const url = editingAd ? `/api/admin/ads/${editingAd._id}` : "/api/admin/ads";
      const method = editingAd ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save ad");
      toast({ title: editingAd ? "Ad updated" : "Ad created" });
      setShowAdDialog(false);
      setEditingAd(null);
      adForm.reset();
      fetchData();
    } catch (error) {
      toast({ 
        title: "Failed to save ad",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await fetch(`/api/admin/ads/${adId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
      setAds(ads.filter(a => a._id !== adId));
      toast({ title: "Ad deleted" });
    } catch {
      toast({ title: "Failed to delete ad", variant: "destructive" });
    }
  };

  const openEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog);
    blogForm.reset({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      isPublished: blog.isPublished,
    });
    setShowBlogDialog(true);
  };

  const openEditPage = (page: PageContent) => {
    setEditingPage(page);
    pageForm.reset({
      slug: page.slug,
      title: page.title,
      content: page.content,
    });
    setShowPageDialog(true);
  };

  const openEditAd = (ad: AdSnippet) => {
    setEditingAd(ad);
    adForm.reset({
      name: ad.name,
      position: ad.position,
      code: ad.code,
      isActive: ad.isActive,
    });
    setShowAdDialog(true);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
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
                className="text-background"
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
            Manage system settings, users, domains, content, and ads
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
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
            <TabsTrigger value="blog" data-testid="admin-tab-blog">
              <BookOpen className="h-4 w-4 mr-2 hidden sm:inline" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="pages" data-testid="admin-tab-pages">
              <Layout className="h-4 w-4 mr-2 hidden sm:inline" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="ads" data-testid="admin-tab-ads">
              <Megaphone className="h-4 w-4 mr-2 hidden sm:inline" />
              Ads
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
                  <Settings className="h-5 w-5" />
                  App Settings
                </h3>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(handleSaveAppSettings)} className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="defaultRetentionDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Retention (Days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              max={30}
                              data-testid="input-retention-days"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>How long to keep temporary emails (1-30 days)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="emailSyncIntervalSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Sync Interval (Seconds)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={5}
                              max={60}
                              data-testid="input-sync-interval"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>How often to check for new emails (5-60 seconds)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="soundNotificationsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Sound Notifications</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" data-testid="button-save-app-settings">
                      <Save className="h-4 w-4 mr-2" />
                      Save App Settings
                    </Button>
                  </form>
                </Form>
              </Card>

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
                                placeholder="Password"
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
                                placeholder="Password"
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
            <div className="flex items-center justify-between gap-4">
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">Domain Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage email domains for temporary addresses
                </p>
              </div>
              <Dialog open={showAddDomainDialog} onOpenChange={setShowAddDomainDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-domain">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Domain</DialogTitle>
                  </DialogHeader>
                  <Form {...domainForm}>
                    <form onSubmit={domainForm.handleSubmit(handleAddDomain)} className="space-y-4">
                      <FormField
                        control={domainForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain Name</FormLabel>
                            <FormControl>
                              <Input placeholder="example.com" data-testid="input-domain-name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" data-testid="button-submit-domain">Add Domain</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
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
                      <TableRow key={domain._id} data-testid={`row-domain-${domain._id}`}>
                        <TableCell className="font-medium">{domain.name}</TableCell>
                        <TableCell>
                          <Badge variant={domain.type === "system" ? "default" : "secondary"}>
                            {domain.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {domain.isVerified ? (
                            <Badge className="bg-green-500 dark:bg-green-600">
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
                          {domain.isDefault && (
                            <Badge className="bg-yellow-500 dark:bg-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!domain.isVerified && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleApproveDomain(domain._id)}
                                data-testid={`button-approve-domain-${domain._id}`}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            {!domain.isDefault && (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleSetDefaultDomain(domain._id)}
                                data-testid={`button-set-default-${domain._id}`}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleDeleteDomain(domain._id)}
                              data-testid={`button-delete-domain-${domain._id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

          <TabsContent value="blog" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">Blog Management</h2>
                <p className="text-sm text-muted-foreground">
                  Create and manage blog posts
                </p>
              </div>
              <Dialog open={showBlogDialog} onOpenChange={(open) => {
                setShowBlogDialog(open);
                if (!open) {
                  setEditingBlog(null);
                  blogForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-blog">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingBlog ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
                  </DialogHeader>
                  <Form {...blogForm}>
                    <form onSubmit={blogForm.handleSubmit(handleSaveBlog)} className="space-y-4">
                      <FormField
                        control={blogForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Post title" data-testid="input-blog-title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="post-url-slug" data-testid="input-blog-slug" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Excerpt</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description" data-testid="input-blog-excerpt" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write your post content..." 
                                className="min-h-[200px]"
                                data-testid="input-blog-content"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Published</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" data-testid="button-submit-blog">
                          {editingBlog ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No blog posts yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    blogPosts.map((post) => (
                      <TableRow key={post._id} data-testid={`row-blog-${post._id}`}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="text-muted-foreground">{post.slug}</TableCell>
                        <TableCell>
                          <Badge variant={post.isPublished ? "default" : "secondary"}>
                            {post.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => openEditBlog(post)}
                              data-testid={`button-edit-blog-${post._id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleDeleteBlog(post._id)}
                              data-testid={`button-delete-blog-${post._id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

          <TabsContent value="pages" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">Page Content</h2>
                <p className="text-sm text-muted-foreground">
                  Edit content for static pages
                </p>
              </div>
            </div>

            <Dialog open={showPageDialog} onOpenChange={(open) => {
              setShowPageDialog(open);
              if (!open) {
                setEditingPage(null);
                pageForm.reset();
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Page Content</DialogTitle>
                </DialogHeader>
                <Form {...pageForm}>
                  <form onSubmit={pageForm.handleSubmit(handleSavePage)} className="space-y-4">
                    <FormField
                      control={pageForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Page title" data-testid="input-page-title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pageForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content (HTML)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Page content..." 
                              className="min-h-[300px] font-mono text-sm"
                              data-testid="input-page-content"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" data-testid="button-submit-page">Save</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2">
              {["privacy", "terms", "contact", "homepage"].map((slug) => {
                const page = pages.find(p => p.slug === slug);
                return (
                  <Card key={slug} className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="font-semibold capitalize">{slug.replace("-", " ")}</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (page) {
                            openEditPage(page);
                          } else {
                            pageForm.reset({ slug, title: slug.charAt(0).toUpperCase() + slug.slice(1), content: "" });
                            setShowPageDialog(true);
                          }
                        }}
                        data-testid={`button-edit-page-${slug}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {page ? `Last updated: ${new Date(page.updatedAt).toLocaleDateString()}` : "Not configured yet"}
                    </p>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">Ad Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage advertisement code snippets
                </p>
              </div>
              <Dialog open={showAdDialog} onOpenChange={(open) => {
                setShowAdDialog(open);
                if (!open) {
                  setEditingAd(null);
                  adForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-ad">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ad
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingAd ? "Edit Ad" : "Create Ad"}</DialogTitle>
                  </DialogHeader>
                  <Form {...adForm}>
                    <form onSubmit={adForm.handleSubmit(handleSaveAd)} className="space-y-4">
                      <FormField
                        control={adForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Ad name" data-testid="input-ad-name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-ad-position">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                                <SelectItem value="content">Content</SelectItem>
                                <SelectItem value="footer">Footer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Code (HTML/Script)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Paste your ad code here..." 
                                className="min-h-[150px] font-mono text-sm"
                                data-testid="input-ad-code"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Active</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" data-testid="button-submit-ad">
                          {editingAd ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No ads configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    ads.map((ad) => (
                      <TableRow key={ad._id} data-testid={`row-ad-${ad._id}`}>
                        <TableCell className="font-medium">{ad.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ad.position}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ad.isActive ? "default" : "secondary"}>
                            {ad.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => openEditAd(ad)}
                              data-testid={`button-edit-ad-${ad._id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleDeleteAd(ad._id)}
                              data-testid={`button-delete-ad-${ad._id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

          <TabsContent value="logs" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
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
