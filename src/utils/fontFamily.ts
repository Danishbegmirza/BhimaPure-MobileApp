import type { SupportedLanguage } from '../staticTexts';

const POPPINS_TO_NOTO_CONDENSED: Record<string, string> = {
  'Poppins-Regular': 'NotoSans_Condensed-Regular',
  'Poppins-Medium': 'NotoSans_Condensed-Medium',
  'Poppins-SemiBold': 'NotoSans_Condensed-SemiBold',
  'Poppins-Bold': 'NotoSans_Condensed-Bold',
  'Poppins-Black': 'NotoSans_Condensed-Black',
  'Poppins-BoldItalic': 'NotoSans_Condensed-BoldItalic',
  'Poppins-ExtraBold': 'NotoSans_Condensed-ExtraBold',
  'Poppins-Light': 'NotoSans_Condensed-Light',
};

/** Returns NotoSans Condensed when Tamil is selected, otherwise the Poppins family. */
export function fontFamilyFor(language: SupportedLanguage, poppinsFamily: string): string {
  if (language !== 'ta') {
    return poppinsFamily;
  }
  return POPPINS_TO_NOTO_CONDENSED[poppinsFamily] ?? 'NotoSans_Condensed-Regular';
}

/** Shorthand for StyleSheet factories: `f('Poppins-Bold')` */
export function createFontPicker(language: SupportedLanguage) {
  return (poppinsFamily: string) => fontFamilyFor(language, poppinsFamily);
}
