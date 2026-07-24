const BASE_URL = 'http://bhimaadmin.smacononline.com/api/auth';
//const BASE_URL = 'http://bhimaadmin.smacononline.com/api/auth';
//http://bhimaadmin.smacononline.com/api/auth
//https://pureapp.bhimajewellery.com//api
//http://bhimaadmin.smacononline.com//api
export interface RequestOtpSuccess {
  message: string;
  action: 'verify_otp';
  otp: number;
  expires_in: number;
}

export interface RequestOtpNewUser {
  message: string;
  customer_state: 'new';
  action: 'register';
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export type RequestOtpResponse = RequestOtpSuccess | RequestOtpNewUser | ValidationError;

// ─────────────────────────────────────────────────────────────────────────────

export interface Customer {
  customerid: number;
  name: string;
  mobile: string;
}

export interface VerifyOtpSuccess {
  message: string;
  action: 'logged_in';
  token: string;
  customer: Customer;
}

export interface VerifyOtpInvalidMobile {
  message: string;
  customer_state: 'new';
  action: 'register';
}

export interface VerifyOtpAcmePending {
  success: boolean;
  message: string;
  customer_state: 'acme_check_pending';
  action: 'guest';
}

export type VerifyOtpResponse = VerifyOtpSuccess | VerifyOtpInvalidMobile | VerifyOtpAcmePending | ValidationError;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isValidationError(res: RequestOtpResponse | VerifyOtpResponse): res is ValidationError {
  return 'errors' in res;
}

export function isRequestOtpSuccess(res: RequestOtpResponse): res is RequestOtpSuccess {
  return (res as RequestOtpSuccess).action === 'verify_otp';
}

export function isVerifyOtpSuccess(res: VerifyOtpResponse): res is VerifyOtpSuccess {
  return (res as VerifyOtpSuccess).action === 'logged_in';
}

export function isNewUser(res: RequestOtpResponse | VerifyOtpResponse): res is RequestOtpNewUser | VerifyOtpInvalidMobile {
  return (res as RequestOtpNewUser).action === 'register';
}

export function isAcmeCheckPending(res: VerifyOtpResponse): res is VerifyOtpAcmePending {
  return (res as VerifyOtpAcmePending).customer_state === 'acme_check_pending';
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function requestOTP(mobile: string): Promise<RequestOtpResponse> {
  const response = await fetch(`${BASE_URL}/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ mobile }),
  });

  const data: RequestOtpResponse = await response.json();
  return data;
}

export async function verifyOTP(
  mobile: string,
  otp: string,
  device_token?: string | null,
  platform?: string
): Promise<VerifyOtpResponse> {
  const response = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      mobile,
      otp,
      device_token: device_token ?? '',
      platform: platform ?? '',
    }),
  });
  console.log('verifyOTP payload', JSON.stringify({
    mobile,
    otp,
    device_token: device_token ?? '',
    platform: platform ?? '',
  }));

  const data: VerifyOtpResponse = await response.json();
  return data;
}
