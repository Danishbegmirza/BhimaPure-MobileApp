/**
 * Static Texts from All Screens - Bilingual (English & Tamil)
 * Supports language_preference: 'en' (English) or 'ta' (Tamil)
 */

export type SupportedLanguage = 'en' | 'ta';

const STATIC_TEXTS_EN = {
  // ─────────────────────────────────────────────────────────────────────────────
  // SplashScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  splash: {
    tagline: 'GOLD SAVINGS SCHEMES',
    updateRequired: 'Update Required',
    currentVersion: 'Current: v',
    updateNow: 'Update Now',
    defaultUpdateMessage: 'A new version of the app is available. Please update to continue.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LoginScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  login: {
    brandCaption: 'G O L D   S A V I N G S   S C H E M E S',
    title: 'Welcome Back!',
    subtitle: 'Enter your mobile number to continue',
    mobileLabel: 'MOBILE NUMBER',
    placeholder: 'Enter 10-digit number',
    countryCode: '+91',
    getStarted: 'GET STARTED',
    notRegisteredTitle: 'Not Registered',
    errorDefault: 'Something went wrong. Please try again.',
    secureTitle: 'Secure & Protected',
    secureBody: 'Your personal information is encrypted and stored securely',
    bhimaTitle: 'Brought to You by Bhima',
    bhimaBody: '100 years of legacy in gold and jewellery',
    termsText: 'By continuing, you agree to our',
    term: 'Term',
    privacyPolicy: 'Privacy Policy',
    guestText: 'Continue as Guest',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CreateAccountScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  createAccount: {
    title: 'Create Account',
    subtitle: 'Join Bhima Gold Savings Schemes',
    firstNameLabel: 'FIRST NAME',
    firstNamePlaceholder: 'First name',
    lastNameLabel: 'LAST NAME',
    lastNamePlaceholder: 'Last name',
    bonusTitle: 'Welcome Bonus',
    bonusBody: 'Get exclusive offers and benefits on your first gold scheme enrollment.',
    createAccountButton: 'CREATE ACCOUNT',
    termsText: 'By continuing, you agree to our Terms of Service and Privacy Policy',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // VerifyOtpScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  verifyOtp: {
    title: 'Verify OTP',
    subtitle: 'Enter the 6-digit code sent to',
    resendOtp: 'Resend OTP',
    resendOtpIn: 'Resend OTP in',
    secureTitle: 'Secure Verification',
    secureBody: 'Your OTP is valid for 5 minutes. Never share it with anyone.',
    verifyButton: 'VERIFY OTP',
    errorDefault: 'Something went wrong. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CompleteProfileScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  completeProfile: {
    title: 'Complete Your Profile',
    stepText: 'Step {step} of {total}',
    welcomeTitle: 'Welcome Aboard!',
    welcomeBody: "Let's set up your profile to start your gold investment journey with Bhima Gold Tree.",
    
    // Step 0 - Personal Details
    personalDetailsLabel: 'PERSONAL DETAILS',
    fullNameLabel: 'FULL NAME',
    fullNamePlaceholder: 'Enter your full name',
    mobileLabel: 'MOBILE NUMBER',
    emailLabel: 'EMAIL ADDRESS',
    emailPlaceholder: 'your.email@example.com',
    dobLabel: 'DATE OF BIRTH',
    anniversaryLabel: 'ANNIVERSARY DATE (OPTIONAL)',
    datePlaceholder: 'DD/MM/YYYY',
    
    // Step 1 - Address & Branch
    addressBranchLabel: 'ADDRESS & BRANCH',
    address1Label: 'ADDRESS LINE 1',
    address1Placeholder: 'House / Door / Street',
    address2Label: 'ADDRESS LINE 2',
    address2Placeholder: 'Landmark / Apartment',
    areaLabel: 'AREA',
    areaPlaceholder: 'Area / Locality',
    cityLabel: 'CITY',
    cityPlaceholder: 'City',
    pincodeLabel: 'PINCODE',
    pincodePlaceholder: '560001',
    stateLabel: 'STATE',
    statePlaceholder: 'Select state',
    branchLabel: 'PREFERRED BRANCH',
    branchPlaceholder: 'Select branch',
    branchCodePlaceholder: 'Enter branch code',
    
    // Step 2 - KYC
    kycLabel: 'KYC DETAILS',
    kycInfo: 'Your KYC details are mandatory for compliance. All information is encrypted and securely stored.',
    panLabel: 'PAN NUMBER',
    panPlaceholder: 'ABCDE1234F',
    aadhaarLabel: 'AADHAAR NUMBER',
    aadhaarPlaceholder: '123456789012',
    
    // Step 3 - Bank
    bankLabel: 'BANK DETAILS (OPTIONAL)',
    bankInfo: 'Bank details are optional but recommended for future auto-debit and refund processing.',
    bankNameLabel: 'BANK NAME',
    bankNamePlaceholder: 'HDFC Bank',
    accountLabel: 'ACCOUNT NUMBER',
    accountPlaceholder: '1234567890',
    ifscLabel: 'IFSC CODE',
    ifscPlaceholder: 'HDFC0001234',
    
    // Buttons
    continueButton: 'CONTINUE',
    completeButton: 'COMPLETE PROFILE',
    backButton: 'Back',
    doneButton: 'Done',
    
    // Validation Messages
    nameRequired: 'Name is required',
    mobileRequired: 'Mobile is required',
    dobRequired: 'Date of birth is required',
    nameAlphabets: 'Name should contain only alphabets',
    mobile10Digits: 'Mobile number should be exactly 10 digits',
    emailInvalid: 'Email should contain @',
    addressRequired: 'Address is required',
    cityRequired: 'City is required',
    pincodeRequired: 'Pincode is required',
    stateRequired: 'State is required',
    pincode6Digits: 'Pincode should be exactly 6 digits',
    panFormat: 'PAN should be in format ABCDE1234F',
    aadhaar12Digits: 'Aadhaar number should be exactly 12 digits',
    fixErrors: 'Please fix all validation errors',
    
    // Alerts
    successTitle: 'Success',
    successMessage: 'Customer saved. SAP sync pending.',
    errorTitle: 'Error',
    unexpectedError: 'An unexpected error occurred. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DashboardScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  dashboard: {
    welcomeBack: 'WELCOME BACK',
    welcome: 'WELCOME',
    guest: 'Guest',
    investmentLabel: 'INVESTMENT',
    goldHoldings: 'GOLD HOLDINGS',
    gold22k: '22K Gold',
    totalInvestment: 'TOTAL INVESTMENT',
    joinNewScheme: 'JOIN NEW GOLD SCHEME',
    myEnrolledSchemes: 'MY ENROLLED SCHEMES',
    viewAllPortfolio: 'VIEW ALL PORTFOLIO',
    dueLabel: 'DUE:',
    todaysGoldRate: "TODAY'S GOLD RATE",
    live: 'LIVE',
    perGram22k: 'Per Gram (22K Gold)',
    viewAllMetalRates: 'View All Metal Rates >',
    recommendedForYou: 'RECOMMENDED FOR YOU',
    viewAll: 'VIEW ALL',
    mostPopular: 'MOST POPULAR',
    fixedMonthly: 'FIXED MONTHLY',
    exploreDetails: 'EXPLORE DETAILS',
    marketAnalytics: 'Market Analytics',
    goldRate1g: '22K GOLD RATE / 1G',
    recentTransactions: 'RECENT TRANSACTIONS',
    history: 'HISTORY',
    installmentPayment: 'Installment Payment',
    success: 'SUCCESS',
    needAssistance: 'NEED ASSISTANCE?',
    whatsappSupport: 'WhatsApp Support',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ProfileScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  profile: {
    title: 'My Profile',
    personalDetails: 'PERSONAL DETAILS',
    dobLabel: 'DATE OF BIRTH',
    anniversaryLabel: 'ANNIVERSARY',
    contactInfo: 'CONTACT INFORMATION',
    mobileLabel: 'MOBILE NUMBER',
    emailLabel: 'EMAIL ADDRESS',
    addressLabel: 'ADDRESS',
    branchDetails: 'BRANCH DETAILS',
    preferredBranch: 'PREFERRED BRANCH',
    languagePreference: 'LANGUAGE PREFERENCE',
    appLanguage: 'APP LANGUAGE',
    languageHint: 'Choose your preferred language',
    english: 'English',
    tamil: 'தமிழ்',
    kycDetails: 'KYC DETAILS',
    panLabel: 'PAN NUMBER',
    aadhaarLabel: 'AADHAAR NUMBER',
    bankDetails: 'BANK DETAILS',
    bankNameLabel: 'BANK NAME',
    accountLabel: 'ACCOUNT NUMBER',
    ifscLabel: 'IFSC CODE',
    logout: 'LOGOUT',
    editProfile: 'EDIT PROFILE',
    loginRequired: 'Please log in to view your profile.',
    loadFailed: 'Failed to load profile.',
    loadError: 'Unable to load profile. Please try again.',
    login: 'LOGIN',
    idLabel: 'ID:',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EditProfileScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  editProfile: {
    title: 'Edit Profile',
    personalDetails: 'PERSONAL DETAILS',
    fullNameLabel: 'FULL NAME',
    fullNamePlaceholder: 'Enter your full name',
    mobileLabel: 'MOBILE NUMBER',
    mobilePlaceholder: '10-digit mobile number',
    emailLabel: 'EMAIL ADDRESS',
    emailPlaceholder: 'Enter email address',
    dobLabel: 'DATE OF BIRTH',
    dobPlaceholder: 'DD/MM/YYYY',
    anniversaryLabel: 'ANNIVERSARY DATE',
    
    addressInfo: 'ADDRESS INFORMATION',
    address1Label: 'ADDRESS LINE 1',
    address1Placeholder: 'House / Door / Street',
    address2Label: 'ADDRESS LINE 2',
    address2Placeholder: 'Landmark / Area',
    areaLabel: 'AREA',
    areaPlaceholder: 'Area / Locality',
    cityLabel: 'CITY',
    cityPlaceholder: 'City',
    pincodeLabel: 'PINCODE',
    pincodePlaceholder: '560001',
    stateLabel: 'STATE',
    statePlaceholder: 'Select state',
    
    preferredBranch: 'PREFERRED BRANCH',
    branchLabel: 'BRANCH',
    branchPlaceholder: 'Select branch',
    branchCodePlaceholder: 'Branch code',
    
    kycDetails: 'KYC DETAILS',
    panLabel: 'PAN NUMBER',
    panPlaceholder: 'ABCDE1234F',
    aadhaarLabel: 'AADHAAR NUMBER',
    aadhaarPlaceholder: '12-digit Aadhaar',
    
    bankDetails: 'BANK DETAILS (OPTIONAL)',
    bankNameLabel: 'BANK NAME',
    bankNamePlaceholder: 'HDFC Bank',
    accountLabel: 'ACCOUNT NUMBER',
    accountPlaceholder: '1234567890',
    ifscLabel: 'IFSC CODE',
    ifscPlaceholder: 'HDFC0001234',
    
    saveChanges: 'SAVE CHANGES',
    
    // Validation
    nameRequired: 'Name is required',
    mobileRequired: 'Mobile number is required',
    dobRequired: 'Date of birth is required',
    nameAlphabets: 'Name should contain only alphabets',
    mobile10Digits: 'Mobile number should be exactly 10 digits',
    emailInvalid: 'Email should contain @',
    addressRequired: 'Address is required',
    cityRequired: 'City is required',
    pincodeRequired: 'Pincode is required',
    stateRequired: 'State is required',
    pincode6Digits: 'Pincode should be exactly 6 digits',
    selectState: 'Please select a state from the list',
    panFormat: 'PAN should be in format ABCDE1234F',
    aadhaar12Digits: 'Aadhaar number should be exactly 12 digits',
    fixErrors: 'Please fix all validation errors',
    
    // Alerts
    successTitle: 'Success',
    successMessage: 'Profile updated successfully.',
    errorTitle: 'Error',
    notLoggedIn: 'You are not logged in.',
    updateFailed: 'Failed to update profile.',
    unexpectedError: 'An unexpected error occurred. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MySchemesScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  mySchemes: {
    title: 'My Gold Portfolio',
    totalInvested: 'TOTAL INVESTED',
    bonusEarned: 'BONUS EARNED',
    joinNewScheme: 'JOIN NEW SCHEME',
    filterAll: 'ALL',
    filterActive: 'ACTIVE',
    filterMatured: 'MATURED',
    filterRedeemed: 'REDEEMED',
    maturityLabel: 'MATURITY:',
    totalInvestedLabel: 'TOTAL INVESTED',
    eligibleValue: 'ELIGIBLE VALUE',
    bonusLabel: 'BONUS:',
    waiver: 'WAIVER',
    viewDetails: 'VIEW DETAILS',
    payNow: 'PAY NOW',
    redeem: 'REDEEM',
    loginRequired: 'Please log in to view your portfolio.',
    loadFailed: 'Failed to load portfolio.',
    loadError: 'Unable to load portfolio. Please try again.',
    login: 'LOGIN',
    noSchemes: 'No schemes found in this category.',
    footerMain: 'Stay consistent, secure your bonus.',
    footerSub: 'KEEP UP YOUR MONTHLY INSTALLMENTS ON TIME.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MySchemeDetailsScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  mySchemeDetails: {
    title: 'My Gold Portfolio',
    totalPaid: 'TOTAL PAID',
    eligibleValue: 'ELIGIBLE VALUE',
    schemeDetailedAnalysis: 'SCHEME DETAILED ANALYSIS',
    installmentTimeline: 'INSTALLMENT TIMELINE',
    paidLabel: 'Paid',
    installmentsComplete: 'INSTALLMENTS COMPLETE',
    bonusValue: 'BONUS VALUE',
    bonusCaption: 'Bonus on scheme completion',
    maturityValue: 'MATURITY VALUE',
    maturityCaption: 'Expected at maturity',
    paymentOverdue: 'Payment Overdue',
    nextPayment: 'Next Payment',
    dueLabel: 'Due:',
    close: 'CLOSE',
    loginRequired: 'Please log in to view scheme details.',
    loadFailed: 'Failed to load scheme details.',
    loadError: 'Unable to load details. Please try again.',
    notFound: 'Scheme not found.',
    login: 'LOGIN',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SelectSchemeScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  selectScheme: {
    title: 'Select Scheme',
    bhimaExclusive: 'BHIMA EXCLUSIVE',
    duration: 'DURATION',
    startingAt: 'STARTING AT',
    perMonth: '/MO',
    flexible: 'Flexible',
    premiumBenefits: 'PREMIUM BENEFITS',
    loadFailed: 'Failed to load schemes.',
    loadError: 'Unable to load schemes. Please try again.',
    login: 'LOGIN',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SchemeDetailsScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  schemeDetails: {
    headerLogo: 'BHIMA SECURE',
    saveFor: 'Save for',
    months: 'months',
    getBonus: 'Get 1 month bonus',
    
    // Benefit Card
    exclusiveBenefit: 'EXCLUSIVE BENEFIT',
    completeInstallments: 'Complete',
    installmentsGet: 'installments – Get 1 month installment',
    free: 'free',
    
    // Briefing
    schemeBriefing: 'SCHEME BRIEFING',
    monthlyInstallmentsFrom: 'Monthly installments from',
    to: 'to',
    flexibleInstallments: 'Flexible monthly installments available.',
    
    // Bonus
    schemeBenefit: 'SCHEME BENEFIT',
    andReceive: 'and\nreceive',
    bonusBadge: '1 month installment as a bonus',
    
    // Select Plan
    selectPlan: 'SELECT PLAN',
    mo: 'mo',
    
    // Projected Maturity
    projectedMaturity: 'PROJECTED MATURITY',
    monthlyAmount: 'MONTHLY AMOUNT',
    monthTotal: '-MONTH TOTAL',
    schemeBonus: 'SCHEME BONUS',
    gift: 'GIFT',
    estGold: 'EST. GOLD',
    totalMaturityValue: 'TOTAL MATURITY VALUE',
    calculatingMaturity: 'Calculating maturity…',
    selectPlanAbove: 'Select a plan above to see projected maturity.',
    
    // Timeline
    savingsTimeline: 'SAVINGS TIMELINE',
    monthsSavingPeriod: 'MONTHS SAVING PERIOD',
    plusBonus: '+ 1 MONTH BONUS',
    bonus: 'BONUS',
    
    // Terms
    termsLabel: 'TERMS & CONDITIONS',
    agreeTerms: 'I agree to the',
    termsConditions: 'Terms & Conditions',
    andConfirm: 'and confirm that I have read the scheme details including the bonus eligibility criteria.',
    
    // CTA
    joinSchemeNow: 'JOIN SCHEME NOW',
    pleaseAcceptTerms: 'Please accept terms and condition',
    
    // Errors
    somethingWrong: 'Something went wrong.',
    loginError: 'Please log in to continue.',
    enrollmentFailed: 'Enrollment could not be started.',
    login: 'LOGIN',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // JoinSchemeScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  joinScheme: {
    title: 'Join Scheme',
    pageTitle: 'Enrollment Details',
    pageSubTitle: 'Complete the form to join the scheme.',
    monthlyInstallment: 'MONTHLY INSTALLMENT',
    planLabel: 'PLAN',
    perMonth: 'per month',
    maturityValue: 'MATURITY VALUE',
    fromSelectedPlan: 'from selected plan',
    nomineeDetails: 'NOMINEE DETAILS',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: "Enter nominee's full name",
    relationshipLabel: 'Relationship',
    salesPersonLabel: 'SALESPERSON NAME (OPTIONAL)',
    salesPersonPlaceholder: 'Enter salesperson name if applicable',
    firstPaymentNotice: 'First Payment Due: Your enrollment will be confirmed upon successful payment of the first installment.',
    proceedToPayment: 'PROCEED TO PAYMENT',
    
    // Errors/Alerts
    loginError: 'Please log in to continue.',
    startFromScheme: 'Please start from Scheme Details and try again.',
    unableToContinue: 'Unable to continue',
    saveFailed: 'Failed to save enrollment details.',
    paymentTitle: 'Payment',
    orderFailed: 'Order creation failed.',
    missingKey: 'Missing payment key. Please try again.',
    errorTitle: 'Error',
    unexpectedError: 'Something went wrong. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NotificationsScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  notifications: {
    title: 'Notifications',
    newNotification: 'new notification',
    newNotifications: 'new notifications',
    markAllRead: 'MARK ALL READ',
    today: 'TODAY',
    yesterday: 'YESTERDAY',
    earlier: 'EARLIER',
    loginRequired: 'Please log in.',
    loadFailed: 'Failed to load notifications.',
    loadError: 'Unable to load notifications. Please try again.',
    login: 'LOGIN',
    noNotifications: 'No notifications yet.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MetalRatesScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  metalRates: {
    title: 'Metal Rates',
    subtitle: 'Live Market Prices',
    lastUpdated: 'Last updated:',
    liveRatesLabel: 'LIVE RATES:',
    liveRatesInfo: 'Sell rates are indicative and may vary at branches. Taxes additional.',
    goldRates: 'GOLD RATES',
    differentPurities: 'Different purities available.',
    otherMetals: 'OTHER METALS',
    silverPlatinum: 'Silver & Platinum.',
    gold22k: 'Gold 22K (916)',
    gold18k: 'Gold 18K (750)',
    gold14k: 'Gold 14K (585)',
    silver: 'Silver',
    platinum: 'Platinum',
    sellRate: 'Sell rate',
    perGram: 'per gram',
    disclaimer: 'Rates are indicative and subject to change without notice. Making charges, GST, and other levies are extra as applicable at the branch.',
    startInvesting: 'START INVESTING NOW',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ActivityHistoryScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  activityHistory: {
    title: 'Transaction History',
    searchPlaceholder: 'Search by scheme or date...',
    totalInstallments: 'TOTAL INSTALLMENTS',
    transactions: 'TRANSACTIONS',
    filterAll: 'ALL',
    filterInstallments: 'INSTALLMENTS',
    installmentLabel: 'INSTALLMENT',
    today: 'TODAY',
    loginRequired: 'Please log in.',
    loadFailed: 'Failed to load payment history.',
    loadError: 'Unable to load history. Please try again.',
    login: 'LOGIN',
    noTransactions: 'No transactions found.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GoldRedemptionScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  goldRedemption: {
    title: 'Gold Redemption',
    maturedScheme: 'MATURED SCHEME',
    totalValue: 'TOTAL VALUE',
    bonusLabel: 'BONUS',
    eligibilityStatus: 'ELIGIBILITY STATUS',
    fullyMatured: 'Scheme Fully Matured',
    eligibleToChoose: 'You are eligible to choose a redemption option.',
    privilegesTitle: 'Your Redemption Privileges:',
    privilege1: 'Guaranteed live-rate redemption',
    privilege2: 'Flexible collection options',
    privilege3: 'Transparent pricing, zero hidden charges',
    chooseMode: 'CHOOSE REDEMPTION MODE',
    jewelleryTitle: 'Jewellery',
    recommended: 'RECOMMENDED',
    jewelleryDescription: 'Visit any branch and redeem as per your gold eligibility and offers.',
    jewelleryPoint1: '12% Month Bonus Applied',
    jewelleryPoint2: 'Priority Store Service',
    shopOnlineTitle: 'Shop Online',
    shopOnlineDescription: 'Prefer shopping from home? You can redeem your scheme amount on our online store using a coupon.',
    shopOnlinePoint1: 'Submit your redemption request',
    shopOnlinePoint2: 'Your request will be processed by our team',
    infoText: 'Jewellery redemption maximizes your benefits with making charge waivers and bonus credits.',
    proceedToRedeem: 'PROCEED TO REDEEM',
    generateCoupon: 'GENERATE ONLINE COUPON',
    loginError: 'Please log in.',
    profileLoadError: 'Customer profile could not be loaded. Please try again.',
    redemptionTitle: 'Redemption',
    requestFailed: 'Request could not be completed.',
    errorTitle: 'Error',
    unexpectedError: 'Something went wrong. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PaymentMethodScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  paymentMethod: {
    title: 'Payment',
    schemeRegistration: 'SCHEME_REGISTRATION',
    installmentPayment: 'INSTALLMENT PAYMENT',
    autopaySecured: 'AUTOPAY SECURED',
    paymentGateway: 'PAYMENT GATEWAY',
    razorpay: 'Razorpay',
    paymentMethods: 'UPI, CARDS, NET BANKING',
    securePayment: 'SECURE PAYMENT',
    securePaymentBody: 'Your payment is processed through Razorpay with bank-grade security.',
    bullet1: 'Instant payment confirmation',
    bullet2: 'Multiple payment options in one',
    bullet3: 'Refund protection available',
    paymentSummary: 'PAYMENT SUMMARY',
    initialInstallment: 'INITIAL INSTALLMENT',
    installment: 'INSTALLMENT',
    gatewayFee: 'GATEWAY FEE',
    absorbedByUs: 'ABSORBED BY US',
    totalPayable: 'TOTAL PAYABLE',
    paySecurely: 'PAY',
    securely: 'SECURELY',
    bhimaPure: 'Bhima Pure',
    schemePayment: 'Scheme payment',
    invalidAmount: 'Invalid amount',
    amountError: 'Payment amount must be greater than zero.',
    loginError: 'Please log in to continue.',
    missingDetails: 'Missing Razorpay order details. Please try again.',
    paymentTitle: 'Payment',
    orderFailed: 'Order creation failed.',
    verifyFailed: 'Payment could not be verified. Please try again or contact support.',
    paymentCancelled: 'Payment is cancelled.',
    paymentFailed: 'Payment is failed. Please try again.',
    unableToStart: 'Unable to start payment. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PaymentSuccessScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  paymentSuccess: {
    title: 'Payment Successful!',
    subtitle: 'Installment for',
    credited: 'has been credited to your account.',
    backToPortfolio: 'BACK TO PORTFOLIO',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SelectShowroomScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  selectShowroom: {
    headerTitle: 'Gold Redemption',
    title: 'Select Showroom',
    subtitle: 'Choose the branch where you wish to collect your gold.',
    nextStep: 'NEXT STEP',
    loginRequired: 'Please log in.',
    loadFailed: 'Failed to load branch list.',
    loadError: 'Unable to load branches. Please try again.',
    login: 'LOGIN',
    profileLoadError: 'Could not load your customer profile.',
    redemptionTitle: 'Redemption',
    updateFailed: 'Could not update redemption mode.',
    errorTitle: 'Error',
    unexpectedError: 'Something went wrong. Please try again.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // RedemptionSuccessScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  redemptionSuccess: {
    title: 'Your Showroom\nVisit is Confirmed ✨',
    subtitle: 'Visit your selected store and enjoy your gold scheme benefits on jewellery purchase.',
    backToPortfolio: 'BACK TO PORTFOLIO',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ShopOnlineSuccessScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  shopOnlineSuccess: {
    title: "You're All Set\nto Shop Online ✨",
    subtitle: 'Your redemption request has been submitted. After verification, your exclusive coupon code will be shared via email. Our representative may reach out for further support.',
    backToPortfolio: 'BACK TO PORTFOLIO',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Common / Shared
  // ─────────────────────────────────────────────────────────────────────────────
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    retry: 'Retry',
    login: 'LOGIN',
    logout: 'LOGOUT',
    save: 'Save',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    close: 'Close',
    required: '*',
    rupeeSymbol: '₹',
    dash: '—',
    dot: '•',
  },
};

const STATIC_TEXTS_TA = {
  // ─────────────────────────────────────────────────────────────────────────────
  // SplashScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  splash: {
    tagline: 'தங்கச் சேமிப்புத் திட்டங்கள்',
    updateRequired: 'புதுப்பிப்பு தேவை',
    currentVersion: 'தற்போதைய பதிப்பு: v',
    updateNow: 'இப்போது புதுப்பிக்கவும்',
    defaultUpdateMessage: 'பயன்பாட்டின் புதிய பதிப்பு கிடைக்கிறது. தொடர புதுப்பிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LoginScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  login: {
    brandCaption: 'த ங் க ச்   சே மி ப் பு த்   தி ட் ட ங் க ள்',
    title: 'மீண்டும் வருக!',
    subtitle: 'தொடர உங்கள் மொபைல் எண்ணை உள்ளிடவும்',
    mobileLabel: 'மொபைல் எண்',
    placeholder: '10 இலக்க எண்ணை உள்ளிடவும்',
    countryCode: '+91',
    getStarted: 'தொடங்குங்கள்',
    notRegisteredTitle: 'பதிவு செய்யப்படவில்லை',
    errorDefault: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    secureTitle: 'பாதுகாப்பான & பாதுகாக்கப்பட்ட',
    secureBody: 'உங்கள் தனிப்பட்ட தகவல்கள் மறைகுறியாக்கப்பட்டு பாதுகாப்பாக சேமிக்கப்படுகின்றன',
    bhimaTitle: 'பீமா வழங்குகிறது',
    bhimaBody: 'தங்கம் மற்றும் நகைகளில் 100 ஆண்டு மரபு',
    termsText: 'தொடர்வதன் மூலம், நீங்கள் எங்கள்',
    term: 'விதிமுறைகள்',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    guestText: 'விருந்தினராக தொடரவும்',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CreateAccountScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  createAccount: {
    title: 'கணக்கை உருவாக்கவும்',
    subtitle: 'பீமா தங்கச் சேமிப்புத் திட்டங்களில் சேரவும்',
    firstNameLabel: 'முதல் பெயர்',
    firstNamePlaceholder: 'முதல் பெயர்',
    lastNameLabel: 'கடைசி பெயர்',
    lastNamePlaceholder: 'கடைசி பெயர்',
    bonusTitle: 'வரவேற்பு போனஸ்',
    bonusBody: 'உங்கள் முதல் தங்கத் திட்ட பதிவில் பிரத்யேக சலுகைகள் மற்றும் நன்மைகளைப் பெறுங்கள்.',
    createAccountButton: 'கணக்கை உருவாக்கவும்',
    termsText: 'தொடர்வதன் மூலம், நீங்கள் எங்கள் சேவை விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்றுக்கொள்கிறீர்கள்',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // VerifyOtpScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  verifyOtp: {
    title: 'OTP சரிபார்க்கவும்',
    subtitle: 'அனுப்பப்பட்ட 6 இலக்க குறியீட்டை உள்ளிடவும்',
    resendOtp: 'OTP மீண்டும் அனுப்பவும்',
    resendOtpIn: 'OTP மீண்டும் அனுப்பவும்',
    secureTitle: 'பாதுகாப்பான சரிபார்ப்பு',
    secureBody: 'உங்கள் OTP 5 நிமிடங்கள் செல்லுபடியாகும். யாருடனும் பகிர்ந்து கொள்ள வேண்டாம்.',
    verifyButton: 'OTP சரிபார்க்கவும்',
    errorDefault: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CompleteProfileScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  completeProfile: {
    title: 'உங்கள் சுயவிவரத்தை நிறைவு செய்யுங்கள்',
    stepText: 'படி {step} / {total}',
    welcomeTitle: 'வருக!',
    welcomeBody: 'பீமா கோல்ட் ட்ரீ உடன் உங்கள் தங்க முதலீட்டு பயணத்தைத் தொடங்க உங்கள் சுயவிவரத்தை அமைப்போம்.',
    
    // Step 0 - Personal Details
    personalDetailsLabel: 'தனிப்பட்ட விவரங்கள்',
    fullNameLabel: 'முழு பெயர்',
    fullNamePlaceholder: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    mobileLabel: 'மொபைல் எண்',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'your.email@example.com',
    dobLabel: 'பிறந்த தேதி',
    anniversaryLabel: 'திருமண நாள் (விரும்பினால்)',
    datePlaceholder: 'நாள்/மாதம்/ஆண்டு',
    
    // Step 1 - Address & Branch
    addressBranchLabel: 'முகவரி & கிளை',
    address1Label: 'முகவரி வரி 1',
    address1Placeholder: 'வீடு / கதவு / தெரு',
    address2Label: 'முகவரி வரி 2',
    address2Placeholder: 'அடையாளம் / அடுக்குமாடி',
    areaLabel: 'பகுதி',
    areaPlaceholder: 'பகுதி / இடம்',
    cityLabel: 'நகரம்',
    cityPlaceholder: 'நகரம்',
    pincodeLabel: 'அஞ்சல் குறியீடு',
    pincodePlaceholder: '560001',
    stateLabel: 'மாநிலம்',
    statePlaceholder: 'மாநிலத்தைத் தேர்ந்தெடுக்கவும்',
    branchLabel: 'விருப்பமான கிளை',
    branchPlaceholder: 'கிளையைத் தேர்ந்தெடுக்கவும்',
    branchCodePlaceholder: 'கிளை குறியீட்டை உள்ளிடவும்',
    
    // Step 2 - KYC
    kycLabel: 'KYC விவரங்கள்',
    kycInfo: 'உங்கள் KYC விவரங்கள் இணக்கத்திற்கு கட்டாயமானவை. அனைத்து தகவல்களும் மறைகுறியாக்கப்பட்டு பாதுகாப்பாக சேமிக்கப்படுகின்றன.',
    panLabel: 'PAN எண்',
    panPlaceholder: 'ABCDE1234F',
    aadhaarLabel: 'ஆதார் எண்',
    aadhaarPlaceholder: '123456789012',
    
    // Step 3 - Bank
    bankLabel: 'வங்கி விவரங்கள் (விரும்பினால்)',
    bankInfo: 'வங்கி விவரங்கள் விரும்பினால் ஆனால் எதிர்கால தானியங்கி பற்று மற்றும் திருப்பிச் செலுத்துதலுக்கு பரிந்துரைக்கப்படுகிறது.',
    bankNameLabel: 'வங்கியின் பெயர்',
    bankNamePlaceholder: 'HDFC வங்கி',
    accountLabel: 'கணக்கு எண்',
    accountPlaceholder: '1234567890',
    ifscLabel: 'IFSC குறியீடு',
    ifscPlaceholder: 'HDFC0001234',
    
    // Buttons
    continueButton: 'தொடரவும்',
    completeButton: 'சுயவிவரத்தை நிறைவு செய்யவும்',
    backButton: 'பின்',
    doneButton: 'முடிந்தது',
    
    // Validation Messages
    nameRequired: 'பெயர் தேவை',
    mobileRequired: 'மொபைல் தேவை',
    dobRequired: 'பிறந்த தேதி தேவை',
    nameAlphabets: 'பெயரில் எழுத்துக்கள் மட்டுமே இருக்க வேண்டும்',
    mobile10Digits: 'மொபைல் எண் சரியாக 10 இலக்கங்களாக இருக்க வேண்டும்',
    emailInvalid: 'மின்னஞ்சலில் @ இருக்க வேண்டும்',
    addressRequired: 'முகவரி தேவை',
    cityRequired: 'நகரம் தேவை',
    pincodeRequired: 'அஞ்சல் குறியீடு தேவை',
    stateRequired: 'மாநிலம் தேவை',
    pincode6Digits: 'அஞ்சல் குறியீடு சரியாக 6 இலக்கங்களாக இருக்க வேண்டும்',
    panFormat: 'PAN ABCDE1234F வடிவத்தில் இருக்க வேண்டும்',
    aadhaar12Digits: 'ஆதார் எண் சரியாக 12 இலக்கங்களாக இருக்க வேண்டும்',
    fixErrors: 'அனைத்து சரிபார்ப்பு பிழைகளையும் சரிசெய்யவும்',
    
    // Alerts
    successTitle: 'வெற்றி',
    successMessage: 'வாடிக்கையாளர் சேமிக்கப்பட்டது. SAP ஒத்திசைவு நிலுவையில் உள்ளது.',
    errorTitle: 'பிழை',
    unexpectedError: 'எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DashboardScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  dashboard: {
    welcomeBack: 'மீண்டும் வருக',
    welcome: 'வருக',
    guest: 'விருந்தினர்',
    investmentLabel: 'முதலீடு',
    goldHoldings: 'தங்க இருப்பு',
    gold22k: '22K தங்கம்',
    totalInvestment: 'மொத்த முதலீடு',
    joinNewScheme: 'புதிய தங்கத் திட்டத்தில் சேரவும்',
    myEnrolledSchemes: 'எனது பதிவு செய்த திட்டங்கள்',
    viewAllPortfolio: 'அனைத்து போர்ட்ஃபோலியோவையும் காணவும்',
    dueLabel: 'நிலுவை:',
    todaysGoldRate: 'இன்றைய தங்க விலை',
    live: 'நேரடி',
    perGram22k: 'ஒரு கிராமுக்கு (22K தங்கம்)',
    viewAllMetalRates: 'அனைத்து உலோக விலைகளையும் காணவும் >',
    recommendedForYou: 'உங்களுக்காக பரிந்துரைக்கப்படுகிறது',
    viewAll: 'அனைத்தையும் காணவும்',
    mostPopular: 'மிகவும் பிரபலமான',
    fixedMonthly: 'நிலையான மாதாந்திர',
    exploreDetails: 'விவரங்களை ஆராயுங்கள்',
    marketAnalytics: 'சந்தை பகுப்பாய்வு',
    goldRate1g: '22K தங்க விலை / 1G',
    recentTransactions: 'சமீபத்திய பரிவர்த்தனைகள்',
    history: 'வரலாறு',
    installmentPayment: 'தவணை செலுத்துதல்',
    success: 'வெற்றி',
    needAssistance: 'உதவி தேவையா?',
    whatsappSupport: 'வாட்ஸ்அப் ஆதரவு',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ProfileScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  profile: {
    title: 'எனது சுயவிவரம்',
    personalDetails: 'தனிப்பட்ட விவரங்கள்',
    dobLabel: 'பிறந்த தேதி',
    anniversaryLabel: 'திருமண நாள்',
    contactInfo: 'தொடர்பு தகவல்',
    mobileLabel: 'மொபைல் எண்',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    addressLabel: 'முகவரி',
    branchDetails: 'கிளை விவரங்கள்',
    preferredBranch: 'விருப்பமான கிளை',
    languagePreference: 'மொழி விருப்பம்',
    appLanguage: 'பயன்பாட்டு மொழி',
    languageHint: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    english: 'English',
    tamil: 'தமிழ்',
    kycDetails: 'KYC விவரங்கள்',
    panLabel: 'PAN எண்',
    aadhaarLabel: 'ஆதார் எண்',
    bankDetails: 'வங்கி விவரங்கள்',
    bankNameLabel: 'வங்கியின் பெயர்',
    accountLabel: 'கணக்கு எண்',
    ifscLabel: 'IFSC குறியீடு',
    logout: 'வெளியேறு',
    editProfile: 'சுயவிவரத்தைத் திருத்தவும்',
    loginRequired: 'உங்கள் சுயவிவரத்தைக் காண உள்நுழையவும்.',
    loadFailed: 'சுயவிவரத்தை ஏற்ற முடியவில்லை.',
    loadError: 'சுயவிவரத்தை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைக',
    idLabel: 'அடையாளம்:',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EditProfileScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  editProfile: {
    title: 'சுயவிவரத்தைத் திருத்தவும்',
    personalDetails: 'தனிப்பட்ட விவரங்கள்',
    fullNameLabel: 'முழு பெயர்',
    fullNamePlaceholder: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    mobileLabel: 'மொபைல் எண்',
    mobilePlaceholder: '10 இலக்க மொபைல் எண்',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'மின்னஞ்சல் முகவரியை உள்ளிடவும்',
    dobLabel: 'பிறந்த தேதி',
    dobPlaceholder: 'நாள்/மாதம்/ஆண்டு',
    anniversaryLabel: 'திருமண நாள்',
    
    addressInfo: 'முகவரி தகவல்',
    address1Label: 'முகவரி வரி 1',
    address1Placeholder: 'வீடு / கதவு / தெரு',
    address2Label: 'முகவரி வரி 2',
    address2Placeholder: 'அடையாளம் / பகுதி',
    areaLabel: 'பகுதி',
    areaPlaceholder: 'பகுதி / இடம்',
    cityLabel: 'நகரம்',
    cityPlaceholder: 'நகரம்',
    pincodeLabel: 'அஞ்சல் குறியீடு',
    pincodePlaceholder: '560001',
    stateLabel: 'மாநிலம்',
    statePlaceholder: 'மாநிலத்தைத் தேர்ந்தெடுக்கவும்',
    
    preferredBranch: 'விருப்பமான கிளை',
    branchLabel: 'கிளை',
    branchPlaceholder: 'கிளையைத் தேர்ந்தெடுக்கவும்',
    branchCodePlaceholder: 'கிளை குறியீடு',
    
    kycDetails: 'KYC விவரங்கள்',
    panLabel: 'PAN எண்',
    panPlaceholder: 'ABCDE1234F',
    aadhaarLabel: 'ஆதார் எண்',
    aadhaarPlaceholder: '12 இலக்க ஆதார்',
    
    bankDetails: 'வங்கி விவரங்கள் (விரும்பினால்)',
    bankNameLabel: 'வங்கியின் பெயர்',
    bankNamePlaceholder: 'HDFC வங்கி',
    accountLabel: 'கணக்கு எண்',
    accountPlaceholder: '1234567890',
    ifscLabel: 'IFSC குறியீடு',
    ifscPlaceholder: 'HDFC0001234',
    
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
    
    // Validation
    nameRequired: 'பெயர் தேவை',
    mobileRequired: 'மொபைல் எண் தேவை',
    dobRequired: 'பிறந்த தேதி தேவை',
    nameAlphabets: 'பெயரில் எழுத்துக்கள் மட்டுமே இருக்க வேண்டும்',
    mobile10Digits: 'மொபைல் எண் சரியாக 10 இலக்கங்களாக இருக்க வேண்டும்',
    emailInvalid: 'மின்னஞ்சலில் @ இருக்க வேண்டும்',
    addressRequired: 'முகவரி தேவை',
    cityRequired: 'நகரம் தேவை',
    pincodeRequired: 'அஞ்சல் குறியீடு தேவை',
    stateRequired: 'மாநிலம் தேவை',
    pincode6Digits: 'அஞ்சல் குறியீடு சரியாக 6 இலக்கங்களாக இருக்க வேண்டும்',
    selectState: 'பட்டியலிலிருந்து மாநிலத்தைத் தேர்ந்தெடுக்கவும்',
    panFormat: 'PAN ABCDE1234F வடிவத்தில் இருக்க வேண்டும்',
    aadhaar12Digits: 'ஆதார் எண் சரியாக 12 இலக்கங்களாக இருக்க வேண்டும்',
    fixErrors: 'அனைத்து சரிபார்ப்பு பிழைகளையும் சரிசெய்யவும்',
    
    // Alerts
    successTitle: 'வெற்றி',
    successMessage: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.',
    errorTitle: 'பிழை',
    notLoggedIn: 'நீங்கள் உள்நுழையவில்லை.',
    updateFailed: 'சுயவிவரத்தைப் புதுப்பிக்க முடியவில்லை.',
    unexpectedError: 'எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MySchemesScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  mySchemes: {
    title: 'எனது தங்க போர்ட்ஃபோலியோ',
    totalInvested: 'மொத்த முதலீடு',
    bonusEarned: 'பெறப்பட்ட போனஸ்',
    joinNewScheme: 'புதிய திட்டத்தில் சேரவும்',
    filterAll: 'அனைத்தும்',
    filterActive: 'செயலில்',
    filterMatured: 'முதிர்வடைந்தது',
    filterRedeemed: 'மீட்டெடுக்கப்பட்டது',
    maturityLabel: 'முதிர்வு:',
    totalInvestedLabel: 'மொத்த முதலீடு',
    eligibleValue: 'தகுதியான மதிப்பு',
    bonusLabel: 'போனஸ்:',
    waiver: 'தள்ளுபடி',
    viewDetails: 'விவரங்களைக் காணவும்',
    payNow: 'இப்போது செலுத்தவும்',
    redeem: 'மீட்டெடுக்கவும்',
    loginRequired: 'உங்கள் போர்ட்ஃபோலியோவைக் காண உள்நுழையவும்.',
    loadFailed: 'போர்ட்ஃபோலியோவை ஏற்ற முடியவில்லை.',
    loadError: 'போர்ட்ஃபோலியோவை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைக',
    noSchemes: 'இந்த வகையில் திட்டங்கள் எதுவும் இல்லை.',
    footerMain: 'நிலையாக இருங்கள், உங்கள் போனஸைப் பாதுகாக்கவும்.',
    footerSub: 'உங்கள் மாதாந்திர தவணைகளை சரியான நேரத்தில் செலுத்துங்கள்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MySchemeDetailsScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  mySchemeDetails: {
    title: 'எனது தங்க போர்ட்ஃபோலியோ',
    totalPaid: 'மொத்தம் செலுத்தியது',
    eligibleValue: 'தகுதியான மதிப்பு',
    schemeDetailedAnalysis: 'திட்ட விரிவான பகுப்பாய்வு',
    installmentTimeline: 'தவணை காலவரிசை',
    paidLabel: 'செலுத்தப்பட்டது',
    installmentsComplete: 'தவணைகள் நிறைவடைந்தன',
    bonusValue: 'போனஸ் மதிப்பு',
    bonusCaption: 'திட்ட நிறைவில் போனஸ்',
    maturityValue: 'முதிர்வு மதிப்பு',
    maturityCaption: 'முதிர்வில் எதிர்பார்க்கப்படுவது',
    paymentOverdue: 'செலுத்துதல் காலாவதியானது',
    nextPayment: 'அடுத்த செலுத்துதல்',
    dueLabel: 'நிலுவை:',
    close: 'மூடு',
    loginRequired: 'திட்ட விவரங்களைக் காண உள்நுழையவும்.',
    loadFailed: 'திட்ட விவரங்களை ஏற்ற முடியவில்லை.',
    loadError: 'விவரங்களை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    notFound: 'திட்டம் கிடைக்கவில்லை.',
    login: 'உள்நுழைக',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SelectSchemeScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  selectScheme: {
    title: 'திட்டத்தைத் தேர்ந்தெடுக்கவும்',
    bhimaExclusive: 'பீமா பிரத்யேகம்',
    duration: 'காலம்',
    startingAt: 'தொடங்கும் விலை',
    perMonth: '/மாதம்',
    flexible: 'நெகிழ்வான',
    premiumBenefits: 'பிரீமியம் நன்மைகள்',
    loadFailed: 'திட்டங்களை ஏற்ற முடியவில்லை.',
    loadError: 'திட்டங்களை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைக',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SchemeDetailsScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  schemeDetails: {
    headerLogo: 'பீமா செக்யூர்',
    saveFor: 'சேமிக்கவும்',
    months: 'மாதங்கள்',
    getBonus: '1 மாத போனஸ் பெறுங்கள்',
    
    // Benefit Card
    exclusiveBenefit: 'பிரத்யேக நன்மை',
    completeInstallments: 'நிறைவு செய்யுங்கள்',
    installmentsGet: 'தவணைகள் – 1 மாத தவணை பெறுங்கள்',
    free: 'இலவசம்',
    
    // Briefing
    schemeBriefing: 'திட்ட சுருக்கம்',
    monthlyInstallmentsFrom: 'மாதாந்திர தவணைகள்',
    to: 'முதல்',
    flexibleInstallments: 'நெகிழ்வான மாதாந்திர தவணைகள் கிடைக்கின்றன.',
    
    // Bonus
    schemeBenefit: 'திட்ட நன்மை',
    andReceive: 'மற்றும்\nபெறுங்கள்',
    bonusBadge: '1 மாத தவணை போனஸாக',
    
    // Select Plan
    selectPlan: 'திட்டத்தைத் தேர்ந்தெடுக்கவும்',
    mo: 'மா',
    
    // Projected Maturity
    projectedMaturity: 'எதிர்பார்க்கப்படும் முதிர்வு',
    monthlyAmount: 'மாதாந்திர தொகை',
    monthTotal: '-மாத மொத்தம்',
    schemeBonus: 'திட்ட போனஸ்',
    gift: 'பரிசு',
    estGold: 'மதிப்பிடப்பட்ட தங்கம்',
    totalMaturityValue: 'மொத்த முதிர்வு மதிப்பு',
    calculatingMaturity: 'முதிர்வு கணக்கிடப்படுகிறது…',
    selectPlanAbove: 'எதிர்பார்க்கப்படும் முதிர்வைக் காண மேலே திட்டத்தைத் தேர்ந்தெடுக்கவும்.',
    
    // Timeline
    savingsTimeline: 'சேமிப்பு காலவரிசை',
    monthsSavingPeriod: 'மாதங்கள் சேமிப்பு காலம்',
    plusBonus: '+ 1 மாத போனஸ்',
    bonus: 'போனஸ்',
    
    // Terms
    termsLabel: 'விதிமுறைகள் & நிபந்தனைகள்',
    agreeTerms: 'நான் ஒப்புக்கொள்கிறேன்',
    termsConditions: 'விதிமுறைகள் & நிபந்தனைகள்',
    andConfirm: 'மற்றும் போனஸ் தகுதி அளவுகோல் உள்ளிட்ட திட்ட விவரங்களை படித்தேன் என்பதை உறுதிப்படுத்துகிறேன்.',
    
    // CTA
    joinSchemeNow: 'இப்போது திட்டத்தில் சேரவும்',
    pleaseAcceptTerms: 'விதிமுறைகள் மற்றும் நிபந்தனைகளை ஏற்றுக்கொள்ளவும்',
    
    // Errors
    somethingWrong: 'ஏதோ தவறு நடந்தது.',
    loginError: 'தொடர உள்நுழையவும்.',
    enrollmentFailed: 'பதிவு தொடங்க முடியவில்லை.',
    login: 'உள்நுழைக',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // JoinSchemeScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  joinScheme: {
    title: 'திட்டத்தில் சேரவும்',
    pageTitle: 'பதிவு விவரங்கள்',
    pageSubTitle: 'திட்டத்தில் சேர படிவத்தை நிறைவு செய்யவும்.',
    monthlyInstallment: 'மாதாந்திர தவணை',
    planLabel: 'திட்டம்',
    perMonth: 'மாதத்திற்கு',
    maturityValue: 'முதிர்வு மதிப்பு',
    fromSelectedPlan: 'தேர்ந்தெடுக்கப்பட்ட திட்டத்திலிருந்து',
    nomineeDetails: 'நாமினி விவரங்கள்',
    fullNameLabel: 'முழு பெயர்',
    fullNamePlaceholder: 'நாமினியின் முழு பெயரை உள்ளிடவும்',
    relationshipLabel: 'உறவு',
    salesPersonLabel: 'விற்பனையாளர் பெயர் (விரும்பினால்)',
    salesPersonPlaceholder: 'பொருந்தினால் விற்பனையாளர் பெயரை உள்ளிடவும்',
    firstPaymentNotice: 'முதல் செலுத்துதல் நிலுவை: முதல் தவணை வெற்றிகரமாக செலுத்தப்பட்டவுடன் உங்கள் பதிவு உறுதிப்படுத்தப்படும்.',
    proceedToPayment: 'செலுத்துதலுக்குச் செல்லவும்',
    
    // Errors/Alerts
    loginError: 'தொடர உள்நுழையவும்.',
    startFromScheme: 'திட்ட விவரங்களிலிருந்து தொடங்கி மீண்டும் முயற்சிக்கவும்.',
    unableToContinue: 'தொடர இயலவில்லை',
    saveFailed: 'பதிவு விவரங்களைச் சேமிக்க முடியவில்லை.',
    paymentTitle: 'செலுத்துதல்',
    orderFailed: 'ஆர்டர் உருவாக்கம் தோல்வியடைந்தது.',
    missingKey: 'செலுத்துதல் விசை காணவில்லை. மீண்டும் முயற்சிக்கவும்.',
    errorTitle: 'பிழை',
    unexpectedError: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NotificationsScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  notifications: {
    title: 'அறிவிப்புகள்',
    newNotification: 'புதிய அறிவிப்பு',
    newNotifications: 'புதிய அறிவிப்புகள்',
    markAllRead: 'அனைத்தையும் படித்ததாகக் குறிக்கவும்',
    today: 'இன்று',
    yesterday: 'நேற்று',
    earlier: 'முன்னர்',
    loginRequired: 'உள்நுழையவும்.',
    loadFailed: 'அறிவிப்புகளை ஏற்ற முடியவில்லை.',
    loadError: 'அறிவிப்புகளை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைக',
    noNotifications: 'இன்னும் அறிவிப்புகள் இல்லை.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MetalRatesScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  metalRates: {
    title: 'உலோக விலைகள்',
    subtitle: 'நேரடி சந்தை விலைகள்',
    lastUpdated: 'கடைசியாக புதுப்பிக்கப்பட்டது:',
    liveRatesLabel: 'நேரடி விலைகள்:',
    liveRatesInfo: 'விற்பனை விலைகள் குறிப்பீடு மட்டுமே மற்றும் கிளைகளில் மாறுபடலாம். வரிகள் கூடுதல்.',
    goldRates: 'தங்க விலைகள்',
    differentPurities: 'வெவ்வேறு தூய்மைகள் கிடைக்கின்றன.',
    otherMetals: 'பிற உலோகங்கள்',
    silverPlatinum: 'வெள்ளி & பிளாட்டினம்.',
    gold22k: 'தங்கம் 22K (916)',
    gold18k: 'தங்கம் 18K (750)',
    gold14k: 'தங்கம் 14K (585)',
    silver: 'வெள்ளி',
    platinum: 'பிளாட்டினம்',
    sellRate: 'விற்பனை விலை',
    perGram: 'ஒரு கிராமுக்கு',
    disclaimer: 'விலைகள் குறிப்பீடு மட்டுமே மற்றும் அறிவிப்பின்றி மாறக்கூடும். செய்கூலி, GST மற்றும் பிற வரிகள் கிளையில் பொருந்தும்.',
    startInvesting: 'இப்போது முதலீடு தொடங்குங்கள்',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ActivityHistoryScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  activityHistory: {
    title: 'பரிவர்த்தனை வரலாறு',
    searchPlaceholder: 'திட்டம் அல்லது தேதியால் தேடவும்...',
    totalInstallments: 'மொத்த தவணைகள்',
    transactions: 'பரிவர்த்தனைகள்',
    filterAll: 'அனைத்தும்',
    filterInstallments: 'தவணைகள்',
    installmentLabel: 'தவணை',
    today: 'இன்று',
    loginRequired: 'உள்நுழையவும்.',
    loadFailed: 'செலுத்துதல் வரலாற்றை ஏற்ற முடியவில்லை.',
    loadError: 'வரலாற்றை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைக',
    noTransactions: 'பரிவர்த்தனைகள் எதுவும் இல்லை.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GoldRedemptionScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  goldRedemption: {
    title: 'தங்க மீட்பு',
    maturedScheme: 'முதிர்வடைந்த திட்டம்',
    totalValue: 'மொத்த மதிப்பு',
    bonusLabel: 'போனஸ்',
    eligibilityStatus: 'தகுதி நிலை',
    fullyMatured: 'திட்டம் முழுமையாக முதிர்வடைந்தது',
    eligibleToChoose: 'நீங்கள் மீட்பு விருப்பத்தைத் தேர்வு செய்ய தகுதியானவர்.',
    privilegesTitle: 'உங்கள் மீட்பு சலுகைகள்:',
    privilege1: 'உத்தரவாதமான நேரடி விலை மீட்பு',
    privilege2: 'நெகிழ்வான சேகரிப்பு விருப்பங்கள்',
    privilege3: 'வெளிப்படையான விலை, மறைந்த கட்டணங்கள் இல்லை',
    chooseMode: 'மீட்பு முறையைத் தேர்ந்தெடுக்கவும்',
    jewelleryTitle: 'நகை',
    recommended: 'பரிந்துரைக்கப்படுகிறது',
    jewelleryDescription: 'எந்த கிளையையும் பார்வையிட்டு உங்கள் தங்க தகுதி மற்றும் சலுகைகளின்படி மீட்டெடுக்கவும்.',
    jewelleryPoint1: '12% மாத போனஸ் பயன்படுத்தப்பட்டது',
    jewelleryPoint2: 'முன்னுரிமை கடை சேவை',
    shopOnlineTitle: 'ஆன்லைனில் ஷாப்பிங்',
    shopOnlineDescription: 'வீட்டிலிருந்தே ஷாப்பிங் செய்ய விரும்புகிறீர்களா? எங்கள் ஆன்லைன் ஸ்டோரில் கூப்பன் பயன்படுத்தி உங்கள் திட்டத் தொகையை மீட்டெடுக்கலாம்.',
    shopOnlinePoint1: 'உங்கள் மீட்பு கோரிக்கையை சமர்ப்பிக்கவும்',
    shopOnlinePoint2: 'உங்கள் கோரிக்கை எங்கள் குழுவால் செயல்படுத்தப்படும்',
    infoText: 'நகை மீட்பு செய்கூலி தள்ளுபடி மற்றும் போனஸ் கிரெடிட்களுடன் உங்கள் நன்மைகளை அதிகரிக்கிறது.',
    proceedToRedeem: 'மீட்டெடுக்கச் செல்லவும்',
    generateCoupon: 'ஆன்லைன் கூப்பன் உருவாக்கவும்',
    loginError: 'உள்நுழையவும்.',
    profileLoadError: 'வாடிக்கையாளர் சுயவிவரத்தை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    redemptionTitle: 'மீட்பு',
    requestFailed: 'கோரிக்கையை நிறைவு செய்ய முடியவில்லை.',
    errorTitle: 'பிழை',
    unexpectedError: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PaymentMethodScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  paymentMethod: {
    title: 'செலுத்துதல்',
    schemeRegistration: 'திட்ட_பதிவு',
    installmentPayment: 'தவணை செலுத்துதல்',
    autopaySecured: 'தானியங்கி செலுத்துதல் பாதுகாக்கப்பட்டது',
    paymentGateway: 'செலுத்துதல் நுழைவாயில்',
    razorpay: 'ரேசர்பே',
    paymentMethods: 'UPI, கார்டுகள், நெட் பேங்கிங்',
    securePayment: 'பாதுகாப்பான செலுத்துதல்',
    securePaymentBody: 'உங்கள் செலுத்துதல் வங்கி-தர பாதுகாப்புடன் ரேசர்பே மூலம் செயல்படுத்தப்படுகிறது.',
    bullet1: 'உடனடி செலுத்துதல் உறுதிப்படுத்தல்',
    bullet2: 'ஒன்றில் பல செலுத்துதல் விருப்பங்கள்',
    bullet3: 'திருப்பிச் செலுத்துதல் பாதுகாப்பு கிடைக்கிறது',
    paymentSummary: 'செலுத்துதல் சுருக்கம்',
    initialInstallment: 'ஆரம்ப தவணை',
    installment: 'தவணை',
    gatewayFee: 'நுழைவாயில் கட்டணம்',
    absorbedByUs: 'எங்களால் உள்வாங்கப்பட்டது',
    totalPayable: 'மொத்த செலுத்த வேண்டியது',
    paySecurely: 'செலுத்தவும்',
    securely: 'பாதுகாப்பாக',
    bhimaPure: 'பீமா ப்யூர்',
    schemePayment: 'திட்ட செலுத்துதல்',
    invalidAmount: 'தவறான தொகை',
    amountError: 'செலுத்துதல் தொகை பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்.',
    loginError: 'தொடர உள்நுழையவும்.',
    missingDetails: 'ரேசர்பே ஆர்டர் விவரங்கள் காணவில்லை. மீண்டும் முயற்சிக்கவும்.',
    paymentTitle: 'செலுத்துதல்',
    orderFailed: 'ஆர்டர் உருவாக்கம் தோல்வியடைந்தது.',
    verifyFailed: 'செலுத்துதலை சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்.',
    paymentCancelled: 'செலுத்துதல் ரத்து செய்யப்பட்டது.',
    paymentFailed: 'செலுத்துதல் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    unableToStart: 'செலுத்துதலைத் தொடங்க இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PaymentSuccessScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  paymentSuccess: {
    title: 'செலுத்துதல் வெற்றி!',
    subtitle: 'தவணை',
    credited: 'உங்கள் கணக்கில் வரவு வைக்கப்பட்டது.',
    backToPortfolio: 'போர்ட்ஃபோலியோவுக்குத் திரும்பு',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SelectShowroomScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  selectShowroom: {
    headerTitle: 'தங்க மீட்பு',
    title: 'ஷோரூமைத் தேர்ந்தெடுக்கவும்',
    subtitle: 'உங்கள் தங்கத்தை சேகரிக்க விரும்பும் கிளையைத் தேர்ந்தெடுக்கவும்.',
    nextStep: 'அடுத்த படி',
    loginRequired: 'உள்நுழையவும்.',
    loadFailed: 'கிளை பட்டியலை ஏற்ற முடியவில்லை.',
    loadError: 'கிளைகளை ஏற்ற இயலவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைக',
    profileLoadError: 'உங்கள் வாடிக்கையாளர் சுயவிவரத்தை ஏற்ற முடியவில்லை.',
    redemptionTitle: 'மீட்பு',
    updateFailed: 'மீட்பு முறையைப் புதுப்பிக்க முடியவில்லை.',
    errorTitle: 'பிழை',
    unexpectedError: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // RedemptionSuccessScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  redemptionSuccess: {
    title: 'உங்கள் ஷோரூம்\nவருகை உறுதிப்படுத்தப்பட்டது ✨',
    subtitle: 'உங்கள் தேர்ந்தெடுக்கப்பட்ட கடையை பார்வையிட்டு நகை வாங்குதலில் உங்கள் தங்கத் திட்ட நன்மைகளை அனுபவிக்கவும்.',
    backToPortfolio: 'போர்ட்ஃபோலியோவுக்குத் திரும்பு',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ShopOnlineSuccessScreen.tsx
  // ─────────────────────────────────────────────────────────────────────────────
  shopOnlineSuccess: {
    title: 'நீங்கள் ஆன்லைனில்\nஷாப்பிங் செய்ய தயார் ✨',
    subtitle: 'உங்கள் மீட்பு கோரிக்கை சமர்ப்பிக்கப்பட்டது. சரிபார்ப்புக்குப் பிறகு, உங்கள் பிரத்யேக கூப்பன் குறியீடு மின்னஞ்சல் வழியாக பகிரப்படும். எங்கள் பிரதிநிதி மேலும் ஆதரவுக்கு தொடர்பு கொள்ளலாம்.',
    backToPortfolio: 'போர்ட்ஃபோலியோவுக்குத் திரும்பு',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Common / Shared
  // ─────────────────────────────────────────────────────────────────────────────
  common: {
    ok: 'சரி',
    cancel: 'ரத்து செய்',
    error: 'பிழை',
    success: 'வெற்றி',
    loading: 'ஏற்றுகிறது...',
    retry: 'மீண்டும் முயற்சிக்கவும்',
    login: 'உள்நுழைக',
    logout: 'வெளியேறு',
    save: 'சேமி',
    back: 'பின்',
    next: 'அடுத்து',
    done: 'முடிந்தது',
    close: 'மூடு',
    required: '*',
    rupeeSymbol: '₹',
    dash: '—',
    dot: '•',
  },
};

export type StaticTextsType = typeof STATIC_TEXTS_EN;

export const STATIC_TEXTS: Record<SupportedLanguage, StaticTextsType> = {
  en: STATIC_TEXTS_EN,
  ta: STATIC_TEXTS_TA,
};

export function getTexts(language: SupportedLanguage = 'en'): StaticTextsType {
  return STATIC_TEXTS[language] || STATIC_TEXTS.en;
}

export default STATIC_TEXTS;
