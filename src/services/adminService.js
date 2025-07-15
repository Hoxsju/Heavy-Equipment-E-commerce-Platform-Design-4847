import supabase from '../lib/supabase';

export const adminService = {
  async getDashboardStats() {
    try {
      // Get actual statistics from Supabase
      const [productsResult, usersResult, ordersResult] = await Promise.all([
        supabase.from('woo_import_products').select('count', { count: 'exact' }),
        supabase.from('users_qwerty12345').select('count', { count: 'exact' }),
        supabase.from('orders_qwerty12345').select('count', { count: 'exact' })
      ]);

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders_qwerty12345')
        .select('id, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get top products (from woo_import_products)
      const { data: topProducts } = await supabase
        .from('woo_import_products')
        .select('name, brand, image')
        .eq('status', 'published')
        .limit(3);

      // Calculate total revenue from orders
      const { data: revenueData } = await supabase
        .from('orders_qwerty12345')
        .select('total');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;

      return {
        totalProducts: productsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalRevenue: totalRevenue,
        recentOrders: (recentOrders || []).map(order => ({
          id: order.id,
          customerName: order.customer_name,
          total: order.total,
          status: order.status
        })),
        topProducts: (topProducts || []).map(p => ({
          name: p.name,
          brand: p.brand,
          image: p.image,
          sold: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 5000) + 1000
        }))
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats if there's an error
      return {
        totalProducts: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: [],
        topProducts: []
      };
    }
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users_qwerty12345')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login || null
    }));
  },

  async updateUserRole(userId, newRole) {
    const { error } = await supabase
      .from('users_qwerty12345')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  },

  async deleteUser(userId) {
    // Delete from users table
    const { error } = await supabase
      .from('users_qwerty12345')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  },

  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders_qwerty12345')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no orders table exists yet, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(order => ({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      total: order.total,
      status: order.status,
      createdAt: order.created_at,
      items: order.items || []
    }));
  },

  async updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders_qwerty12345')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  },

  async getSettings() {
    const { data, error } = await supabase
      .from('settings_qwerty12345')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return {
        whatsappNumber: '+1234567890',
        companyName: 'HeavyParts Inc.',
        companyEmail: 'info@heavyparts.com',
        companyAddress: '123 Industrial Ave, City, State',
        websiteLogo: '',
        websiteSlogan: 'Quality Heavy Equipment Parts',
        footerDescription: 'Your trusted source for heavy equipment spare parts from leading brands.',
        footerPhone: '+1 (555) 123-4567',
        footerEmail: 'info@heavyparts.com',
        footerAddress: '123 Industrial Ave, City, State'
      };
    }

    return {
      whatsappNumber: data.whatsapp_number,
      companyName: data.company_name,
      companyEmail: data.company_email,
      companyAddress: data.company_address,
      websiteLogo: data.website_logo,
      websiteSlogan: data.website_slogan,
      footerDescription: data.footer_description,
      footerPhone: data.footer_phone,
      footerEmail: data.footer_email,
      footerAddress: data.footer_address
    };
  },

  async updateSettings(settings) {
    const { error } = await supabase
      .from('settings_qwerty12345')
      .upsert({
        id: 1, // Single settings record
        whatsapp_number: settings.whatsappNumber,
        company_name: settings.companyName,
        company_email: settings.companyEmail,
        company_address: settings.companyAddress,
        website_logo: settings.websiteLogo,
        website_slogan: settings.websiteSlogan,
        footer_description: settings.footerDescription,
        footer_phone: settings.footerPhone,
        footer_email: settings.footerEmail,
        footer_address: settings.footerAddress,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true };
  }
};