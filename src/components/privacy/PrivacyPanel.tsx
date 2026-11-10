import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Stack, Text } from '@/components/primitives';
import { useAuthStore } from '@/state/useAuthStore';
import { StyledButton } from '@/components/StyledButton';
import { SectionCard } from '@/components/shared/SectionCard';
import { CONTENT_MAX_WIDTH } from '@/theme/tokens';

const UPDATED = '10 November 2026';
const CONTACT_URL = 'https://github.com/rubenbubba/mobile-applications';

interface Section {
  title: string;
  lines: string[];
}

// Chapter 23.4.1: what, why, legal basis, how long, with whom, where, and which rights. In plain words.
const SECTIONS: Section[] = [
  {
    title: 'Who we are',
    lines: [
      'Vitrine is a student project at UCLL (Mobile Applications, 2026–2027). It helps small business owners see how they are doing online.',
    ],
  },
  {
    title: 'What we store and why',
    lines: [
      'Your email address and password, to log you in. Passwords are stored encrypted by our login provider; we never see them.',
      'The businesses you add (name, type, town, website address), so we know which website to check.',
      'Check results for those websites (availability, speed, search findings) and which issues you marked as fixed or which reviews you answered, so you can follow your progress.',
      'Legal basis: providing the service you asked for (contract). We do not use analytics, advertising or tracking.',
    ],
  },
  {
    title: 'Where it is stored and who receives it',
    lines: [
      'Our database and login run on Supabase, in an EU region (Frankfurt). Your data does not leave the EU there.',
      'The app itself is served by Vercel. It only delivers the app files and does not receive your account data.',
      'To measure speed, the website address of your business (not your personal data) is sent to Google PageSpeed Insights.',
      'We do not sell or share your data with anyone else.',
    ],
  },
  {
    title: 'How long we keep it',
    lines: [
      'As long as you have an account. Minute-by-minute availability results are deleted after 90 days.',
      'When you delete your account, everything above is deleted at once.',
    ],
  },
  {
    title: 'On your device',
    lines: [
      'The app saves your latest results on this device so they stay readable offline. Logging out of a real account removes them.',
      'In the demo, everything stays on this device and nothing is sent anywhere.',
    ],
  },
  {
    title: 'Your rights',
    lines: [
      'You can see, download and delete your data yourself: "Download my data" and "Delete my account" are in Settings, under Privacy.',
      'To correct a business, remove it in Settings and add it again. Its check results are deleted with it.',
      'For anything else, or a complaint, contact us through the project page below. You can also contact the Belgian Data Protection Authority (gegevensbeschermingsautoriteit.be).',
    ],
  },
];

export function PrivacyPanel() {
  // The policy is outside the tabs, so "Back" returns explicitly to where it was opened from.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const goBack = () => {
    if (from === 'register') router.replace('/register');
    else router.replace(isAuthenticated ? '/settings' : '/login');
  };

  return (
    <Screen padding="lg" maxWidth={CONTENT_MAX_WIDTH} testID="screen-privacy">
      <Stack gap="lg">
        <Stack gap="xs">
          <Text size="xxl" weight="bold" heading={1}>Privacy policy</Text>
          <Text tone="secondary">Last updated {UPDATED}. Short and in plain words.</Text>
        </Stack>

        {SECTIONS.map((section) => (
          <SectionCard key={section.title} title={section.title}>
            <Stack gap="sm">
              {section.lines.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
            </Stack>
          </SectionCard>
        ))}

        <SectionCard title="Contact" testID="privacy-contact">
          <Text selectable>{CONTACT_URL}</Text>
        </SectionCard>

        <StyledButton
          label="Back"
          variant="secondary"
          icon="arrow-back"
          onPress={goBack}
          testID="privacy-back"
        />
      </Stack>
    </Screen>
  );
}
