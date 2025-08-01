/**
 * Image Optimization Service
 * Handles image compression, thumbnail generation, and optimization
 */

export class ImageOptimizationService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.thumbnailMaxWidth = 400;
    this.thumbnailMaxHeight = 400;
    this.thumbnailQuality = 0.8;
    this.fullImageMaxWidth = 1200;
    this.fullImageMaxHeight = 1200;
    this.fullImageQuality = 0.85;
  }

  /**
   * Optimize an image file by creating both thumbnail and full-size optimized versions
   * @param {File|string} imageInput - File object or base64 string
   * @returns {Promise<Object>} - Object containing thumbnail and full image data
   */
  async optimizeImage(imageInput) {
    try {
      console.log('Starting image optimization...');
      
      // Convert input to canvas
      const canvas = await this.loadImageToCanvas(imageInput);
      if (!canvas) {
        throw new Error('Failed to load image');
      }

      console.log('Original image size:', canvas.width, 'x', canvas.height);

      // Generate thumbnail
      const thumbnail = await this.createThumbnail(canvas);
      
      // Generate optimized full image
      const fullImage = await this.createOptimizedFullImage(canvas);

      console.log('Image optimization completed');
      
      return {
        thumbnail: {
          dataUrl: thumbnail.dataUrl,
          size: thumbnail.size,
          dimensions: thumbnail.dimensions
        },
        fullImage: {
          dataUrl: fullImage.dataUrl,
          size: fullImage.size,
          dimensions: fullImage.dimensions
        },
        original: {
          dimensions: { width: canvas.width, height: canvas.height }
        }
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw error;
    }
  }

  /**
   * Load image to canvas from various input types
   * @param {File|string} imageInput - File object or base64/URL string
   * @returns {Promise<HTMLCanvasElement>}
   */
  async loadImageToCanvas(imageInput) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (imageInput instanceof File) {
        // Convert File to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(imageInput);
      } else if (typeof imageInput === 'string') {
        // Handle data URL or regular URL
        img.crossOrigin = 'anonymous';
        img.src = imageInput;
      } else {
        reject(new Error('Invalid image input type'));
      }
    });
  }

  /**
   * Create thumbnail version of the image
   * @param {HTMLCanvasElement} sourceCanvas
   * @returns {Promise<Object>}
   */
  async createThumbnail(sourceCanvas) {
    const { width, height } = this.calculateDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      this.thumbnailMaxWidth,
      this.thumbnailMaxHeight
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;

    // Use better image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', this.thumbnailQuality);
    
    return {
      dataUrl,
      size: this.getDataUrlSize(dataUrl),
      dimensions: { width, height }
    };
  }

  /**
   * Create optimized full-size image
   * @param {HTMLCanvasElement} sourceCanvas
   * @returns {Promise<Object>}
   */
  async createOptimizedFullImage(sourceCanvas) {
    const { width, height } = this.calculateDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      this.fullImageMaxWidth,
      this.fullImageMaxHeight
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;

    // Use better image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', this.fullImageQuality);
    
    return {
      dataUrl,
      size: this.getDataUrlSize(dataUrl),
      dimensions: { width, height }
    };
  }

  /**
   * Calculate new dimensions while maintaining aspect ratio
   * @param {number} originalWidth
   * @param {number} originalHeight
   * @param {number} maxWidth
   * @param {number} maxHeight
   * @returns {Object}
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // If image is smaller than max dimensions, don't upscale
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }
    
    // Calculate scaling factor
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);
    
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
    
    return { width, height };
  }

  /**
   * Get size of data URL in bytes
   * @param {string} dataUrl
   * @returns {number}
   */
  getDataUrlSize(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    return Math.round(base64.length * 0.75); // Base64 is ~75% efficient
  }

  /**
   * Validate image file
   * @param {File} file
   * @returns {Object}
   */
  validateImageFile(file) {
    const errors = [];
    
    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`);
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Batch optimize multiple images
   * @param {Array} imageInputs - Array of File objects or base64 strings
   * @returns {Promise<Array>}
   */
  async batchOptimizeImages(imageInputs) {
    const results = [];
    
    for (let i = 0; i < imageInputs.length; i++) {
      try {
        console.log(`Optimizing image ${i + 1} of ${imageInputs.length}...`);
        const result = await this.optimizeImage(imageInputs[i]);
        results.push({
          index: i,
          success: true,
          data: result
        });
      } catch (error) {
        console.error(`Failed to optimize image ${i + 1}:`, error);
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Create a progressive loading placeholder
   * @param {number} width
   * @param {number} height
   * @returns {string} - Base64 encoded placeholder image
   */
  createPlaceholder(width = 400, height = 300) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add icon in center
    ctx.fillStyle = '#9ca3af';
    ctx.font = `${Math.min(width, height) / 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', width / 2, height / 2);
    
    return canvas.toDataURL('image/jpeg', 0.3);
  }
}

// Create singleton instance
export const imageOptimizationService = new ImageOptimizationService();
export default imageOptimizationService;