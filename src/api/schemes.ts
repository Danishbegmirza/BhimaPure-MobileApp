const BASE_URL = 'https://pureapp.bhimajewellery.com/api';

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
  id: number;
  scheme_type: number;
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

export interface SchemesByTypeResponse {
  success: boolean;
  message: string;
  schemetype: SchemeTypeDetail;
  projected_maturity?: ProjectedMaturity | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchSchemeTypes(): Promise<SchemeTypesResponse> {
  const response = await fetch(`${BASE_URL}/schemetypes`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  return response.json();
}

export async function fetchSchemesByType(
  schemeTypeId: number,
): Promise<SchemesByTypeResponse> {
  const response = await fetch(
    `${BASE_URL}/schemes/by-scheme-type/${schemeTypeId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
