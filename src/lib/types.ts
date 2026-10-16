export type Plan = 'STARTER' | 'PRO' | 'ENTERPRISE';
export type BotStatus = 'disconnected' | 'connected' | 'qr_ready';
export type Platform = 'whatsapp' | 'telegram';
export type MessageStatus = 'success' | 'failed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: Plan;
  bot_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface Bot {
  id: string;
  user_id: string;
  platform: Platform;
  bot_name: string;
  status: BotStatus;
  api_token: string | null;
  webhook_url: string | null;
  qr_code: string | null;
  created_at: string;
}

export interface MessageLog {
  id: string;
  bot_id: string;
  sender: string | null;
  message_text: string | null;
  ai_response: string | null;
  request_timestamp: string;
  response_timestamp: string | null;
  status: MessageStatus;
}

export const PLAN_LIMITS: Record<Plan, number> = {
  STARTER: 1,
  PRO: 5,
  ENTERPRISE: 999,
};

export const PLAN_PRICES: Record<Plan, { monthly: number; yearly: number }> = {
  STARTER: { monthly: 0, yearly: 0 },
  PRO: { monthly: 49, yearly: 470 },
  ENTERPRISE: { monthly: 199, yearly: 1908 },
};

export const STRIPE_PRICE_IDS: Record<Plan, string | null> = {
  STARTER: null,
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? 'price_pro_monthly',
  ENTERPRISE:
    process.env.STRIPE_ENTERPRISE_PRICE_ID ?? 'price_enterprise_monthly',
};
