import supabase from '../lib/supabase';

export const storageService = {
  /**
   * Upload an image file or base64 string to Supabase storage
   * @param {File|String} fileOrBase64 - File object or base64 string to upload
   * @param {String} folder - Optional folder path within the bucket
   * @returns {Promise<String>} - URL of the uploaded file
   */
  async uploadProductImage(fileOrBase64, folder = 'products') {
    try {
      console.log('Starting image upload process...', typeof fileOrBase64);
      
      // If it's already a valid HTTP URL, return it as-is
      if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http') || fileOrBase64.startsWith('https'))) {
        console.log('Image is already a valid URL, returning as-is');
        return fileOrBase64;
      }
      
      // If it's a base64 data URL, convert to file if possible
      if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
        console.log('Image is base64 data URL, converting to File');
        try {
          const file = await this.dataURLtoFile(fileOrBase64, 'image.png');
          console.log('Successfully converted base64 to file');
          // Continue with file upload
          fileOrBase64 = file;
        } catch (conversionError) {
          console.log('Failed to convert base64 to file, returning as-is');
          return fileOrBase64;
        }
      }
      
      // Only process actual File objects
      if (!(fileOrBase64 instanceof File)) {
        console.log('Input is not a File object, returning as-is:', typeof fileOrBase64);
        return fileOrBase64;
      }
      
      const file = fileOrBase64;
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, WebP, or GIF format');
      }
      
      // Create bucket if it doesn't exist
      await this.createBucketIfNotExists();
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      console.log(`Uploading file to Supabase storage: ${filePath}`);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Changed to false to avoid conflicts
        });
      
      if (error) {
        console.error('Supabase storage upload failed:', error);
        // Fall back to converting to base64 for local storage
        return await this.convertFileToBase64(file);
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);
      
      console.log('Upload successful, public URL:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('Error uploading image:', error);
      // If it's a File object and upload failed, try to convert to base64
      if (fileOrBase64 instanceof File) {
        try {
          console.log('Falling back to base64 conversion...');
          return await this.convertFileToBase64(fileOrBase64);
        } catch (base64Error) {
          console.error('Base64 conversion also failed:', base64Error);
        }
      }
      // Return original input as fallback
      return fileOrBase64;
    }
  },

  /**
   * Convert a File object to base64 data URL
   * @param {File} file - File object to convert
   * @returns {Promise<String>} - Base64 data URL
   */
  convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Convert a base64 data URL to a File object
   */
  dataURLtoFile(dataUrl, filename) {
    return new Promise((resolve, reject) => {
      try {
        // Extract the base64 data and MIME type
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        // Create a File object
        const file = new File([u8arr], filename, { type: mime });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Delete an image from Supabase storage by URL
   * @param {String} imageUrl - URL of the image to delete
   * @returns {Promise<Boolean>} - Success status
   */
  async deleteProductImage(imageUrl) {
    try {
      // Only try to delete if it's a Supabase storage URL
      if (!imageUrl || !imageUrl.includes('supabase')) {
        console.log('Not a Supabase storage URL, skipping delete');
        return false;
      }
      
      // Extract the file path from the URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      
      // Find the bucket name and extract the path after it
      const bucketIndex = pathParts.findIndex(part => part === 'product_images');
      if (bucketIndex === -1) {
        console.log('Could not find bucket name in URL');
        return false;
      }
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      console.log('Attempting to delete file:', filePath);
      
      const { error } = await supabase.storage
        .from('product_images')
        .remove([filePath]);
      
      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }
      
      console.log('Image deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  },

  /**
   * Create a storage bucket if it doesn't exist
   * @param {String} bucketName - Name of the bucket to create
   * @returns {Promise<Object>} - Result of the operation
   */
  async createBucketIfNotExists(bucketName = 'product_images') {
    try {
      console.log(`Checking if bucket ${bucketName} exists...`);
      
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: listError };
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        
        // Create the bucket
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB in bytes
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        });
        
        if (error) {
          console.error('Error creating bucket:', error);
          return { success: false, error };
        }
        
        console.log(`Bucket ${bucketName} created successfully`);
        return { success: true, data };
      }
      
      console.log(`Bucket ${bucketName} already exists`);
      return { success: true, message: 'Bucket already exists' };
      
    } catch (error) {
      console.error('Error checking/creating bucket:', error);
      return { success: false, error };
    }
  }
};

export default storageService;