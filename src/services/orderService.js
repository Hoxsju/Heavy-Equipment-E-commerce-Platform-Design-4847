import supabase from '../lib/supabase';

export const orderService = {
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

  async createOrder(orderData) {
    try {
      await this.createOrdersTableIfNotExists();
      console.log('Creating order:', orderData);
      
      const formattedOrder = {
        customer_name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
        customer_email: orderData.customer.email,
        customer_phone: orderData.customer.phone || '',
        delivery_address: orderData.deliveryAddress,
        delivery_date: orderData.deliveryDate,
        notes: orderData.notes || '',
        items: orderData.items,
        status: 'pending',
        customer_id: orderData.customer.id,
        item_prices: orderData.items.map(item => ({ id: item.id, price: 0 })),
        total_price: 0
      };

      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .insert([formattedOrder])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  async getOrdersByCustomer(customerEmail) {
    try {
      await this.createOrdersTableIfNotExists();
      
      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .select('*')
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  },
  
  async updateOrder(orderId, updateData) {
    try {
      const { error } = await supabase
        .from('orders_qwerty12345')
        .update(updateData)
        .eq('id', orderId);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating order:', error);
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
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  },
  
  async getOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }
};