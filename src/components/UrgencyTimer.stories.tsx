import type { Meta, StoryObj } from '@storybook/react';
import { UrgencyTimer } from './UrgencyTimer';

const meta = {
  title: 'Components/UrgencyTimer',
  component: UrgencyTimer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['beta-coupon', 'launch-offer', 'seasonal'],
    },
  },
} satisfies Meta<typeof UrgencyTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

// 24 hours from now (revenue optimization)
export const BetaCoupon24h: Story = {
  args: {
    expiry: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    variant: 'beta-coupon',
  },
};

// 48 hours from now (urgency)
export const LaunchOffer48h: Story = {
  args: {
    expiry: Math.floor(Date.now() / 1000) + (48 * 60 * 60),
    variant: 'launch-offer',
  },
};

// Already expired (edge case)
export const Expired: Story = {
  args: {
    expiry: Math.floor(Date.now() / 1000) - (60 * 60), // 1 hour ago
    variant: 'launch-offer',
  },
};