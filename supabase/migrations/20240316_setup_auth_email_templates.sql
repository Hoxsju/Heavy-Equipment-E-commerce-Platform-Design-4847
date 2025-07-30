-- Setup email templates for different OTP purposes
-- This will configure Supabase Auth to use custom email templates

-- Create a function to handle custom email templates
CREATE OR REPLACE FUNCTION public.handle_auth_email_template()
RETURNS trigger AS $$
BEGIN
  -- This function will be called when auth emails are sent
  -- We can customize the email content based on the purpose
  
  -- Check if this is an OTP email
  IF NEW.email_data->>'purpose' IS NOT NULL THEN
    CASE NEW.email_data->>'purpose'
      WHEN 'registration' THEN
        -- Registration email template
        NEW.email_subject := 'Welcome! Verify your HeavyParts account';
        NEW.email_body := format(
          'Hi %s,

Welcome to HeavyParts! We''re excited to have you join our community.

Your verification code is: %s

This code will expire in 15 minutes for security purposes.

If you didn''t create this account, please ignore this email.

Best regards,
The HeavyParts Team

---
AL HAJ HASSAN UNITED CO
Email: info@alhajhasan.sa
Phone: +966115081749',
          COALESCE(NEW.email_data->>'first_name', 'User'),
          NEW.email_data->>'otp_code'
        );
        
      WHEN 'login' THEN
        -- Login verification email template
        NEW.email_subject := 'HeavyParts Login Verification';
        NEW.email_body := format(
          'Hi %s,

Someone is trying to sign in to your HeavyParts account.

Your login verification code is: %s

This code will expire in 15 minutes for security purposes.

If this wasn''t you, please secure your account immediately.

Best regards,
The HeavyParts Team

---
AL HAJ HASSAN UNITED CO
Email: info@alhajhasan.sa
Phone: +966115081749',
          COALESCE(NEW.email_data->>'first_name', 'User'),
          NEW.email_data->>'otp_code'
        );
        
      WHEN 'password_reset' THEN
        -- Password reset email template
        NEW.email_subject := 'HeavyParts Password Reset';
        NEW.email_body := format(
          'Hi %s,

You requested to reset your password for your HeavyParts account.

Your password reset code is: %s

Use this code to reset your password. This code will expire in 15 minutes.

If you didn''t request this password reset, please ignore this email.

Best regards,
The HeavyParts Team

---
AL HAJ HASSAN UNITED CO
Email: info@alhajhasan.sa
Phone: +966115081749',
          COALESCE(NEW.email_data->>'first_name', 'User'),
          NEW.email_data->>'otp_code'
        );
        
      ELSE
        -- Default template
        NEW.email_subject := 'HeavyParts Verification Code';
        NEW.email_body := format(
          'Hi %s,

Your verification code is: %s

This code will expire in 15 minutes.

Best regards,
The HeavyParts Team',
          COALESCE(NEW.email_data->>'first_name', 'User'),
          NEW.email_data->>'otp_code'
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create email configuration table for custom templates
CREATE TABLE IF NOT EXISTS public.email_templates_qwerty12345 (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO public.email_templates_qwerty12345 (template_name, subject, body_template) VALUES
('registration', 'Welcome! Verify your HeavyParts account', 
'Hi {{first_name}},

Welcome to HeavyParts! We''re excited to have you join our community.

Your verification code is: {{otp_code}}

This code will expire in 15 minutes for security purposes.

If you didn''t create this account, please ignore this email.

Best regards,
The HeavyParts Team

---
AL HAJ HASSAN UNITED CO
Email: info@alhajhasan.sa
Phone: +966115081749'),

('login', 'HeavyParts Login Verification',
'Hi {{first_name}},

Someone is trying to sign in to your HeavyParts account.

Your login verification code is: {{otp_code}}

This code will expire in 15 minutes for security purposes.

If this wasn''t you, please secure your account immediately.

Best regards,
The HeavyParts Team

---
AL HAJ HASSAN UNITED CO
Email: info@alhajhasan.sa
Phone: +966115081749'),

('password_reset', 'HeavyParts Password Reset',
'Hi {{first_name}},

You requested to reset your password for your HeavyParts account.

Your password reset code is: {{otp_code}}

Use this code to reset your password. This code will expire in 15 minutes.

If you didn''t request this password reset, please ignore this email.

Best regards,
The HeavyParts Team

---
AL HAJ HASSAN UNITED CO
Email: info@alhajhasan.sa
Phone: +966115081749');

-- Enable RLS on email templates
ALTER TABLE public.email_templates_qwerty12345 ENABLE ROW LEVEL SECURITY;

-- Create policies for email templates
CREATE POLICY "Allow public read access to email templates" 
ON public.email_templates_qwerty12345 FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to email templates" 
ON public.email_templates_qwerty12345 FOR ALL USING (
  auth.role() = 'authenticated'
) WITH CHECK (
  auth.role() = 'authenticated'
);