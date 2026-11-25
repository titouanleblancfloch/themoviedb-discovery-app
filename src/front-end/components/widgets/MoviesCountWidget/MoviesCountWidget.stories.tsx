import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesCountWidget from './MoviesCountWidget';

const meta = {
  title: 'Widgets/MoviesCountWidget',
  component: MoviesCountWidget,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    count: {
      control: 'number',
      description:
        'Number of movies stored in the database, or null when it is unknown.',
    },
  },
} satisfies Meta<typeof MoviesCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { count: 1248 },
};

export const LargeCount: Story = {
  args: { count: 1234567 },
};

export const SingleMovie: Story = {
  args: { count: 1 },
};

export const Empty: Story = {
  args: { count: 0 },
};

export const Unavailable: Story = {
  args: { count: null },
};

export const DarkTheme: Story = {
  args: { count: 1248 },
  globals: {
    theme: 'dark',
  },
};
