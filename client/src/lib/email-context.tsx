import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import type { Message, Domain } from "@shared/schema";

interface EmailContextType {
  currentEmail: string | null;
  currentDomain: string;
  domains: Domain[];
  messages: Message[];
  isLoading: boolean;
  isSyncing: boolean;
  syncProgress: number;
  generateEmail: (domain?: string, customName?: string) => void;
  copyEmail: () => Promise<boolean>;
  deleteInbox: () => void;
  changeDomain: (domain: string) => void;
  refreshInbox: () => Promise<void>;
  selectMessage: (message: Message | null) => void;
  selectedMessage: Message | null;
  deleteMessage: (messageId: string) => Promise<void>;
  stats: { emailsCreated: number; messagesReceived: number };
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

const DEFAULT_DOMAINS = ["tempmail.io", "quickmail.dev", "disposable.cc"];

function generateRandomString(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    console.log("Could not play notification sound");
  }
}

export function EmailProvider({ children }: { children: ReactNode }) {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>(DEFAULT_DOMAINS[0]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [stats, setStats] = useState({ emailsCreated: 0, messagesReceived: 0 });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("soundEnabled");
    return stored !== "false";
  });
  const previousMessageCount = useRef(0);
  const hasInitialized = useRef(false);

  const loadFromStorage = useCallback(() => {
    const storedEmail = localStorage.getItem("tempEmail");
    const storedDomain = localStorage.getItem("tempDomain");
    const storedMessages = localStorage.getItem("tempMessages");
    
    if (storedEmail) {
      setCurrentEmail(storedEmail);
    }
    if (storedDomain) {
      setCurrentDomain(storedDomain);
    }
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
        previousMessageCount.current = parsed.length;
      } catch {
        setMessages([]);
      }
    }
    setIsLoading(false);
  }, []);

  const fetchDomains = useCallback(async () => {
    try {
      const response = await fetch("/api/domains");
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
        const defaultDomain = data.find((d: Domain) => d.isDefault);
        if (defaultDomain && !localStorage.getItem("tempDomain")) {
          setCurrentDomain(defaultDomain.name);
        }
        return data;
      }
    } catch {
      const fallbackDomains = DEFAULT_DOMAINS.map((name, i) => ({
        _id: String(i),
        name,
        type: "system" as const,
        isVerified: true,
        isActive: true,
        isDefault: i === 0,
        retentionDays: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setDomains(fallbackDomains);
      return fallbackDomains;
    }
    return [];
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      setStats({ emailsCreated: 12458, messagesReceived: 45872 });
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
    fetchDomains();
    fetchStats();
  }, [loadFromStorage, fetchDomains, fetchStats]);

  const refreshInbox = useCallback(async () => {
    if (!currentEmail) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => Math.min(prev + 12.5, 100));
    }, 1000);

    try {
      const response = await fetch(`/api/messages?email=${encodeURIComponent(currentEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > previousMessageCount.current && soundEnabled && hasInitialized.current) {
          playNotificationSound();
        }
        previousMessageCount.current = data.length;
        setMessages(data);
        localStorage.setItem("tempMessages", JSON.stringify(data));
      }
    } catch {
      console.log("Failed to sync inbox");
    } finally {
      clearInterval(progressInterval);
      setSyncProgress(100);
      setTimeout(() => {
        setIsSyncing(false);
        setSyncProgress(0);
      }, 300);
    }
  }, [currentEmail, soundEnabled]);

  useEffect(() => {
    if (!currentEmail) return;

    const interval = setInterval(() => {
      refreshInbox();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentEmail, refreshInbox]);

  useEffect(() => {
    if (!isLoading && !hasInitialized.current && domains.length > 0) {
      hasInitialized.current = true;
      const storedEmail = localStorage.getItem("tempEmail");
      if (!storedEmail) {
        const defaultDomain = domains.find(d => d.isDefault) || domains[0];
        if (defaultDomain) {
          const username = generateRandomString(10);
          const email = `${username}@${defaultDomain.name}`;
          setCurrentEmail(email);
          setCurrentDomain(defaultDomain.name);
          localStorage.setItem("tempEmail", email);
          localStorage.setItem("tempDomain", defaultDomain.name);
          localStorage.setItem("tempMessages", "[]");
          fetch("/api/mailbox/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, domain: defaultDomain.name }),
          }).catch(() => {});
        }
      }
    }
  }, [isLoading, domains]);

  useEffect(() => {
    localStorage.setItem("soundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  const generateEmail = useCallback((domain?: string, customName?: string) => {
    const selectedDomain = domain || currentDomain;
    const username = customName || generateRandomString(10);
    const email = `${username}@${selectedDomain}`;
    
    setCurrentEmail(email);
    setCurrentDomain(selectedDomain);
    setMessages([]);
    setSelectedMessage(null);
    previousMessageCount.current = 0;
    
    localStorage.setItem("tempEmail", email);
    localStorage.setItem("tempDomain", selectedDomain);
    localStorage.setItem("tempMessages", "[]");

    fetch("/api/mailbox/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, domain: selectedDomain }),
    }).catch(() => {});

    setStats((prev) => ({ ...prev, emailsCreated: prev.emailsCreated + 1 }));
  }, [currentDomain]);

  const copyEmail = useCallback(async (): Promise<boolean> => {
    if (!currentEmail) return false;
    try {
      await navigator.clipboard.writeText(currentEmail);
      return true;
    } catch {
      return false;
    }
  }, [currentEmail]);

  const deleteInbox = useCallback(() => {
    if (currentEmail) {
      fetch("/api/mailbox/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail }),
      }).catch(() => {});
    }
    
    setCurrentEmail(null);
    setMessages([]);
    setSelectedMessage(null);
    localStorage.removeItem("tempEmail");
    localStorage.removeItem("tempMessages");
  }, [currentEmail]);

  const changeDomain = useCallback((domain: string) => {
    setCurrentDomain(domain);
    localStorage.setItem("tempDomain", domain);
    generateEmail(domain);
  }, [generateEmail]);

  const selectMessage = useCallback((message: Message | null) => {
    setSelectedMessage(message);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
    } catch {
      console.log("Failed to delete message");
    }
  }, [selectedMessage]);

  return (
    <EmailContext.Provider
      value={{
        currentEmail,
        currentDomain,
        domains,
        messages,
        isLoading,
        isSyncing,
        syncProgress,
        generateEmail,
        copyEmail,
        deleteInbox,
        changeDomain,
        refreshInbox,
        selectMessage,
        selectedMessage,
        deleteMessage,
        stats,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error("useEmail must be used within an EmailProvider");
  }
  return context;
}
