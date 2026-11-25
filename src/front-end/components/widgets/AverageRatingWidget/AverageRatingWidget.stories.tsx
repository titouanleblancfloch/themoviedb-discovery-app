import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRatingWidget from './AverageRatingWidget';

const meta = {
  title: 'Widgets/AverageRatingWidget',
  component: AverageRatingWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    averageRating: {
      control: { type: 'number', min: 0, max: 10, step: 0.01 },
      description:
        'Simple average rating out of 10 over the whole catalog. null means no rating.',
    },
    status: {
      control: 'inline-radio',
      options: ['ready', 'loading', 'error'],
      description: 'Loading state of the value.',
    },
  },
} satisfies Meta<typeof AverageRatingWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { averageRating: 6.78 },
};

export const Loading: Story = {
  args: { averageRating: null, status: 'loading' },
};

export const NoRatings: Story = {
  args: { averageRating: null },
};

export const ZeroAverage: Story = {
  args: { averageRating: 0 },
};

export const ErrorState: Story = {
  name: 'Error',
  args: { averageRating: null, status: 'error' },
};

export const Mobile: Story = {
  args: { averageRating: 6.78 },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export const DarkTheme: Story = {
  args: { averageRating: 6.78 },
  globals: {
    theme: 'dark',
  },
};
