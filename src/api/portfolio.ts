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

export interface PortfolioScheme {
  id: number;
  order_no: string;
  status: string; // 'ACTIVE' | 'MATURED' | 'REDEEMED'
  scheme: {
    id: number;
    name: string;
  };
  maturity_date: string;
  metrics: PortfolioSchemeMetrics;
  next_payment: PortfolioNextPayment;
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
