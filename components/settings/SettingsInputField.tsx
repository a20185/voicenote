import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import { Eye, EyeOff } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

interface SettingsInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export const SettingsInputField = React.memo(function SettingsInputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
}: SettingsInputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const isSecure = secureTextEntry && !showPassword;

  return (
    <YStack gap={6}>
      <Text fontSize={12} fontWeight="500" color={isDark ? '#9ca3af' : '#6b7280'}>
        {label}
      </Text>
      <XStack
        alignItems="center"
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' },
          focused && styles.inputFocused,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: isDark ? '#e5e7eb' : '#111827' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#4b5563' : '#9ca3af'}
          secureTextEntry={isSecure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            {showPassword ? (
              <EyeOff size={18} color={isDark ? '#6b7280' : '#9ca3af'} />
            ) : (
              <Eye size={18} color={isDark ? '#6b7280' : '#9ca3af'} />
            )}
          </Pressable>
        )}
      </XStack>
    </YStack>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
});
