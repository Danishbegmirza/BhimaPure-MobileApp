export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  CreateAccount: undefined;
  CompleteProfile: undefined;
  VerifyOtp: { phoneNumber: string };
  Dashboard: undefined;
  MetalRates: undefined;
  MySchemes: undefined;
  MySchemeDetails: { schemeId: string };
  GoldRedemption: { schemeId: string };
  SelectShowroom: { schemeId: string };
  RedemptionSuccess: { schemeId: string };
  ShopOnlineSuccess: { schemeId: string };
  PaymentMethod: {
    schemeId: string;
    customerSchemeId: number;
    paymentContext: 'SCHEME_REGISTRATION' | 'INSTALLMENT_PAYMENT';
    amount: number;
    schemeDisplayName?: string;
    initialOrder?: {
      order_id: string | number;
      amount: number;
      razorpayKey: string;
      currency: string;
    };
  };
  PaymentSuccess: { schemeId: string };
  Notifications: undefined;
  ActivityHistory: undefined;
  Profile: undefined;
  EditProfile: undefined;
  SelectScheme: undefined;
  SchemeDetails: { schemeId: string };
  JoinScheme: {
    schemeId: string;
    apiSchemeId: number;
    customerSchemeId?: number;
    schemeName: string;
    monthlyAmount: number;
    maturityLabel?: string;
  };
};
