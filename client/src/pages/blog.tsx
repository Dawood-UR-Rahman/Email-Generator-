import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AdDisplay } from "@/components/ad-display";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/blog");
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

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

          <AdDisplay position="content" className="mb-8" />

          <div className="flex gap-8">
            <AdDisplay position="sidebar" className="hidden lg:block w-[160px] flex-shrink-0" />

            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {posts.map((post) => (
                    <Link key={post._id} href={`/blog/${post.slug}`}>
                      <Card 
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
                        data-testid={`blog-card-${post._id}`}
                      >
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-6xl font-bold text-primary/20">
                            {post.title.charAt(0)}
                          </span>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary">Blog</Badge>
                          </div>
                          <h2 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <AdDisplay position="sidebar" className="hidden lg:block w-[160px] flex-shrink-0" />
          </div>

          <AdDisplay position="content" className="mt-8" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
