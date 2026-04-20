import { styled, GetProps } from 'tamagui';
import { Button as TamaguiButton } from 'tamagui';

export const Button = styled(TamaguiButton, {
  name: 'Button',
  borderRadius: 8,
  variants: {
    variant: {
      primary: {
        backgroundColor: '#6366f1',
        color: 'white',
      },
      secondary: {
        backgroundColor: '#f4f4f5',
        color: '#18181b',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e4e4e7',
        color: '#18181b',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#18181b',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: 'white',
      },
    },
    size: {
      sm: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
      },
      md: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
      },
      lg: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        fontSize: 18,
      },
    },
  } as const,
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonProps = GetProps<typeof Button>;
