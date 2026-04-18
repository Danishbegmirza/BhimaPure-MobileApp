import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import {
  fetchProfile,
  fetchBranchList,
  updateProfile,
  type BranchItem,
} from '../api/user';
import { getToken } from '../storage/auth';
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

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const STATE_LIST = INDIA_STATES as readonly string[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pass dates in DD/MM/YYYY format. */
function formatDateForApi(dmy: string): string {
  return dmy.trim();
}

function extractAddressParts(address: string): {
  address1: string;
  city: string;
  state: string;
} {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { address1: '', city: '', state: '' };
  }
  if (parts.length === 1) {
    return { address1: parts[0], city: '', state: '' };
  }
  if (parts.length === 2) {
    return { address1: parts[0], city: '', state: parts[1] };
  }
  return {
    address1: parts.slice(0, -2).join(', '),
    city: parts[parts.length - 2],
    state: parts[parts.length - 1],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

function InputRow({
  icon,
  value,
  setValue,
  placeholder,
  editable = true,
  keyboardType = 'default',
  error,
}: {
  icon: string;
  value: string;
  setValue?: (v: string) => void;
  placeholder: string;
  editable?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad';
  error?: string;
}) {
  return (
    <View>
      <View style={[styles.inputRow, !editable && styles.inputRowDisabled, error && styles.inputRowError]}>
        <Ionicons name={icon} size={15} color="#9CA3AF" />
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          editable={editable}
          keyboardType={keyboardType}
        />
      </View>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function EditProfileScreen({ navigation }: Props) {
  const safeBottom = useSafeBottomInset();
  // Data loading
  const [initialising, setInitialising] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile identity (for update)
  const [customerCode, setCustomerCode] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');

  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');

  // Branch dropdown (GET /api/branchlist with Bearer token — see fetchBranchList)
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formErrorBanner, setFormErrorBanner] = useState('');

  const loadData = useCallback(async () => {
    try {
      setInitialising(true);
      const token = await getToken();
      if (!token) { return; }

      // Fetch profile and branch list in parallel (branchlist: GET + Authorization Bearer)
      const [profileRes, branchRes] = await Promise.all([
        fetchProfile(token),
        fetchBranchList(token),
      ]);

      let preferredBranchRaw: string | null = null;
      if (profileRes.success) {
        const d = profileRes.data;
        const contact = d.contact_information;
        const fullAddress = contact?.address ?? '';
        const parsedAddress = extractAddressParts(fullAddress);

        preferredBranchRaw =
          d.branch_details?.preferred_branch_code
          ?? d.branch_details?.preferred_branch
          ?? null;

        setCustomerCode(d.customer_code ?? '');
        setFullName(d.name ?? '');
        setMobile(d.mobile ?? '');
        setEmail(d.email ?? '');
        setDob(d.personal_details?.dob ?? '');
        setAnniversary(d.personal_details?.wedding_anniversary ?? '');
        setAddress(contact?.address1 ?? parsedAddress.address1 ?? fullAddress);
        setAddress2(contact?.address2 ?? '');
        setArea(contact?.area ?? '');
        setCity(contact?.city ?? parsedAddress.city);
        setPincode((contact?.pin_code ?? contact?.pincode ?? '').replace(/\D/g, '').slice(0, 6));
        setState(contact?.state ?? parsedAddress.state);
        // Bank details
        setBankName(d.bank_details?.bank_name ?? '');
        setAccountNumber(d.bank_details?.account_number ?? '');
        setIfsc(d.bank_details?.ifsc ?? '');
        // KYC
        setPan(d.kyc_details?.pan_number ?? '');
        setAadhaar(d.kyc_details?.aadhaar_number ?? '');
      }

      const branchList = branchRes.success ? (branchRes.branchdata ?? []) : [];
      setBranches(branchList);

      const pref = preferredBranchRaw?.trim() ?? '';
      if (pref && branchList.length > 0) {
        const byCode = branchList.find(b => b.branch_code === pref);
        const byName = branchList.find(b => b.display_name === pref);
        setSelectedBranchCode((byCode ?? byName)?.branch_code ?? '');
      }
    } catch (_e) {
      // silent fail – user can still edit manually
    } finally {
      setInitialising(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBranch = branches.find(b => b.branch_code === selectedBranchCode);

  const onMobileChange = useCallback((v: string) => {
    setMobile(v.replace(/\D/g, '').slice(0, 10));
  }, []);

  const onPincodeChange = useCallback((v: string) => {
    setPincode(v.replace(/\D/g, '').slice(0, 6));
  }, []);

  const onPanChange = useCallback((v: string) => {
    setPan(v.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase());
  }, []);

  const onAadhaarChange = useCallback((v: string) => {
    setAadhaar(v.replace(/\D/g, '').slice(0, 12));
  }, []);

  const validateBeforeSave = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};
    const nameTrim = fullName.trim();
    const mobileTrim = mobile.trim();
    const emailTrim = email.trim();
    const panTrim = pan.trim().toUpperCase();

    if (!nameTrim) { nextErrors.fullName = 'Name is required'; }
    if (!mobileTrim) { nextErrors.mobile = 'Mobile number is required'; }
    if (!dob.trim()) { nextErrors.dob = 'Date of birth is required'; }
    if (!isValidFullNameLettersOnly(nameTrim)) {
      nextErrors.fullName = 'Name should contain only alphabets';
    }
    if (!isValidMobile10Digits(mobileTrim)) {
      nextErrors.mobile = 'Mobile number should be exactly 10 digits';
    }
    if (emailTrim && !isValidEmailHasAt(emailTrim)) {
      nextErrors.email = 'Email should contain @';
    }
    if (!address.trim()) { nextErrors.address = 'Address is required'; }
    if (!city.trim()) { nextErrors.city = 'City is required'; }
    if (!pincode.trim()) { nextErrors.pincode = 'Pincode is required'; }
    if (!state.trim()) { nextErrors.state = 'State is required'; }
    if (!isValidPincode6(pincode)) {
      nextErrors.pincode = 'Pincode should be exactly 6 digits';
    }
    if (!STATE_LIST.includes(state.trim())) {
      nextErrors.state = 'Please select a state from the list';
    }
    const aadhaarDigits = aadhaar.replace(/\D/g, '');
    if (panTrim && !isValidPanFormat(panTrim)) {
      nextErrors.pan = 'PAN should be in format ABCDE1234F';
    }
    if (aadhaarDigits && !isValidAadhaar12Digits(aadhaar)) {
      nextErrors.aadhaar = 'Aadhaar number should be exactly 12 digits';
    }

    setFormErrors(nextErrors);
    const hasErrors = Object.keys(nextErrors).length > 0;
    setFormErrorBanner(hasErrors ? 'Please fix all validation errors' : '');
    return !hasErrors;
  }, [aadhaar, address, city, dob, email, fullName, mobile, pan, pincode, state]);

  const handleSave = useCallback(async () => {
    if (!validateBeforeSave()) {
      return;
    }
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'You are not logged in.');
        return;
      }
      const result = await updateProfile(token, {
        name: fullName,
        mobileNo: mobile,
        emailId: email,
        birthDate: formatDateForApi(dob),
        weddingAnniversary: anniversary ? formatDateForApi(anniversary) : undefined,
        address1: address,
        address2: address2 || undefined,
        area: area || undefined,
        city,
        pinCode: pincode,
        state,
        branchCode: selectedBranchCode,
        panNo: pan,
        adharNo: aadhaar,
        bankName,
        accountNo: accountNumber,
        ifsc,
        customerCode,
      });
      if (result.success) {
        Alert.alert('Success', result.message ?? 'Profile updated successfully.', [
          { text: 'OK', onPress: () => goBackOrDashboard(navigation) },
        ]);
      } else {
        const errorMsg =
          result.errors
            ? Object.values(result.errors).flat().join('\n')
            : result.message ?? 'Failed to update profile.';
        Alert.alert('Error', errorMsg);
      }
    } catch (_e) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    validateBeforeSave,
    fullName, mobile, email, dob, anniversary, address, address2, area,
    city, pincode, state, selectedBranchCode, pan, aadhaar, bankName,
    accountNumber, ifsc, customerCode, navigation,
  ]);

  if (initialising) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 98 + safeBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {formErrorBanner ? (
          <View style={styles.formErrorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color="#B91C1C" />
            <Text style={styles.formErrorBannerText}>{formErrorBanner}</Text>
          </View>
        ) : null}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          {/* <View style={styles.iconBtn} /> */}
        </View>

        {/* Personal details */}
        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
        <Label text="FULL NAME" required />
        <InputRow icon="person-outline" value={fullName} setValue={(v) => { setFullName(v); setFormErrors(prev => ({ ...prev, fullName: '' })); }} placeholder="Enter your full name" error={formErrors.fullName} />
        <Label text="MOBILE NUMBER" required />
        <InputRow icon="call-outline" value={mobile} setValue={(v) => { onMobileChange(v); setFormErrors(prev => ({ ...prev, mobile: '' })); }} placeholder="10-digit mobile number" keyboardType="phone-pad" error={formErrors.mobile} />
        <Label text="EMAIL ADDRESS" />
        <InputRow icon="mail-outline" value={email} setValue={(v) => { setEmail(v); setFormErrors(prev => ({ ...prev, email: '' })); }} placeholder="Enter email address" keyboardType="email-address" error={formErrors.email} />
        <Label text="DATE OF BIRTH" required />
        <InputRow icon="calendar-outline" value={dob} setValue={(v) => { setDob(v); setFormErrors(prev => ({ ...prev, dob: '' })); }} placeholder="DD/MM/YYYY" error={formErrors.dob} />
        <Label text="ANNIVERSARY DATE" />
        <InputRow icon="heart-outline" value={anniversary} setValue={setAnniversary} placeholder="DD/MM/YYYY" />

        {/* Address */}
        <Text style={styles.sectionTitle}>ADDRESS INFORMATION</Text>
        <Label text="ADDRESS LINE 1" required />
        <InputRow icon="location-outline" value={address} setValue={(v) => { setAddress(v); setFormErrors(prev => ({ ...prev, address: '' })); }} placeholder="House / Door / Street" error={formErrors.address} />
        <Label text="ADDRESS LINE 2" />
        <InputRow icon="location-outline" value={address2} setValue={setAddress2} placeholder="Landmark / Area" />
        <Label text="AREA" />
        <InputRow icon="map-outline" value={area} setValue={setArea} placeholder="Area / Locality" />
        <View style={styles.row2}>
          <View style={styles.half}>
            <Label text="CITY" required />
            <InputRow icon="business-outline" value={city} setValue={(v) => { setCity(v); setFormErrors(prev => ({ ...prev, city: '' })); }} placeholder="City" error={formErrors.city} />
          </View>
          <View style={styles.half}>
            <Label text="PINCODE" required />
            <InputRow icon="keypad-outline" value={pincode} setValue={(v) => { onPincodeChange(v); setFormErrors(prev => ({ ...prev, pincode: '' })); }} placeholder="560001" keyboardType="number-pad" error={formErrors.pincode} />
          </View>
        </View>
        <Label text="STATE" required />
        <Pressable
          style={[styles.dropdownRow, formErrors.state && styles.inputRowError]}
          onPress={() => {
            setBranchDropdownOpen(false);
            setStateDropdownOpen(prev => !prev);
          }}
        >
          <Ionicons name="navigate-outline" size={15} color="#9CA3AF" />
          <Text style={[styles.dropdownText, !state.trim() && styles.dropdownPlaceholder]}>
            {state.trim() || 'Select state'}
          </Text>
          <Ionicons
            name={stateDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={15}
            color="#9CA3AF"
          />
        </Pressable>
        {stateDropdownOpen && (
          <View style={styles.dropdownList}>
            {INDIA_STATES.map(stateName => (
              <Pressable
                key={stateName}
                style={[
                  styles.dropdownItem,
                  stateName === state && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  setState(stateName);
                  setFormErrors(prev => ({ ...prev, state: '' }));
                  setStateDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    stateName === state && styles.dropdownItemTextActive,
                  ]}
                >
                  {stateName}
                </Text>
                {stateName === state && (
                  <Ionicons name="checkmark" size={14} color="#F39200" />
                )}
              </Pressable>
            ))}
          </View>
        )}
        {formErrors.state ? <Text style={styles.fieldErrorText}>{formErrors.state}</Text> : null}

        {/* Branch — dropdown from GET /api/branchlist; manual code if list empty */}
        <Text style={styles.sectionTitle}>PREFERRED BRANCH</Text>
        <Label text="BRANCH" />
        {branches.length > 0 ? (
          <>
            <Pressable
              style={[styles.dropdownRow, formErrors.branch && styles.inputRowError]}
              onPress={() => {
                setStateDropdownOpen(false);
                setBranchDropdownOpen(prev => !prev);
              }}
            >
              <Ionicons name="business-outline" size={15} color="#9CA3AF" />
              <Text style={[styles.dropdownText, !selectedBranch && styles.dropdownPlaceholder]}>
                {selectedBranch?.display_name ?? 'Select branch'}
              </Text>
              <Ionicons
                name={branchDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={15}
                color="#9CA3AF"
              />
            </Pressable>
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
                      <Ionicons name="checkmark" size={14} color="#F39200" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <InputRow
            icon="business-outline"
            value={selectedBranchCode}
            setValue={(v) => {
              setSelectedBranchCode(v);
              setFormErrors(prev => ({ ...prev, branch: '' }));
            }}
            placeholder="Branch code"
            error={formErrors.branch}
          />
        )}
        {branches.length > 0 && formErrors.branch ? (
          <Text style={styles.fieldErrorText}>{formErrors.branch}</Text>
        ) : null}

        {/* KYC */}
        <Text style={styles.sectionTitle}>KYC DETAILS</Text>
        <Label text="PAN NUMBER" />
        <InputRow icon="card-outline" value={pan} setValue={(v) => { onPanChange(v); setFormErrors(prev => ({ ...prev, pan: '' })); }} placeholder="ABCDE1234F" error={formErrors.pan} />
        <Label text="AADHAAR NUMBER" />
        <InputRow icon="card-outline" value={aadhaar} setValue={(v) => { onAadhaarChange(v); setFormErrors(prev => ({ ...prev, aadhaar: '' })); }} placeholder="12-digit Aadhaar" keyboardType="number-pad" error={formErrors.aadhaar} />

        {/* Bank */}
        <Text style={styles.sectionTitle}>BANK DETAILS (OPTIONAL)</Text>
        <Label text="BANK NAME" />
        <InputRow icon="business-outline" value={bankName} setValue={setBankName} placeholder="HDFC Bank" />
        <Label text="ACCOUNT NUMBER" />
        <InputRow icon="card-outline" value={accountNumber} setValue={setAccountNumber} placeholder="1234567890" keyboardType="number-pad" />
        <Label text="IFSC CODE" />
        <InputRow icon="document-text-outline" value={ifsc} setValue={setIfsc} placeholder="HDFC0001234" />
      </ScrollView>

      <View style={[styles.bottomCtaWrap, { paddingBottom: 14 + safeBottom }]}>
        <Pressable style={styles.bottomCta} onPress={handleSave} disabled={saving}>
          <LinearGradient
            colors={['#FFA800', '#F38B00']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.bottomCtaGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={14} color="#FFFFFF" />
                <Text style={styles.bottomCtaText}>SAVE CHANGES</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 14, paddingTop: 8, marginTop: 30 },
  formErrorBanner: {
    marginBottom: 10,
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
  formErrorBannerText: { color: '#B91C1C', fontSize: 11, fontFamily: 'Poppins-Medium' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    // borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
  },
  headerTitle: { color: '#111827', fontSize: 22, lineHeight: 28, fontFamily: 'Jost-BoldItalic', marginLeft:10},
  sectionTitle: {
    marginTop: 14,
    marginBottom: 6,
    color: '#96A0AE',
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: 'Poppins-Bold',
  },
  label: { marginBottom: 5, color: '#98A2B3', fontSize: 8, letterSpacing: 1.2, fontFamily: 'Poppins-SemiBold' },
  required: { color: '#EF4444' },
  inputRow: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 9,
    shadowColor: '#111827',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  inputRowDisabled: { backgroundColor: '#F3F4F6' },
  inputRowError: { borderColor: '#EF4444' },
  input: { flex: 1, color: '#131A28', fontSize: 13, fontFamily: 'Poppins-Medium' },
  fieldErrorText: { marginTop: -4, marginBottom: 8, color: '#DC2626', fontSize: 10, fontFamily: 'Poppins-Medium' },
  row2: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  // Branch dropdown
  dropdownRow: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 4,
  },
  dropdownText: { flex: 1, color: '#131A28', fontSize: 13, fontFamily: 'Poppins-Medium' },
  dropdownPlaceholder: { color: '#9CA3AF' },
  dropdownList: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 9,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: { backgroundColor: '#FFF8ED' },
  dropdownItemText: { color: '#374151', fontSize: 13, fontFamily: 'Poppins-Medium', flex: 1 },
  dropdownItemTextActive: { color: '#F39200', fontFamily: 'Poppins-Bold' },
  // Bottom CTA
  bottomCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EBEF',
  },
  bottomCta: {
    minHeight: 54,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#B45309',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  bottomCtaGradient: {
    width: '100%',
    minHeight: 54,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomCtaText: { color: '#FFFFFF', fontSize: 11, letterSpacing: 1.2, fontFamily: 'Poppins-Black' },
});
