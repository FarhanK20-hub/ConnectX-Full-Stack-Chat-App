import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('isAuthenticated is false initially', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('isLoading is true initially', () => {
    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('setUser sets user and isAuthenticated correctly', () => {
    const mockUser = { _id: '123', name: 'Test', email: 'test@test.com' };
    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('setUser with null sets isAuthenticated to false', () => {
    useAuthStore.getState().setUser({ _id: '123' });
    useAuthStore.getState().setUser(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('logout clears user state', () => {
    // First login
    useAuthStore.getState().setUser({ _id: '123', name: 'Test' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
