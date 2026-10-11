import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';

export const colors = {
  primary: '#2f6b2f',
  border: '#cfd8cf',
  surface: '#f6faf6',
  text: '#1d241d',
  muted: '#4a554a',
  error: '#b42318',
};

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text style={styles.error} accessibilityRole="alert">{children}</Text>;
}

export function Field({ label, ...input }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#8a948a" {...input} />
    </View>
  );
}

export function Button({
  title,
  onPress,
  busy = false,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={[styles.button, primary ? styles.buttonPrimary : styles.buttonSecondary]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? '#fff' : colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choice} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          accessibilityRole="radio"
          accessibilityState={{ checked: o.value === value }}
          style={[styles.choiceItem, o.value === value && styles.choiceItemOn]}
        >
          <Text style={[styles.choiceText, o.value === value && styles.choiceTextOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Wrapping quick-pick buttons; tapping the selected one again clears it. */
export function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const on = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(on ? null : option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.chip, on && styles.choiceItemOn]}
          >
            <Text style={[styles.choiceText, on && styles.choiceTextOn]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 22, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, color: colors.muted },
  error: { fontSize: 15, color: colors.error },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    fontSize: 17,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: colors.text,
  },
  button: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { borderWidth: 1, borderColor: colors.primary },
  buttonText: { fontSize: 17, fontWeight: '600' },
  choice: { flexDirection: 'row', gap: 8 },
  choiceItem: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  choiceItemOn: { borderColor: colors.primary, backgroundColor: colors.surface },
  choiceText: { fontSize: 16, color: colors.muted },
  choiceTextOn: { color: colors.primary, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  section: { fontSize: 18, fontWeight: '600', marginTop: 12, color: colors.text },
  card: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 4 },
});
