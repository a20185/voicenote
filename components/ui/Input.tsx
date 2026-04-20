import { styled, GetProps } from 'tamagui';
import { Input as TamaguiInput } from 'tamagui';

export const Input = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '#f4f4f5',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e4e4e7',
  paddingHorizontal: 12,
  paddingVertical: 8,
  fontSize: 16,
  color: '#18181b',

  focusStyle: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },

  variants: {
    size: {
      sm: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 14,
      },
      md: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
      },
      lg: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
      },
    },
    variant: {
      filled: {
        backgroundColor: '#e4e4e7',
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: 'transparent',
      },
    },
    error: {
      true: {
        borderColor: '#ef4444',
        focusStyle: {
          borderColor: '#ef4444',
        },
      },
    },
  } as const,
  defaultVariants: {
    size: 'md',
  },
});

export type InputProps = GetProps<typeof Input>;
