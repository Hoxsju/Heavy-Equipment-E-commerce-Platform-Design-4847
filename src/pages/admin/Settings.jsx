import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import LogoUploader from '../../components/LogoUploader';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiMessageCircle, FiMail, FiMapPin, FiUser, FiImage, FiType, FiInfo } = FiIcons;

const Settings = () => {
  const [settings, setSettings] = useState({
    websiteName: 'HeavyParts',
    whatsappNumber: '+966502255702',
    companyName: 'AL HAJ HASSAN UNITED CO',
    companyEmail: 'info@alhajhasan.sa',
    companyAddress: '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia',
    websiteLogo: '',
    websiteSlogan: 'Quality Heavy Equipment Parts',
    footerDescription: 'Your trusted source for heavy equipment spare parts from leading brands.',
    footerPhone: '+966115081749',
    footerEmail: 'info@alhajhasan.sa',
    footerAddress: '6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching settings...');
      
      // Try to get settings from localStorage first
      const localSettings = localStorage.getItem('heavyparts_settings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        setSettings(parsedSettings);
        console.log('Loaded settings from localStorage:', parsedSettings);
      }
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.info('Using default settings. You can update them below.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem('heavyparts_settings', JSON.stringify(settings));
      
      // Broadcast a custom event so other components can update
      const settingsEvent = new CustomEvent('settingsUpdated', { 
        detail: settings 
      });
      window.dispatchEvent(settingsEvent);
      
      toast.success('Settings updated successfully!');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <div className="text-sm text-gray-500">
          Changes will be applied across the website
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Website Branding */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiImage} className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Website Branding</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Name
              </label>
              <input
                type="text"
                name="websiteName"
                value={settings.websiteName}
                onChange={handleInputChange}
                placeholder="HeavyParts"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be used as the website title and browser tab name.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Slogan
              </label>
              <input
                type="text"
                name="websiteSlogan"
                value={settings.websiteSlogan}
                onChange={handleInputChange}
                placeholder="Quality Heavy Equipment Parts"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will appear on the homepage hero section.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Logo
              </label>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Test with your logo:</strong> You can paste this URL to test: 
                  <br />
                  <code className="bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                    https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1752482859288-Alhaj-hasan-co-icon-logo.png
                  </code>
                </p>
              </div>
              <LogoUploader
                currentLogo={settings.websiteLogo}
                onLogoUpdate={(url) => {
                  setSettings({ ...settings, websiteLogo: url });
                }}
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiMessageCircle} className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">WhatsApp Integration</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number
            </label>
            <input
              type="tel"
              name="whatsappNumber"
              value={settings.whatsappNumber}
              onChange={handleInputChange}
              placeholder="+966502255702"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Include country code (e.g., +966502255702). This number will be used for WhatsApp communication when customers click the WhatsApp button.
            </p>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiUser} className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Email
              </label>
              <input
                type="email"
                name="companyEmail"
                value={settings.companyEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Address
            </label>
            <textarea
              name="companyAddress"
              value={settings.companyAddress}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter full company address"
            />
          </div>
        </div>

        {/* Footer Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiInfo} className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Footer Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer Description
              </label>
              <textarea
                name="footerDescription"
                value={settings.footerDescription}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your trusted source for heavy equipment spare parts from leading brands."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Phone
                </label>
                <input
                  type="tel"
                  name="footerPhone"
                  value={settings.footerPhone}
                  onChange={handleInputChange}
                  placeholder="+966115081749"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Email
                </label>
                <input
                  type="email"
                  name="footerEmail"
                  value={settings.footerEmail}
                  onChange={handleInputChange}
                  placeholder="info@alhajhasan.sa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Address
                </label>
                <input
                  type="text"
                  name="footerAddress"
                  value={settings.footerAddress}
                  onChange={handleInputChange}
                  placeholder="6359, Haroun Al Rashid Street, Al Sulay District, 2816, Riyadh, Saudi Arabia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;