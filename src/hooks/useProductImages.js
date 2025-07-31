import { useState, useEffect, useCallback } from 'react';

// APPROACH 3: Advanced Image Management Hook
export const useProductImages = (product) => {
  const [imageState, setImageState] = useState({
    validImages: [],
    currentImageIndex: 0,
    isLoading: true,
    hasImages: false,
    errorCount: 0
  });

  // Comprehensive image extraction
  const extractAllImages = useCallback((product) => {
    const imageMap = new Map(); // Use Map to avoid duplicates
    
    // Helper function to add image with metadata
    const addImage = (url, source, priority = 10) => {
      if (!url || typeof url !== 'string') return;
      
      const cleanUrl = url.trim();
      if (cleanUrl.length < 8) return; // Too short
      
      // Create a normalized key to avoid duplicates
      const normalizedKey = cleanUrl.toLowerCase();
      
      if (!imageMap.has(normalizedKey)) {
        imageMap.set(normalizedKey, {
          url: cleanUrl,
          originalUrl: url,
          source,
          priority,
          tested: false,
          valid: null
        });
      }
    };

    // Extract from various possible fields
    const imageFields = [
      { field: 'image', priority: 1 },
      { field: 'featured_image', priority: 2 },
      { field: 'thumbnail', priority: 3 },
      { field: 'main_image', priority: 4 },
      { field: 'product_image', priority: 5 },
      { field: 'picture', priority: 6 },
      { field: 'photo', priority: 7 },
      { field: 'img', priority: 8 }
    ];

    // Add single image fields
    imageFields.forEach(({ field, priority }) => {
      if (product[field]) {
        addImage(product[field], field, priority);
      }
    });

    // Add from images array
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img, index) => {
        addImage(img, `images[${index}]`, 20 + index);
      });
    }

    // Add from gallery array (alternative name)
    if (product.gallery && Array.isArray(product.gallery)) {
      product.gallery.forEach((img, index) => {
        addImage(img, `gallery[${index}]`, 30 + index);
      });
    }

    // Convert map to array and sort by priority
    return Array.from(imageMap.values()).sort((a, b) => a.priority - b.priority);
  }, []);

  // Enhanced URL validation
  const isValidImageUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    
    // Length check
    if (trimmedUrl.length < 10) return false;
    
    // Protocol check
    if (!trimmedUrl.match(/^(https?:\/\/|\/|\.\/)/)) return false;
    
    // Blacklist specific problematic URLs (minimal list)
    const blacklistedUrls = [
      'https://via.placeholder.com/150',
      'https://via.placeholder.com/300',
      'https://placeholder.com/150',
      'https://placeholder.com/300',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQi' // Common empty SVG
    ];
    
    if (blacklistedUrls.some(blocked => trimmedUrl.startsWith(blocked))) {
      return false;
    }
    
    // Check for suspicious patterns but be more permissive
    const suspiciousPatterns = [
      /placeholder.*150.*150/i,
      /example\.com\/.*placeholder/i,
      /test.*image.*placeholder/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(trimmedUrl))) {
      return false;
    }
    
    return true;
  }, []);

  // Test image loading with timeout and retry
  const testImageLoad = useCallback((url, timeout = 8000) => {
    return new Promise((resolve) => {
      const img = new Image();
      let resolved = false;
      
      const resolveOnce = (result) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };
      
      img.onload = () => {
        // Additional check: ensure the image has actual dimensions
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolveOnce(true);
        } else {
          resolveOnce(false);
        }
      };
      
      img.onerror = () => resolveOnce(false);
      
      // Set timeout
      setTimeout(() => resolveOnce(false), timeout);
      
      // Start loading
      img.src = url;
    });
  }, []);

  // Initialize and validate images
  useEffect(() => {
    const initializeImages = async () => {
      setImageState(prev => ({ ...prev, isLoading: true, errorCount: 0 }));
      
      const allImages = extractAllImages(product);
      console.log(`Product ${product.id || 'unknown'} - Extracted ${allImages.length} potential images:`, allImages);
      
      if (allImages.length === 0) {
        setImageState({
          validImages: [],
          currentImageIndex: 0,
          isLoading: false,
          hasImages: false,
          errorCount: 0
        });
        return;
      }

      const validatedImages = [];
      let errorCount = 0;

      // Test each image
      for (let i = 0; i < allImages.length; i++) {
        const imageItem = allImages[i];
        
        if (!isValidImageUrl(imageItem.url)) {
          console.log(`Product ${product.id} - Skipping invalid URL (${imageItem.source}):`, imageItem.url);
          errorCount++;
          continue;
        }

        console.log(`Product ${product.id} - Testing image ${i + 1}/${allImages.length} (${imageItem.source}):`, imageItem.url);
        
        try {
          const isValid = await testImageLoad(imageItem.url);
          imageItem.tested = true;
          imageItem.valid = isValid;
          
          if (isValid) {
            validatedImages.push(imageItem);
            console.log(`Product ${product.id} - ✅ Valid image found (${imageItem.source}):`, imageItem.url);
          } else {
            console.log(`Product ${product.id} - ❌ Invalid image (${imageItem.source}):`, imageItem.url);
            errorCount++;
          }
        } catch (error) {
          console.log(`Product ${product.id} - 💥 Error testing image (${imageItem.source}):`, error.message);
          errorCount++;
        }

        // If we found at least one valid image, we can stop testing others for performance
        // But continue testing a few more to have backups
        if (validatedImages.length >= 3) {
          console.log(`Product ${product.id} - Found enough valid images, stopping tests`);
          break;
        }
      }

      console.log(`Product ${product.id} - Final result: ${validatedImages.length} valid images, ${errorCount} errors`);

      setImageState({
        validImages: validatedImages,
        currentImageIndex: 0,
        isLoading: false,
        hasImages: validatedImages.length > 0,
        errorCount
      });
    };

    initializeImages();
  }, [product.id, product.image, product.images, extractAllImages, isValidImageUrl, testImageLoad]);

  // Function to switch to next image
  const nextImage = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      currentImageIndex: (prev.currentImageIndex + 1) % Math.max(1, prev.validImages.length)
    }));
  }, []);

  // Function to switch to previous image
  const previousImage = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      currentImageIndex: prev.currentImageIndex > 0 
        ? prev.currentImageIndex - 1 
        : Math.max(0, prev.validImages.length - 1)
    }));
  }, []);

  // Function to mark current image as invalid and try next
  const markCurrentImageInvalid = useCallback(() => {
    setImageState(prev => {
      const newValidImages = prev.validImages.filter((_, index) => index !== prev.currentImageIndex);
      return {
        ...prev,
        validImages: newValidImages,
        currentImageIndex: Math.min(prev.currentImageIndex, Math.max(0, newValidImages.length - 1)),
        hasImages: newValidImages.length > 0,
        errorCount: prev.errorCount + 1
      };
    });
  }, []);

  return {
    ...imageState,
    currentImage: imageState.validImages[imageState.currentImageIndex] || null,
    totalImages: imageState.validImages.length,
    nextImage,
    previousImage,
    markCurrentImageInvalid
  };
};

export default useProductImages;