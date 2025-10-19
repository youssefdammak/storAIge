import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { LoginFormData } from '../types/index'
import Signup from './Signup'

const Login: React.FC = () => {
  const { login } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [showSignup, setShowSignup] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would validate credentials with a backend
    login({
      email: formData.email,
      name: formData.email.split('@')[0] // Simulate user data
    })
  }

  if (showSignup) {
    return <Signup onBackToLogin={() => setShowSignup(false)} />
  }

  return (
    <div className="fade-in">
      <div className="bg-white rounded-2xl card-shadow p-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">storAIge</h1>
          <p className="text-gray-600">Sign in to access your files</p>
        </div>
        
        <form onSubmit={handleSubmit}>
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
          
          <div className="mb-6">
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
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-200 mb-4"
          >
            Sign In
          </button>
          
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-indigo-600 font-medium hover:text-indigo-800 transition"
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login