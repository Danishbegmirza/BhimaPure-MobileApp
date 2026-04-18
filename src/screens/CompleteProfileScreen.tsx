import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import { createCustomer, fetchBranchList, type BranchItem } from '../api/user';
import { getCustomer, saveToken, getPendingMobile, clearPendingMobile } from '../storage/auth';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';
import { INDIA_STATES } from '../constants/indiaStates';
import {
  isValidAadhaar12Digits,
  isValidEmailHasAt,
  isValidFullNameLettersOnly,
  isValidMobile10Digits,
  isValidPanFormat,
  isValidPincode6,
} from '../utils/profileFieldValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

const TOTAL_STEPS = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pass dates in DD/MM/YYYY format (same as `formatDisplayDate` from the picker). */
function formatDateForApi(dmy: string): string {
  return dmy.trim();
}

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function parseDisplayDate(value: string): Date | null {
  const parts = value.split('/');
  if (parts.length !== 3) { return null; }
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function CompleteProfileScreen({ navigation }: Props) {
  const safeBottom = useSafeBottomInset();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0 – Personal
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('7415786458');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [activeDateField, setActiveDateField] = useState<'dob' | 'anniversary' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step 1 – Address & Branch
  const [street, setStreet] = useState('');
  const [address2, setAddress2] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);

  // Step 2 – KYC
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  // Step 3 – Bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState('');

  // Prepopulate mobile: prefer pending mobile (new-user flow), fall back to stored customer
  useEffect(() => {
    (async () => {
      const pending = await getPendingMobile();
      if (pending) {
        setMobileNumber(pending);
        return;
      }
      const customer = await getCustomer();
      if (customer?.mobile) { setMobileNumber(customer.mobile); }
    })();
  }, []);

  // Load branch list when reaching step 1
  const loadBranches = useCallback(async () => {
    if (branches.length > 0) { return; }
    try {
      setBranchLoading(true);
      // Branch list endpoint requires a token; use a dummy call to get
      // the list – if no token yet (new user), it may fail, so handle gracefully
      const { getToken } = await import('../storage/auth');
      const token = await getToken();
      if (!token) { return; }
      const result = await fetchBranchList(token);
      if (result.success) {
        setBranches(result.branchdata ?? []);
      }
    } catch (_e) {
      // silent – branch field stays editable as text
    } finally {
      setBranchLoading(false);
    }
  }, [branches.length]);

  useEffect(() => {
    if (step === 1) { loadBranches(); }
  }, [step, loadBranches]);

  const stepTitle = useMemo(() => `Step ${step + 1} of ${TOTAL_STEPS}`, [step]);
  const isLastStep = step === TOTAL_STEPS - 1;
  const continueLabel = isLastStep ? 'COMPLETE PROFILE' : 'CONTINUE';

  const selectedBranch = branches.find(b => b.branch_code === selectedBranchCode);
  const datePickerValue = useMemo(() => {
    const selectedValue = activeDateField === 'dob' ? dob : anniversary;
    return parseDisplayDate(selectedValue) ?? new Date(2000, 0, 1);
  }, [activeDateField, anniversary, dob]);

  const openDatePicker = useCallback((field: 'dob' | 'anniversary') => {
    setActiveDateField(field);
    setShowDatePicker(true);
  }, []);

  const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type !== 'set' || !selectedDate || !activeDateField) {
      return;
    }
    const formatted = formatDisplayDate(selectedDate);
    if (activeDateField === 'dob') {
      setDob(formatted);
      setFormErrors(prev => ({ ...prev, dob: '' }));
      return;
    }
    setAnniversary(formatted);
  }, [activeDateField]);

  const handleComplete = useCallback(async () => {
    try {
      setSubmitting(true);
      const result = await createCustomer({
        name: fullName,
        mobileNo: mobileNumber,
        emailId: email,
        birthDate: formatDateForApi(dob),
        weddingAnniversary: anniversary ? formatDateForApi(anniversary) : undefined,
        address1: street,
        address2: address2 || undefined,
        area: area || undefined,
        city,
        pinCode: pincode,
        state: stateValue,
        branchCode: selectedBranchCode,
        panNo: pan,
        adharNo: aadhaar,
        bankName,
        accountNo: accountNumber,
        ifsc,
        reqFromMobApp:true    
      });
      console.log('result',result);

      if (result.success && result.token) {
        await saveToken(result.token);
        await clearPendingMobile();
        navigation.replace('Dashboard');
      } else if (result.success && result.code === 'SAP_PENDING') {
        await clearPendingMobile();
        Alert.alert(
          'Success',
          result.message ?? 'Customer saved. SAP sync pending.',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
            },
          ],
        );
      } else {
        const errorMsg =
          result.errors
            ? Object.values(result.errors).flat().join('\n')
            : result.message ?? 'Failed to create account.';
        Alert.alert('Error', errorMsg);
      }
    } catch (_e) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [
    fullName, mobileNumber, email, dob, anniversary, street, address2, area,
    city, pincode, stateValue, selectedBranchCode, pan, aadhaar, bankName,
    accountNumber, ifsc, navigation,
  ]);

  const validateStep = useCallback((currentStep: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 0) {
      const nameTrim = fullName.trim();
      const emailTrim = email.trim();
      const mobileTrim = mobileNumber.trim();
      if (!nameTrim) { nextErrors.fullName = 'Name is required'; }
      if (!mobileTrim) { nextErrors.mobileNumber = 'Mobile is required'; }
      if (!dob.trim()) { nextErrors.dob = 'Date of birth is required'; }
      if (!isValidFullNameLettersOnly(nameTrim)) {
        nextErrors.fullName = 'Name should contain only alphabets';
      }
      if (!isValidMobile10Digits(mobileTrim)) {
        nextErrors.mobileNumber = 'Mobile number should be exactly 10 digits';
      }
      if (emailTrim && !isValidEmailHasAt(emailTrim)) {
        nextErrors.email = 'Email should contain @';
      }
    }

    if (currentStep === 1) {
      if (!street.trim()) { nextErrors.street = 'Address is required'; }
      if (!city.trim()) { nextErrors.city = 'City is required'; }
      if (!pincode.trim()) { nextErrors.pincode = 'Pincode is required'; }
      if (!stateValue.trim()) { nextErrors.stateValue = 'State is required'; }
      if (!isValidPincode6(pincode)) {
        nextErrors.pincode = 'Pincode should be exactly 6 digits';
      }
    }

    if (currentStep === 2) {
      const panTrim = pan.trim().toUpperCase();
      const aadhaarDigits = aadhaar.replace(/\D/g, '');
      if (panTrim && !isValidPanFormat(panTrim)) {
        nextErrors.pan = 'PAN should be in format ABCDE1234F';
      }
      if (aadhaarDigits && !isValidAadhaar12Digits(aadhaar)) {
        nextErrors.aadhaar = 'Aadhaar number should be exactly 12 digits';
      }
    }

    setFormErrors(nextErrors);
    const hasErrors = Object.keys(nextErrors).length > 0;
    setStepError(hasErrors ? 'Please fix all validation errors' : '');
    return !hasErrors;
  }, [aadhaar, city, dob, email, fullName, mobileNumber, pan, pincode, stateValue, street]);

  const onContinue = () => {
    if (!validateStep(step)) {
      return;
    }
    if (!isLastStep) {
      setStep(current => current + 1);
      return;
    }
    handleComplete();
  };

  const onBack = () => {
    if (step === 0) { goBackOrDashboard(navigation); return; }
    setStep(current => current - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.formArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + safeBottom }]}
          >
          {stepError ? (
            <View style={styles.stepErrorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color="#B91C1C" />
              <Text style={styles.stepErrorText}>{stepError}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.stepText}>{stepTitle}</Text>

          <View style={styles.progressWrap}>
            {Array.from({ length: TOTAL_STEPS }, (_, index) => (
              <View
                key={index}
                style={[styles.progressSegment, index <= step && styles.progressSegmentActive]}
              />
            ))}
          </View>

          {/* ── Step 0: Personal Details ───────────────────────────────────── */}
          {step === 0 && (
            <View>
              <View style={styles.welcomeCard}>
                <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                <View style={styles.welcomeTextWrap}>
                  <Text style={styles.welcomeTitle}>Welcome Aboard!</Text>
                  <Text style={styles.welcomeBody}>
                    Let&apos;s set up your profile to start your gold investment journey with Bhima
                    Gold Tree.
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
              <FormField label="FULL NAME" required icon="person-outline" value={fullName} onChangeText={(value) => { setFullName(value); setFormErrors(prev => ({ ...prev, fullName: '' })); }} placeholder="Enter your full name" error={formErrors.fullName} />
              <FormField label="MOBILE NUMBER" required icon="call-outline" value={mobileNumber} editable={false} error={formErrors.mobileNumber} />
              <FormField label="EMAIL ADDRESS" icon="mail-outline" value={email} onChangeText={(value) => { setEmail(value); setFormErrors(prev => ({ ...prev, email: '' })); }} placeholder="your.email@example.com" keyboardType="email-address" error={formErrors.email} />
              <DateField
                label="DATE OF BIRTH"
                required
                icon="calendar-outline"
                value={dob}
                placeholder="DD/MM/YYYY"
                onPress={() => openDatePicker('dob')}
                error={formErrors.dob}
              />
              <DateField
                label="ANNIVERSARY DATE (OPTIONAL)"
                icon="heart-outline"
                value={anniversary}
                placeholder="DD/MM/YYYY"
                onPress={() => openDatePicker('anniversary')}
              />
            </View>
          )}

          {/* ── Step 1: Address & Branch ───────────────────────────────────── */}
          {step === 1 && (
            <View>
              <Text style={styles.sectionLabel}>ADDRESS & BRANCH</Text>
              <FormField label="ADDRESS LINE 1" required icon="location-outline" value={street} onChangeText={(value) => { setStreet(value); setFormErrors(prev => ({ ...prev, street: '' })); }} placeholder="House / Door / Street" error={formErrors.street} />
              <FormField label="ADDRESS LINE 2" icon="location-outline" value={address2} onChangeText={setAddress2} placeholder="Landmark / Apartment" />
              <FormField label="AREA" icon="map-outline" value={area} onChangeText={setArea} placeholder="Area / Locality" />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FormField label="CITY" required value={city} onChangeText={(value) => { setCity(value); setFormErrors(prev => ({ ...prev, city: '' })); }} placeholder="City" error={formErrors.city} />
                </View>
                <View style={styles.halfField}>
                  <FormField
                    label="PINCODE"
                    required
                    value={pincode}
                    onChangeText={(value) => {
                      setPincode(value.replace(/\D/g, '').slice(0, 6));
                      setFormErrors(prev => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="560001"
                    keyboardType="number-pad"
                    error={formErrors.pincode}
                  />
                </View>
              </View>
              <View style={{marginBottom: 15}}></View>
              <Text style={styles.fieldLabel}>
                STATE
                <Text style={styles.required}> *</Text>
              </Text>
              <Pressable
                style={[styles.dropdownRow, formErrors.stateValue && styles.inputShellError]}
                onPress={() => setStateDropdownOpen(prev => !prev)}
              >
                <Ionicons name="navigate-outline" size={14} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !stateValue && styles.dropdownPlaceholder]}>
                  {stateValue || 'Select state'}
                </Text>
                <Ionicons
                  name={stateDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={14}
                  color="#9CA3AF"
                />
              </Pressable>
              {formErrors.stateValue ? <Text style={styles.fieldErrorText}>{formErrors.stateValue}</Text> : null}
              {stateDropdownOpen && (
                <View style={styles.dropdownList}>
                  {INDIA_STATES.map(stateName => (
                    <Pressable
                      key={stateName}
                      style={[
                        styles.dropdownItem,
                        stateName === stateValue && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setStateValue(stateName);
                        setFormErrors(prev => ({ ...prev, stateValue: '' }));
                        setStateDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          stateName === stateValue && styles.dropdownItemTextActive,
                        ]}
                      >
                        {stateName}
                      </Text>
                      {stateName === stateValue && (
                        <Ionicons name="checkmark" size={14} color="#F06F00" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Branch dropdown */}
              <View style={{marginBottom: 15}}></View>
              <Text style={styles.fieldLabel}>
                PREFERRED BRANCH
              </Text>
              {branchLoading ? (
                <ActivityIndicator size="small" color="#F59E0B" style={{ marginBottom: 15 }} />
              ) : branches.length > 0 ? (
                <>
                  <Pressable
                    style={[styles.dropdownRow, formErrors.branch && styles.inputShellError]}
                    onPress={() => setBranchDropdownOpen(prev => !prev)}
                  >
                    <Ionicons name="business-outline" size={14} color="#9CA3AF" />
                    <Text style={[styles.dropdownText, !selectedBranch && styles.dropdownPlaceholder]}>
                      {selectedBranch?.display_name ?? 'Select branch'}
                    </Text>
                    <Ionicons
                      name={branchDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={14}
                      color="#9CA3AF"
                    />
                  </Pressable>
                  {formErrors.branch ? <Text style={styles.fieldErrorText}>{formErrors.branch}</Text> : null}
                  {branchDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {branches.map(b => (
                        <Pressable
                          key={b.branch_code}
                          style={[
                            styles.dropdownItem,
                            b.branch_code === selectedBranchCode && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setSelectedBranchCode(b.branch_code);
                            setFormErrors(prev => ({ ...prev, branch: '' }));
                            setBranchDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              b.branch_code === selectedBranchCode && styles.dropdownItemTextActive,
                            ]}
                          >
                            {b.display_name}
                          </Text>
                          {b.branch_code === selectedBranchCode && (
                            <Ionicons name="checkmark" size={14} color="#F06F00" />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <FormField
                  label=""
                  value={selectedBranchCode}
                  onChangeText={(value) => {
                    setSelectedBranchCode(value);
                    setFormErrors(prev => ({ ...prev, branch: '' }));
                  }}
                  icon="business-outline"
                  placeholder="Enter branch code"
                  error={formErrors.branch}
                />
              )}
            </View>
          )}

          {/* ── Step 2: KYC ───────────────────────────────────────────────── */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionLabel}>KYC DETAILS</Text>
              <View style={styles.kycCard}>
                <Text style={styles.kycText}>
                  Your KYC details are mandatory for compliance. All information is encrypted and
                  securely stored.
                </Text>
              </View>
              <FormField
                label="PAN NUMBER"
                icon="card-outline"
                value={pan}
                onChangeText={(value) => {
                  setPan(value.toUpperCase());
                  setFormErrors(prev => ({ ...prev, pan: '' }));
                }}
                placeholder="ABCDE1234F"
                error={formErrors.pan}
              />
              <FormField
                label="AADHAAR NUMBER"
                icon="card-outline"
                value={aadhaar}
                onChangeText={(value) => {
                  setAadhaar(value.replace(/\D/g, '').slice(0, 12));
                  setFormErrors(prev => ({ ...prev, aadhaar: '' }));
                }}
                placeholder="123456789012"
                keyboardType="number-pad"
                error={formErrors.aadhaar}
              />
            </View>
          )}

          {/* ── Step 3: Bank ───────────────────────────────────────────────── */}
          {step === 3 && (
            <View>
              <Text style={styles.sectionLabel}>BANK DETAILS (OPTIONAL)</Text>
              <View style={styles.bankCard}>
                <Text style={styles.bankText}>
                  Bank details are optional but recommended for future auto-debit and refund
                  processing.
                </Text>
              </View>
              <FormField label="BANK NAME" icon="business-outline" value={bankName} onChangeText={setBankName} placeholder="HDFC Bank" />
              <FormField label="ACCOUNT NUMBER" icon="card-outline" value={accountNumber} onChangeText={setAccountNumber} placeholder="1234567890" keyboardType="number-pad" />
              <FormField label="IFSC CODE" icon="business-outline" value={ifsc} onChangeText={setIfsc} placeholder="HDFC0001234" />
            </View>
          )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: 12 + safeBottom }]}>
          {step > 0 && (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.continueButton, step === 0 && styles.continueButtonFull]}
            onPress={onContinue}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#FFA800', '#F38B00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.continueButtonGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.continueText}>{continueLabel}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
        {showDatePicker && activeDateField ? (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={datePickerValue}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
            {Platform.OS === 'ios' ? (
              <Pressable style={styles.datePickerDoneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// ─── FormField component ──────────────────────────────────────────────────────

type FormFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  icon?: string;
  dropdown?: boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad';
  placeholder?: string;
  onChangeText?: (value: string) => void;
  error?: string;
};

function FormField({
  label,
  value,
  required,
  icon,
  dropdown,
  editable = true,
  keyboardType = 'default',
  placeholder,
  onChangeText,
  error,
}: FormFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.inputShell, !editable && styles.inputShellDisabled, error && styles.inputShellError]}>
        {icon ? <Ionicons name={icon} size={14} color="#9CA3AF" /> : null}
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {dropdown ? <Ionicons name="chevron-down-outline" size={16} color="#9CA3AF" /> : null}
      </View>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  icon?: string;
  placeholder?: string;
  onPress: () => void;
  error?: string;
};

function DateField({
  label,
  value,
  required,
  icon,
  placeholder,
  onPress,
  error,
}: DateFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable style={[styles.inputShell, error && styles.inputShellError]} onPress={onPress}>
        {icon ? <Ionicons name={icon} size={14} color="#9CA3AF" /> : null}
        <Text style={[styles.input, styles.dateFieldText, !value && styles.dateFieldPlaceholder]}>
          {value || placeholder || 'DD/MM/YYYY'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  formArea: { flex: 1 },
  scrollContent: { marginLeft: 12, marginRight: 12 },
  stepErrorBanner: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepErrorText: { color: '#B91C1C', fontSize: 11, fontFamily: 'Poppins-Medium' },
  title: { color: '#111827', fontSize: 22, fontFamily: 'Jost-BoldItalic', letterSpacing: -0.5, marginTop: 40 },
  stepText: { marginTop: 4, color: '#6B7280', fontSize: 12, fontFamily: 'Poppins-Medium' },
  progressWrap: { marginTop: 16, flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#D6D9DF' },
  progressSegmentActive: { backgroundColor: '#F06F00' },
  welcomeCard: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#F68B00',
    padding: 24,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  welcomeTextWrap: { flex: 1 },
  welcomeTitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins-Bold' },
  welcomeBody: { marginTop: 5, color: '#FFFFFF', fontSize: 12, lineHeight: 18, fontFamily: 'Poppins-Medium' },
  sectionLabel: { marginTop: 30, color: '#8A93A4', letterSpacing: 2.2, fontSize: 10, fontFamily: 'Poppins-Bold' },
  row: { flexDirection: 'row', gap: 8 },
  halfField: { flex: 1 },
  kycCard: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: '#C9D8FA', backgroundColor: '#DCE8FF', padding: 12 },
  kycText: { color: '#1C398E', fontSize: 11, lineHeight: 15, fontFamily: 'Poppins-Medium' },
  bankCard: { marginTop: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F0E1A2', backgroundColor: '#FFF6D6', padding: 18 },
  bankText: { color: '#A16207', fontSize: 11, lineHeight: 15, fontFamily: 'Poppins-Medium' },
  fieldWrap: { marginTop: 15 },
  fieldLabel: { marginBottom: 7, color: '#8A93A4', letterSpacing: 1.8, fontSize: 9, fontFamily: 'Poppins-Bold' },
  required: { color: '#EF4444' },
  inputShell: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    borderRadius: 15,
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputShellDisabled: { backgroundColor: '#EFEFEF' },
  inputShellError: { borderColor: '#EF4444' },
  input: { flex: 1, marginLeft: 8, color: '#6B7280', fontSize: 14, fontFamily: 'Poppins-Medium' },
  fieldErrorText: { marginTop: 4, color: '#DC2626', fontSize: 10, fontFamily: 'Poppins-Medium' },
  // Branch dropdown
  dropdownRow: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    borderRadius: 15,
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  dropdownText: { flex: 1, color: '#6B7280', fontSize: 14, fontFamily: 'Poppins-Medium' },
  dropdownPlaceholder: { color: '#9CA3AF' },
  dropdownList: {
    marginTop: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: { backgroundColor: '#FFF8ED' },
  dropdownItemText: { color: '#374151', fontSize: 14, fontFamily: 'Poppins-Medium', flex: 1 },
  dropdownItemTextActive: { color: '#F06F00', fontFamily: 'Poppins-Bold' },
  footer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F5F0',
  },
  backButton: {
    minHeight: 60,
    minWidth: 78,
    borderRadius: 16,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backButtonText: { color: '#111827', fontFamily: 'Poppins-Bold', fontSize: 12 },
  continueButton: {
    width: '72%',
    minHeight: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    width: '100%',
    minHeight: 55,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  continueButtonFull: { flex: 0, width: '100%' ,},
  continueText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins-Black', letterSpacing: 0.8, marginTop: 2 },
  dateFieldText: { paddingVertical: 14 },
  dateFieldPlaceholder: { color: '#9CA3AF' },
  datePickerWrap: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  datePickerDoneText: {
    color: '#111827',
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
});

export default CompleteProfileScreen;
