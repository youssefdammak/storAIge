export interface User {
  email: string;
  name: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToSignup: () => void;
}

export interface SignupProps {
  onSignup: (user: User) => void;
  onNavigateToLogin: () => void;
}

export interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}