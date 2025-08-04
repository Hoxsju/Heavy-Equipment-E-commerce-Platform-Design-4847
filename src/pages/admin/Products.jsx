import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {toast} from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import FilterBar from '../../components/FilterBar';
import ProductModal from '../../components/ProductModal';
import BulkEditModal from '../../components/BulkEditModal';
import {productService} from '../../services/productService';
import {useAuth} from '../../context/AuthContext';
import * as FiIcons from 'react-icons/fi';

const {FiPlus, FiEdit, FiTrash2, FiEye, FiCheck, FiChevronDown, FiChevronUp, FiMoreVertical} = FiIcons;

const Products = () => {
  const {user} = useAuth();
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
  const [expandedRows, setExpandedRows] = useState(new Set());

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
      console.log('Saving product from Products page:', productData);
      console.log('Current user:', user);
      setLoading(true);

      let result;
      if (editingProduct) {
        console.log('Updating existing product:', editingProduct.id);
        try {
          result = await productService.updateProduct(editingProduct.id, productData);
          console.log('Update result:', result);
          toast.success('Product updated successfully');
        } catch (updateError) {
          console.error('Update failed:', updateError);
          if (updateError.message?.includes('permission') || updateError.message?.includes('policy')) {
            toast.error('Permission denied: Unable to update product. Please contact your administrator.');
          } else if (updateError.message?.includes('Database error')) {
            toast.error('Database error: Please check your internet connection and try again.');
          } else {
            toast.error(`Update failed: ${updateError.message}`);
          }
          return;
        }
      } else {
        console.log('Creating new product');
        try {
          result = await productService.createProduct(productData);
          console.log('Create result:', result);
          toast.success('Product created successfully');
        } catch (createError) {
          console.error('Create failed:', createError);
          toast.error(`Create failed: ${createError.message}`);
          return;
        }
      }

      setShowModal(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      let errorMessage = `Failed to ${editingProduct ? 'update' : 'create'} product`;
      if (error.message) {
        if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = 'Permission denied. Please check your user role and try again.';
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'A product with this part number already exists';
        } else if (error.message.includes('required') || error.message.includes('not null')) {
          errorMessage = 'Please fill in all required fields';
        } else if (error.message.includes('Database') || error.message.includes('database')) {
          errorMessage = 'Database error. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
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
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      let successCount = 0;
      let errorCount = 0;

      for (const product of selectedProductsData) {
        try {
          let updatedProduct = {...product};

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

          if (updates.brands) {
            const currentBrands = Array.isArray(product.brands) ? product.brands : (product.brand ? [product.brand] : []);
            if (updates.brands.action === 'add') {
              updatedProduct.brands = [...new Set([...currentBrands, ...updates.brands.value])];
            } else if (updates.brands.action === 'replace') {
              updatedProduct.brands = [...updates.brands.value];
            } else if (updates.brands.action === 'remove') {
              updatedProduct.brands = currentBrands.filter(brand => !updates.brands.value.includes(brand));
            }
            if (updatedProduct.brands.length > 0) {
              updatedProduct.brand = updatedProduct.brands[0];
            }
          }

          if (updates.categories) {
            const currentCategories = Array.isArray(product.categories) ? product.categories : (product.category ? [product.category] : []);
            if (updates.categories.action === 'add') {
              updatedProduct.categories = [...new Set([...currentCategories, ...updates.categories.value])];
            } else if (updates.categories.action === 'replace') {
              updatedProduct.categories = [...updates.categories.value];
            } else if (updates.categories.action === 'remove') {
              updatedProduct.categories = currentCategories.filter(cat => !updates.categories.value.includes(cat));
            }
            if (updatedProduct.categories.length > 0) {
              updatedProduct.category = updatedProduct.categories[0];
            }
          }

          const {updated_at, ...updateData} = updatedProduct;
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

  const toggleRowExpansion = (productId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const canEditProducts = user && ['admin', 'main_admin', 'sub_admin'].includes(user.role);

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
          {selectedProducts.length > 0 && canEditProducts && (
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
          {canEditProducts && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* User Role Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Current Role:</strong> {user?.role} - {canEditProducts ? ' You can create and edit products' : ' You have read-only access'}
        </p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortOptions={[
          {value: 'name', label: 'Name'},
          {value: 'part_number', label: 'Part Number'},
          {value: 'brand', label: 'Brand'},
          {value: 'price', label: 'Price'},
          {value: 'stock', label: 'Stock'},
          {value: 'created_at', label: 'Date Added'}
        ]}
      />

      {/* Compact Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {canEditProducts && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  {/* Expand column */}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Number
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <motion.tr
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="hover:bg-gray-50"
                  >
                    {canEditProducts && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => toggleRowExpansion(product.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <SafeIcon 
                          icon={expandedRows.has(product.id) ? FiChevronUp : FiChevronDown} 
                          className="h-4 w-4" 
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop'}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover mr-2 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={product.name}>
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]" title={product.category}>
                            {product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {product.part_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {product.brand}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      ${product.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        {canEditProducts ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-900 p-1"
                              title="Edit product"
                            >
                              <SafeIcon icon={FiEdit} className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete product"
                            >
                              <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            className="text-gray-400 cursor-not-allowed p-1"
                            title="View only - no edit permissions"
                          >
                            <SafeIcon icon={FiEye} className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded Row Content */}
                  {expandedRows.has(product.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={canEditProducts ? 9 : 8} className="px-3 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-gray-700">Description:</label>
                            <p className="text-gray-600 mt-1">{product.description || 'No description available'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Sale Price:</label>
                            <p className="text-gray-600 mt-1">
                              {product.sale_price ? `$${product.sale_price.toFixed(2)}` : 'No sale price'}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Created:</label>
                            <p className="text-gray-600 mt-1">
                              {new Date(product.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Slug:</label>
                            <p className="text-gray-600 mt-1 font-mono text-xs">{product.slug || 'No slug'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Images:</label>
                            <p className="text-gray-600 mt-1">
                              {product.images?.length || 0} image(s)
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Last Updated:</label>
                            <p className="text-gray-600 mt-1">
                              {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && canEditProducts && (
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
      {showBulkEditModal && canEditProducts && (
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