import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import { storageService } from '../services/storageService';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiX, FiImage, FiLink, FiTrash2, FiEdit3, FiAlertCircle, FiCheck } = FiIcons;

const ImageUploader = ({ images = [], onImagesUpdate, maxImages = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  
  // Initialize storage bucket on component mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        await storageService.createBucketIfNotExists();
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        // Continue anyway - the bucket might already exist or be created by another process
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
    // Check if we can add more images
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
          [file.name]: { progress: 0, status: 'validating' }
        }));
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB`);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 100, status: 'error', message: 'File too large' }
          }));
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported image format`);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 100, status: 'error', message: 'Invalid format' }
          }));
          continue;
        }

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { progress: 30, status: 'reading' }
        }));

        // Convert file to base64 data URL for preview and upload
        const dataUrl = await fileToDataUrl(file);
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { progress: 50, status: 'uploading' }
        }));

        // Upload to storage
        try {
          const uploadedUrl = await storageService.uploadProductImage(file);
          newImages.push(uploadedUrl);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 100, status: 'success' }
          }));
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name} to storage:`, uploadError);
          // Fall back to base64 for now
          newImages.push(dataUrl);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { 
              progress: 100, 
              status: 'warning', 
              message: 'Using local storage (not uploaded to cloud)'
            }
          }));
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        onImagesUpdate(updatedImages);
        toast.success(`${newImages.length} image(s) uploaded successfully!`);
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

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Check if we can add more images
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
      
      // Store the URL directly
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
          await storageService.deleteProductImage(imageToRemove);
        } catch (error) {
          console.error('Failed to delete image from storage:', error);
          // Continue anyway - we'll still remove it from the UI
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
    // Create a file input specifically for replacing this image
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploading(true);
        try {
          // Validate file
          if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
          }

          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
          if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image file');
            return;
          }

          // First, try to delete the old image if it's from storage
          const oldImage = images[index];
          if (typeof oldImage === 'string' && oldImage.includes('supabase')) {
            try {
              await storageService.deleteProductImage(oldImage);
            } catch (deleteError) {
              console.error('Failed to delete old image:', deleteError);
              // Continue anyway
            }
          }

          // Upload the new image
          let newImageUrl;
          try {
            // Try to upload to storage
            newImageUrl = await storageService.uploadProductImage(file);
          } catch (uploadError) {
            console.error('Failed to upload to storage:', uploadError);
            // Fall back to base64
            newImageUrl = await fileToDataUrl(file);
          }

          // Update the images array
          const updatedImages = [...images];
          updatedImages[index] = newImageUrl;
          onImagesUpdate(updatedImages);
          toast.success('Image replaced successfully!');
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
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop';
                  }}
                />
                
                {/* Main image badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
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
              <p className="text-gray-600">Uploading images...</p>
              
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
                          {status.status === 'warning' && <SafeIcon icon={FiAlertCircle} className="text-yellow-500" />}
                          {['validating', 'reading', 'uploading'].includes(status.status) && 
                            `${status.progress}%`
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            status.status === 'error' 
                              ? 'bg-red-500' 
                              : status.status === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-primary-600'
                          }`} 
                          style={{ width: `${status.progress}%` }}
                        ></div>
                      </div>
                      {status.message && (
                        <p className={`text-xs mt-0.5 ${
                          status.status === 'error' 
                            ? 'text-red-500' 
                            : status.status === 'warning'
                              ? 'text-yellow-500'
                              : 'text-gray-500'
                        }`}>
                          {status.message}
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
                Upload Product Images
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-xs text-gray-400">
                {images.length} of {maxImages} images • Max 5MB per image
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
          Upload from Device
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
        <p><strong>Upload:</strong> Drag & drop or click to upload from your device</p>
        <p><strong>URL:</strong> Add images from web URLs</p>
        <p><strong>Main Image:</strong> First image is used as the main product image</p>
        <p><strong>Replace:</strong> Click the edit icon to replace any image</p>
        <p><strong>Formats:</strong> JPEG, PNG, WebP, GIF • Max 5MB per image</p>
      </div>
    </div>
  );
};

export default ImageUploader;