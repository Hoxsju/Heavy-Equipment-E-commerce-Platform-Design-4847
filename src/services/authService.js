import supabase from '../lib/supabase';
import { emailService } from './emailService';

export const authService = {
  async getCurrentUser() {
    try {
      // First try to get from localStorage
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('Found stored user:', userData);
        return userData;
      }
      
      // If no stored user, return null
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async register(userData) {
    try {
      console.log('Starting registration process for:', userData.email);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users_qwerty12345')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        if (!existingUser.email_confirmed) {
          // If user exists but email not confirmed, allow re-sending verification
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          
          await supabase
            .from('users_qwerty12345')
            .update({
              confirmation_code: verificationCode,
              confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', existingUser.id);

          await emailService.sendVerificationCode(userData.email, verificationCode);

          return {
            needsConfirmation: true,
            user: {
              id: existingUser.id,
              email: existingUser.email,
              firstName: existingUser.first_name,
              lastName: existingUser.last_name,
              role: existingUser.role
            }
          };
        } else {
          throw new Error('ACCOUNT_EXISTS');
        }
      }

      // Special handling for main admin
      const isMainAdmin = userData.email === 'hoxs@regravity.net';

      // Generate verification code for non-main admin users
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Create user record
      const { data: newUser, error: userError } = await supabase
        .from('users_qwerty12345')
        .insert([{
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          role: isMainAdmin ? 'main_admin' : 'user',
          email_confirmed: isMainAdmin, // Main admin is auto-confirmed
          confirmation_code: isMainAdmin ? null : verificationCode,
          confirmation_expires_at: isMainAdmin ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();

      if (userError) {
        console.error('Database error:', userError);
        throw new Error('REGISTRATION_FAILED');
      }

      // Send verification code for non-main admin users
      if (!isMainAdmin) {
        try {
          await emailService.sendVerificationCode(userData.email, verificationCode);
          console.log('Verification email sent successfully');
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          throw new Error('VERIFICATION_EMAIL_FAILED');
        }

        return {
          needsConfirmation: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role
          }
        };
      }

      // For main admin, return user data directly
      return {
        needsConfirmation: false,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      console.log('Login attempt for:', email);

      // Check for demo accounts
      const isDemoAccount = email === 'admin@demo.com' || email === 'demo@demo.com';
      const isMainAdmin = email === 'hoxs@regravity.net';

      if (isDemoAccount) {
        // Handle demo accounts
        const demoUser = {
          id: email === 'admin@demo.com' ? 'demo-admin-id' : 'demo-user-id',
          email: email,
          firstName: email === 'admin@demo.com' ? 'Admin' : 'Demo',
          lastName: 'User',
          role: email === 'admin@demo.com' ? 'admin' : 'user',
          emailConfirmed: true
        };

        return { needsConfirmation: false, user: demoUser };
      }

      // For real users, fetch from database
      const { data: user, error } = await supabase
        .from('users_qwerty12345')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        throw new Error('USER_NOT_FOUND');
      }

      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Update last login
      await supabase
        .from('users_qwerty12345')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // For real users, check if email is confirmed
      if (!user.email_confirmed && !isDemoAccount && !isMainAdmin) {
        // Generate new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Update the user with the new verification code
        await supabase
          .from('users_qwerty12345')
          .update({
            confirmation_code: verificationCode,
            confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', user.id);

        // Send verification code via email
        try {
          await emailService.sendVerificationCode(email, verificationCode);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          throw new Error('VERIFICATION_EMAIL_FAILED');
        }

        return {
          needsConfirmation: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          }
        };
      }

      // Return confirmed user
      return {
        needsConfirmation: false,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          emailConfirmed: user.email_confirmed
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  async confirmEmail(email, code) {
    try {
      // In a real app, we would validate the code against the database
      console.log(`Confirming email for ${email} with code ${code}`);
      
      // For demo purposes, create a user account
      const user = {
        id: 'verified-' + Date.now(),
        email,
        firstName: 'Verified',
        lastName: 'User',
        role: 'user',
        emailConfirmed: true
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      return { user };
    } catch (error) {
      console.error('Email confirmation error:', error);
      
      // For demo purposes, still return a successful response
      const fallbackUser = {
        id: 'verified-' + Date.now(),
        email,
        firstName: 'Verified',
        lastName: 'User',
        role: 'user',
        emailConfirmed: true
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
      
      return { user: fallbackUser };
    }
  }
};