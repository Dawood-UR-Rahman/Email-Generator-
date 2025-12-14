import { formatDistanceToNow } from "date-fns";
import { Mail, ArrowLeft, Trash2, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmail } from "@/lib/email-context";
import type { Message } from "@shared/schema";

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Mail className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">No messages yet</h3>
      <p className="text-muted-foreground max-w-sm">
        When you receive emails to your temporary address, they will appear here. 
        Your inbox auto-syncs every 8 seconds.
      </p>
    </div>
  );
}

function MessageRow({ message, onClick }: { message: Message; onClick: () => void }) {
  const timeAgo = formatDistanceToNow(new Date(message.receivedAt), { addSuffix: true });
  
  return (
    <div
      className={`flex items-center gap-4 p-4 border-b border-border cursor-pointer transition-colors hover:bg-primary/5 ${
        !message.isRead ? "bg-primary/5" : ""
      }`}
      onClick={onClick}
      data-testid={`message-row-${message._id}`}
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-primary">
          {(message.fromName || message.from).charAt(0).toUpperCase()}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium truncate ${!message.isRead ? "text-foreground" : "text-muted-foreground"}`}>
            {message.fromName || message.from.split("@")[0]}
          </span>
          {!message.isRead && (
            <Badge variant="default" className="text-xs">New</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{message.subject}</p>
      </div>
      
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {timeAgo}
      </div>
    </div>
  );
}

function MessageView({ message, onBack }: { message: Message; onBack: () => void }) {
  const { deleteMessage } = useEmail();
  const timeAgo = formatDistanceToNow(new Date(message.receivedAt), { addSuffix: true });
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back-to-inbox">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" data-testid="button-favorite-message">
          <Heart className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => { deleteMessage(message._id); onBack(); }}
          data-testid="button-delete-message"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-primary">
              {(message.fromName || message.from).charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="font-semibold">
                {message.fromName || message.from.split("@")[0]}
              </span>
              <Badge variant="secondary" className="text-xs">
                {timeAgo}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{message.from}</p>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mt-4">{message.subject}</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-6">
          {message.htmlBody ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: message.htmlBody }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {message.textBody || "No content"}
            </pre>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function Inbox() {
  const { currentEmail, messages, selectedMessage, selectMessage, isLoading } = useEmail();

  if (!currentEmail) {
    return null;
  }

  return (
    <section className="py-8 md:py-12">
      <div className="w-full">
        <Card className="overflow-hidden min-h-[400px]">
          {selectedMessage ? (
            <MessageView 
              message={selectedMessage} 
              onBack={() => selectMessage(null)} 
            />
          ) : (
            <>
              <div className="p-4 border-b border-border bg-muted/30">
                <h2 className="font-semibold">Inbox</h2>
                <p className="text-sm text-muted-foreground">{messages.length} messages</p>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : messages.length === 0 ? (
                <EmptyInbox />
              ) : (
                <ScrollArea className="h-[400px]">
                  {messages.map((message) => (
                    <MessageRow
                      key={message._id}
                      message={message}
                      onClick={() => selectMessage(message)}
                    />
                  ))}
                </ScrollArea>
              )}
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
