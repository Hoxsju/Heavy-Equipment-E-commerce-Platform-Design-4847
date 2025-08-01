import supabase from '../lib/supabase';
import { enhancedStorageService } from './enhancedStorageService';

export const productService = {
  async getAllProducts() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Process and validate images with optimization support
    const processedData = (data || []).map(product => {
      let processedProduct = { ...product };
      
      // Ensure images is always an array
      if (!Array.isArray(processedProduct.images)) {
        processedProduct.images = [];
      }
      
      // Clean and validate image URLs
      processedProduct.images = processedProduct.images
        .filter(img => img && typeof img === 'string' && img.trim().length > 0)
        .map(img => img.trim())
        .filter(img => {
          // Only keep valid URLs or base64 images
          return img.startsWith('http') || img.startsWith('https') || img.startsWith('data:');
        });
      
      // Set main image from images array if not set
      if (!processedProduct.image && processedProduct.images.length > 0) {
        processedProduct.image = processedProduct.images[0];
      }
      
      // Validate main image
      if (processedProduct.image && typeof processedProduct.image === 'string') {
        const img = processedProduct.image.trim();
        if (!img.startsWith('http') && !img.startsWith('https') && !img.startsWith('data:')) {
          processedProduct.image = '';
        } else {
          processedProduct.image = img;
        }
      }
      
      return processedProduct;
    });
    
    return processedData;
  },

  async getProductById(id) {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    let processedProduct = { ...data };
    
    // Ensure images is always an array
    if (!Array.isArray(processedProduct.images)) {
      processedProduct.images = [];
    }
    
    // Clean and validate image URLs
    processedProduct.images = processedProduct.images
      .filter(img => img && typeof img === 'string' && img.trim().length > 0)
      .map(img => img.trim())
      .filter(img => {
        // Only keep valid URLs or base64 images
        return img.startsWith('http') || img.startsWith('https') || img.startsWith('data:');
      });
    
    // Set main image from images array if not set
    if (!processedProduct.image && processedProduct.images.length > 0) {
      processedProduct.image = processedProduct.images[0];
    }
    
    // Validate main image
    if (processedProduct.image && typeof processedProduct.image === 'string') {
      const img = processedProduct.image.trim();
      if (!img.startsWith('http') && !img.startsWith('https') && !img.startsWith('data:')) {
        processedProduct.image = '';
      } else {
        processedProduct.image = img;
      }
    }
    
    // Log for debugging
    console.log('Product Image Debug:', {
      id: processedProduct.id,
      name: processedProduct.name,
      main_image: processedProduct.image,
      images_count: processedProduct.images.length,
      first_image: processedProduct.images[0] || 'none'
    });
    
    return processedProduct;
  },

  async createProduct(productData) {
    try {
      console.log('Creating product with data:', productData);
      
      // Process images before saving with optimization
      let mainImage = '';
      let images = [];
      
      if (Array.isArray(productData.images) && productData.images.length > 0) {
        console.log('Processing images for new product...');
        const processedImages = [];
        
        for (const image of productData.images) {
          try {
            if (typeof image === 'string' && image.trim().length > 0) {
              const trimmedImage = image.trim();
              if (trimmedImage.startsWith('http') || trimmedImage.startsWith('https')) {
                // Valid URL, keep as is
                processedImages.push(trimmedImage);
              } else if (trimmedImage.startsWith('data:')) {
                // Base64 image, try to upload to storage with optimization
                try {
                  const result = await enhancedStorageService.uploadOptimizedProductImage(trimmedImage);
                  processedImages.push(result.thumbnail); // Use thumbnail for storage
                } catch (uploadError) {
                  console.error('Failed to upload base64 image:', uploadError);
                  // Keep original as fallback
                  processedImages.push(trimmedImage);
                }
              }
            } else if (image instanceof File) {
              try {
                const result = await enhancedStorageService.uploadOptimizedProductImage(image);
                processedImages.push(result.thumbnail); // Use thumbnail for storage
              } catch (uploadError) {
                console.error('Failed to upload file:', uploadError);
                // Convert to base64 as fallback
                const base64 = await this.convertFileToBase64(image);
                processedImages.push(base64);
              }
            }
          } catch (error) {
            console.error('Failed to process image:', error);
          }
        }
        
        images = processedImages;
        mainImage = images[0] || '';
      }
      
      // Prepare the product data for insertion
      const insertData = {
        name: productData.name,
        part_number: productData.partNumber,
        brand: productData.brand,
        category: productData.category,
        price: productData.price ? parseFloat(productData.price) : null,
        sale_price: productData.salePrice ? parseFloat(productData.salePrice) : null,
        stock: productData.stock ? parseInt(productData.stock) : 10,
        description: productData.description || '',
        image: mainImage,
        images: images,
        status: productData.status || 'published',
        slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      };

      console.log('Inserting product data:', insertData);

      const { data, error } = await supabase
        .from('woo_import_products')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Failed to save product: ${error.message}`);
      }

      console.log('Product created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error(`Error creating product: ${error.message}`);
    }
  },

  async updateProduct(id, productData) {
    try {
      console.log('Updating product:', id, productData);
      
      // Get existing product data first
      const { data: existingProduct, error: fetchError } = await supabase
        .from('woo_import_products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching existing product:', fetchError);
        throw new Error(`Failed to fetch existing product: ${fetchError.message}`);
      }

      console.log('Existing product data:', existingProduct);

      // Process images if they were updated with optimization
      let mainImage = existingProduct.image;
      let images = existingProduct.images || [];

      // Only process images if they were explicitly provided
      if (productData.hasOwnProperty('images') && Array.isArray(productData.images)) {
        console.log('Processing image updates...');
        if (productData.images.length > 0) {
          console.log('Processing new images for product update...');
          const processedImages = [];
          
          for (const image of productData.images) {
            try {
              if (typeof image === 'string' && image.trim().length > 0) {
                const trimmedImage = image.trim();
                if (trimmedImage.startsWith('http') || trimmedImage.startsWith('https')) {
                  // Valid URL, keep as is
                  processedImages.push(trimmedImage);
                } else if (trimmedImage.startsWith('data:')) {
                  // Base64 image, try to upload to storage with optimization
                  try {
                    const result = await enhancedStorageService.uploadOptimizedProductImage(trimmedImage);
                    processedImages.push(result.thumbnail); // Use thumbnail for storage
                  } catch (uploadError) {
                    console.error('Failed to upload base64 image:', uploadError);
                    // Keep original as fallback
                    processedImages.push(trimmedImage);
                  }
                }
              } else if (image instanceof File) {
                try {
                  const result = await enhancedStorageService.uploadOptimizedProductImage(image);
                  processedImages.push(result.thumbnail); // Use thumbnail for storage
                } catch (uploadError) {
                  console.error('Failed to upload file:', uploadError);
                  // Convert to base64 as fallback
                  const base64 = await this.convertFileToBase64(image);
                  processedImages.push(base64);
                }
              }
            } catch (error) {
              console.error('Failed to process image:', error);
            }
          }
          
          images = processedImages;
          mainImage = images.length > 0 ? images[0] : '';
          console.log('Updated images:', images);
          console.log('Updated main image:', mainImage);
        } else {
          // Empty array means remove all images
          images = [];
          mainImage = '';
          console.log('Removing all images from product');
        }
      }

      // Prepare update data with correct field mappings
      const updateData = {
        name: productData.name !== undefined ? productData.name : existingProduct.name,
        part_number: productData.partNumber || productData.part_number || existingProduct.part_number,
        brand: productData.brand !== undefined ? productData.brand : existingProduct.brand,
        category: productData.category !== undefined ? productData.category : existingProduct.category,
        price: productData.price !== undefined && productData.price !== '' ? parseFloat(productData.price) : existingProduct.price,
        sale_price: productData.salePrice !== undefined && productData.salePrice !== '' ? parseFloat(productData.salePrice) : existingProduct.sale_price,
        stock: productData.stock !== undefined && productData.stock !== '' ? parseInt(productData.stock) : existingProduct.stock,
        description: productData.description !== undefined ? productData.description : existingProduct.description,
        image: mainImage,
        images: images,
        status: productData.status !== undefined ? productData.status : existingProduct.status,
        slug: productData.slug || existingProduct.slug || (productData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || existingProduct.slug,
        updated_at: new Date().toISOString()
      };

      // Remove any undefined values to prevent database errors
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log('Final update data being sent to database:', updateData);

      // Perform the update
      const { data, error } = await supabase
        .from('woo_import_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Update failed: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from update operation');
        throw new Error('No data returned from update operation');
      }

      console.log('Product updated successfully:', data);
      return {
        ...data,
        partNumber: data.part_number,
        salePrice: data.sale_price
      };
    } catch (error) {
      console.error('Error updating product:', error);
      // Provide more specific error messages
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        throw new Error(`Permission denied: You don't have permission to edit products. Please contact your administrator.`);
      } else if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        throw new Error(`A product with this part number already exists.`);
      } else if (error.message?.includes('not null') || error.message?.includes('required')) {
        throw new Error(`Please fill in all required fields.`);
      } else {
        throw new Error(`Error updating product: ${error.message}`);
      }
    }
  },

  async deleteProduct(id) {
    try {
      // Get product to delete its images first
      const { data: product } = await supabase
        .from('woo_import_products')
        .select('images')
        .eq('id', id)
        .single();

      // Try to delete product images from storage
      if (product?.images && Array.isArray(product.images)) {
        await enhancedStorageService.deleteOptimizedImages(product.images);
      }

      // Delete the product record
      const { error } = await supabase
        .from('woo_import_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async bulkDeleteProducts(productIds) {
    try {
      // Get products to delete their images first
      const { data: products } = await supabase
        .from('woo_import_products')
        .select('id, images')
        .in('id', productIds);

      // Try to delete product images from storage
      if (products && products.length > 0) {
        const allImages = products.flatMap(product => product.images || []);
        if (allImages.length > 0) {
          await enhancedStorageService.deleteOptimizedImages(allImages);
        }
      }

      // Delete the product records
      const { error } = await supabase
        .from('woo_import_products')
        .delete()
        .in('id', productIds);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      throw error;
    }
  },

  // Helper method for base64 conversion
  async convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  async bulkUpdateProducts(productIds, updates) {
    try {
      console.log('Bulk updating products:', productIds, updates);
      const updateData = { ...updates };

      const { error } = await supabase
        .from('woo_import_products')
        .update(updateData)
        .in('id', productIds);

      if (error) {
        console.error('Bulk update error:', error);
        throw error;
      }

      console.log('Bulk update successful');
      return { success: true };
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw error;
    }
  },

  async getFeaturedProducts() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data || [];
  },

  async searchProducts(searchTerm) {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBrands() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('brand')
      .not('brand', 'is', null);

    if (error) throw error;
    // Get unique brands
    const brands = [...new Set(data.map(item => item.brand))].filter(Boolean);
    return brands;
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))].filter(Boolean);
    return categories;
  },

  // New method to clear all products
  async clearAllProducts() {
    try {
      console.log('Clearing all products from database...');
      
      // Get count first
      const { count } = await supabase
        .from('woo_import_products')
        .select('*', { count: 'exact', head: true });

      if (count === 0) {
        console.log('No products to clear');
        return { success: true, deletedCount: 0 };
      }

      // Delete all products
      const { error } = await supabase
        .from('woo_import_products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all real UUIDs

      if (error) throw error;

      console.log(`Successfully cleared ${count} products`);
      return { success: true, deletedCount: count };
    } catch (error) {
      console.error('Error clearing products:', error);
      throw error;
    }
  }
};