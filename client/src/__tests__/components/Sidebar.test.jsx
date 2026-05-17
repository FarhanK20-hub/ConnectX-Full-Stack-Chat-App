import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock ConversationItem
vi.mock('../../components/ConversationItem', () => ({
  default: ({ conversation }) => (
    <div data-testid={`conv-${conversation._id}`}>{conversation.name || 'DM'}</div>
  ),
}));

// Mock axios
vi.mock('../../utils/axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

const mockUser = { _id: 'user1', name: 'Test User', avatar: '' };
const mockConversations = [
  {
    _id: 'conv1',
    isGroup: true,
    name: 'Dev Team',
    members: [{ _id: 'user1' }, { _id: 'user2' }],
    lastMessage: null,
  },
  {
    _id: 'conv2',
    isGroup: false,
    name: '',
    members: [
      { _id: 'user1', name: 'Test User' },
      { _id: 'user3', name: 'Bob' },
    ],
    lastMessage: null,
  },
];

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: mockUser }),
}));

vi.mock('../../store/useChatStore', () => ({
  useChatStore: vi.fn(() => ({
    conversations: mockConversations,
    onlineUsers: new Set(),
  })),
}));

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );

describe('Sidebar', () => {
  it('renders list of conversations', () => {
    renderSidebar();
    expect(screen.getByTestId('conv-conv1')).toBeInTheDocument();
    expect(screen.getByTestId('conv-conv2')).toBeInTheDocument();
  });

  it('renders ConnectX brand header', () => {
    renderSidebar();
    expect(screen.getByText('ConnectX')).toBeInTheDocument();
  });

  it('search input filters conversations by name', () => {
    renderSidebar();
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'Dev' } });
    expect(screen.getByTestId('conv-conv1')).toBeInTheDocument();
    expect(screen.queryByTestId('conv-conv2')).not.toBeInTheDocument();
  });

  it('shows "No conversations found." when search has no results', () => {
    renderSidebar();
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'zzzzz' } });
    expect(screen.getByText('No conversations found.')).toBeInTheDocument();
  });

  it('shows user mini profile at the bottom', () => {
    renderSidebar();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
