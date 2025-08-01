import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import { enhancedStorageService } from '../services/enhancedStorageService';
import { imageOptimizationService } from '../services/imageOptimizationService';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiX, FiImage, FiLink, FiTrash2, FiEdit3, FiAlertCircle, FiCheck, FiLoader, FiZoomIn } = FiIcons;

const OptimizedImageUploader = ({ images = [], onImagesUpdate, maxImages = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize storage bucket on component mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        await enhancedStorageService.createBucketIfNotExists();
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      }
    };
    initStorage();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files) => {
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    setUploading(true);

    try {
      const newImages = [];

      for (const file of filesToProcess) {
        // Update progress state
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            progress: 0,
            status: 'validating'
          }
        }));

        // Validate file
        const validation = imageOptimizationService.validateImageFile(file);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.errors[0]}`);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              progress: 100,
              status: 'error',
              message: validation.errors[0]
            }
          }));
          continue;
        }

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            progress: 20,
            status: 'optimizing'
          }
        }));

        try {
          // Upload optimized image
          const result = await enhancedStorageService.uploadOptimizedProductImage(file);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              progress: 100,
              status: 'success',
              metadata: result.metadata
            }
          }));

          // Use thumbnail for grid display, full image for detail view
          newImages.push({
            thumbnail: result.thumbnail,
            fullImage: result.fullImage,
            isOptimized: result.isOptimized,
            metadata: result.metadata
          });

        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              progress: 100,
              status: 'error',
              message: 'Upload failed'
            }
          }));
        }
      }

      if (newImages.length > 0) {
        // Convert optimized images to the format expected by the parent component
        const formattedImages = newImages.map(img => img.thumbnail);
        const updatedImages = [...images, ...formattedImages];
        onImagesUpdate(updatedImages);
        toast.success(`${newImages.length} image(s) uploaded and optimized successfully!`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setUploading(true);
    try {
      // Test if the URL is an image
      const isValid = await testImageUrl(imageUrl);
      if (!isValid) {
        toast.error('Invalid image URL. Please check the URL and try again.');
        return;
      }

      const updatedImages = [...images, imageUrl];
      onImagesUpdate(updatedImages);
      toast.success('Image added successfully!');
      setShowUrlInput(false);
      setImageUrl('');
    } catch (error) {
      toast.error('Failed to add image URL. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const testImageUrl = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleRemoveImage = async (index) => {
    try {
      const imageToRemove = images[index];
      
      // If it's a Supabase storage URL, try to delete from storage
      if (typeof imageToRemove === 'string' && imageToRemove.includes('supabase')) {
        try {
          await enhancedStorageService.deleteOptimizedImages(imageToRemove);
        } catch (error) {
          console.error('Failed to delete image from storage:', error);
        }
      }

      const updatedImages = images.filter((_, i) => i !== index);
      onImagesUpdate(updatedImages);
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleReplaceImage = async (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploading(true);
        try {
          // Validate file
          const validation = imageOptimizationService.validateImageFile(file);
          if (!validation.isValid) {
            toast.error(validation.errors[0]);
            return;
          }

          // Delete old image if it's from storage
          const oldImage = images[index];
          if (typeof oldImage === 'string' && oldImage.includes('supabase')) {
            try {
              await enhancedStorageService.deleteOptimizedImages(oldImage);
            } catch (deleteError) {
              console.error('Failed to delete old image:', deleteError);
            }
          }

          // Upload new optimized image
          const result = await enhancedStorageService.uploadOptimizedProductImage(file);
          
          // Update the images array
          const updatedImages = [...images];
          updatedImages[index] = result.thumbnail;
          onImagesUpdate(updatedImages);
          
          toast.success('Image replaced and optimized successfully!');
        } catch (error) {
          console.error('Replace error:', error);
          toast.error('Failed to replace image');
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  const handleSetAsMain = (index) => {
    if (index === 0) return; // Already main image
    
    const updatedImages = [...images];
    const mainImage = updatedImages[index];
    updatedImages.splice(index, 1);
    updatedImages.unshift(mainImage);
    onImagesUpdate(updatedImages);
    toast.success('Main image updated');
  };

  const handlePreviewImage = (image) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className={`relative rounded-lg overflow-hidden border-2 ${
                index === 0 ? 'border-primary-500' : 'border-gray-200'
              }`}>
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover cursor-pointer"
                  onClick={() => handlePreviewImage(image)}
                  onError={(e) => {
                    e.target.src = imageOptimizationService.createPlaceholder(400, 300);
                  }}
                  loading="lazy"
                />
                
                {/* Main image badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
                
                {/* Optimization badge */}
                {image.includes('supabase') && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Optimized
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewImage(image)}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                      title="Preview image"
                    >
                      <SafeIcon icon={FiZoomIn} className="h-4 w-4" />
                    </button>
                    
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetAsMain(index)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                        title="Set as main image"
                      >
                        <SafeIcon icon={FiImage} className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleReplaceImage(index)}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                      title="Replace image"
                    >
                      <SafeIcon icon={FiEdit3} className="h-4 w-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      title="Remove image"
                    >
                      <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={() => !uploading && !showUrlInput && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Optimizing and uploading images...</p>
              
              {/* Progress indicators */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="w-full max-w-xs mt-4 space-y-2">
                  {Object.entries(uploadProgress).map(([filename, status]) => (
                    <div key={filename} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="truncate max-w-[150px]">{filename}</span>
                        <span>
                          {status.status === 'success' && <SafeIcon icon={FiCheck} className="text-green-500" />}
                          {status.status === 'error' && <SafeIcon icon={FiAlertCircle} className="text-red-500" />}
                          {['validating', 'optimizing'].includes(status.status) && (
                            <SafeIcon icon={FiLoader} className="animate-spin text-blue-500" />
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            status.status === 'error'
                              ? 'bg-red-500'
                              : status.status === 'success'
                              ? 'bg-green-500'
                              : 'bg-primary-600'
                          }`}
                          style={{ width: `${status.progress}%` }}
                        ></div>
                      </div>
                      {status.message && (
                        <p className={`text-xs mt-0.5 ${
                          status.status === 'error' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {status.message}
                        </p>
                      )}
                      {status.metadata && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Compressed by {status.metadata.compressionRatio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <SafeIcon icon={FiUpload} className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload Optimized Product Images
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-xs text-gray-400">
                {images.length} of {maxImages} images • Auto-optimized for web
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />

      {/* URL Input Section */}
      {showUrlInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Image from URL
          </label>
          <div className="flex space-x-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false);
              setImageUrl('');
            }}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SafeIcon icon={FiUpload} className="h-4 w-4 mr-2" />
          Upload & Optimize
        </button>
        
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SafeIcon icon={FiLink} className="h-4 w-4 mr-2" />
          Add from URL
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Auto-Optimization:</strong> Images are automatically compressed and resized for optimal web performance</p>
        <p><strong>Thumbnail Generation:</strong> Thumbnails are created for fast loading in product grids</p>
        <p><strong>Supported Formats:</strong> JPEG, PNG, WebP, GIF • Max 5MB per image</p>
        <p><strong>Compression:</strong> Images are optimized to reduce file size by up to 80% while maintaining quality</p>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closePreview}>
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closePreview}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <SafeIcon icon={FiX} className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImageUploader;