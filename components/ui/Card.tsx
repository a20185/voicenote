import { styled, GetProps } from 'tamagui';
import { View } from 'tamagui';

export const Card = styled(View, {
  name: 'Card',
  backgroundColor: '#f4f4f5',
  borderRadius: 12,
  padding: 16,

  variants: {
    variant: {
      elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      outlined: {
        borderWidth: 1,
        borderColor: '#e4e4e7',
      },
      filled: {
        backgroundColor: '#e4e4e7',
      },
    },
    padding: {
      none: {
        padding: 0,
      },
      sm: {
        padding: 8,
      },
      md: {
        padding: 16,
      },
      lg: {
        padding: 24,
      },
    },
  } as const,
  defaultVariants: {
    padding: 'md',
  },
});

export type CardProps = GetProps<typeof Card>;
