// This file is now deprecated - using Supabase Auth for all email functionality
// Keeping for reference only

console.warn('smtpService.js is deprecated. Using Supabase Auth for email functionality.');

// Placeholder service that redirects to Supabase Auth
export const smtpService = {
  async testConnection() {
    console.log('SMTP service deprecated. Use Supabase Auth instead.');
    return {
      success: false,
      error: 'SMTP service deprecated. Use Supabase Auth instead.'
    };
  },

  async sendVerificationCode(email, code, firstName = 'User') {
    console.log('SMTP service deprecated. Use Supabase Auth instead.');
    return {
      success: false,
      error: 'SMTP service deprecated. Use Supabase Auth instead.'
    };
  },

  async sendWelcomeEmail(email, firstName, lastName) {
    console.log('SMTP service deprecated. Use Supabase Auth instead.');
    return {
      success: false,
      error: 'SMTP service deprecated. Use Supabase Auth instead.'
    };
  },

  async sendOrderConfirmation(email, orderDetails) {
    console.log('SMTP service deprecated. Use Supabase Auth instead.');
    return {
      success: false,
      error: 'SMTP service deprecated. Use Supabase Auth instead.'
    };
  },

  async sendPasswordReset(email, resetCode, firstName = 'User') {
    console.log('SMTP service deprecated. Use Supabase Auth instead.');
    return {
      success: false,
      error: 'SMTP service deprecated. Use Supabase Auth instead.'
    };
  },

  async sendCustomEmail(email, subject, message) {
    console.log('SMTP service deprecated. Use Supabase Auth instead.');
    return {
      success: false,
      error: 'SMTP service deprecated. Use Supabase Auth instead.'
    };
  }
};

export default smtpService;