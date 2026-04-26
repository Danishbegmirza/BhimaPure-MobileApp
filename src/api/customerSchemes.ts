import { authFetch } from './apiClient';

const BASE_URL = 'https://pureapp.bhimajewellery.com/api';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ─── Scheme enrollment ───────────────────────────────────────────────────────

export interface InitiateSchemeResponse {
  success: boolean;
  message: string;
  customerSchemeId?: number;
  status?: string;
}

export async function initiateSchemeEnrollment(
  token: string,
  schemeId: number,
): Promise<InitiateSchemeResponse> {
  return authFetch<InitiateSchemeResponse>(`${BASE_URL}/customer-schemes/initiate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ schemeId }),
  });
}

export interface UpdateEnrollmentPayload {
  nomineeName: string;
  nomineeRelationship: string;
  salesPersonName?: string;
}

export interface UpdateEnrollmentResponse {
  success: boolean;
  message: string;
}

export async function updateEnrollmentDetails(
  token: string,
  customerSchemeId: number,
  payload: UpdateEnrollmentPayload,
): Promise<UpdateEnrollmentResponse> {
  return authFetch<UpdateEnrollmentResponse>(
    `${BASE_URL}/customer-schemes/${customerSchemeId}`,
    {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

// ─── Payment order (POST same path as enrollment update) ─────────────────────

export type PaymentContext = 'SCHEME_REGISTRATION' | 'INSTALLMENT_PAYMENT';

export interface CreatePaymentOrderBody {
  customerSchemeId: number;
  amount: number;
  paymentContext: PaymentContext;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) { return v; }
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  if (typeof v === 'number' && !Number.isNaN(v)) { return v; }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) { return n; }
  }
  return undefined;
}

function pickOrderId(obj: Record<string, unknown>): string | number | undefined {
  const direct = obj.order_id;
  if (typeof direct === 'string' && direct.trim() !== '') { return direct; }
  if (typeof direct === 'number' && !Number.isNaN(direct)) { return direct; }
  return undefined;
}

/** Normalizes API quirks such as keys with surrounding spaces. */
export function normalizePaymentOrderResponse(raw: Record<string, unknown>): {
  success: boolean;
  message?: string;
  error?: string;
  order_id?: string | number;
  amount?: number;
  razorpayKey?: string;
  currency?: string;
} {
  return {
    success: Boolean(raw.success),
    message: typeof raw.message === 'string' ? raw.message : undefined,
    error: typeof raw.error === 'string' ? raw.error : undefined,
    order_id: pickOrderId(raw),
    amount: pickNum(raw, 'amount'),
    razorpayKey: pickStr(raw, ['key', ' key ', 'razorpay_key']),
    currency: pickStr(raw, ['currency', ' currency ']),
  };
}

export async function createSchemePaymentOrder(
  token: string,
  customerSchemeId: number,
  body: CreatePaymentOrderBody,
): Promise<Record<string, unknown>> {
  void customerSchemeId;
  return authFetch<Record<string, unknown>>(
    `${BASE_URL}/payment/order`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    },
  );
}

// ─── Verify payment ───────────────────────────────────────────────────────────

export interface VerifyPaymentPayload {
  razorpay_payment_id: string | number;
  razorpay_order_id: string | number;
  razorpay_signature: string;
  amount: number;
}

export interface VerifyPaymentResponse {
  success?: boolean;
  status?: boolean;
  message?: string;
}

export async function verifyRazorpayPayment(
  token: string,
  payload: VerifyPaymentPayload,
): Promise<VerifyPaymentResponse> {
  return authFetch<VerifyPaymentResponse>(`${BASE_URL}/payment/verify`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

// ─── Redemption mode ──────────────────────────────────────────────────────────

export interface RedemptionStatusPayload {
  customerCode: number | string;
  customerschemeId: number;
  redumption_mode: 'jwellery' | 'shop online';
  showroom: string;
}

export interface RedemptionStatusResponse {
  status: boolean;
  message: string;
  data?: {
    customerschemeId?: string;
    redumption_mode?: string;
  };
}

export async function postRedemptionStatus(
  token: string,
  payload: RedemptionStatusPayload,
): Promise<RedemptionStatusResponse> {
  return authFetch<RedemptionStatusResponse>(`${BASE_URL}/redumption/status`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
