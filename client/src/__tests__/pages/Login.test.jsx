import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const mockSetUser = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ setUser: mockSetUser }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPost = vi.fn();
vi.mock('../../utils/axios', () => ({
  default: { post: (...args) => mockPost(...args) },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the Sign In button', () => {
    renderLogin();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders the Create one link', () => {
    renderLogin();
    expect(screen.getByText('Create one')).toBeInTheDocument();
  });

  it('calls login API on valid submit', async () => {
    mockPost.mockResolvedValue({ data: { _id: '1', name: 'Test', email: 'test@test.com' } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password123' });
    });
  });

  it('redirects to / on successful login', async () => {
    mockPost.mockResolvedValue({ data: { _id: '1', name: 'Test', email: 'test@test.com' } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error toast on wrong credentials', async () => {
    const toast = await import('react-hot-toast');
    mockPost.mockRejectedValue({ response: { data: { message: 'Invalid email or password' } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Invalid email or password');
    });
  });
});
