// API base URL - loaded from environment variable
const API_BASE_URL = "http://localhost:8080";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

// Generic API request function
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
        };
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        // Check if response includes a refreshed token (sliding expiration)
        if (response.ok && data.token && endpoint.includes('/api/auth/profile')) {
            localStorage.setItem('authToken', data.token);
        }

        if (!response.ok) {
            // Log technical details to console
            console.error('API Error:', {
                status: response.status,
                statusText: response.statusText,
                url,
                data
            });
            
            // Handle 401 errors (token expired/invalid) - auto logout
            if (response.status === 401) {
                // Clear stored auth data
                authStorage.clear();
                // Redirect to login page
                window.location.href = '/auth';
                throw new Error('Your session has expired. Please log in again.');
            }
            
            // Return user-friendly error messages
            let userMessage = 'Something went wrong. Please try again.';
            
            if (response.status === 400) {
                userMessage = data.error || 'Invalid request. Please check your information.';
            } else if (response.status === 403) {
                userMessage = 'Access denied.';
            } else if (response.status === 404) {
                userMessage = 'Service not found. Please try again later.';
            } else if (response.status >= 500) {
                userMessage = 'Server error. Please try again later.';
            }
            
            throw new Error(userMessage);
        }

        return {
            success: true,
            message: data.message || 'Success',
            data: data,
        };

    } catch (error) {
        // Log technical error details to console
        console.error('API Request Error:', {
        url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
        });
        
        // Return user-friendly error message
        let userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        
        if (error instanceof Error) {
            // If it's already a user-friendly message from the response handling above
            if (error.message.includes('Invalid') || 
                error.message.includes('Access') || 
                error.message.includes('Server') || 
                error.message.includes('Service')) {
                    userMessage = error.message;
            }
        }
        
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Request failed',
        };
    }
}

// Local storage utilities
export const authStorage = {
    setToken: (token: string) => {
        localStorage.setItem('authToken', token);
    },

    getToken: (): string | null => {
        return localStorage.getItem('authToken');
    },

    removeToken: () => {
        localStorage.removeItem('authToken');
    },

    setUser: (user: AuthResponse['user']) => {
        localStorage.setItem('authUser', JSON.stringify(user));
    },

    getUser: (): AuthResponse['user'] | null => {
        const user = localStorage.getItem('authUser');
        return user ? JSON.parse(user) : null;
    },

    removeUser: () => {
        localStorage.removeItem('authUser');
    },

    clear: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    },
};

// Auth API functions
export const authAPI = {
    // Login user
    login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
        return apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        });
    },

    // Register new user
    signup: async (userData: SignupRequest): Promise<ApiResponse<AuthResponse>> => {
        return apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        });
    },

    // Logout user
    logout: async (): Promise<ApiResponse> => {
        return apiRequest('/api/auth/logout', {
        method: 'POST',
        });
    },

    // Get current user profile
    getProfile: async (): Promise<ApiResponse<{ user: AuthResponse['user']; token?: string }>> => {
        return apiRequest('/api/auth/profile');
    },

    // Refresh auth token
    refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
        return apiRequest('/api/auth/refresh', {
        method: 'POST',
        });
    },
};

export default {
    authAPI,
};