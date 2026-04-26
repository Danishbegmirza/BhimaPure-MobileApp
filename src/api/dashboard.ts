import { authFetch } from './apiClient';

const BASE_URL = 'https://pureapp.bhimajewellery.com/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoldRate {
  unit: string;
  purity: string;
  sale_rate: string;
  as_on_date: string;
}

export interface SchemeType {
  id: number;
  scheme_type_name: string;
  short_description: string;
  highlights: string[];
  duration: string | null;
  banner_image_url: string;
}

export interface MyScheme {
  scheme_name: string;
  amount: string;
  status: string;
  due: {
    label: string;
    date: string;
    status: string; // 'OVERDUE' | 'PAID' | etc.
    text: string;
    is_paid: boolean;
    paid_on: string | null;
  };
}

export interface PaymentHistory {
  installment_amount: string;
  installment_date: string;
  status_message: string;
}

export interface DashboardCustomer {
  name: string;
  mobile: string;
}

// Authenticated response includes customer, myschemes, paymenthistory, totalinstalment
export interface DashboardResponse {
  success: boolean;
  message: string;
  customer?: DashboardCustomer;
  todays_goldrate: GoldRate;
  /** Total paid / investment (API spelling) */
  totalinstalment?: string;
  /** Legacy typo — some responses may still use this; prefer `totalinstalment` */
  totalinstallment?: string;
  /** When set (e.g. "6.8" or "+6.8%"), shown on the investment growth pill */
  investment_growth_percent?: string;
  schemetype: SchemeType[];
  myschemes?: MyScheme[];
  paymenthistory?: PaymentHistory[];
}

/** Resolves total amount from dashboard (checks `totalinstalment` then `totalinstallment`). */
export function getDashboardTotalInstalment(
  d: DashboardResponse | null | undefined,
): string | undefined {
  if (!d) return undefined;
  const raw = d.totalinstalment ?? d.totalinstallment;
  if (raw == null || String(raw).trim() === '') return undefined;
  return String(raw);
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function fetchDashboard(token?: string): Promise<DashboardResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return authFetch<DashboardResponse>(`${BASE_URL}/dashboard`, {
    method: 'GET',
    headers,
  });
}
