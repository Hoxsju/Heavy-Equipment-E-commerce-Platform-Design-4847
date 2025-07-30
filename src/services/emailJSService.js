import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: 'service_alhajhasan',
  templateId: 'template_alhajhasan',
  publicKey: 'gAmpnYoqIq4cgZJ3Z'
};

class EmailJSService {
  constructor() {
    this.initialized = false;
    this.initializeEmailJS();
  }

  initializeEmailJS() {
    try {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      this.initialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      this.initialized = false;
    }
  }

  async sendOrderUpdateEmail(orderData) {
    if (!this.initialized) {
      console.error('EmailJS not initialized');
      return { success: false, error: 'EmailJS not initialized' };
    }

    try {
      console.log('Sending order update email via EmailJS:', orderData);

      // Format order items for email
      const itemsList = orderData.items?.map(item => 
        `• ${item.name} (${item.part_number || 'No Part #'}) - Qty: ${item.quantity}`
      ).join('\n') || 'No items found';

      // Format pricing information
      const priceInfo = orderData.total_price > 0 
        ? `Total: $${orderData.total_price.toFixed(2)}` 
        : 'Pricing: Pending quote - Our team will contact you with pricing details';

      // Get status display
      const statusDisplay = this.getStatusDisplay(orderData.status);

      // Prepare template parameters for EmailJS
      const templateParams = {
        to_email: orderData.customer_email,
        to_name: orderData.customer_name || 'Customer',
        order_id: orderData.id.slice(0, 8),
        full_order_id: orderData.id,
        order_status: statusDisplay,
        order_items: itemsList,
        price_info: priceInfo,
        delivery_address: orderData.delivery_address || 'Not specified',
        delivery_date: orderData.delivery_date 
          ? new Date(orderData.delivery_date).toLocaleDateString() 
          : 'Not specified',
        updated_date: new Date(orderData.updated_at || orderData.created_at).toLocaleString(),
        company_name: 'AL HAJ HASSAN UNITED CO',
        company_email: 'info@alhajhasan.sa',
        company_phone: '+966115081749',
        profile_url: 'https://deluxe-bombolone-47b1e6.netlify.app/#/profile',
        whatsapp_url: `https://wa.me/966502255702?text=I'd like to inquire about my order #${orderData.id.slice(0, 8)}`,
        notes: orderData.notes || 'No special notes'
      };

      console.log('EmailJS template parameters:', templateParams);

      // Send email using EmailJS
      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('EmailJS send result:', result);

      if (result.status === 200) {
        console.log('✅ Order update email sent successfully via EmailJS');
        return {
          success: true,
          message: 'Order update email sent successfully',
          emailService: 'EmailJS',
          messageId: result.text
        };
      } else {
        throw new Error(`EmailJS returned status: ${result.status}`);
      }

    } catch (error) {
      console.error('❌ EmailJS send failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via EmailJS',
        emailService: 'EmailJS'
      };
    }
  }

  async sendOrderConfirmationEmail(orderData) {
    if (!this.initialized) {
      console.error('EmailJS not initialized');
      return { success: false, error: 'EmailJS not initialized' };
    }

    try {
      console.log('Sending order confirmation email via EmailJS:', orderData);

      // Format order items for email
      const itemsList = orderData.items?.map(item => 
        `• ${item.name} (${item.part_number || 'No Part #'}) - Qty: ${item.quantity}`
      ).join('\n') || 'No items found';

      // Prepare template parameters for order confirmation
      const templateParams = {
        to_email: orderData.customer_email,
        to_name: orderData.customer_name || 'Customer',
        order_id: orderData.id.slice(0, 8),
        full_order_id: orderData.id,
        order_status: 'Pending Review',
        order_items: itemsList,
        price_info: 'Pricing: Our team will review your order and provide pricing details shortly',
        delivery_address: orderData.delivery_address || 'Not specified',
        delivery_date: orderData.delivery_date 
          ? new Date(orderData.delivery_date).toLocaleDateString() 
          : 'Not specified',
        updated_date: new Date(orderData.created_at).toLocaleString(),
        company_name: 'AL HAJ HASSAN UNITED CO',
        company_email: 'info@alhajhasan.sa',
        company_phone: '+966115081749',
        profile_url: 'https://deluxe-bombolone-47b1e6.netlify.app/#/profile',
        whatsapp_url: `https://wa.me/966502255702?text=I'd like to inquire about my order #${orderData.id.slice(0, 8)}`,
        notes: orderData.notes || 'No special notes',
        email_type: 'confirmation' // Special flag for confirmation emails
      };

      console.log('EmailJS confirmation template parameters:', templateParams);

      // Send email using EmailJS
      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('EmailJS confirmation result:', result);

      if (result.status === 200) {
        console.log('✅ Order confirmation email sent successfully via EmailJS');
        return {
          success: true,
          message: 'Order confirmation email sent successfully',
          emailService: 'EmailJS',
          messageId: result.text
        };
      } else {
        throw new Error(`EmailJS returned status: ${result.status}`);
      }

    } catch (error) {
      console.error('❌ EmailJS confirmation send failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send confirmation email via EmailJS',
        emailService: 'EmailJS'
      };
    }
  }

