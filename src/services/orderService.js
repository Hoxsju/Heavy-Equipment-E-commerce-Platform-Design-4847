import supabase from '../lib/supabase';
import emailJSService from './emailJSService';

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
        total_price: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .insert([formattedOrder])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      console.log('Order created successfully:', data);

      // Send order confirmation email via EmailJS
      try {
        console.log('Sending order confirmation email via EmailJS...');
        const emailResult = await emailJSService.sendOrderConfirmationEmail({
          id: data.id,
          customer_name: formattedOrder.customer_name,
          customer_email: formattedOrder.customer_email,
          items: orderData.items,
          delivery_address: formattedOrder.delivery_address,
          delivery_date: formattedOrder.delivery_date,
          notes: formattedOrder.notes,
          created_at: data.created_at
        });

        if (emailResult.success) {
          console.log('✅ Order confirmation email sent successfully via EmailJS');
        } else {
          console.error('❌ Failed to send confirmation email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't throw error - order creation was successful
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  async getOrdersByCustomer(customerEmail) {
    try {
      await this.createOrdersTableIfNotExists();
      console.log('Fetching orders for customer:', customerEmail);

      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .select('*')
        .eq('customer_email', customerEmail)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders:', error);
        throw error;
      }

      console.log('Found orders for customer:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  },

  async getOrdersByCustomerId(customerId) {
    try {
      await this.createOrdersTableIfNotExists();
      console.log('Fetching orders for customer ID:', customerId);

      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .select('*')
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders by ID:', error);
        throw error;
      }

      console.log('Found orders for customer ID:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching customer orders by ID:', error);
      return [];
    }
  },

  async updateOrder(orderId, updateData) {
    try {
      console.log('Updating order:', orderId, updateData);

      // Prepare the update data with explicit updated_at timestamp
      const updatedOrderData = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Remove any undefined values
      Object.keys(updatedOrderData).forEach(key => {
        if (updatedOrderData[key] === undefined) {
          delete updatedOrderData[key];
        }
      });

      console.log('Final update data:', updatedOrderData);

      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .update(updatedOrderData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Order updated successfully:', data);

      // Send order update notification via EmailJS
      try {
        console.log('Sending order update notification via EmailJS...');
        const emailResult = await emailJSService.sendOrderUpdateEmail(data);

        if (emailResult.success) {
          console.log('✅ Order update email sent successfully via EmailJS');
        } else {
          console.error('❌ Failed to send update email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending order update notification:', emailError);
        // Don't throw error - order update was successful
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  async sendOrderUpdateNotification(orderData) {
    try {
      if (!orderData || !orderData.customer_email) {
        console.error('Cannot send notification: Missing order data or customer email');
        return { success: false, error: 'Missing order data' };
      }

      console.log('Sending order update notification via EmailJS to:', orderData.customer_email);

      // Use EmailJS service to send the notification
      const emailResult = await emailJSService.sendOrderUpdateEmail(orderData);

      if (emailResult.success) {
        console.log('✅ Order update notification sent successfully via EmailJS');
        return { success: true, emailResult };
      } else {
        console.error('❌ Failed to send notification via EmailJS:', emailResult.error);
        return { success: false, error: emailResult.error };
      }

    } catch (error) {
      console.error('Failed to send order update notification:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllOrders() {
    try {
      await this.createOrdersTableIfNotExists();
      console.log('Fetching all orders with latest updates...');

      // First try the direct query with proper ordering
      const { data, error } = await supabase
        .from('orders_qwerty12345')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        
        // Try the RPC function as fallback
        try {
          console.log('Trying RPC function fallback...');
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_orders');
          if (rpcError) throw rpcError;
          console.log('Successfully fetched orders via RPC:', rpcData?.length || 0);
          return rpcData || [];
        } catch (rpcError) {
          console.error('RPC fallback also failed:', rpcError);
          throw error; // Throw the original error
        }
      }

      console.log('Successfully fetched orders:', data?.length || 0);
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
  },

  async testEmailJS(testEmail = 'test@example.com') {
    try {
      console.log('Testing EmailJS integration...');
      const result = await emailJSService.testEmailJS(testEmail);
      return result;
    } catch (error) {
      console.error('Error testing EmailJS:', error);
      return { success: false, error: error.message };
    }
  },

  // Method to get EmailJS configuration status
  getEmailJSStatus() {
    return emailJSService.validateConfiguration();
  }
};