import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import FilterBar from '../../components/FilterBar';
import ProductModal from '../../components/ProductModal';
import BulkEditModal from '../../components/BulkEditModal';
import { productService } from '../../services/productService';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiTrash2, FiEye, FiCheck } = FiIcons;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleSaveProduct = async (productData) => {
    try {
      setLoading(true);
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(productData);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error deleting product');
      }
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkEdit = async (updates) => {
    if (selectedProducts.length === 0) {
      toast.warning('No products selected');
      return;
    }

    setLoading(true);
    try {
      // Get selected products data first
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      
      // Process each product individually for better error handling
      let successCount = 0;
      let errorCount = 0;

      for (const product of selectedProductsData) {
        try {
          let updatedProduct = { ...product };

          // Update simple fields
          if (updates.price !== undefined) {
            updatedProduct.price = updates.price;
          }
          if (updates.salePrice !== undefined) {
            updatedProduct.sale_price = updates.salePrice;
          }
          if (updates.stock !== undefined) {
            updatedProduct.stock = updates.stock;
          }
          if (updates.status !== undefined) {
            updatedProduct.status = updates.status;
          }

          // Handle brands update
          if (updates.brands) {
            const currentBrands = Array.isArray(product.brands) ? product.brands : 
                                (product.brand ? [product.brand] : []);
            
            if (updates.brands.action === 'add') {
              // Add new brands without duplicates
              updatedProduct.brands = [...new Set([...currentBrands, ...updates.brands.value])];
            } else if (updates.brands.action === 'replace') {
              // Replace all brands
              updatedProduct.brands = [...updates.brands.value];
            } else if (updates.brands.action === 'remove') {
              // Remove specified brands
              updatedProduct.brands = currentBrands.filter(brand => !updates.brands.value.includes(brand));
            }
            
            // Update legacy brand field for backward compatibility
            if (updatedProduct.brands.length > 0) {
              updatedProduct.brand = updatedProduct.brands[0];
            }
          }

          // Handle categories update
          if (updates.categories) {
            const currentCategories = Array.isArray(product.categories) ? product.categories : 
                                    (product.category ? [product.category] : []);
            
            if (updates.categories.action === 'add') {
              // Add new categories without duplicates
              updatedProduct.categories = [...new Set([...currentCategories, ...updates.categories.value])];
            } else if (updates.categories.action === 'replace') {
              // Replace all categories
              updatedProduct.categories = [...updates.categories.value];
            } else if (updates.categories.action === 'remove') {
              // Remove specified categories
              updatedProduct.categories = currentCategories.filter(cat => !updates.categories.value.includes(cat));
            }
            
            // Update legacy category field for backward compatibility
            if (updatedProduct.categories.length > 0) {
              updatedProduct.category = updatedProduct.categories[0];
            }
          }

          // Remove updated_at from the update data
          const { updated_at, ...updateData } = updatedProduct;

          // Save the updated product
          await productService.updateProduct(product.id, updateData);
          successCount++;
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} products`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} products`);
      }

      setShowBulkEditModal(false);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast.error(`Error updating products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.warning('No products selected');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        await productService.bulkDeleteProducts(selectedProducts);
        toast.success(`Successfully deleted ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting products:', error);
        toast.error('Error deleting products');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <div className="flex space-x-2">
          {selectedProducts.length > 0 && (
            <>
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <SafeIcon icon={FiEdit} className="h-4 w-4 mr-2" />
                Bulk Edit ({selectedProducts.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <SafeIcon icon={FiTrash2} className="h-4 w-4 mr-2" />
                Delete Selected
              </button>
            </>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
          >
            <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortOptions={[
          { value: 'name', label: 'Name' },
          { value: 'part_number', label: 'Part Number' },
          { value: 'brand', label: 'Brand' },
          { value: 'price', label: 'Price' },
          { value: 'stock', label: 'Stock' },
          { value: 'created_at', label: 'Date Added' }
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop'}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.part_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <SafeIcon icon={FiEdit} className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <BulkEditModal
          selectedProducts={selectedProducts}
          onSave={handleBulkEdit}
          onClose={() => setShowBulkEditModal(false)}
          productCount={selectedProducts.length}
        />
      )}
    </div>
  );
};

export default Products;