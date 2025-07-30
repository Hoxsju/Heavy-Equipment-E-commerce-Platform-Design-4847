import supabase from '../lib/supabase';

export const authService = {
  async getCurrentUser() {
    try {
      console.log('AuthService: Getting current user...');
      
      // Then try to get from Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      if (session?.user) {
        console.log('Found Supabase session for user:', session.user.email);
        
        // Get additional user data from our users table
        const { data: userData, error: userError } = await supabase
          .from('users_qwerty12345')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userData) {
          const user = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phone: userData.phone,
            role: userData.role || 'user',
            emailConfirmed: true, // Always treat as confirmed
            address: userData.address,
            city: userData.city,
            state: userData.state,
            zipCode: userData.zip_code,
            country: userData.country,
            status: userData.status || 'active'
          };
          return user;
        } else {
          // User exists in auth but not in our database - create basic record
          return {
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            role: session.user.email === 'hoxs@regravity.net' ? 'main_admin' : 'user', // Special case for admin
            emailConfirmed: true, // Always treat as confirmed
            status: 'active'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('INVALID_CREDENTIALS');
        }
        throw error;
      }

      // Get user data from our database
      const { data: userData, error: userError } = await supabase
        .from('users_qwerty12345')
        .select('*')
        .eq('email', email)
        .single();

      if (userData) {
        const user = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          role: userData.role,
          emailConfirmed: true, // Always treat as confirmed
          status: userData.status || 'active'
        };
        return { user };
      }

      // Fallback with minimal user object
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name || '',
          lastName: data.user.user_metadata?.last_name || '',
          role: email === 'hoxs@regravity.net' ? 'main_admin' : 'user', // Special case for admin
          emailConfirmed: true, // Always treat as confirmed
          status: 'active'
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log('Starting registration process for:', userData.email);

      // Check if user already exists in our database first
      const { data: existingUser, error: checkError } = await supabase
        .from('users_qwerty12345')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      // Get current domain for redirect URL
      const currentDomain = window.location.origin;
      const redirectUrl = `${currentDomain}/#/auth/callback`;
      
      console.log('Using redirect URL:', redirectUrl);

      // Sign up with Supabase Auth - NO email confirmation required
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (authError) {
        console.error('Supabase auth signup error:', authError);
        
        // Handle specific error cases
        if (authError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        
        if (authError.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        }
        
        if (authError.message.includes('Password')) {
          throw new Error('Password must be at least 6 characters long.');
        }

        // Generic error handling
        throw new Error('Registration failed. Please try again.');
      }

      console.log('Supabase auth signup successful:', authData);

      // Create user record in our database
      // Special case for main admin
      const isMainAdmin = userData.email === 'hoxs@regravity.net';
      
      const newUser = {
        id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || null,
        role: isMainAdmin ? 'main_admin' : 'user', // Set role to main_admin for hoxs@regravity.net
        email_confirmed: true, // Always treat as confirmed
        address: userData.address || null,
        city: userData.city || null,
        state: userData.state || null,
        zip_code: userData.zipCode || null,
        country: userData.country || null,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { data: dbUser, error: dbError } = await supabase
        .from('users_qwerty12345')
        .insert([newUser])
        .select()
        .single();

      if (dbError) {
        console.error('Database user creation error:', dbError);
        // Don't throw here - auth user was created successfully
      }

      // Return user data immediately - no email confirmation needed
      const user = {
        id: authData.user.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: newUser.role,
        emailConfirmed: true, // Always treat as confirmed
        status: 'active'
      };

      return { user };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async requestPasswordReset(email) {
    try {
      console.log('Requesting password reset for:', email);
      
      // Get current domain for redirect URL
      const currentDomain = window.location.origin;
      const redirectUrl = `${currentDomain}/#/auth/callback?type=recovery`;
      
      console.log('Using password reset redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // Handle rate limiting specifically
        if (error.message && error.message.includes('18 seconds')) {
          throw new Error('For security purposes, you can only request this after 18 seconds.');
        }
        
        if (error.message.includes('User not found')) {
          throw new Error('USER_NOT_FOUND');
        }
        
        throw error;
      }

      return {
        success: true,
        message: 'Password reset link sent to your email'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  async resetPassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  async updateProfile(userData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone
        }
      });

      if (authError) {
        console.error('Auth profile update error:', authError);
      }

      // Update user record in our database
      const { data: updatedUser, error: dbError } = await supabase
        .from('users_qwerty12345')
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          zip_code: userData.zipCode,
          country: userData.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (dbError) {
        console.error('Database profile update error:', dbError);
        throw dbError;
      }

      return {
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        zipCode: updatedUser.zip_code,
        country: updatedUser.country
      };
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};