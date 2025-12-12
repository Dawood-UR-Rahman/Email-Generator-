import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is a temporary email address?",
    answer: "A temporary email address (also called disposable email, throwaway email) is a free inbox created instantly. Use it for sign-ups, verifications, or anywhere you need to provide an email without revealing your real address, perfect for avoiding spam or testing new websites safely.",
  },
  {
    question: "Why should I use a disposable email?",
    answer: "Disposable emails protect your main inbox from spam, newsletters, and promotional emails. They're perfect for one-time registrations, downloading content, or accessing services that require email verification without compromising your privacy.",
  },
  {
    question: "How long does a temporary email last?",
    answer: "Your temporary email address lasts for 5 days after creation. All messages are automatically deleted after this period. You can delete your inbox manually anytime, or create a new one whenever you need.",
  },
  {
    question: "Can I use a temporary email address for attachments?",
    answer: "Yes! Our service supports receiving emails with attachments. You can view and download any files sent to your temporary inbox, including images, documents, and other file types.",
  },
  {
    question: "Do I need to register to use it?",
    answer: "No registration required! Simply visit our site, and you'll get a temporary email address instantly. If you want additional features like custom domains or saved emails, you can create a free account.",
  },
  {
    question: "Can I send emails from my temporary inbox?",
    answer: "Currently, our service is designed for receiving emails only. This is to prevent misuse of the service. You can receive any emails sent to your temporary address and view them in your inbox.",
  },
  {
    question: "Are my emails secure and private?",
    answer: "Yes, your privacy is our priority. We don't share your data with third parties, and all emails are automatically deleted after 5 days. We use secure connections to protect your data in transit.",
  },
  {
    question: "Can I use temp mail for account verification?",
    answer: "Absolutely! Temporary emails are perfect for account verification. Simply use your generated address to sign up for services, receive the verification email, and confirm your account.",
  },
  {
    question: "Is the service really free?",
    answer: "Yes, our basic service is completely free with no hidden costs. You can generate unlimited temporary email addresses and receive unlimited emails. Premium features like custom domains are available for registered users.",
  },
];

export function FAQSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our temporary email service and how to use it effectively
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger 
                className="text-left text-lg font-semibold py-4"
                data-testid={`faq-trigger-${index}`}
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
