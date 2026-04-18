/** Shared rules for Complete Profile & Edit Profile screens */

export function isValidFullNameLettersOnly(name: string): boolean {
  return /^[A-Za-z ]+$/.test(name.trim());
}

export function isValidMobile10Digits(mobile: string): boolean {
  return /^\d{10}$/.test(mobile.trim());
}

export function isValidEmailHasAt(email: string): boolean {
  return email.trim().includes('@');
}

export function isValidPincode6(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

export function isValidPanFormat(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());
}

export function isValidAadhaar12Digits(aadhaar: string): boolean {
  const digits = aadhaar.replace(/\D/g, '');
  return /^\d{12}$/.test(digits);
}
