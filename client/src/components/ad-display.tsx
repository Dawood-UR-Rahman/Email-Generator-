import { useEffect, useState } from "react";
import type { AdSnippet } from "@shared/schema";

interface AdDisplayProps {
  position: "header" | "sidebar" | "content" | "footer";
  className?: string;
}

export function AdDisplay({ position, className = "" }: AdDisplayProps) {
  const [ads, setAds] = useState<AdSnippet[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch("/api/ads");
        if (response.ok) {
          const data = await response.json();
          setAds(data.filter((ad: AdSnippet) => ad.position === position && ad.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      }
    };
    fetchAds();
  }, [position]);

  if (ads.length === 0) {
    return null;
  }

  return (
    <div className={`ad-container ${className}`} data-testid={`ad-display-${position}`}>
      {ads.map((ad) => (
        <div 
          key={ad._id} 
          className="ad-slot"
          dangerouslySetInnerHTML={{ __html: ad.code }}
        />
      ))}
    </div>
  );
}
