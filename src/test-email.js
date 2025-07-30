// EmailJS Test Script
import { createClient } from '@supabase/supabase-js';

// EmailJS configuration with your actual credentials
const EMAILJS_CONFIG = {
  serviceId: 'service_alhajhasan',
  templateId: 'template_alhajhasan',
  publicKey: 'gAmpnYoqIq4cgZJ3Z'
};

// Load EmailJS SDK dynamically
const loadEmailJS = () => {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      resolve(window.emailjs);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = () => {
      if (window.emailjs) {
        resolve(window.emailjs);
      } else {
        reject(new Error('EmailJS failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load EmailJS script'));
    document.head.appendChild(script);
  });
};

// Direct test function
const testEmailJS = async () => {
  console.log('Starting EmailJS test...');
  
  try {
    // Load the EmailJS library
    const emailjs = await loadEmailJS();
    console.log('EmailJS library loaded successfully');
    
    // Initialize EmailJS with your public key
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log('EmailJS initialized with public key:', EMAILJS_CONFIG.publicKey);
    
    // Prepare template parameters
    const templateParams = {
      to_email: 'hello@alhajhasan.sa', // Use your email here
      to_name: 'Test User',
      verification_code: '123456',
      company_name: 'AL HAJ HASSAN UNITED CO',
      from_name: 'AL HAJ HASSAN UNITED CO',
      reply_to: 'hello@alhajhasan.sa',
      user_name: 'Test User',
      message: `This is a test email from EmailJS. Verification code: 123456.`
    };
    
    console.log('Sending test email with params:', templateParams);
    
    // Send the email
    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    
    console.log('✅ Email sent successfully:', result);
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ EmailJS test failed:', error);
    return { success: false, error: error.message };
  }
};

// Run the test
testEmailJS().then(result => {
  console.log('Test completed:', result);
  if (result.success) {
    alert('Email sent successfully! Please check your inbox.');
  } else {
    alert(`Email test failed: ${result.error}`);
  }
});

export default testEmailJS;