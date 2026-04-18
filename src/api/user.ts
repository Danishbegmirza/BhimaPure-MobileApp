import { authFetch } from './apiClient';

const BASE_URL = 'http://bhimaadmin.smacononline.com/api';

// ─── Shared header helpers ────────────────────────────────────────────────────

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ─── Scheme popup details (/api/myportfolio/:id/details) ─────────────────────

export interface SchemeTimelineEntry {
  month: string;
  status: string; // 'PAID' | 'PENDING' | ...
}

export interface SchemePopupDetail {
  id: number;
  name: string;
  bonus_value: string;
  paid_count: number;
  total_installments: number;
  timeline: SchemeTimelineEntry[];
}

export interface SchemeNextPayment {
  due_date: string;
  label: string;
  days: number;
  status: string;
}

export interface SchemePopupMetrics {
  total_paid: number;
  eligible_value: number;
  maturity_amount: number;
}

export interface SchemePopupResponse {
  success: boolean;
  scheme: SchemePopupDetail;
  next_payment: SchemeNextPayment;
  metrics: SchemePopupMetrics;
}

export async function fetchSchemePopupDetails(
  token: string,
  id: number,
): Promise<SchemePopupResponse> {
  return authFetch<SchemePopupResponse>(`${BASE_URL}/myportfolio/${id}/details`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

// ─── Profile (/api/profile) ───────────────────────────────────────────────────

export interface CustomerProfile {
  customer_id: number;
  customer_code: string;
  name: string;
  mobile: string;
  email: string;
  personal_details: {
    dob: string;
    wedding_anniversary: string;
  };
  contact_information: {
    mobile_number: string;
    email_address: string;
    address: string;
    address1?: string | null;
    address2?: string | null;
    area?: string | null;
    city?: string | null;
    pin_code?: string | null;
    pincode?: string | null;
    state?: string | null;
  };
  kyc_details: {
    pan_number: string;
    aadhaar_number: string;
  };
  bank_details: {
    bank_name: string | null;
    ifsc: string | null;
    account_number: string | null;
  };
  branch_details: {
    preferred_branch: string | null;
    preferred_branch_code?: string | null;
  };
  language_preference: {
    app_language: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfile;
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  return authFetch<ProfileResponse>(`${BASE_URL}/profile`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

// ─── Notifications (/api/notifications) ──────────────────────────────────────

export interface ApiNotification {
  notification_id: number | null;
  description: string;
  user_id: string;
  call_to_action: string;
  read_unread: string; // 'read' | 'unread'
  date: string; // "2026-03-20 05:56:48"
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  count: number;
  notifications: ApiNotification[];
}

export async function fetchNotifications(token: string): Promise<NotificationsResponse> {
  return authFetch<NotificationsResponse>(`${BASE_URL}/notifications`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  updated_count: number;
}

export async function markAllNotificationsRead(token: string): Promise<MarkReadResponse> {
  return authFetch<MarkReadResponse>(`${BASE_URL}/notifications/read`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

// ─── Payment history (/api/paymenthistory) ────────────────────────────────────

export interface PaymentInstallment {
  scheme_name: string;
  instalment_amount: string;
  status_message: string;
  time: string;
  date: string; // "15 Jan 2026"
  is_today: boolean;
}

export interface PaymentHistoryResponse {
  success: boolean;
  message: string;
  total_installment: string;
  installments: PaymentInstallment[];
}

export async function fetchPaymentHistory(token: string): Promise<PaymentHistoryResponse> {
  return authFetch<PaymentHistoryResponse>(`${BASE_URL}/paymenthistory`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

// ─── Branch list (/api/branchlist) ────────────────────────────────────────────

export interface BranchItem {
  branch_code: string;
  display_name: string;
}

export interface BranchListResponse {
  success: boolean;
  branchdata: BranchItem[];
}

export async function fetchBranchList(token: string): Promise<BranchListResponse> {
  return authFetch<BranchListResponse>(`${BASE_URL}/branchlist`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

// ─── Create / Update customer (/api/store/customer) ──────────────────────────

export interface CustomerPayload {
  name: string;
  mobileNo: string;
  address1: string;
  address2?: string;
  area?: string;
  city: string;
  pinCode: string;
  emailId: string;
  panNo: string;
  birthDate: string; // DD/MM/YYYY
  weddingAnniversary?: string; // DD/MM/YYYY
  gstnNo?: string;
  state: string;
  branchCode: string;
  ifsc: string;
  bankName: string;
  accountNo: string;
  adharNo: string;
  reqFromMobApp?: boolean;
  customerCode?: string; // present → update, absent → create
}

export interface CustomerMutationResponse {
  success: boolean;
  message: string;
  token?: string; // only on create
  /** e.g. SAP_PENDING — customer saved but login token not issued yet */
  code?: string;
  status?: boolean;
  errors?: Record<string, string[]>;
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<CustomerMutationResponse> {
  // createCustomer does NOT require auth — use plain fetch
  const response = await fetch(`${BASE_URL}/store/customer`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ ...payload, reqFromMobApp: true }),
  });
  return response.json();
}

export async function updateProfile(
  token: string,
  payload: CustomerPayload,
): Promise<CustomerMutationResponse> {
  return authFetch<CustomerMutationResponse>(`${BASE_URL}/updateprofile`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
