import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {toast} from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import {useCart} from '../context/CartContext';
import {useAuth} from '../context/AuthContext';
import {productService} from '../services/productService';
import QuickOrderModal from '../components/QuickOrderModal';
import * as FiIcons from 'react-icons/fi';

const {FiShoppingCart, FiMessageCircle, FiMinus, FiPlus, FiArrowLeft, FiTruck, FiShield, FiClock, FiDollarSign, FiShare2} = FiIcons;

const ProductDetail = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const {addToCart} = useCart();
  const {user} = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showQuickOrder, setShowQuickOrder] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProductById(id);
      setProduct({
        ...data,
        stock: Math.max(10, data.stock || 0)
      });
    } catch (error) {
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Simplified image handling - just use what's available
  const getProductImage = () => {
    if (!product) return null;
    
    // First priority: product.image
    if (product.image && product.image.length > 0) {
      console.log('Using main image:', product.image);
      return product.image;
    }
    
    // Second priority: first image from images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log('Using image from array:', product.images[0]);
      return product.images[0];
    }
    
    // No image available
    console.log('No valid images found, using placeholder');
    return null;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success('Added to cart!');
  };

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in ${product.name} - ${product.part_number || product.partNumber}. Link: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/966502255702?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = () => {
    const url = window.location.href;
    const title = `Check out ${product.name}`;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      })
        .then(() => console.log('Shared successfully'))
        .catch(error => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Product link copied to clipboard!'))
        .catch(err => console.log('Failed to copy link:', err));
    }
  };

  const handleBuyNow = () => {
    setShowQuickOrder(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const productImage = getProductImage();
  
  // Debug image information
  console.log('Product Detail Image Info:', {
    product_id: product.id,
    product_name: product.name,
    main_image: product.image,
    images_array: product.images,
    selected_image: productImage
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                {productImage ? (
                  <motion.img
                    initial={{opacity: 0, scale: 0.95}}
                    animate={{opacity: 1, scale: 1}}
                    src={productImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log(`Image load error for: ${productImage}`);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Fallback when no image available */}
                <div 
                  className={`${productImage ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
                  style={{display: productImage ? 'none' : 'flex'}}
                >
                  <div className="text-center text-gray-500">
                    <SafeIcon icon={FiShoppingCart} className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">{product.brand}</p>
                    <p className="text-sm">{product.category}</p>
                    <p className="text-xs mt-2 text-gray-400">Part #{product.part_number}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <button
                    onClick={handleShare}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="Share product"
                  >
                    <SafeIcon icon={FiShare2} className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-sm text-gray-500">Part Number:</span>
                    <p className="font-medium">{product.part_number || product.partNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Brand:</span>
                    <p className="font-medium">{product.brand}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Category:</span>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Availability:</span>
                    <p className="font-medium text-green-600">In stock</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium text-gray-900 flex items-center">
                    <SafeIcon icon={FiDollarSign} className="h-5 w-5 mr-1 text-primary-600" />
                    Contact for pricing
                  </span>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100"
                    >
                      <SafeIcon icon={FiMinus} className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <SafeIcon icon={FiPlus} className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                    >
                      <SafeIcon icon={FiShoppingCart} className="h-5 w-5 mr-2" />
                      Add to Cart
                    </button>
                    
                    <button
                      onClick={handleWhatsApp}
                      className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <SafeIcon icon={FiMessageCircle} className="h-5 w-5 mr-2" />
                      WhatsApp
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <SafeIcon icon={FiShare2} className="h-5 w-5 mr-2" />
                      Share
                    </button>
                  </div>
                  
                  <button
                    onClick={handleBuyNow}
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                  >
                    Request Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t bg-gray-50 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiTruck} className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
                <p className="text-sm text-gray-600">Quick shipping to your location</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiShield} className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Quality Guarantee</h3>
                <p className="text-sm text-gray-600">Genuine parts with warranty</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiClock} className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-600">Round-the-clock assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Order Modal */}
      {showQuickOrder && (
        <QuickOrderModal
          product={product}
          quantity={quantity}
          onClose={() => setShowQuickOrder(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;