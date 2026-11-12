import { useState } from 'react';
import { InputField, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { normalizeWebsiteUrl } from '@/logic/url';
import { useMonitoringStore } from '@/state/useMonitoringStore';

interface AddBusinessFormProps {
  onAdded?: () => void;
}

export function AddBusinessForm({ onAdded }: AddBusinessFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [websiteError, setWebsiteError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const addBusiness = useMonitoringStore((state) => state.addBusiness);
  const isOnline = useOnlineStatus();

  const submit = async () => {
    const url = normalizeWebsiteUrl(website);
    setNameError(name.trim() === '' ? 'Enter the name of your business.' : undefined);
    setWebsiteError(url.ok ? undefined : url.error);
    if (name.trim() === '' || !url.ok) return;

    setIsSaving(true);
    try {
      await addBusiness({ name: name.trim(), category: category.trim(), city: city.trim(), websiteUrl: url.url });
      onAdded?.();
    } catch (caught) {
      setWebsiteError(caught instanceof Error ? caught.message : 'The business could not be saved. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="lg" testID="add-business-form">
      <InputField label="Business name" value={name} onChangeText={setName} placeholder="Bakery Sunfield" error={nameError} testID="business-name" />
      <InputField label="Type of business (optional)" value={category} onChangeText={setCategory} placeholder="Bakery" testID="business-category" />
      <InputField label="Town or city (optional)" value={city} onChangeText={setCity} placeholder="Leuven" testID="business-city" />
      <InputField
        label="Website"
        value={website}
        onChangeText={setWebsite}
        placeholder="www.yourbusiness.be"
        keyboardType="url"
        autoComplete="url"
        onSubmitEditing={submit}
        error={websiteError}
        testID="business-website"
      />
      <Text size="sm" tone="muted">
        Our server checks this website every 10 minutes and when you run a check. Nothing else is shared.
      </Text>
      <StyledButton
        label="Add and run the first check"
        icon="add-circle-outline"
        onPress={submit}
        isLoading={isSaving}
        disabled={!isOnline}
        hint={!isOnline ? 'You need a connection to add a business.' : undefined}
        testID="add-business-button"
      />
    </Stack>
  );
}
