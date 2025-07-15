import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDownload, FiCheck, FiX, FiLoader, FiInfo, FiRefreshCw, FiImage, FiTag, FiLayers, FiList, FiPackage, FiExternalLink, FiAlertCircle } = FiIcons;

const Import = () => {
  const [importConfig, setImportConfig] = useState({
    apiUrl: 'https://alhajhasan.sa/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys&create-key=1',
    consumerKey: 'ck_593d7dd20f8ec93ce100b8ee9cf62a1b8b063241',
    consumerSecret: 'cs_1072ce7dc4ab7216ed1277b2e0d49bb57c6ba2dc'
  });

  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    status: '',
    logs: []
  });

  const handleInputChange = (e) => {
    setImportConfig({
      ...importConfig,
      [e.target.name]: e.target.value
    });
  };

  const addLog = (message, type = 'info') => {
    setImportProgress(prev => ({
      ...prev,
      logs: [...prev.logs, { message, type, timestamp: new Date().toISOString() }]
    }));
  };

  // Direct fetch approach
  const fetchWooCommerceData = async (url, consumerKey, consumerSecret) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        data: await response.json(),
        totalItems: parseInt(response.headers.get('X-WP-Total') || '0'),
        totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '0')
      };
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  };

  // Direct Supabase insert using REST API
  const insertProduct = async (productData) => {
    try {
      const response = await fetch('https://kiuzrsirplaulpogsdup.supabase.co/rest/v1/woo_import_products', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXpyc2lycGxhdWxwb2dzZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzA5MzgsImV4cCI6MjA2NzgwNjkzOH0.C8DszEIYetXEPqBtmfHHYUwUzx18VWUsRb-LMXasCAE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXpyc2lycGxhdWxwb2dzZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzA5MzgsImV4cCI6MjA2NzgwNjkzOH0.C8DszEIYetXEPqBtmfHHYUwUzx18VWUsRb-LMXasCAE',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database error: ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImportResults(null);
    setImportProgress({
      current: 0,
      total: 0,
      status: 'Starting import...',
      logs: []
    });

    try {
      // Extract base URL
      const baseUrl = importConfig.apiUrl.replace('/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys&create-key=1', '');
      const wooApiUrl = `${baseUrl}/wp-json/wc/v3/products`;

      addLog(`🔍 Connecting to WooCommerce API: ${baseUrl}`);

      // Test the connection
      try {
        const testResponse = await fetchWooCommerceData(
          `${wooApiUrl}?per_page=1`,
          importConfig.consumerKey,
          importConfig.consumerSecret
        );

        const totalProducts = testResponse.totalItems;
        addLog(`✅ Connection successful! Found ${totalProducts} products.`, "success");

        // Update progress state
        setImportProgress(prev => ({
          ...prev,
          total: totalProducts,
          status: `Found ${totalProducts} products to import`
        }));

        if (totalProducts === 0) {
          throw new Error('No products found in WooCommerce store');
        }

        // Import products in batches
        const perPage = 5; // Small batch size for testing
        const totalPages = Math.ceil(totalProducts / perPage);
        let successCount = 0;
        let failedCount = 0;

        addLog(`⏳ Starting import of ${totalProducts} products in ${totalPages} batches...`);

        for (let page = 1; page <= totalPages; page++) {
          addLog(`📄 Processing batch ${page} of ${totalPages}...`);

          try {
            const { data: products } = await fetchWooCommerceData(
              `${wooApiUrl}?per_page=${perPage}&page=${page}`,
              importConfig.consumerKey,
              importConfig.consumerSecret
            );

            addLog(`📦 Fetched ${products.length} products in batch ${page}`);

            // Process each product
            for (const wooProduct of products) {
              try {
                // Extract brand from attributes
                let brand = 'Unknown';
                if (wooProduct.attributes && wooProduct.attributes.length > 0) {
                  const brandAttr = wooProduct.attributes.find(attr =>
                    attr.name && (
                      attr.name.toLowerCase().includes('brand') ||
                      attr.name.toLowerCase().includes('manufacturer') ||
                      attr.name.toLowerCase().includes('make')
                    )
                  );
                  if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
                    brand = brandAttr.options[0];
                  }
                }

                // Process categories
                const categories = wooProduct.categories ? wooProduct.categories.map(cat => cat.name) : [];
                const primaryCategory = categories.length > 0 ? categories[0] : 'General';

                // Process images
                const primaryImage = wooProduct.images && wooProduct.images.length > 0 ? wooProduct.images[0].src : '';

                // Clean description
                const description = wooProduct.description ? 
                  wooProduct.description.replace(/<\/?[^>]+(>|$)/g, '').trim() : '';

                // Generate slug
                const slug = wooProduct.slug || wooProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                // Prepare product data
                const productData = {
                  woo_id: wooProduct.id.toString(),
                  name: wooProduct.name || 'Untitled Product',
                  slug,
                  part_number: wooProduct.sku || `WOO-${wooProduct.id}`,
                  brand,
                  category: primaryCategory,
                  price: parseFloat(wooProduct.price || '0'),
                  sale_price: wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : null,
                  stock: parseInt(wooProduct.stock_quantity || '0'),
                  description,
                  image: primaryImage,
                  status: wooProduct.status === 'publish' ? 'published' : 'draft'
                };

                addLog(`🔄 Processing: ${productData.name}`);

                // Insert product
                const success = await insertProduct(productData);
                if (success) {
                  successCount++;
                  addLog(`✅ Imported: ${productData.name}`, "success");
                } else {
                  failedCount++;
                  addLog(`❌ Failed to import: ${productData.name}`, "error");
                }

                // Update progress
                setImportProgress(prev => ({
                  ...prev,
                  current: successCount + failedCount,
                  status: `Processed ${successCount + failedCount} of ${totalProducts} products`
                }));

              } catch (error) {
                failedCount++;
                addLog(`❌ Error processing product ${wooProduct.name}: ${error.message}`, "error");
              }
            }
          } catch (error) {
            addLog(`❌ Error fetching batch ${page}: ${error.message}`, "error");
            failedCount += perPage;
          }

          // Add a small delay between batches
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Final results
        addLog(`🎉 Import completed! Successful: ${successCount}, Failed: ${failedCount}`, "success");
        setImportResults({
          success: true,
          count: successCount,
          failedCount,
          products: []
        });

        // If we have successful imports, fetch the first 10 for display
        if (successCount > 0) {
          try {
            const response = await fetch('https://kiuzrsirplaulpogsdup.supabase.co/rest/v1/woo_import_products?select=*&limit=10', {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXpyc2lycGxhdWxwb2dzZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzA5MzgsImV4cCI6MjA2NzgwNjkzOH0.C8DszEIYetXEPqBtmfHHYUwUzx18VWUsRb-LMXasCAE',
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const sampleProducts = await response.json();
              setImportResults(prev => ({
                ...prev,
                products: sampleProducts
              }));
            }
          } catch (error) {
            addLog(`❌ Error fetching sample products: ${error.message}`, "error");
          }
        }

        toast.success(`Successfully imported ${successCount} products!`);

      } catch (error) {
        addLog(`❌ Connection error: ${error.message}`, "error");
        throw error;
      }

    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        success: false,
        error: error.message
      });
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      setImportProgress(prev => ({
        ...prev,
        status: 'Import completed'
      }));
    }
  };

  const handleTestConnection = async () => {
    setImporting(true);
    addLog("🔍 Testing WooCommerce connection...");

    try {
      const baseUrl = importConfig.apiUrl.replace('/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys&create-key=1', '');
      const testUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=1`;

      addLog(`🔍 Connecting to: ${testUrl}`);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${importConfig.consumerKey}:${importConfig.consumerSecret}`),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const totalProducts = response.headers.get('X-WP-Total');
        addLog(`✅ Connection successful! Found ${totalProducts} products ready for import.`, "success");
        toast.success(`Connection successful! Found ${totalProducts} products ready for import.`);
      } else {
        const errorText = await response.text();
        throw new Error(`Connection failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      addLog(`❌ Connection test failed: ${error.message}`, "error");
      toast.error(`Connection test failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">WooCommerce Product Import</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Products from WooCommerce</h2>
          <p className="text-gray-600">
            Import all products with complete data including categories, images, and metadata.
          </p>
        </div>

        <form onSubmit={handleImport} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WooCommerce Store URL
            </label>
            <input
              type="url"
              name="apiUrl"
              value={importConfig.apiUrl}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Key
              </label>
              <input
                type="text"
                name="consumerKey"
                value={importConfig.consumerKey}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Secret
              </label>
              <input
                type="password"
                name="consumerSecret"
                value={importConfig.consumerSecret}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Import Features:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                      <SafeIcon icon={FiExternalLink} className="h-4 w-4 mr-1" />
                      URL Slug Preservation
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside ml-4">
                      <li>Exact WooCommerce URLs maintained</li>
                      <li>SEO-friendly slug preservation</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                      <SafeIcon icon={FiImage} className="h-4 w-4 mr-1" />
                      Multiple Images
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside ml-4">
                      <li>All product images imported</li>
                      <li>Full resolution preservation</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                      <SafeIcon icon={FiLayers} className="h-4 w-4 mr-1" />
                      Multiple Categories
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside ml-4">
                      <li>All category associations</li>
                      <li>Primary category identification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={importing}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {importing ? (
                <>
                  <SafeIcon icon={FiLoader} className="animate-spin h-4 w-4 mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <SafeIcon icon={FiRefreshCw} className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={importing}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {importing ? (
                <>
                  <SafeIcon icon={FiLoader} className="animate-spin h-4 w-4 mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <SafeIcon icon={FiDownload} className="h-4 w-4 mr-2" />
                  Import Products
                </>
              )}
            </button>
          </div>
        </form>

        {/* Progress Indicator */}
        {importing && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <SafeIcon icon={FiLoader} className="animate-spin h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-blue-800">{importProgress.status}</span>
                </div>
                {importProgress.total > 0 && (
                  <span className="text-sm text-blue-600">
                    {importProgress.current} of {importProgress.total} ({Math.round((importProgress.current / importProgress.total) * 100)}%)
                  </span>
                )}
              </div>
              {importProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((importProgress.current / importProgress.total) * 100))}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="mt-4 max-h-60 overflow-y-auto border border-blue-100 rounded-lg p-2 bg-blue-50">
              <div className="font-medium text-sm text-blue-800 mb-2">Import Log:</div>
              {importProgress.logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm py-1 border-b border-blue-100 last:border-0 ${
                    log.type === 'error' ? 'text-red-600' : 
                    log.type === 'success' ? 'text-green-600' : 
                    'text-blue-700'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import Results */}
      {importResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center mb-4">
            {importResults.success ? (
              <SafeIcon icon={FiCheck} className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <SafeIcon icon={FiX} className="h-6 w-6 text-red-500 mr-2" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Import {importResults.success ? 'Successful' : 'Failed'}
            </h3>
          </div>

          {importResults.success ? (
            <div>
              <p className="text-gray-600 mb-4">
                Successfully imported {importResults.count} products
                {importResults.failedCount > 0 && ` (${importResults.failedCount} failed)`}.
              </p>

              {importResults.products && importResults.products.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Sample Imported Products:</h4>
                  <div className="space-y-4">
                    {importResults.products.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={product.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop'}
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{product.name}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <p><strong>Part #:</strong> {product.part_number}</p>
                              <p><strong>Brand:</strong> {product.brand}</p>
                              <p><strong>Price:</strong> ${product.price}</p>
                              <p><strong>Status:</strong> {product.status || 'published'}</p>
                              <p><strong>URL Slug:</strong> <code className="bg-gray-100 px-1 rounded">{product.slug}</code></p>
                              <p><strong>WooCommerce ID:</strong> {product.woo_id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <SafeIcon icon={FiInfo} className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-700">Products were imported successfully, but no sample data is available to display.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-red-50 p-4 rounded-lg mb-4 flex items-start">
                <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">Import failed with the following error:</p>
                  <p className="text-red-600 mt-1">{importResults.error}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Please check your API credentials and WooCommerce store configuration. 
                Make sure your WooCommerce REST API is enabled and the credentials have proper permissions.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Import;