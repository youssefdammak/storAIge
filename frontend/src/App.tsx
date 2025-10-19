import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Dashboard />
  }

  return <Login />
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
        <div className="container max-w-4xl mx-auto">
          <AppRoutes />
        </div>
      </div>
    </AuthProvider>
  )
}

export default App