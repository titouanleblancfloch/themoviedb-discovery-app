import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageDurationWidget from './AverageDurationWidget';

const meta = {
  title: 'Widgets/AverageDurationWidget',
  component: AverageDurationWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    averageMinutes: {
      control: 'number',
      description:
        'Average duration in minutes, computed from valid durations only. null means no valid data.',
    },
    status: {
      control: 'inline-radio',
      options: ['ready', 'loading', 'error'],
      description: 'Loading state of the value.',
    },
  },
} satisfies Meta<typeof AverageDurationWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { averageMinutes: 107 },
};

export const Loading: Story = {
  args: { averageMinutes: null, status: 'loading' },
};

export const NoData: Story = {
  args: { averageMinutes: null },
};

export const ErrorState: Story = {
  name: 'Error',
  args: { averageMinutes: null, status: 'error' },
};

export const Mobile: Story = {
  args: { averageMinutes: 107 },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export const DarkTheme: Story = {
  args: { averageMinutes: 107 },
  globals: {
    theme: 'dark',
  },
};
