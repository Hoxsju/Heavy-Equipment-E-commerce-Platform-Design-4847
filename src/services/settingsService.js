import supabase from '../lib/supabase';

export const settingsService = {
  async getSettings() {
    try {
      console.log('Fetching settings from database...');
      
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('settings_qwerty12345')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // If table doesn't exist, create it and return defaults
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('Settings table does not exist, creating it...');
          await this.createSettingsTable();
          return this.getDefaultSettings();
        }
        
        // For other errors, return defaults
        return this.getDefaultSettings();
      }

      // If we have data from database, return it
      if (data) {
        console.log('Settings loaded from database:', data);
        return {
          websiteName: data.website_name || 'HeavyParts',
          whatsappNumber: data.whatsapp_number || '+966502255702',
          companyName: data.company_name || 'AL HAJ HASSAN UNITED CO',
          companyEmail: data.company_email || 'info@alhajhasan.sa',
          companyAddress: data.company_address || '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia',
          websiteLogo: data.website_logo || '',
          websiteSlogan: data.website_slogan || 'Quality Heavy Equipment Parts',
          footerDescription: data.footer_description || 'Your trusted source for heavy equipment spare parts from leading brands.',
          footerPhone: data.footer_phone || '+966115081749',
          footerEmail: data.footer_email || 'info@alhajhasan.sa',
          footerAddress: data.footer_address || '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia'
        };
      }

      // Fallback to localStorage if database is empty
      const localSettings = localStorage.getItem('heavyparts_settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        console.log('Settings loaded from localStorage, syncing to database...');
        // Also save to database for future use
        await this.saveSettings(parsed);
        return parsed;
      }

      // Return default settings if nothing is found
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error in getSettings:', error);
      return this.getDefaultSettings();
    }
  },

  getDefaultSettings() {
    return {
      websiteName: 'HeavyParts',
      whatsappNumber: '+966502255702',
      companyName: 'AL HAJ HASSAN UNITED CO',
      companyEmail: 'info@alhajhasan.sa',
      companyAddress: '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia',
      websiteLogo: '',
      websiteSlogan: 'Quality Heavy Equipment Parts',
      footerDescription: 'Your trusted source for heavy equipment spare parts from leading brands.',
      footerPhone: '+966115081749',
      footerEmail: 'info@alhajhasan.sa',
      footerAddress: '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia'
    };
  },

  async createSettingsTable() {
    try {
      console.log('Creating settings table...');
      
      // Create table with RLS policies using raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create settings table if it doesn't exist
          CREATE TABLE IF NOT EXISTS public.settings_qwerty12345 (
            id INTEGER PRIMARY KEY DEFAULT 1,
            website_name TEXT DEFAULT 'HeavyParts',
            whatsapp_number TEXT DEFAULT '+966502255702',
            company_name TEXT DEFAULT 'AL HAJ HASSAN UNITED CO',
            company_email TEXT DEFAULT 'info@alhajhasan.sa',
            company_address TEXT DEFAULT '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia',
            website_logo TEXT DEFAULT '',
            website_slogan TEXT DEFAULT 'Quality Heavy Equipment Parts',
            footer_description TEXT DEFAULT 'Your trusted source for heavy equipment spare parts from leading brands.',
            footer_phone TEXT DEFAULT '+966115081749',
            footer_email TEXT DEFAULT 'info@alhajhasan.sa',
            footer_address TEXT DEFAULT '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Enable Row Level Security
          ALTER TABLE public.settings_qwerty12345 ENABLE ROW LEVEL SECURITY;

          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Enable public read access" ON public.settings_qwerty12345;
          DROP POLICY IF EXISTS "Enable public insert access" ON public.settings_qwerty12345;
          DROP POLICY IF EXISTS "Enable public update access" ON public.settings_qwerty12345;

          -- Create new policies for public access
          CREATE POLICY "Enable public read access" ON public.settings_qwerty12345 
            FOR SELECT USING (true);

          CREATE POLICY "Enable public insert access" ON public.settings_qwerty12345 
            FOR INSERT WITH CHECK (true);

          CREATE POLICY "Enable public update access" ON public.settings_qwerty12345 
            FOR UPDATE USING (true) WITH CHECK (true);

          -- Insert default settings if no record exists
          INSERT INTO public.settings_qwerty12345 (
            id,
            website_name,
            whatsapp_number,
            company_name,
            company_email,
            company_address,
            website_logo,
            website_slogan,
            footer_description,
            footer_phone,
            footer_email,
            footer_address
          ) 
          SELECT 
            1,
            'HeavyParts',
            '+966502255702',
            'AL HAJ HASSAN UNITED CO',
            'info@alhajhasan.sa',
            '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia',
            '',
            'Quality Heavy Equipment Parts',
            'Your trusted source for heavy equipment spare parts from leading brands.',
            '+966115081749',
            'info@alhajhasan.sa',
            '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia'
          WHERE NOT EXISTS (SELECT 1 FROM public.settings_qwerty12345 WHERE id = 1);
        `
      });

      if (error) {
        console.error('Error creating settings table:', error);
        throw error;
      }

      console.log('Settings table created successfully');
    } catch (error) {
      console.error('Failed to create settings table:', error);
      // Don't throw here, let the app continue with defaults
    }
  },

  async saveSettings(settings) {
    try {
      console.log('Saving settings to database:', settings);
      
      // Save to Supabase database
      const { error } = await supabase
        .from('settings_qwerty12345')
        .upsert({
          id: 1, // Single settings record
          website_name: settings.websiteName,
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

      if (error) {
        console.error('Error saving to database:', error);
        
        // If table doesn't exist, try to create it first
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('Table does not exist, creating it and retrying...');
          await this.createSettingsTable();
          
          // Retry the save operation
          const { error: retryError } = await supabase
            .from('settings_qwerty12345')
            .upsert({
              id: 1,
              website_name: settings.websiteName,
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
          
          if (retryError) {
            console.error('Retry save failed:', retryError);
            throw retryError;
          }
        } else {
          throw error;
        }
      }

      // Also save to localStorage as backup
      localStorage.setItem('heavyparts_settings', JSON.stringify(settings));

      // Broadcast settings update event
      const settingsEvent = new CustomEvent('settingsUpdated', { detail: settings });
      window.dispatchEvent(settingsEvent);

      console.log('Settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Fallback to localStorage only
      localStorage.setItem('heavyparts_settings', JSON.stringify(settings));
      
      // Broadcast settings update event
      const settingsEvent = new CustomEvent('settingsUpdated', { detail: settings });
      window.dispatchEvent(settingsEvent);
      
      return { success: true };
    }
  }
};