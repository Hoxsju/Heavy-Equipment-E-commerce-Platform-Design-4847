// Mock authentication service
export const authService = {
  async login(email, password) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const mockUser = {
      id: 1,
      email,
      firstName: 'John',
      lastName: 'Doe',
      role: email.includes('admin') ? 'main_admin' : 'user'
    };
    
    return {
      user: mockUser,
      token: 'mock-jwt-token'
    };
  },

  async register(userData) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: Date.now(),
      ...userData,
      role: 'user'
    };
    
    return {
      user: mockUser,
      token: 'mock-jwt-token'
    };
  },

  async getCurrentUser() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: 1,
      email: 'admin@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'main_admin'
    };
  }
};