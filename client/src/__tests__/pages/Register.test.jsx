import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';

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

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('all fields render correctly', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders the Sign in link', () => {
    renderRegister();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows error toast when fields are empty', async () => {
    const toast = await import('react-hot-toast');
    renderRegister();

    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Please fill all fields');
    });
  });

  it('calls register API on valid submit', async () => {
    mockPost.mockResolvedValue({ data: { _id: '1', name: 'New User', email: 'new@test.com' } });
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/register', {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      });
    });
  });

  it('successful register redirects to /', async () => {
    mockPost.mockResolvedValue({ data: { _id: '1', name: 'New User', email: 'new@test.com' } });
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error toast on server failure', async () => {
    const toast = await import('react-hot-toast');
    mockPost.mockRejectedValue({ response: { data: { message: 'User already exists' } } });
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Dup User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'dup@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('User already exists');
    });
  });
});
