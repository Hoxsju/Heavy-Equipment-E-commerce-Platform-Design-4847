import supabase from '../lib/supabase';

export const productService = {
  async getAllProducts() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProductById(id) {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createProduct(productData) {
    const { data, error } = await supabase
      .from('woo_import_products')
      .insert([{
        name: productData.name,
        part_number: productData.partNumber,
        brand: productData.brand,
        category: productData.category,
        price: productData.price ? parseFloat(productData.price) : null,
        sale_price: productData.salePrice ? parseFloat(productData.salePrice) : null,
        stock: productData.stock ? parseInt(productData.stock) : null,
        description: productData.description,
        image: productData.image || productData.mainImage,
        status: productData.status || 'draft',
        slug: productData.slug
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id, productData) {
    try {
      console.log('Updating product:', id, productData);
      
      // Prepare update data with correct field mappings
      const updateData = {
        name: productData.name,
        part_number: productData.partNumber || productData.part_number,
        brand: productData.brand,
        category: productData.category,
        price: productData.price ? parseFloat(productData.price) : null,
        sale_price: productData.salePrice ? parseFloat(productData.salePrice) : null,
        stock: productData.stock ? parseInt(productData.stock) : null,
        description: productData.description,
        image: productData.mainImage || productData.image,
        status: productData.status || 'draft',
        slug: productData.slug
      };

      const { data, error } = await supabase
        .from('woo_import_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Product updated successfully:', data);
      return { ...data, partNumber: data.part_number, salePrice: data.sale_price };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('woo_import_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  async bulkUpdateProducts(productIds, updates) {
    try {
      console.log('Bulk updating products:', productIds, updates);
      const updateData = {...updates};
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

  async bulkDeleteProducts(productIds) {
    const { error } = await supabase
      .from('woo_import_products')
      .delete()
      .in('id', productIds);

    if (error) throw error;
    return { success: true };
  },

  async getFeaturedProducts() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data;
  },

  async searchProducts(searchTerm) {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getBrands() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('brand')
      .not('brand', 'is', null);

    if (error) throw error;
    // Get unique brands
    const brands = [...new Set(data.map(item => item.brand))];
    return brands;
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('woo_import_products')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories;
  }
};