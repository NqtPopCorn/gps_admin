import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { tokenStorage, userStorage } from "../lib/api";
import type { LoginRequest, RegisterRequest, UserResponse, RoleEnum } from "../types/api.types";
import type { ApiError } from "../lib/api";

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (payload: RegisterRequest) => Promise<UserResponse | null>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [state, setState] = useState<AuthState>({
    user: userStorage.get(),
    isAuthenticated: authService.isAuthenticated(),
    isLoading: false,
    error: null,
  });

  // ─── Listen for 401 events from the API interceptor ────────────────────────
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await authService.getProfile();
        if (profile) {
          userStorage.set(profile);
          setState((s) => ({ ...s, user: profile, isAuthenticated: true }));
        } else {
          userStorage.clear();
          setState((s) => ({ ...s, user: null, isAuthenticated: false }));
          navigate("/login", { replace: true });
        }
      } catch {
        userStorage.clear();
        setState((s) => ({ ...s, user: null, isAuthenticated: false }));
        navigate("/login", { replace: true });
      }
    };
    fetchUserProfile();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const response = await authService.login(credentials);
      // Đảm bảo dữ liệu được lưu
      userStorage.set(response.data.user);
      setState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err as ApiError,
      }));
      return false;
    }
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (payload: RegisterRequest): Promise<UserResponse | null> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const response = await authService.register(payload);
      setState((s) => ({ ...s, isLoading: false }));
      return response.data;
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err as ApiError,
      }));
      return null;
    }
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshUserProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      if (profile) {
        userStorage.set(profile);
        setState((s) => ({ ...s, user: profile }));
      } else {
        userStorage.clear();
        setState((s) => ({ ...s, user: null, isAuthenticated: false }));
        navigate("/login", { replace: true });
      }
    } catch {
      userStorage.clear();
      setState((s) => ({ ...s, user: null, isAuthenticated: false }));
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook để sử dụng Context ─────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getHomePathForRole(role?: RoleEnum | null): string {
  switch (role) {
    case "admin":
      return "/";
    case "partner":
      return "/partner/pois";
    default:
      return "/forbidden";
  }
}
