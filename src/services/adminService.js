// Mock admin service
export const adminService = {
  async getDashboardStats() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalProducts: 156,
      totalUsers: 89,
      totalOrders: 234,
      totalRevenue: 45670,
      recentOrders: [
        { id: 1001, customerName: 'John Smith', total: 299.99, status: 'Completed' },
        { id: 1002, customerName: 'Jane Doe', total: 189.50, status: 'Processing' },
        { id: 1003, customerName: 'Bob Johnson', total: 450.00, status: 'Shipped' }
      ],
      topProducts: [
        { name: 'Hydraulic Filter', brand: 'Caterpillar', sold: 45, revenue: 4049.55 },
        { name: 'Engine Oil Filter', brand: 'Komatsu', sold: 38, revenue: 1747.62 },
        { name: 'Brake Pad Set', brand: 'BOMAG', sold: 22, revenue: 3299.78 }
      ]
    };
  },

  async getAllUsers() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'main_admin',
        createdAt: '2024-01-15T10:30:00Z',
        lastLogin: '2024-01-20T14:20:00Z'
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'admin',
        createdAt: '2024-01-16T09:15:00Z',
        lastLogin: '2024-01-19T16:45:00Z'
      },
      {
        id: 3,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        role: 'user',
        createdAt: '2024-01-17T11:20:00Z',
        lastLogin: '2024-01-20T08:30:00Z'
      }
    ];
  },

  async updateUserRole(userId, newRole) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  async deleteUser(userId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  async getAllOrders() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 1001,
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        total: 299.99,
        status: 'completed',
        createdAt: '2024-01-20T10:30:00Z',
        items: [
          { name: 'Hydraulic Filter', quantity: 2, price: 89.99 },
          { name: 'Engine Oil Filter', quantity: 3, price: 45.99 }
        ]
      },
      {
        id: 1002,
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        total: 189.50,
        status: 'processing',
        createdAt: '2024-01-19T14:20:00Z',
        items: [
          { name: 'Brake Pad Set', quantity: 1, price: 149.99 }
        ]
      }
    ];
  },

  async updateOrderStatus(orderId, newStatus) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  async getSettings() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      whatsappNumber: '+1234567890',
      companyName: 'HeavyParts Inc.',
      companyEmail: 'info@heavyparts.com',
      companyAddress: '123 Industrial Ave, City, State'
    };
  },

  async updateSettings(settings) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }
};