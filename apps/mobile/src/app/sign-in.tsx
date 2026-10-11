import { normaliseGhanaPhone } from '@farmwisr/core';
import { useState } from 'react';
import { Body, Button, ErrorText, Field, Heading, Screen } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function SignIn() {
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const normalised = normaliseGhanaPhone(phoneInput);
    if (!normalised) {
      setError('Enter a Ghana mobile number, for example 024 123 4567.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase!.auth.signInWithOtp({ phone: normalised });
    setBusy(false);
    if (sendError) setError(sendError.message);
    else setPhone(normalised);
  }

  async function verifyCode() {
    if (!phone) return;
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase!.auth.verifyOtp({ phone, token: code.trim(), type: 'sms' });
    setBusy(false);
    // On success the auth listener updates the session and the router leaves this screen.
    if (verifyError) setError(verifyError.message);
  }

  if (!phone) {
    return (
      <Screen>
        <Heading>Sign in to FarmWisr</Heading>
        <Body>We will send a code by SMS to your phone.</Body>
        <Field
          label="Phone number"
          value={phoneInput}
          onChangeText={setPhoneInput}
          placeholder="024 123 4567"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          onSubmitEditing={sendCode}
        />
        {error && <ErrorText>{error}</ErrorText>}
        <Button title="Send code" onPress={sendCode} busy={busy} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>Enter your code</Heading>
      <Body>We sent a code to {phone}.</Body>
      <Field
        label="Code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        onSubmitEditing={verifyCode}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Sign in" onPress={verifyCode} busy={busy} />
      <Button
        title="Use a different number"
        variant="secondary"
        onPress={() => {
          setPhone(null);
          setCode('');
          setError(null);
        }}
      />
    </Screen>
  );
}
