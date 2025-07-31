import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPackage, FiImage, FiAlertCircle } = FiIcons;

const ProductImageLoader = ({ product, className = "w-full h-full object-cover" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidImage, setHasValidImage] = useState(false);

  // APPROACH 1: Comprehensive Image Collection
  const getAllPossibleImages = () => {
    const imageList = [];
    
    // Add main image if exists
    if (product.image && typeof product.image === 'string' && product.image.trim()) {
      imageList.push({
        url: product.image.trim(),
        source: 'main_image',
        priority: 1
      });
    }

    // Add images from images array
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img, index) => {
        if (img && typeof img === 'string' && img.trim()) {
          const cleanUrl = img.trim();
          // Only add if not already in the list
          if (!imageList.some(item => item.url === cleanUrl)) {
            imageList.push({
              url: cleanUrl,
              source: 'images_array',
              priority: 2 + index
            });
          }
        }
      });
    }

    // Add alternative image fields that might exist
    const alternativeFields = ['featured_image', 'thumbnail', 'main_img', 'product_image'];
    alternativeFields.forEach((field, index) => {
      if (product[field] && typeof product[field] === 'string' && product[field].trim()) {
        const cleanUrl = product[field].trim();
        if (!imageList.some(item => item.url === cleanUrl)) {
          imageList.push({
            url: cleanUrl,
            source: field,
            priority: 10 + index
          });
        }
      }
    });

    // Sort by priority (lower number = higher priority)
    return imageList.sort((a, b) => a.priority - b.priority);
  };

  // APPROACH 2: Smart Image Validation
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl.length < 10) return false; // Too short to be a valid URL
    
    // Check if it's a valid URL format
    try {
      new URL(trimmedUrl);
    } catch {
      // If it's not a valid URL, check if it's a relative path
      if (!trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('./')) {
        return false;
      }
    }

    // Only filter out specific problematic URLs (very restrictive list)
    const problematicUrls = [
      'https://via.placeholder.com/150',
      'https://via.placeholder.com/300',
      'https://via.placeholder.com/400',
      'https://placeholder.com',
      'https://example.com',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQi', // Common placeholder SVG
    ];

    // Check for exact matches only
    if (problematicUrls.includes(trimmedUrl)) {
      return false;
    }

    // Check for very generic placeholder patterns
    if (trimmedUrl.includes('placeholder') && trimmedUrl.includes('150x150')) {
      return false;
    }

    return true;
  };

  // Test if an image can be loaded
  const testImageLoad = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
      
      // Set a timeout to avoid hanging
      setTimeout(() => resolve(false), 5000);
    });
  };

  // Initialize images and test loading
  useEffect(() => {
    const initializeImages = async () => {
      setIsLoading(true);
      const possibleImages = getAllPossibleImages();
      
      console.log(`Product ${product.id} - Found ${possibleImages.length} possible images:`, possibleImages);

      if (possibleImages.length === 0) {
        setIsLoading(false);
        setHasValidImage(false);
        return;
      }

      // Test each image in order of priority
      for (let i = 0; i < possibleImages.length; i++) {
        const imageItem = possibleImages[i];
        
        if (!isValidImageUrl(imageItem.url)) {
          console.log(`Product ${product.id} - Skipping invalid URL:`, imageItem.url);
          continue;
        }

        console.log(`Product ${product.id} - Testing image ${i + 1}/${possibleImages.length}:`, imageItem.url);
        
        const canLoad = await testImageLoad(imageItem.url);
        
        setImageLoadStates(prev => ({
          ...prev,
          [i]: canLoad
        }));

        if (canLoad) {
          console.log(`Product ${product.id} - Successfully loaded image:`, imageItem.url);
          setCurrentImageIndex(i);
          setHasValidImage(true);
          setIsLoading(false);
          return;
        } else {
          console.log(`Product ${product.id} - Failed to load image:`, imageItem.url);
        }
      }

      // No valid images found
      console.log(`Product ${product.id} - No valid images found`);
      setIsLoading(false);
      setHasValidImage(false);
    };

    initializeImages();
  }, [product.id, product.image, product.images]);

  const possibleImages = getAllPossibleImages();
  const currentImage = possibleImages[currentImageIndex];

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p className="text-xs">Loading image...</p>
        </div>
      </div>
    );
  }

  // Show image if we have a valid one
  if (hasValidImage && currentImage) {
    return (
      <div className="relative w-full h-full">
        <img
          src={currentImage.url}
          alt={product.name}
          className={className}
          onError={(e) => {
            console.log(`Product ${product.id} - Image load error, trying next:`, currentImage.url);
            // Try the next image
            const nextIndex = currentImageIndex + 1;
            if (nextIndex < possibleImages.length) {
              setCurrentImageIndex(nextIndex);
            } else {
              setHasValidImage(false);
            }
          }}
          onLoad={() => {
            console.log(`Product ${product.id} - Image loaded successfully:`, currentImage.url);
          }}
          loading="lazy"
        />
        
        {/* Image source indicator (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
            {currentImage.source}
          </div>
        )}
        
        {/* Multiple images indicator */}
        {possibleImages.length > 1 && (
          <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
            {currentImageIndex + 1}/{possibleImages.length}
          </div>
        )}
      </div>
    );
  }

  // Show placeholder when no valid image is available
  return (
    <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
      <div className="text-center text-gray-500">
        <SafeIcon icon={FiImage} className="h-8 w-8 mx-auto mb-2" />
        <p className="text-xs font-medium">{product.brand}</p>
        <p className="text-xs">{product.category}</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-500 mt-1">No valid images</p>
        )}
      </div>
    </div>
  );
};

export default ProductImageLoader;