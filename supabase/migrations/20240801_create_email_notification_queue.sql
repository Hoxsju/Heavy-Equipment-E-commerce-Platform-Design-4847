-- Create email notifications queue table
CREATE TABLE IF NOT EXISTS order_email_notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE order_email_notifications_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow insert access to all" ON order_email_notifications_queue 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow read access to admins" ON order_email_notifications_queue 
  FOR SELECT USING (auth.role() IN ('admin', 'main_admin'));
  
CREATE POLICY "Allow update access to admins" ON order_email_notifications_queue 
  FOR UPDATE USING (auth.role() IN ('admin', 'main_admin'))
  WITH CHECK (auth.role() IN ('admin', 'main_admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS order_email_notifications_status_idx 
  ON order_email_notifications_queue(status);
  
CREATE INDEX IF NOT EXISTS order_email_notifications_created_at_idx 
  ON order_email_notifications_queue(created_at);

-- Create email notification trigger function
CREATE OR REPLACE FUNCTION handle_order_update_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  customer_email TEXT;
  order_id TEXT;
  order_status TEXT;
  order_total DECIMAL;
BEGIN
  -- Get customer email and order details
  customer_email := NEW.customer_email;
  order_id := NEW.id;
  order_status := NEW.status;
  order_total := NEW.total_price;
  
  -- Only send notification if the order was updated (not newly created)
  -- This is determined by checking if updated_at is different from created_at
  IF NEW.updated_at IS DISTINCT FROM NEW.created_at THEN
    -- Insert a record into a notification queue table
    INSERT INTO order_email_notifications_queue (
      order_id, 
      customer_email, 
      subject, 
      message_body,
      status
    ) VALUES (
      order_id,
      customer_email,
      'Your order #' || substring(order_id::text, 1, 8) || ' has been updated',
      'Dear Customer,

Your order #' || substring(order_id::text, 1, 8) || ' has been updated.

Status: ' || order_status || '
' || CASE WHEN order_total > 0 THEN 'Total: $' || order_total::text ELSE 'Pricing: Pending quote' END || '

Please log in to your account to view the complete order details:
https://deluxe-bombolone-47b1e6.netlify.app/#/profile

If you have any questions, please contact our customer service team.

Thank you for choosing our services.

Best regards,
AL HAJ HASSAN UNITED CO
',
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS order_update_email_notification_trigger ON orders_qwerty12345;

CREATE TRIGGER order_update_email_notification_trigger
AFTER UPDATE ON orders_qwerty12345
FOR EACH ROW
EXECUTE FUNCTION handle_order_update_email_notification();