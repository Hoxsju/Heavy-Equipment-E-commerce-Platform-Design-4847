# Domain Configuration Guide

## Current Issue
The Supabase authentication is configured for the production domain `https://alhajhasan.sa`, but during development you're likely using a different URL (localhost, preview URL, etc.). This causes authentication failures.

## Quick Fix for Development

### Option 1: Update Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/kiuzrsirplaulpogsdup
2. Navigate to **Authentication → URL Configuration**
3. Add your development URLs to the **Redirect URLs** list:
   - `http://localhost:5173/#/auth/callback` (for Vite dev server)
   - `https://your-preview-url.netlify.app/#/auth/callback` (if using Netlify)
   - Keep the existing: `https://alhajhasan.sa/#/auth/callback`

### Option 2: Temporary Local Configuration
The code has been updated to automatically use the current domain for redirects during development while maintaining production compatibility.

## How the Fix Works

1. **Dynamic Domain Detection**: The `supabase.js` file now detects the current domain automatically
2. **Flexible Redirects**: Authentication redirects work with any domain (localhost, preview URLs, production)
3. **Error Handling**: Better error messages for authentication issues
4. **Graceful Fallbacks**: If one method fails, the system tries alternatives

## Testing the Fix

1. **Clear Browser Data**: Clear cookies and localStorage
2. **Try Registration**: Test with a new email address
3. **Check Console**: Look for any error messages in browser console
4. **Verify Redirects**: Ensure auth callbacks work properly

## Production Deployment

When deploying to production (`https://alhajhasan.sa`):
1. The system will automatically use the production domain
2. All authentication flows will work seamlessly
3. No additional configuration needed

## Troubleshooting

If you still see issues:

1. **Check Supabase Dashboard**:
   - Verify the Site URL is set correctly
   - Ensure all redirect URLs are properly configured
   - Check that email templates are working

2. **Browser Console**:
   - Look for specific error messages
   - Check network tab for failed requests
   - Verify redirect URLs in the logs

3. **Clear Data**:
   - Clear browser cache and cookies
   - Try in incognito/private mode
   - Test with different browsers

4. **Contact Support**:
   - If issues persist, the error logs will help identify the specific problem
   - Check the browser console for detailed error messages

## Current Configuration Status

✅ **Code Updated**: Dynamic domain detection implemented
✅ **Error Handling**: Improved error messages and fallbacks
✅ **Redirect URLs**: Flexible redirect system
⚠️ **Supabase Dashboard**: May need manual URL configuration for development

The registration should now work properly on both development and production environments.