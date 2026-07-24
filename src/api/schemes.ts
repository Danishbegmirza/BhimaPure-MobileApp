const BASE_URL = 'http://bhimaadmin.smacononline.com/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchemeTypeItem {
  id: number;
  scheme_type_name: string;
  short_description: string;
  highlights: string[];
  duration: string | null;
  banner_image_url: string;
  starting_plan: string | null;
}

export interface SchemeEntry {
  id?: number;
  scheme_type?: number;
  min_amount: string;
  duration: number;
}

export interface SchemeTypeDetail {
  id: number;
  scheme_type_name: string;
  short_description: string;
  duration: string | null;
  terms_and_conditions: string | null;
  popular_scheme: number | null;
  min_amount: string | null;
  max_amount: string | null;
  multiple_of?: number | null;
  scheme_code?: number | null;
  allow_custom_amount_to_enter?: boolean;
  text_above_amount?: string | null;
  calculation_type?: 'amount' | 'weight' | null;
  gold_rate?: string | null;
  /** Description to show in projected maturity section (e.g., for No Making Charge scheme) */
  des_in_prjected_mturity?: string | null;
  /** Whether to show scheme bonus (false for No Making Charge scheme) */
  show_scheme_bonus?: boolean;
  scheme?: SchemeEntry[];
  schemes: SchemeEntry[];
  /** May also arrive at response root; merged in `loadSchemeType`. */
  projected_maturity?: ProjectedMaturity | null;
}

export interface ProjectedMaturity {
  monthly_amount: string;
  duration: number;
  bonus: string | number | '';
  total_without_bonus: number;
  total_maturity_amount: number | string;
  estimated_gold?: number | null;
  weight_in?: string | null;
}

export interface SchemeTypesResponse {
  success: boolean;
  message: string;
  schemetype: SchemeTypeItem[];
}

export interface SchemeAttribute {
  field_name: string;
  field_value: string;
}

export interface SchemesByTypeResponse {
  success: boolean;
  message: string;
  schemetype: SchemeTypeDetail;
  attributes?: SchemeAttribute[];
  projected_maturity?: ProjectedMaturity | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchSchemeTypes(token?: string | null): Promise<SchemeTypesResponse> {
  const response = await fetch(`${BASE_URL}/schemetypes`, {
    method: 'GET',
    headers: buildHeaders(token),
  });
  return response.json();
}

export async function fetchSchemesByType(
  schemeTypeId: number,
  token?: string | null,
): Promise<SchemesByTypeResponse> {
  const response = await fetch(
    `${BASE_URL}/schemes/by-scheme-type/${schemeTypeId}`,
    {
      method: 'GET',
      headers: buildHeaders(token),
    },
  );
  return response.json();
}

// ─── Single scheme maturity (called on tab click) ─────────────────────────────

export interface SchemeMaturityResponse {
  success: boolean;
  message: string;
  monthly_amount: string;
  duration: number;
  bonus: string;
  total_without_bonus: number;
  total_maturity_amount: number | string;
  estimated_gold?: number | null;
  weight_in?: string | null;
}

export async function fetchSchemeMaturity(
  schemeId: number,
): Promise<SchemeMaturityResponse> {
  const response = await fetch(`${BASE_URL}/schemes/${schemeId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  return response.json();
}

// ─── Fetch maturity by scheme ID ────────────────────────────────────────────────

export interface MaturityByAmountResponse {
  success: boolean;
  message?: string;
  monthly_amount?: string;
  duration?: number;
  bonus?: string | number;
  total_without_bonus?: number;
  total_maturity_amount?: number | string;
  estimated_gold?: number | null;
  weight_in?: string | null;
}

export async function fetchMaturityByAmount(
  schemeId: number,
): Promise<MaturityByAmountResponse> {
  const response = await fetch(`${BASE_URL}/schemes/${schemeId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  return response.json();
}
