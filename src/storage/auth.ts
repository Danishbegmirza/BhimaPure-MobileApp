import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Customer } from '../api/auth';

const TOKEN_KEY = '@bhima_auth_token';
const CUSTOMER_KEY = '@bhima_customer';

// ─── Token ────────────────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function saveCustomer(customer: Customer): Promise<void> {
  await AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export async function getCustomer(): Promise<Customer | null> {
  const raw = await AsyncStorage.getItem(CUSTOMER_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as Customer;
}

export async function removeCustomer(): Promise<void> {
  await AsyncStorage.removeItem(CUSTOMER_KEY);
}

// ─── Pending mobile (new-user registration flow) ─────────────────────────────

const PENDING_MOBILE_KEY = '@bhima_pending_mobile';

export async function savePendingMobile(mobile: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_MOBILE_KEY, mobile);
}

export async function getPendingMobile(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_MOBILE_KEY);
}

export async function clearPendingMobile(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_MOBILE_KEY);
}

// ─── Clear all auth data (logout) ─────────────────────────────────────────────

export async function clearAuthData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(CUSTOMER_KEY),
    AsyncStorage.removeItem(PENDING_MOBILE_KEY),
  ]);
}
