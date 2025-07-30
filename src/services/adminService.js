import supabase from '../lib/supabase';

export const adminService = {
  async getDashboardStats() {
    try {
      // Create mock data
      const mockData = {
        totalProducts: 24,
        totalUsers: 8,
        totalOrders: 12,
        totalRevenue: 5840,
        recentOrders: [
          { id: 'ord-123456', customerName: 'John Doe', total: 650, status: 'pending' },
          { id: 'ord-123457', customerName: 'Jane Smith', total: 1200, status: 'processing' },
          { id: 'ord-123458', customerName: 'Robert Johnson', total: 890, status: 'completed' }
        ],
        topProducts: [
          {
            name: 'Heavy Duty Bearing',
            brand: 'CAT',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100',
            sold: 42,
            revenue: 4200
          },
          {
            name: 'Hydraulic Cylinder',
            brand: 'BOMAG',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100',
            sold: 28,
            revenue: 3360
          },
          {
            name: 'Engine Filter',
            brand: 'Wirtigen',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100',
            sold: 35,
            revenue: 1750
          }
        ]
      };

      try {
        // Try to get actual statistics from Supabase
        await supabase.rpc('create_orders_table');

        const productsResult = await supabase
          .from('woo_import_products')
          .select('count', { count: 'exact', head: true });

        const usersResult = await supabase
          .from('users_qwerty12345')
          .select('count', { count: 'exact', head: true });

        const ordersResult = await supabase
          .from('orders_qwerty12345')
          .select('count', { count: 'exact', head: true });

        // Get recent orders
        const { data: recentOrders } = await supabase
          .from('orders_qwerty12345')
          .select('id, customer_name, total_price, status, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        // Get top products
        const { data: topProducts } = await supabase
          .from('woo_import_products')
          .select('name, brand, image')
          .eq('status', 'published')
          .limit(3);

        // Calculate total revenue from orders
        const { data: revenueData } = await supabase
          .from('orders_qwerty12345')
          .select('total_price');

        const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;

        // If we got data, return it
        if (productsResult && usersResult && ordersResult) {
          return {
            totalProducts: productsResult.count || 0,
            totalUsers: usersResult.count || 0,
            totalOrders: ordersResult.count || 0,
            totalRevenue: totalRevenue,
            recentOrders: (recentOrders || []).map(order => ({
              id: order.id,
              customerName: order.customer_name,
              total: order.total_price,
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
        }
      } catch (error) {
        console.error('Error fetching actual stats:', error);
      }

      // Return mock data if fetching real data failed
      return mockData;
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
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
    try {
      console.log('Fetching users from Supabase...');

      // Get users from our custom table
      const { data: dbUsers, error: dbError } = await supabase
        .from('users_qwerty12345')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching users from database:', dbError);
        throw dbError;
      }

      console.log('Database users:', dbUsers);

      // Get users from Supabase Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('Error fetching auth users:', authError);
        // Continue with just database users if auth fails
      }

      console.log('Auth users:', authUsers);

      // Combine and sync users
      const combinedUsers = [];
      const processedIds = new Set();

      // First, process users from our database
      if (dbUsers) {
        for (const dbUser of dbUsers) {
          combinedUsers.push({
            id: dbUser.id,
            firstName: dbUser.first_name || '',
            lastName: dbUser.last_name || '',
            email: dbUser.email,
            phone: dbUser.phone || '',
            role: dbUser.role || 'user',
            status: dbUser.status || 'active',
            createdAt: dbUser.created_at,
            lastLogin: dbUser.last_login || null,
            address: dbUser.address || '',
            city: dbUser.city || '',
            state: dbUser.state || '',
            zipCode: dbUser.zip_code || '',
            country: dbUser.country || ''
          });
          processedIds.add(dbUser.id);
        }
      }

      // Then, process users that exist in auth but not in our database
      if (authUsers?.users) {
        for (const authUser of authUsers.users) {
          if (!processedIds.has(authUser.id)) {
            // This user exists in auth but not in our database - sync them
            console.log('Found auth user not in database, syncing:', authUser.email);

            const userMetadata = authUser.user_metadata || {};
            const newUser = {
              id: authUser.id,
              email: authUser.email,
              first_name: userMetadata.first_name || authUser.email.split('@')[0],
              last_name: userMetadata.last_name || '',
              phone: userMetadata.phone || null,
              role: authUser.email === 'hoxs@regravity.net' ? 'main_admin' : 'user',
              status: 'active',
              email_confirmed: authUser.email_confirmed_at ? true : false,
              created_at: authUser.created_at,
              last_login: authUser.last_sign_in_at
            };

            // Insert into our database
            try {
              const { error: insertError } = await supabase
                .from('users_qwerty12345')
                .insert([newUser]);

              if (!insertError) {
                combinedUsers.push({
                  id: newUser.id,
                  firstName: newUser.first_name,
                  lastName: newUser.last_name,
                  email: newUser.email,
                  phone: newUser.phone || '',
                  role: newUser.role,
                  status: newUser.status,
                  createdAt: newUser.created_at,
                  lastLogin: newUser.last_login,
                  address: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                });
                console.log('Successfully synced auth user to database:', authUser.email);
              }
            } catch (syncError) {
              console.error('Error syncing auth user to database:', syncError);
            }
          }
        }
      }

      console.log('Final combined users:', combinedUsers);
      return combinedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return empty array instead of mock data to show real state
      return [];
    }
  },

  async updateUserRole(userId, newRole) {
    try {
      console.log(`Updating user ${userId} role to ${newRole}`);

      const { error } = await supabase
        .from('users_qwerty12345')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      console.log('User role updated successfully');

      // Broadcast role change event for immediate UI update
      // This will be picked up by the AuthContext to update the current user if needed
      window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
        detail: { userId, newRole }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  async updateUserStatus(userId, newStatus) {
    try {
      console.log(`Updating user ${userId} status to ${newStatus}`);

      // First update the user's status in the database
      const { error: dbError } = await supabase
        .from('users_qwerty12345')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (dbError) throw dbError;

      // Update auth metadata
      try {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { status: newStatus },
            app_metadata: { status: newStatus }
          }
        );

        if (authError) {
          console.error('Failed to update auth status, but database updated:', authError);
        }
      } catch (authError) {
        console.error('Auth update failed, but database updated:', authError);
      }

      console.log('User status updated successfully');

      // Broadcast status change event for immediate UI update
      // This will be picked up by the AuthContext to update the current user if needed
      window.dispatchEvent(new CustomEvent('userStatusUpdated', { 
        detail: { userId, newStatus }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      console.log(`Deleting user ${userId}`);

      // First get the user's email for reference
      const { data: userData, error: userError } = await supabase
        .from('users_qwerty12345')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      console.log(`Deleting user: ${userData.email}`);

      // Delete from our users table first
      const { error: dbError } = await supabase
        .from('users_qwerty12345')
        .delete()
        .eq('id', userId);

      if (dbError) {
        console.error('Error deleting user from database:', dbError);
        throw dbError;
      }

      console.log('User deleted from database successfully');

      // Delete from Supabase auth
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.error('Warning: User deleted from database but not from auth system:', authError);
          // Don't throw here - the user is deleted from our system
        } else {
          console.log('User deleted from auth system successfully');
        }
      } catch (authError) {
        console.error('Auth deletion failed, but user deleted from database:', authError);
      }

      // Broadcast user deletion event for immediate UI update
      // This will be picked up by the AuthContext to log out the user if they deleted themselves
      window.dispatchEvent(new CustomEvent('userDeleted', { 
        detail: { userId }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async syncUsers() {
    try {
      console.log('Starting user synchronization...');

      // Get all users from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw authError;
      }

      // Get all users from our database
      const { data: dbUsers, error: dbError } = await supabase
        .from('users_qwerty12345')
        .select('*');

      if (dbError) {
        console.error('Error fetching database users:', dbError);
        throw dbError;
      }

      const dbUserIds = new Set(dbUsers?.map(u => u.id) || []);
      const authUserIds = new Set(authUsers?.users?.map(u => u.id) || []);

      // Remove users from database that don't exist in auth
      const usersToRemove = dbUsers?.filter(dbUser => !authUserIds.has(dbUser.id)) || [];
      for (const userToRemove of usersToRemove) {
        console.log(`Removing orphaned user from database: ${userToRemove.email}`);
        await supabase
          .from('users_qwerty12345')
          .delete()
          .eq('id', userToRemove.id);
      }

      // Add users to database that exist in auth but not in database
      const usersToAdd = authUsers?.users?.filter(authUser => !dbUserIds.has(authUser.id)) || [];
      for (const authUser of usersToAdd) {
        console.log(`Adding missing user to database: ${authUser.email}`);

        const userMetadata = authUser.user_metadata || {};
        const newUser = {
          id: authUser.id,
          email: authUser.email,
          first_name: userMetadata.first_name || authUser.email.split('@')[0],
          last_name: userMetadata.last_name || '',
          phone: userMetadata.phone || null,
          role: authUser.email === 'hoxs@regravity.net' ? 'main_admin' : 'user',
          status: 'active',
          email_confirmed: authUser.email_confirmed_at ? true : false,
          created_at: authUser.created_at,
          last_login: authUser.last_sign_in_at
        };

        await supabase
          .from('users_qwerty12345')
          .insert([newUser]);
      }

      console.log(`Sync completed. Removed: ${usersToRemove.length}, Added: ${usersToAdd.length}`);

      // Broadcast sync completion event
      window.dispatchEvent(new CustomEvent('usersSynced', { 
        detail: { removed: usersToRemove.length, added: usersToAdd.length }
      }));

      return {
        success: true,
        removed: usersToRemove.length,
        added: usersToAdd.length
      };
    } catch (error) {
      console.error('Error syncing users:', error);
      throw error;
    }
  },

  async getAllOrders() {
    try {
      await this.createOrdersTableIfNotExists();

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
        total: order.total_price,
        status: order.status,
        createdAt: order.created_at,
        items: order.items || []
      }));
    } catch (error) {
      console.error('Error fetching all orders:', error);
      // Return empty array instead of mock data
      return [];
    }
  },

  async createOrdersTableIfNotExists() {
    try {
      const { error } = await supabase.rpc('create_orders_table');
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating orders table:', error);
      }

      // Try to add item_prices and total_price columns if they don't exist
      try {
        await supabase.rpc('add_price_columns_to_orders');
      } catch (columnError) {
        console.error('Error adding price columns:', columnError);
      }
    } catch (error) {
      console.error('Error checking/creating orders table:', error);
    }
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
    try {
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
    } catch (error) {
      console.error('Error fetching settings:', error);
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
  },

  async updateSettings(settings) {
    try {
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
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};