  getStatusDisplay(status) {
    const statusMap = {
      'pending': '⏳ Pending Review',
      'processing': '🔄 Processing',
      'shipped': '🚚 Shipped',
      'completed': '✅ Completed',
      'cancelled': '❌ Cancelled'
    };
    return statusMap[status] || status;
  }

  async testEmailJS(testEmail = 'test@example.com') {
    if (!this.initialized) {
      return { success: false, error: 'EmailJS not initialized' };
    }

    try {
      console.log('Testing EmailJS connection...');

      const testParams = {
        to_email: testEmail,
        to_name: 'Test User',
        order_id: '12345678',
        full_order_id: '12345678-1234-1234-1234-123456789012',
        order_status: '🔄 Processing',
        order_items: '• Test Heavy Duty Bearing (HD-B-1234) - Qty: 2\n• Test Hydraulic Cylinder (HC-5678) - Qty: 1',
        price_info: 'Total: $1,250.00',
        delivery_address: '123 Test Street, Test City, Test State 12345',
        delivery_date: new Date().toLocaleDateString(),
        updated_date: new Date().toLocaleString(),
        company_name: 'AL HAJ HASSAN UNITED CO',
        company_email: 'info@alhajhasan.sa',
        company_phone: '+966115081749',
        profile_url: 'https://deluxe-bombolone-47b1e6.netlify.app/#/profile',
        whatsapp_url: 'https://wa.me/966502255702?text=Test message',
        notes: 'This is a test email to verify EmailJS integration',
        email_type: 'test'
      };

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        testParams
      );

      if (result.status === 200) {
        console.log('✅ EmailJS test successful');
        return {
          success: true,
          message: 'EmailJS test email sent successfully',
          emailService: 'EmailJS',
          testEmail: testEmail
        };
      } else {
        throw new Error(`Test failed with status: ${result.status}`);
      }

    } catch (error) {
      console.error('❌ EmailJS test failed:', error);
      return {
        success: false,
        error: error.message || 'EmailJS test failed',
        emailService: 'EmailJS'
      };
    }
  }

  // Method to validate EmailJS configuration
  validateConfiguration() {
    const issues = [];

    if (!EMAILJS_CONFIG.serviceId || EMAILJS_CONFIG.serviceId === 'your_service_id') {
      issues.push('Service ID not configured');
    }

    if (!EMAILJS_CONFIG.templateId || EMAILJS_CONFIG.templateId === 'your_template_id') {
      issues.push('Template ID not configured');
    }

    if (!EMAILJS_CONFIG.publicKey || EMAILJS_CONFIG.publicKey === 'your_public_key') {
      issues.push('Public Key not configured');
    }

    if (!this.initialized) {
      issues.push('EmailJS not initialized');
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      configuration: {
        serviceId: EMAILJS_CONFIG.serviceId ? '✅ Configured' : '❌ Missing',
        templateId: EMAILJS_CONFIG.templateId ? '✅ Configured' : '❌ Missing',
        publicKey: EMAILJS_CONFIG.publicKey ? '✅ Configured' : '❌ Missing',
        initialized: this.initialized ? '✅ Initialized' : '❌ Not Initialized'
      }
    };
  }
}

// Create singleton instance
const emailJSService = new EmailJSService();

export default emailJSService;
export { EmailJSService };