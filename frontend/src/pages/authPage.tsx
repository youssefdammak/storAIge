import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { SignupFormData, LoginFormData } from '../types/index';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, login, signup, clearError } = useAuth();
  const { isLoading, error, isAuthenticated } = state;

  const [isLogin, setIsLogin] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 🔹 handle form field updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isLogin) {
      setLoginData({ ...loginData, [name]: value });
    } else {
      setSignupData({ ...signupData, [name]: value });
    }
  };

  // 🔹 handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setVerificationMessage(null);

    if (isLogin) {
      await login(loginData.email, loginData.password);
    } else {
      if (signupData.password !== signupData.confirmPassword) {
        setVerificationMessage('Passwords do not match!');
        return;
      }
      const success = await signup(
        signupData.name,
        signupData.email,
        signupData.password
      );
      if (success) {
        setVerificationMessage(
          'Account created! Please check your email to verify your account.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 fade-in">
      <div className="bg-white rounded-2xl card-shadow p-8 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your storAIge account' : 'Join storAIge today'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={signupData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-medium mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={isLogin ? loginData.email : signupData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={isLogin ? loginData.password : signupData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder={isLogin ? 'Enter your password' : 'Create a password'}
            />
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Confirm your password"
              />
            </div>
          )}

          {(verificationMessage || error) && (
            <p className="text-center text-sm mb-4 text-red-500">
              {verificationMessage || error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-200 mb-4 disabled:opacity-50"
          >
            {isLoading
              ? isLogin
                ? 'Signing in...'
                : 'Creating Account...'
              : isLogin
              ? 'Sign In'
              : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setVerificationMessage(null);
                  clearError();
                }}
                className="text-indigo-600 font-medium hover:text-indigo-800 transition"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
