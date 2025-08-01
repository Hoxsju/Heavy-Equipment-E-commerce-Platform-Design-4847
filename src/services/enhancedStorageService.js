import supabase from '../lib/supabase';
import { imageOptimizationService } from './imageOptimizationService';

export const enhancedStorageService = {
  /**
   * Upload an optimized image with thumbnail generation
   * @param {File|String} fileOrBase64 - File object or base64 string to upload
   * @param {String} folder - Optional folder path within the bucket
   * @returns {Promise<Object>} - Object containing thumbnail and full image URLs
   */
  async uploadOptimizedProductImage(fileOrBase64, folder = 'products') {
    try {
      console.log('Starting optimized image upload process...');

      // If it's already a valid HTTP URL, return it as-is
      if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http') || fileOrBase64.startsWith('https'))) {
        console.log('Image is already a valid URL, returning as-is');
        return {
          thumbnail: fileOrBase64,
          fullImage: fileOrBase64,
          isOptimized: false
        };
      }

      // If it's a base64 data URL, convert to file
      if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
        console.log('Converting base64 to file for optimization...');
        try {
          const file = await this.dataURLtoFile(fileOrBase64, 'image.jpg');
          fileOrBase64 = file;
        } catch (conversionError) {
          console.error('Failed to convert base64 to file:', conversionError);
          return {
            thumbnail: fileOrBase64,
            fullImage: fileOrBase64,
            isOptimized: false
          };
        }
      }

      // Only process actual File objects
      if (!(fileOrBase64 instanceof File)) {
        console.log('Input is not a File object, returning as-is');
        return {
          thumbnail: fileOrBase64,
          fullImage: fileOrBase64,
          isOptimized: false
        };
      }

      const file = fileOrBase64;

      // Validate file
      const validation = imageOptimizationService.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`Invalid image file: ${validation.errors.join(', ')}`);
      }

      // Create bucket if it doesn't exist
      await this.createBucketIfNotExists();

      // Optimize the image
      console.log('Optimizing image...');
      const optimizedImages = await imageOptimizationService.optimizeImage(file);

      console.log('Optimization complete:', {
        thumbnailSize: `${(optimizedImages.thumbnail.size / 1024).toFixed(2)}KB`,
        fullImageSize: `${(optimizedImages.fullImage.size / 1024).toFixed(2)}KB`,
        originalSize: `${(file.size / 1024).toFixed(2)}KB`
      });

      // Generate unique filenames
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExt = 'jpg'; // Always use JPG for optimized images

      const thumbnailFileName = `${folder}/thumbnails/${randomId}_${timestamp}_thumb.${fileExt}`;
      const fullImageFileName = `${folder}/full/${randomId}_${timestamp}_full.${fileExt}`;

      // Convert optimized images to blobs for upload
      const thumbnailBlob = await this.dataURLToBlob(optimizedImages.thumbnail.dataUrl);
      const fullImageBlob = await this.dataURLToBlob(optimizedImages.fullImage.dataUrl);

      console.log('Uploading thumbnail to Supabase storage...');
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('product_images')
        .upload(thumbnailFileName, thumbnailBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (thumbnailError) {
        console.error('Thumbnail upload failed:', thumbnailError);
        throw thumbnailError;
      }

      console.log('Uploading full image to Supabase storage...');
      const { data: fullImageData, error: fullImageError } = await supabase.storage
        .from('product_images')
        .upload(fullImageFileName, fullImageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (fullImageError) {
        console.error('Full image upload failed:', fullImageError);
        // If full image upload fails, use thumbnail as fallback
        console.log('Using thumbnail as fallback for full image');
      }

      // Get public URLs
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(thumbnailFileName);

      const { data: { publicUrl: fullImageUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(fullImageError ? thumbnailFileName : fullImageFileName);

      console.log('Upload successful:', {
        thumbnail: thumbnailUrl,
        fullImage: fullImageUrl
      });

      return {
        thumbnail: thumbnailUrl,
        fullImage: fullImageUrl,
        isOptimized: true,
        metadata: {
          originalSize: file.size,
          thumbnailSize: optimizedImages.thumbnail.size,
          fullImageSize: optimizedImages.fullImage.size,
          compressionRatio: ((file.size - optimizedImages.fullImage.size) / file.size * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      console.error('Error uploading optimized image:', error);
      
      // Fallback: try to convert to base64 if it's a File object
      if (fileOrBase64 instanceof File) {
        try {
          console.log('Falling back to base64 conversion...');
          const base64 = await this.convertFileToBase64(fileOrBase64);
          return {
            thumbnail: base64,
            fullImage: base64,
            isOptimized: false,
            fallback: true
          };
        } catch (base64Error) {
          console.error('Base64 conversion also failed:', base64Error);
        }
      }

      // Return original input as last resort
      return {
        thumbnail: fileOrBase64,
        fullImage: fileOrBase64,
        isOptimized: false,
        error: error.message
      };
    }
  },

  /**
   * Convert data URL to Blob
   * @param {string} dataURL
   * @returns {Promise<Blob>}
   */
  async dataURLToBlob(dataURL) {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        resolve(new Blob([u8arr], { type: mime }));
      } catch (error) {
        reject(error);
      }
    });
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
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        const file = new File([u8arr], filename, { type: mime });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Delete images from Supabase storage by URL
   * @param {String|Array} imageUrls - URL or array of URLs of images to delete
   * @returns {Promise<Boolean>} - Success status
   */
  async deleteOptimizedImages(imageUrls) {
    try {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      let successCount = 0;

      for (const imageUrl of urls) {
        try {
          if (!imageUrl || !imageUrl.includes('supabase')) {
            console.log('Not a Supabase storage URL, skipping delete');
            continue;
          }

          const url = new URL(imageUrl);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'product_images');
          
          if (bucketIndex === -1) {
            console.log('Could not find bucket name in URL');
            continue;
          }

          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          console.log('Attempting to delete file:', filePath);

          const { error } = await supabase.storage
            .from('product_images')
            .remove([filePath]);

          if (error) {
            console.error('Error deleting image:', error);
          } else {
            console.log('Image deleted successfully:', filePath);
            successCount++;
          }
        } catch (error) {
          console.error('Error processing image URL for deletion:', error);
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error('Error deleting optimized images:', error);
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

      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: listError };
      }

      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
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
  },

  /**
   * Get optimized image URLs for display
   * @param {Object} product - Product object with image data
   * @returns {Object} - Object with thumbnail and full image URLs
   */
  getOptimizedImageUrls(product) {
    if (!product) return { thumbnail: null, fullImage: null };

    // Check if product has optimized images
    if (product.thumbnail && product.fullImage) {
      return {
        thumbnail: product.thumbnail,
        fullImage: product.fullImage
      };
    }

    // Fallback to regular image processing
    const getValidImageUrl = (url) => {
      if (!url || typeof url !== 'string') return null;
      const trimmed = url.trim();
      return (trimmed.startsWith('http') || trimmed.startsWith('https') || trimmed.startsWith('data:')) ? trimmed : null;
    };

    // First priority: product.image
    const mainImage = getValidImageUrl(product.image);
    if (mainImage) {
      return {
        thumbnail: mainImage,
        fullImage: mainImage
      };
    }

    // Second priority: first valid image from images array
    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        const validUrl = getValidImageUrl(img);
        if (validUrl) {
          return {
            thumbnail: validUrl,
            fullImage: validUrl
          };
        }
      }
    }

    return { thumbnail: null, fullImage: null };
  }
};

export default enhancedStorageService;