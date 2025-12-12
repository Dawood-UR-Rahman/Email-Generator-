import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const blogPosts = [
  {
    id: 1,
    title: "Best Temporary Email Services for Ultimate Online Privacy in 2025",
    excerpt: "Explore the top temporary email services for ultimate online privacy in 2025. Compare features, security, and usability to choose the right temp email provider for protecting your identity online.",
    category: "Privacy",
    date: "Jan 5, 2025",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Best Free Temporary Email Services Compared [2025 Expert Guide]",
    excerpt: "Discover the best free temporary email services in 2025. Compare features, security, and usability to choose the right temp email provider for your privacy needs.",
    category: "Guide",
    date: "Jan 3, 2025",
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "Temp Mail in 2025: The Ultimate Guide to Disposable Email and Online Privacy",
    excerpt: "Explore Temp Mail in 2025 with this guide to disposable email and online privacy. Learn how to create, benefits, security tips, and the future of anonymous email.",
    category: "Tutorial",
    date: "Dec 28, 2024",
    readTime: "10 min read",
  },
  {
    id: 4,
    title: "How to Protect Your Email Privacy When Signing Up for Services",
    excerpt: "Learn essential strategies for protecting your email privacy when signing up for online services. From temporary emails to privacy-focused providers.",
    category: "Privacy",
    date: "Dec 20, 2024",
    readTime: "6 min read",
  },
  {
    id: 5,
    title: "Understanding Email Tracking and How to Avoid It",
    excerpt: "Discover how companies track your email activity and learn practical steps to protect your privacy from email trackers and analytics.",
    category: "Security",
    date: "Dec 15, 2024",
    readTime: "7 min read",
  },
  {
    id: 6,
    title: "The Complete Guide to Setting Up Custom Domains for Temp Mail",
    excerpt: "Step-by-step guide to configuring your own custom domain for temporary email addresses. DNS settings, verification, and best practices included.",
    category: "Tutorial",
    date: "Dec 10, 2024",
    readTime: "12 min read",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tips, guides, and insights about online privacy, temporary emails, and protecting your digital identity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
                  data-testid={`blog-card-${post.id}`}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-6xl font-bold text-primary/20">
                      {post.category.charAt(0)}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {post.date}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
