import supabase from '../lib/supabase';
import {storageService} from './storageService';

export const productService = {
  async getAllProducts() {
    const {data, error} = await supabase
      .from('woo_import_products')
      .select('*')
      .order('created_at', {ascending: false});

    if (error) throw error;
    return data || [];
  },

  async getProductById(id) {
    const {data, error} = await supabase
      .from('woo_import_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createProduct(productData) {
    try {
      console.log('Creating product with data:', productData);

      // Process images before saving
      let mainImage = '';
      let images = [];

      if (Array.isArray(productData.images) && productData.images.length > 0) {
        console.log('Processing images for new product...');
        const processedImages = [];

        for (const image of productData.images) {
          try {
            // Only process if it's not already a URL
            if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('data:'))) {
              const processedImage = await storageService.uploadProductImage(image);
              processedImages.push(processedImage);
              console.log('Processed image:', processedImage);
            } else if (image instanceof File) {
              const processedImage = await storageService.uploadProductImage(image);
              processedImages.push(processedImage);
              console.log('Processed file:', processedImage);
            } else {
              // Keep as is if it's already processed
              processedImages.push(image);
            }
          } catch (error) {
            console.error('Failed to process image:', error);
            // Keep the original image as fallback
            processedImages.push(image);
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

      const {data, error} = await supabase
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
      const {data: existingProduct, error: fetchError} = await supabase
        .from('woo_import_products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching existing product:', fetchError);
        throw new Error(`Failed to fetch existing product: ${fetchError.message}`);
      }

      console.log('Existing product data:', existingProduct);

      // Process images if they were updated
      let mainImage = existingProduct.image;
      let images = existingProduct.images || [];

      // CRITICAL FIX: Only process images if they were explicitly provided
      if (productData.hasOwnProperty('images') && Array.isArray(productData.images)) {
        console.log('Processing image updates...');
        if (productData.images.length > 0) {
          console.log('Processing new images for product update...');
          const processedImages = [];

          for (const image of productData.images) {
            try {
              // Check if it's a new image that needs processing
              if (typeof image === 'string') {
                if (image.startsWith('data:')) {
                  // It's a base64 data URL, needs to be uploaded
                  console.log('Uploading base64 data URL image...');
                  const processedImage = await storageService.uploadProductImage(image);
                  processedImages.push(processedImage);
                  console.log('Processed data URL image:', processedImage);
                } else if (image.startsWith('http') || image.startsWith('https')) {
                  // It's already a valid URL, keep as is
                  processedImages.push(image);
                  console.log('Kept existing URL image:', image);
                } else {
                  // It's some other string, keep as is
                  processedImages.push(image);
                  console.log('Kept string image:', image);
                }
              } else if (image instanceof File) {
                // It's a file object, needs to be uploaded
                console.log('Uploading file object...');
                const processedImage = await storageService.uploadProductImage(image);
                processedImages.push(processedImage);
                console.log('Processed file:', processedImage);
              } else {
                // Keep as is if it's already processed
                processedImages.push(image);
                console.log('Kept processed image:', image);
              }
            } catch (error) {
              console.error('Failed to process image:', error);
              // Keep the original image as fallback
              processedImages.push(image);
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
      const {data, error} = await supabase
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
      const {data: product} = await supabase
        .from('woo_import_products')
        .select('images')
        .eq('id', id)
        .single();

      // Try to delete product images from storage
      if (product?.images && Array.isArray(product.images)) {
        for (const imageUrl of product.images) {
          try {
            await storageService.deleteProductImage(imageUrl);
          } catch (deleteError) {
            console.error('Failed to delete product image:', deleteError);
            // Continue with the rest of the operation
          }
        }
      }

      // Delete the product record
      const {error} = await supabase
        .from('woo_import_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return {success: true};
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async bulkUpdateProducts(productIds, updates) {
    try {
      console.log('Bulk updating products:', productIds, updates);
      const updateData = {...updates};

      const {error} = await supabase
        .from('woo_import_products')
        .update(updateData)
        .in('id', productIds);

      if (error) {
        console.error('Bulk update error:', error);
        throw error;
      }

      console.log('Bulk update successful');
      return {success: true};
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw error;
    }
  },

  async bulkDeleteProducts(productIds) {
    try {
      // Get products to delete their images first
      const {data: products} = await supabase
        .from('woo_import_products')
        .select('id, images')
        .in('id', productIds);

      // Try to delete product images from storage
      if (products && products.length > 0) {
        for (const product of products) {
          if (product.images && Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
              try {
                await storageService.deleteProductImage(imageUrl);
              } catch (deleteError) {
                console.error('Failed to delete product image:', deleteError);
                // Continue with the rest of the operation
              }
            }
          }
        }
      }

      // Delete the product records
      const {error} = await supabase
        .from('woo_import_products')
        .delete()
        .in('id', productIds);

      if (error) throw error;
      return {success: true};
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      throw error;
    }
  },

  async getFeaturedProducts() {
    const {data, error} = await supabase
      .from('woo_import_products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', {ascending: false})
      .limit(8);

    if (error) throw error;
    return data || [];
  },

  async searchProducts(searchTerm) {
    const {data, error} = await supabase
      .from('woo_import_products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('created_at', {ascending: false});

    if (error) throw error;
    return data || [];
  },

  async getBrands() {
    const {data, error} = await supabase
      .from('woo_import_products')
      .select('brand')
      .not('brand', 'is', null);

    if (error) throw error;
    // Get unique brands
    const brands = [...new Set(data.map(item => item.brand))].filter(Boolean);
    return brands;
  },

  async getCategories() {
    const {data, error} = await supabase
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
      const {count} = await supabase
        .from('woo_import_products')
        .select('*', {count: 'exact', head: true});

      if (count === 0) {
        console.log('No products to clear');
        return {success: true, deletedCount: 0};
      }

      // Delete all products
      const {error} = await supabase
        .from('woo_import_products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all real UUIDs

      if (error) throw error;

      console.log(`Successfully cleared ${count} products`);
      return {success: true, deletedCount: count};
    } catch (error) {
      console.error('Error clearing products:', error);
      throw error;
    }
  }
};