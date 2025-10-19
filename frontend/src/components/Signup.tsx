import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { SignupFormData } from '../types/index'

interface SignupProps {
  onBackToLogin: () => void
}

const Signup: React.FC<SignupProps> = ({ onBackToLogin }) => {
  const { login } = useAuth()
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long!')
      return
    }

    // In a real app, you would create the account with a backend
    login({
      name: formData.name,
      email: formData.email
    })
  }

  return (
    <div className="fade-in">
      <div className="bg-white rounded-2xl card-shadow p-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">Create Account</h1>
          <p className="text-gray-600">Join storAIge today</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Enter your email"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Create a password"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Confirm your password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-200 mb-4"
          >
            Create Account
          </button>
          
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-indigo-600 font-medium hover:text-indigo-800 transition"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup