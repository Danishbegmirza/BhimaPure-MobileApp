export type Scheme = {
  id: string;
  name: string;
  tagLine: string;
  description: string;
  durationMonths: number;
  startAmount: number;
  monthlyMin: number;
  monthlyMax: number;
  bonusInstallments: number;
  maturityDate: string;
  maturitySubtitle: string;
  cardTone: string;
};

export type EnrolledScheme = {
  id: string;
  name: string;
  status: 'active' | 'matured' | 'redeemed';
  maturityDate: string;
  totalInvested: number;
  eligibleValue: number;
  bonusLabel: string;
  progressPercent: number;
  installmentMonths: string[];
  paidInstallments: number;
  bonusValue: number;
  makingChargeWaiver: string;
  nextMilestone?: string;
};

export const SCHEMES: Scheme[] = [
  {
    id: 'gold-tree-bonus',
    name: 'Gold Tree Bonus Plan',
    tagLine: 'FUTURE PLUS SCHEME',
    description: 'Get 1 month installment as a gift from Bhima.',
    durationMonths: 11,
    startAmount: 500,
    monthlyMin: 500,
    monthlyMax: 100000,
    bonusInstallments: 1,
    maturityDate: 'Jan 24, 2027',
    maturitySubtitle: '11 months from today',
    cardTone: '#9F1D1D',
  },
  {
    id: 'gold-tree-no-making-charge',
    name: 'Gold Tree No Making Charge Plan',
    tagLine: 'SMART BUY SCHEME',
    description: 'Zero making charges on your dream jewelry.',
    durationMonths: 11,
    startAmount: 1000,
    monthlyMin: 1000,
    monthlyMax: 100000,
    bonusInstallments: 0,
    maturityDate: 'Jan 24, 2027',
    maturitySubtitle: '11 months from today',
    cardTone: '#161321',
  },
  {
    id: 'gold-tree-weight',
    name: 'Gold Tree Weight Plan',
    tagLine: 'WEIGHT ACCUMULATION SCHEME',
    description: 'Accumulate gold weight, not just money.',
    durationMonths: 11,
    startAmount: 1000,
    monthlyMin: 1000,
    monthlyMax: 100000,
    bonusInstallments: 0,
    maturityDate: 'Jan 24, 2027',
    maturitySubtitle: '11 months from today',
    cardTone: '#101010',
  },
];

export function getSchemeById(id: string) {
  return SCHEMES.find(item => item.id === id);
}

export const ENROLLED_SCHEMES: EnrolledScheme[] = [
  {
    id: 'gold-tree-plus',
    name: 'Gold Tree Plus',
    status: 'active',
    maturityDate: 'MAR 15, 2026',
    totalInvested: 100000,
    eligibleValue: 118000,
    bonusLabel: 'BONUS: 18 % WAIVER',
    progressPercent: 79,
    installmentMonths: ['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'],
    paidInstallments: 5,
    bonusValue: 18000,
    makingChargeWaiver: '18% Off',
    nextMilestone: 'Pay your next installment by Feb 22, 2026 to maintain your 1+1 bonus eligibility.',
  },
  {
    id: 'gold-tree-coin',
    name: 'Gold Tree Coin Plan',
    status: 'matured',
    maturityDate: 'JAN 10, 2026',
    totalInvested: 110000,
    eligibleValue: 125500,
    bonusLabel: 'BONUS: 12 % WAIVER',
    progressPercent: 100,
    installmentMonths: ['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'],
    paidInstallments: 11,
    bonusValue: 7500,
    makingChargeWaiver: '12% Off',
  },
];

export function getEnrolledSchemeById(id: string) {
  return ENROLLED_SCHEMES.find(item => item.id === id);
}
