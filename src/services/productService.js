// Mock product service
const mockProducts = [
  {
    id: 1,
    name: 'Hydraulic Filter',
    partNumber: 'CAT-126-2081',
    brand: 'Caterpillar',
    category: 'Filters',
    price: 89.99,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    description: 'High-quality hydraulic filter for Caterpillar equipment',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Engine Oil Filter',
    partNumber: 'KOM-600-211-1230',
    brand: 'Komatsu',
    category: 'Filters',
    price: 45.99,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    description: 'Premium engine oil filter for Komatsu machinery',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Hydraulic Pump',
    partNumber: 'BOMAG-05727277',
    brand: 'BOMAG',
    category: 'Hydraulics',
    price: 1299.99,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    description: 'High-performance hydraulic pump for BOMAG compactors',
    createdAt: new Date().toISOString()
  }
];

export const productService = {
  async getAllProducts() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts;
  },

  async getFeaturedProducts() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts.slice(0, 8);
  },

  async getProductById(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts.find(p => p.id === parseInt(id));
  },

  async createProduct(productData) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProduct = {
      id: Date.now(),
      ...productData,
      createdAt: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    return newProduct;
  },

  async updateProduct(id, productData) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...productData };
      return mockProducts[index];
    }
    throw new Error('Product not found');
  },

  async deleteProduct(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
      return true;
    }
    throw new Error('Product not found');
  },

  async importFromWooCommerce(apiUrl, consumerKey, consumerSecret) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock imported products
    const importedProducts = [
      {
        id: Date.now() + 1,
        name: 'Air Filter - Imported',
        partNumber: 'WC-AF-001',
        brand: 'Generic',
        category: 'Filters',
        price: 29.99,
        stock: 100,
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
        description: 'Imported air filter from WooCommerce',
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now() + 2,
        name: 'Brake Pad Set - Imported',
        partNumber: 'WC-BP-002',
        brand: 'Generic',
        category: 'Brakes',
        price: 149.99,
        stock: 75,
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
        description: 'Imported brake pad set from WooCommerce',
        createdAt: new Date().toISOString()
      }
    ];
    
    mockProducts.push(...importedProducts);
    return importedProducts;
  }
};