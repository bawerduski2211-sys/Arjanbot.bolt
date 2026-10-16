'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I deploy a WhatsApp bot on ARJAN?',
    answer:
      'Create a bot from your dashboard, select WhatsApp as the platform, and enter your API token. ARJAN inserts a bot record with a "qr_ready" status, and an external worker service generates a QR code that appears in your dashboard in real time. Scan it with your WhatsApp phone to link the account — no code required on your end.',
  },
  {
    question: 'Is my API token stored securely?',
    answer:
      'Yes. ARJAN stores only the encrypted ciphertext of your API token. The encryption happens in the application layer before anything is written to the database, so the database never sees plaintext tokens. The plaintext is decrypted only in the isolated worker service at runtime.',
  },
  {
    question: 'What is the difference between the Starter, Pro, and Enterprise plans?',
    answer:
      'Starter (free) includes 1 bot and standard message logging. Pro ($49/mo) includes up to 5 bots, AI-powered responses, and 90-day message retention. Enterprise ($199/mo) includes unlimited bots, priority processing, and dedicated support. You can upgrade or cancel anytime through the Stripe Customer Portal.',
  },
  {
    question: 'How does the AI response pipeline work?',
    answer:
      'When an incoming message arrives at a connected bot, the worker service forwards it to an AI model for processing. The AI-generated reply is sent back to the user and logged in the messages_log table with both the request and response timestamps. Your dashboard shows average latency and success rates in real time.',
  },
  {
    question: 'What happens to my old message logs?',
    answer:
      'Message logs older than 90 days are automatically deleted by a scheduled pg_cron job that runs daily at 03:00 UTC. This keeps your dashboard fast and your data footprint lean. You can export logs before they expire if you need long-term records.',
  },
  {
    question: 'Can I use both WhatsApp and Telegram bots on the same account?',
    answer:
      'Absolutely. ARJAN supports both platforms natively. You can mix and match WhatsApp and Telegram bots within the same account, up to your plan\'s bot limit. Each bot is managed independently with its own status, webhook URL, and message logs.',
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={cn(
                'glass overflow-hidden rounded-xl transition-colors',
                isOpen ? 'border-primary/20' : 'hover:border-white/15'
              )}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-base font-semibold">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180 text-primary'
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  isOpen
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
