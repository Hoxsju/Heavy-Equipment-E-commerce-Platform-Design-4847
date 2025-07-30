import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import LogoUploader from '../../components/LogoUploader';
import EmailTest from '../../EmailTest';
import EmailJSTest from '../../components/EmailJSTest';
import { settingsService } from '../../services/settingsService';
import { authService } from '../../services/authService';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiMessageCircle, FiMail, FiMapPin, FiUser, FiImage, FiType, FiInfo, FiCheckCircle, FiXCircle, FiLoader, FiKey, FiChevronRight, FiChevronLeft } = FiIcons;

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
  const [activeEmailTab, setActiveEmailTab] = useState('emailjs');
  const [tabsScrollPosition, setTabsScrollPosition] = useState(0);
  
  const tabsRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching settings...');
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
      console.log('Loaded settings:', settingsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.info('Using default settings. You can update them below.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await settingsService.saveSettings(settings);
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Update scroll position for arrow visibility
      setTimeout(() => {
        if (tabsRef.current) {
          setTabsScrollPosition(tabsRef.current.scrollLeft);
        }
      }, 300);
    }
  };

  // Check if scroll arrows should be visible
  const canScrollLeft = tabsScrollPosition > 0;
  const canScrollRight = tabsRef.current ? 
    tabsRef.current.scrollWidth > tabsRef.current.clientWidth && 
    tabsRef.current.scrollLeft + tabsRef.current.clientWidth < tabsRef.current.scrollWidth - 10 : 
    false;

  // Update scroll position when tabs container is scrolled
  const handleTabsScroll = () => {
    if (tabsRef.current) {
      setTabsScrollPosition(tabsRef.current.scrollLeft);
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (tabsElement) {
      tabsElement.addEventListener('scroll', handleTabsScroll);
      
      // Check if scrollbars are needed
      const checkScrollable = () => {
        setTabsScrollPosition(tabsElement.scrollLeft);
      };
      
      checkScrollable();
      window.addEventListener('resize', checkScrollable);
      
      return () => {
        tabsElement.removeEventListener('scroll', handleTabsScroll);
        window.removeEventListener('resize', checkScrollable);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'emailjs', label: 'EmailJS Service' },
    { id: 'supabase', label: 'Supabase Auth' },
    { id: 'notifications', label: 'Email Notifications' },
    { id: 'templates', label: 'Email Templates' },
    { id: 'smtp', label: 'SMTP Settings' },
    { id: 'logs', label: 'Email Logs' },
    { id: 'advanced', label: 'Advanced Settings' },
    { id: 'integrations', label: 'Third-party Integrations' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <div className="text-sm text-gray-500">
          Changes will be applied across the website
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* EmailJS Configuration Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiMail} className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Email System Configuration</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <SafeIcon icon={FiCheckCircle} className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-900">Multiple Email Systems Available!</h3>
            </div>
            <div className="text-sm text-blue-800 mt-2 space-y-1">
              <p>✅ <strong>EmailJS:</strong> Real-time order notifications via EmailJS service</p>
              <p>✅ <strong>Supabase Auth:</strong> Account verification and password resets</p>
              <p>✅ <strong>Automatic Notifications:</strong> Order updates sent immediately</p>
              <p>✅ <strong>Professional Templates:</strong> Branded email templates</p>
            </div>
          </div>

          {/* NEW TABS IMPLEMENTATION WITH SCROLL BUTTONS */}
          <div className="relative mb-4">
            {/* Left scroll button */}
            {canScrollLeft && (
              <button 
                type="button"
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
                aria-label="Scroll tabs left"
              >
                <SafeIcon icon={FiChevronLeft} className="h-5 w-5" />
              </button>
            )}
            
            {/* Tabs container with horizontal scrolling */}
            <div 
              className="overflow-x-auto py-2 px-6 border-b border-gray-200 scrollbar-hide"
              ref={tabsRef}
              style={{ 
                msOverflowStyle: 'none', /* IE and Edge */
                scrollbarWidth: 'none', /* Firefox */
              }}
            >
              <div className="flex space-x-2 min-w-max">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEmailTab(tab.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeEmailTab === tab.id 
                        ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right scroll button */}
            {canScrollRight && (
              <button 
                type="button"
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
                aria-label="Scroll tabs right"
              >
                <SafeIcon icon={FiChevronRight} className="h-5 w-5" />
              </button>
            )}
            
            {/* CSS to hide scrollbars but keep functionality */}
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

          {/* Email System Content */}
          {activeEmailTab === 'emailjs' && <EmailJSTest embedded={true} />}
          {activeEmailTab === 'supabase' && <EmailTest embedded={true} />}
          {activeEmailTab === 'notifications' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Email Notifications</h3>
              <p className="text-sm text-gray-600">Configure automatic email notifications for orders and account activities.</p>
            </div>
          )}
          {activeEmailTab === 'templates' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Email Templates</h3>
              <p className="text-sm text-gray-600">Customize email templates for different types of notifications.</p>
            </div>
          )}
          {activeEmailTab === 'smtp' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">SMTP Settings</h3>
              <p className="text-sm text-gray-600">Configure SMTP server settings for sending emails.</p>
            </div>
          )}
          {activeEmailTab === 'logs' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Email Logs</h3>
              <p className="text-sm text-gray-600">View email delivery logs and troubleshoot issues.</p>
            </div>
          )}
          {activeEmailTab === 'advanced' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Advanced Email Settings</h3>
              <p className="text-sm text-gray-600">Configure advanced email delivery options and performance settings.</p>
            </div>
          )}
          {activeEmailTab === 'integrations' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Third-party Email Integrations</h3>
              <p className="text-sm text-gray-600">Connect with external email services and marketing platforms.</p>
            </div>
          )}
        </div>

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