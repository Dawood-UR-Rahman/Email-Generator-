import { Mail, MessageSquare, Users, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEmail } from "@/lib/email-context";

const stats = [
  {
    icon: Mail,
    getValue: (s: { emailsCreated: number; messagesReceived: number }) => s.emailsCreated.toLocaleString(),
    label: "Emails Created",
  },
  {
    icon: MessageSquare,
    getValue: (s: { emailsCreated: number; messagesReceived: number }) => s.messagesReceived.toLocaleString(),
    label: "Messages Received",
  },
  {
    icon: Users,
    getValue: () => "10K+",
    label: "Active Users",
  },
  {
    icon: Globe,
    getValue: () => "99.9%",
    label: "Uptime",
  },
];

export function StatsSection() {
  const { stats: emailStats } = useEmail();

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-1" data-testid={`stat-value-${index}`}>
                {stat.getValue(emailStats)}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
