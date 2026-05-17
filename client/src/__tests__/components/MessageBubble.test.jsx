import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageBubble from '../../components/MessageBubble';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock the auth store
const mockUser = { _id: 'user1', name: 'Me' };
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: mockUser }),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: () => '14:30',
}));

// Mock cn utility
vi.mock('../../utils/cn', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

describe('MessageBubble', () => {
  const baseMessage = {
    _id: 'msg1',
    sender: { _id: 'user2', name: 'Alice', avatar: '' },
    content: 'Hello there!',
    type: 'text',
    createdAt: new Date().toISOString(),
    isDeleted: false,
    readBy: ['user2'],
  };

  it('renders text content correctly', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('own messages align right, others align left', () => {
    const { container, rerender } = render(<MessageBubble message={baseMessage} />);
    // Other's message — should contain justify-start
    expect(container.firstChild.className).toContain('justify-start');

    // Own message
    const ownMessage = { ...baseMessage, sender: { _id: 'user1', name: 'Me' } };
    rerender(<MessageBubble message={ownMessage} />);
    expect(container.firstChild.className).toContain('justify-end');
  });

  it('shows "Message deleted" style for isDeleted messages', () => {
    const deletedMessage = { ...baseMessage, isDeleted: true, content: 'Message deleted' };
    render(<MessageBubble message={deletedMessage} />);
    expect(screen.getByText('Message deleted')).toBeInTheDocument();
  });

  it('renders image type with <img> tag', () => {
    const imageMessage = { ...baseMessage, type: 'image', content: 'https://example.com/img.png' };
    render(<MessageBubble message={imageMessage} />);
    const img = screen.getByAltText('Attachment');
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/img.png');
  });

  it('shows sender name for other users messages', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('does not show sender name for own messages', () => {
    const ownMessage = { ...baseMessage, sender: { _id: 'user1', name: 'Me' } };
    render(<MessageBubble message={ownMessage} />);
    expect(screen.queryByText('Me')).not.toBeInTheDocument();
  });

  it('timestamps display in correct format', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('shows single check for unread own message', () => {
    const ownMessage = {
      ...baseMessage,
      sender: { _id: 'user1', name: 'Me' },
      readBy: ['user1'],
    };
    render(<MessageBubble message={ownMessage} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows double check for read own message', () => {
    const ownMessage = {
      ...baseMessage,
      sender: { _id: 'user1', name: 'Me' },
      readBy: ['user1', 'user2'],
    };
    render(<MessageBubble message={ownMessage} />);
    expect(screen.getByText('✓✓')).toBeInTheDocument();
  });
});
