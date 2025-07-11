import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import { productService } from '../../services/productService';
import * as FiIcons from 'react-icons/fi';

const { FiDownload, FiCheck, FiX, FiLoader } = FiIcons;

const Import = () => {
  const [importConfig, setImportConfig] = useState({
    apiUrl: '',
    consumerKey: '',
    consumerSecret: ''
  });
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const handleInputChange = (e) => {
    setImportConfig({
      ...importConfig,
      [e.target.name]: e.target.value
    });
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImportResults(null);

    try {
      const results = await productService.importFromWooCommerce(
        importConfig.apiUrl,
        importConfig.consumerKey,
        importConfig.consumerSecret
      );
      
      setImportResults({
        success: true,
        count: results.length,
        products: results
      });
      
      toast.success(`Successfully imported ${results.length} products!`);
    } catch (error) {
      setImportResults({
        success: false,
        error: error.message
      });
      toast.error('Import failed. Please check your configuration.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Import Products</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">WooCommerce Import</h2>
          <p className="text-gray-600">
            Import products from your WooCommerce store. All product data including images, 
            descriptions, and metadata will be transferred.
          </p>
        </div>

        <form onSubmit={handleImport} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WooCommerce API URL
            </label>
            <input
              type="url"
              name="apiUrl"
              value={importConfig.apiUrl}
              onChange={handleInputChange}
              required
              placeholder="https://yourstore.com/wp-json/wc/v3/"
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
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to get API credentials:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to your WordPress admin dashboard</li>
              <li>Navigate to WooCommerce → Settings → Advanced → REST API</li>
              <li>Click "Add key" to create new API credentials</li>
              <li>Set permissions to "Read" and copy the generated keys</li>
            </ol>
          </div>

          <div className="flex justify-end">
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
                  Start Import
                </>
              )}
            </button>
          </div>
        </form>
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
                Successfully imported {importResults.count} products from your WooCommerce store.
              </p>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Imported Products:</h4>
                {importResults.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.partNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${product.price}</p>
                      <p className="text-sm text-gray-600">{product.stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-red-600 mb-2">Import failed with the following error:</p>
              <code className="bg-red-50 text-red-800 p-2 rounded block">
                {importResults.error}
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Please check your API credentials and try again.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Import;