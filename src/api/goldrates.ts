const BASE_URL = 'https://pureapp.bhimajewellery.com/api';

export interface GoldRateItem {
  item_type: string;
  unit: string;
  purity: string;
  sale_rate: string;
  last_updated: string;
}

export interface GoldRatesResponse {
  success: boolean;
  goldrates?: GoldRateItem[];
  message?: string;
}

export async function fetchGoldRates(): Promise<GoldRatesResponse> {
  const response = await fetch(`${BASE_URL}/goldrates`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Gold rates request failed: ${response.status}`);
  }
  return response.json() as Promise<GoldRatesResponse>;
}

/** Sale rate string for Gold at the given purity (e.g. "22", "22.00"). */
export function saleRateForGoldPurity(
  goldrates: GoldRateItem[] | undefined,
  purityMatch: number,
): string | undefined {
  if (!goldrates?.length) return undefined;
  const row = goldrates.find(
    (r) =>
      r.item_type === 'Gold' &&
      Math.abs(parseFloat(String(r.purity)) - purityMatch) < 0.01,
  );
  return row?.sale_rate;
}

export function firstGoldLastUpdated(goldrates: GoldRateItem[] | undefined): string | undefined {
  const g = goldrates?.find((r) => r.item_type === 'Gold');
  return g?.last_updated;
}
