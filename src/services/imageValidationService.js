// APPROACH 4: Dedicated Image Validation Service
class ImageValidationService {
  constructor() {
    this.cache = new Map();
    this.pendingValidations = new Map();
  }

  // Comprehensive URL validation
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    
    // Basic checks
    if (trimmedUrl.length < 10) return false;
    
    // URL format validation
    try {
      const urlObj = new URL(trimmedUrl);
      // Check for valid protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
    } catch {
      // If not a valid URL, check if it's a relative path
      if (!trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('./')) {
        return false;
      }
    }

    // Specific problematic URLs to avoid
    const problematicUrls = [
      'https://via.placeholder.com/150',
      'https://via.placeholder.com/300',
      'https://via.placeholder.com/400',
      'https://placeholder.com/150',
      'https://placeholder.com/300',
      'https://example.com/image.jpg',
      'https://example.com/placeholder.jpg'
    ];

    if (problematicUrls.includes(trimmedUrl)) {
      return false;
    }

    // Pattern-based validation (very specific)
    const problematicPatterns = [
      /^https?:\/\/.*placeholder.*150.*150/i,
      /^https?:\/\/.*example\.com.*\.(jpg|png|gif|webp)/i,
      /^data:image\/svg\+xml;base64,PHN2ZyB3aWR0aD0iMjQi/i
    ];

    if (problematicPatterns.some(pattern => pattern.test(trimmedUrl))) {
      return false;
    }

    return true;
  }

  // Test if image can be loaded
  async validateImageLoad(url, timeout = 10000) {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Check if validation is already pending
    if (this.pendingValidations.has(url)) {
      return this.pendingValidations.get(url);
    }

    const validationPromise = new Promise((resolve) => {
      const img = new Image();
      let resolved = false;
      
      const resolveOnce = (result) => {
        if (!resolved) {
          resolved = true;
          this.cache.set(url, result);
          this.pendingValidations.delete(url);
          resolve(result);
        }
      };

      img.onload = () => {
        // Verify the image has actual content
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          // Additional check for very small images (likely placeholders)
          if (img.naturalWidth < 50 && img.naturalHeight < 50) {
            resolveOnce(false);
          } else {
            resolveOnce(true);
          }
        } else {
          resolveOnce(false);
        }
      };

      img.onerror = () => resolveOnce(false);

      // Timeout handling
      setTimeout(() => resolveOnce(false), timeout);

      // Start loading
      try {
        img.src = url;
      } catch (error) {
        resolveOnce(false);
      }
    });

    this.pendingValidations.set(url, validationPromise);
    return validationPromise;
  }

  // Extract all possible image URLs from a product
  extractProductImages(product) {
    const images = [];
    
    // Define all possible image fields with priorities
    const imageFields = [
      { key: 'image', priority: 1 },
      { key: 'featured_image', priority: 2 },
      { key: 'main_image', priority: 3 },
      { key: 'thumbnail', priority: 4 },
      { key: 'product_image', priority: 5 },
      { key: 'picture', priority: 6 },
      { key: 'photo', priority: 7 },
      { key: 'img', priority: 8 }
    ];

    // Extract single image fields
    imageFields.forEach(({ key, priority }) => {
      if (product[key] && typeof product[key] === 'string') {
        const url = product[key].trim();
        if (url && this.isValidImageUrl(url)) {
          images.push({
            url,
            source: key,
            priority,
            type: 'single'
          });
        }
      }
    });

    // Extract from image arrays
    const arrayFields = ['images', 'gallery', 'pictures', 'photos'];
    arrayFields.forEach((field, fieldIndex) => {
      if (product[field] && Array.isArray(product[field])) {
        product[field].forEach((img, index) => {
          if (img && typeof img === 'string') {
            const url = img.trim();
            if (url && this.isValidImageUrl(url)) {
              images.push({
                url,
                source: `${field}[${index}]`,
                priority: 20 + fieldIndex * 10 + index,
                type: 'array'
              });
            }
          }
        });
      }
    });

    // Remove duplicates and sort by priority
    const uniqueImages = images.filter((img, index, self) => 
      index === self.findIndex(i => i.url === img.url)
    );

    return uniqueImages.sort((a, b) => a.priority - b.priority);
  }

  // Validate multiple images and return the first valid one
  async findFirstValidImage(product, maxTests = 5) {
    const candidateImages = this.extractProductImages(product);
    
    console.log(`ImageValidationService: Found ${candidateImages.length} candidate images for product ${product.id || 'unknown'}`);

    if (candidateImages.length === 0) {
      return null;
    }

    // Test images in order of priority
    const imagesToTest = candidateImages.slice(0, maxTests);
    
    for (let i = 0; i < imagesToTest.length; i++) {
      const imageItem = imagesToTest[i];
      console.log(`ImageValidationService: Testing image ${i + 1}/${imagesToTest.length} (${imageItem.source}): ${imageItem.url}`);
      
      try {
        const isValid = await this.validateImageLoad(imageItem.url);
        if (isValid) {
          console.log(`ImageValidationService: ✅ Found valid image (${imageItem.source}): ${imageItem.url}`);
          return imageItem;
        } else {
          console.log(`ImageValidationService: ❌ Invalid image (${imageItem.source}): ${imageItem.url}`);
        }
      } catch (error) {
        console.log(`ImageValidationService: 💥 Error testing image (${imageItem.source}): ${error.message}`);
      }
    }

    console.log(`ImageValidationService: No valid images found for product ${product.id || 'unknown'}`);
    return null;
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
    this.pendingValidations.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingValidations: this.pendingValidations.size,
      cacheEntries: Array.from(this.cache.entries()).map(([url, isValid]) => ({
        url: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
        isValid
      }))
    };
  }
}

// Create singleton instance
const imageValidationService = new ImageValidationService();

export default imageValidationService;
export { ImageValidationService };