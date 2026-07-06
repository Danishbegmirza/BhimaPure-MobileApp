import { authFetch } from './apiClient';

const BASE_URL = 'http://bhimaadmin.smacononline.com/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioSchemeMetrics {
  total_invested: number;
  eligible_value: number;
  maturity_amount: number;
  bonus_percent: number;
  bonus_amount: number;
  progress_percent: number;
}

export interface PortfolioNextPayment {
  due_date: string;
  days_to_due: number | null;
  label: string;
  status: string; // 'OVERDUE' | 'PAID' | etc.
  is_paid: boolean;
  paid_on: string | null;
}

export interface PortfolioSchemeInfo {
  id: number;
  name: string;
  min_amount?: string | null;
  max_amount?: string | null;
  multiple_of?: number | null;
}

export interface PortfolioScheme {
  id: number;
  order_no: string;
  status: string; // 'ACTIVE' | 'MATURED' | 'REDEEMED'
  scheme_amount?: number | null;
  variable_installment_allow?: boolean;
  scheme: PortfolioSchemeInfo;
  join_date?: string | null;
  maturity_date: string;
  nominee_name?: string | null;
  nominee_relation?: string | null;
  metrics: PortfolioSchemeMetrics;
  next_payment: PortfolioNextPayment;
  payment_history?: Array<{
    installment_amount: string;
    installment_date: string;
    status_message: string;
    transaction_id: string | null;
    source: string;
  }>;
}

export interface PortfolioCounts {
  all: number;
  active: number;
  matured: number;
  redeemed: number;
}

export interface PortfolioResponse {
  success: boolean;
  message: string;
  totalInvested: string;
  bonusearned: string;
  counts: PortfolioCounts;
  all: PortfolioScheme[];
  active: PortfolioScheme[];
  matured: PortfolioScheme[];
  redeemed: PortfolioScheme[];
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function fetchMyPortfolio(token: string): Promise<PortfolioResponse> {
  return authFetch<PortfolioResponse>(`${BASE_URL}/myportfolio`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}
