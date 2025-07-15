import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiX, FiImage, FiLink } = FiIcons;

const LogoUploader = ({ currentLogo, onLogoUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const fileInputRef = useRef(null);

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
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo image must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Logo must be JPEG, PNG, SVG, or WebP format');
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        onLogoUpdate(dataUrl);
        toast.success('Logo uploaded successfully!');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!logoUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(logoUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    // Test if the URL is an image
    const img = new Image();
    img.onload = () => {
      onLogoUpdate(logoUrl);
      toast.success('Logo updated successfully!');
      setShowUrlInput(false);
      setLogoUrl('');
    };
    img.onerror = () => {
      toast.error('Invalid image URL. Please check the URL and try again.');
    };
    img.src = logoUrl;
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !uploading && !showUrlInput && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center
          bg-gray-50 transition-colors cursor-pointer
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${currentLogo ? 'relative group' : ''}
        `}
      >
        {currentLogo ? (
          <>
            <img 
              src={currentLogo} 
              alt="Company Logo" 
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error('Logo image failed to load:', currentLogo);
                e.target.src = 'https://via.placeholder.com/200x200?text=Logo+Error';
              }}
            />
            {!uploading && !showUrlInput && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center">
                  <SafeIcon icon={FiUpload} className="h-8 w-8 text-white mx-auto mb-2" />
                  <p className="text-white text-sm">Click or drag to replace</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-4">
            <SafeIcon icon={FiImage} className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Click or drag image here to upload
            </p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Processing...</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/svg+xml,image/webp"
        className="hidden"
        disabled={uploading}
      />

      {/* URL Input Section */}
      {showUrlInput && (
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <label className="block text-sm font-medium text-gray-700">
            Enter Image URL
          </label>
          <div className="flex space-x-2">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Apply
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false);
              setLogoUrl('');
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || showUrlInput}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center transition-colors"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiUpload} className="h-4 w-4 mr-2" />
              {currentLogo ? 'Replace Logo' : 'Upload Logo'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={uploading}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center transition-colors"
        >
          <SafeIcon icon={FiLink} className="h-4 w-4 mr-2" />
          Use Image URL
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p><strong>Upload:</strong> Drag & drop or click to upload. Maximum size: 2MB</p>
        <p><strong>URL:</strong> Use direct image URL (e.g., from your website or cloud storage)</p>
        <p><strong>Recommended:</strong> 200x200px (square ratio)</p>
        <p><strong>Formats:</strong> JPEG, PNG, SVG, WebP</p>
      </div>
    </div>
  );
};

export default LogoUploader;