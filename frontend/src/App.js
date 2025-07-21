import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './App.css';
import './i18n';
import About from './pages/About';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Register form state
  const [registerFormData, setRegisterFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  
  // Submit case form state
  const [caseFormData, setCaseFormData] = useState({
    case_type: 'divorce',
    title: '',
    description: ''
  });
  const [caseFiles, setCaseFiles] = useState([]);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseSuccess, setCaseSuccess] = useState(false);
  const [caseError, setCaseError] = useState('');
  
  // Booking form state
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  // Dashboard state
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // Admin dashboard state
  const [adminCases, setAdminCases] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  
  // Videos state
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Navigation and mobile menu state
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // About page state
  const [aboutLoading, setAboutLoading] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  // Remove Emergent badge injected via index.html if present
  useEffect(() => {
    const badge = document.getElementById('emergent-badge');
    if (badge) {
      badge.remove();
    }
  }, []);
  
  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setShowLanguageMenu(false);
  };

  const getCurrentLanguageFlag = () => {
    const flags = { en: '🇺🇸', fr: '🇫🇷', ar: '🇱🇧' };
    return flags[i18n.language] || '🇺🇸';
  };

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageMenu && !event.target.closest('.language-menu')) {
        setShowLanguageMenu(false);
      }
      if (showMobileMenu && !event.target.closest('.mobile-menu')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu, showMobileMenu]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (currentPage === 'videos') {
      fetchVideos();
    }
  }, [currentPage]);

  const fetchVideos = async () => {
    setVideosLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/videos`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setVideosLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage === 'admin' && user?.role === 'admin') {
      fetchAdminData();
    }
  }, [currentPage, user]);

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const casesResponse = await fetch(`${API_URL}/api/admin/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setAdminCases(casesData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh admin data
        fetchAdminData();
        setShowCaseModal(false);
      }
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  useEffect(() => {
    if (currentPage === 'dashboard' && isAuthenticated) {
      fetchDashboardData();
    }
  }, [currentPage, isAuthenticated]);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const [casesResponse, appointmentsResponse] = await Promise.all([
        fetch(`${API_URL}/api/cases`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setCases(casesData);
      }

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    }
  };

  const navigateToPage = (page) => {
    // Reset success states when navigating
    setCaseSuccess(false);
    setBookingSuccess(false);
    setCurrentPage(page);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
    // Reset all form states
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setRegisterFormData({ email: '', password: '', name: '', phone: '' });
    setRegisterError('');
    setCaseFormData({ case_type: 'divorce', title: '', description: '' });
    setCaseFiles([]);
    setCaseSuccess(false);
    setCaseError('');
    setAppointmentDate('');
    setAppointmentNotes('');
    setBookingSuccess(false);
    setBookingError('');
    setCases([]);
    setAppointments([]);
  };

  const renderNavigation = () => (
    <nav className="bg-[#0d1b2a] shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => {
                window.scrollTo(0, 0);
                navigateToPage('home');
              }}
              className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/assets/logo.png"
                alt="Union Law Firm Logo"
                className="h-10 w-auto mr-2"
              />
              <span className="block text-sm sm:text-lg text-white font-semibold">Union Law Firm</span>
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('home');
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                  currentPage === 'home'
                    ? 'text-[#fcbf49]'
                    : 'text-[#fefefe] hover:text-[#fcbf49]'
                }`}
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('videos');
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                  currentPage === 'videos'
                    ? 'text-[#fcbf49]'
                    : 'text-[#fefefe] hover:text-[#fcbf49]'
                }`}
              >
                {t('nav.videos')}
              </button>
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('about');
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                  currentPage === 'about'
                    ? 'text-[#fcbf49]'
                    : 'text-[#fefefe] hover:text-[#fcbf49]'
                }`}
              >
                {t('nav.about', 'About')}
              </button>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('submit-case');
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                      currentPage === 'submit-case'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49]'
                    }`}
                  >
                    {t('nav.submitCase')}
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('booking');
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                      currentPage === 'booking'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49]'
                    }`}
                  >
                    {t('nav.booking')}
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('dashboard');
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                      currentPage === 'dashboard'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49]'
                    }`}
                  >
                    {t('nav.dashboard')}
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        window.scrollTo(0, 0);
                        navigateToPage('admin');
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                        currentPage === 'admin'
                          ? 'text-[#fcbf49]'
                          : 'text-[#fefefe] hover:text-[#fcbf49]'
                      }`}
                    >
                      {t('nav.admin')}
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium tracking-wide text-red-400 hover:text-red-600 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('login');
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                      currentPage === 'login'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49]'
                    }`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('register');
                    }}
                    className="bg-[#fcbf49] text-[#0d1b2a] px-4 py-2 rounded-md text-sm font-medium tracking-wide shadow hover:bg-[#fcbf49]/90 transition-colors"
                  >
                    {t('nav.register')}
                  </button>
                </>
              )}
              
              {/* Desktop Language Selector */}
              <div className="relative language-menu">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium tracking-wide text-[#fefefe] hover:text-[#fcbf49] transition-colors"
                >
                  <span className="mr-2">{getCurrentLanguageFlag()}</span>
                  <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => changeLanguage('en')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="mr-3">🇺🇸</span>
                        English
                      </button>
                      <button
                        onClick={() => changeLanguage('fr')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="mr-3">🇫🇷</span>
                        Français
                      </button>
                      <button
                        onClick={() => changeLanguage('ar')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="mr-3">🇱🇧</span>
                        العربية
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button and language selector */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Language Selector */}
            <div className="relative language-menu">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-md text-gray-700 hover:text-yellow-600 hover:bg-gray-100 transition-colors border border-gray-300"
                aria-label="Select Language"
              >
                <span className="text-xl">{getCurrentLanguageFlag()}</span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-30">
                  <div className="py-1">
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 ${i18n.language === 'en' ? 'bg-yellow-50 text-yellow-800' : ''}`}
                    >
                      <span className="mr-2">🇺🇸</span>
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage('fr')}
                      className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 ${i18n.language === 'fr' ? 'bg-yellow-50 text-yellow-800' : ''}`}
                    >
                      <span className="mr-2">🇫🇷</span>
                      Français
                    </button>
                    <button
                      onClick={() => changeLanguage('ar')}
                      className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 ${i18n.language === 'ar' ? 'bg-yellow-50 text-yellow-800' : ''}`}
                    >
                      <span className="mr-2">🇱🇧</span>
                      العربية
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger menu */}
            <div className="mobile-menu">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-md text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70 transition-colors border border-[#fcbf49]"
                aria-label="Open mobile menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0d1b2a] border-t border-[#fcbf49]">
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('home');
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                  currentPage === 'home'
                    ? 'text-[#fcbf49]'
                    : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                }`}
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('videos');
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                  currentPage === 'videos'
                    ? 'text-[#fcbf49]'
                    : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                }`}
              >
                {t('nav.videos')}
              </button>
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('about');
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                  currentPage === 'about'
                    ? 'text-[#fcbf49]'
                    : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                }`}
              >
                {t('nav.about', 'About')}
              </button>
              
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('submit-case');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                      currentPage === 'submit-case'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                    }`}
                  >
                    {t('nav.submitCase')}
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('booking');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                      currentPage === 'booking'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                    }`}
                  >
                    {t('nav.booking')}
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('dashboard');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                      currentPage === 'dashboard'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                    }`}
                  >
                    {t('nav.dashboard')}
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        window.scrollTo(0, 0);
                        navigateToPage('admin');
                        setShowMobileMenu(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                        currentPage === 'admin'
                          ? 'text-[#fcbf49]'
                          : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                      }`}
                    >
                      {t('nav.admin')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('login');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium tracking-wide transition-colors ${
                      currentPage === 'login'
                        ? 'text-[#fcbf49]'
                        : 'text-[#fefefe] hover:text-[#fcbf49] hover:bg-[#0d1b2a]/70'
                    }`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigateToPage('register');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left mt-2 bg-[#fcbf49] text-[#0d1b2a] px-3 py-2 rounded-md text-base font-medium tracking-wide shadow hover:bg-[#fcbf49]/90 transition-colors"
                  >
                    {t('nav.register')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  const renderAbout = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <img
            src="/assets/c.jpg"
            alt="Lawyer Omar Iskandarani"
            className="w-48 h-48 rounded-full shadow-lg object-cover"
          />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Union Law Firm</h1>
          <p className="text-xl text-gray-600">Your trusted legal partner in Lebanon</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8" data-aos="fade-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-700 mb-4">
            Founded in 2020, Union Law Firm has been dedicated to providing exceptional legal services to families across Lebanon. We specialize in family law matters, understanding the sensitive nature of these issues and providing compassionate, professional representation.
          </p>
          <p className="text-gray-700 mb-4">
            Our team of experienced attorneys has been helping clients navigate complex legal challenges for over a decade. We pride ourselves on our deep understanding of Lebanese family law and our commitment to achieving the best possible outcomes for our clients.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8" data-aos="fade-up">
          <div className="bg-white rounded-lg shadow-lg p-6 transition-transform hover:scale-105 ring-1 ring-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-700">
              To provide compassionate, skilled legal representation to families in Lebanon, ensuring that every client receives personalized attention and the highest quality legal services in their time of need.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 transition-transform hover:scale-105 ring-1 ring-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Values</h3>
            <ul className="text-gray-700 space-y-2">
              <li>• Integrity and transparency in all dealings</li>
              <li>• Compassionate client service</li>
              <li>• Excellence in legal representation</li>
              <li>• Respect for cultural and religious values</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8" data-aos="fade-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Expertise</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Family Law Specialists</h4>
              <p className="text-gray-700">With years of experience in Lebanese family law, we handle complex cases involving divorce, custody, and financial arrangements.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Inheritance Law</h4>
              <p className="text-gray-700">We provide expert guidance on inheritance matters, ensuring fair distribution of assets according to Lebanese law.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Child Custody</h4>
              <p className="text-gray-700">We prioritize the best interests of children while protecting your parental rights throughout custody proceedings.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Mediation Services</h4>
              <p className="text-gray-700">We offer mediation services to help families resolve disputes amicably without lengthy court proceedings.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-8 text-white text-center" data-aos="zoom-in">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-6">Contact us today for a consultation about your legal needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('contact');
                }}
                className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-transform transform hover:scale-105 ring-1 ring-white"
              >
                Contact Us
              </button>
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigateToPage('booking');
                }}
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-yellow-600 transition-transform transform hover:scale-105 ring-1 ring-white"
              >
                Book Consultation
              </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">Get in touch with our legal team</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8" data-aos="fade-up">
          <div className="bg-white rounded-lg shadow-lg p-8" data-aos="fade-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Office Address</h3>
                  <p className="text-gray-700">123 Legal Street, Beirut, Lebanon</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-700">+961 1 234 567</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-700">contact@unionlaw.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Business Hours</h3>
                  <p className="text-gray-700">Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-700">Saturday: 10:00 AM - 2:00 PM</p>
                  <p className="text-gray-700">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8" data-aos="fade-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="How can we help you?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Tell us about your legal needs..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 px-4 rounded-md font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-transform transform hover:scale-105 ring-1 ring-yellow-500"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us, such as when you:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Create an account or submit a legal case</li>
                <li>Book an appointment or consultation</li>
                <li>Contact us through our website or email</li>
                <li>Subscribe to our newsletter or updates</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide legal services and consultation</li>
                <li>Process your case submissions and appointments</li>
                <li>Communicate with you about your legal matters</li>
                <li>Improve our services and website functionality</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to outside parties except as described in this policy. We may share information with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Legal professionals working on your case</li>
                <li>Court systems as required by law</li>
                <li>Service providers who assist in our operations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <p>Union Law Firm</p>
                <p>123 Legal Street, Beirut, Lebanon</p>
                <p>Email: privacy@unionlaw.com</p>
                <p>Phone: +961 1 234 567</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using Union Law Firm's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Services Provided</h2>
              <p className="mb-3">Union Law Firm provides legal services including but not limited to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Family law consultation and representation</li>
                <li>Divorce proceedings</li>
                <li>Child custody matters</li>
                <li>Inheritance and estate planning</li>
                <li>Alimony and support arrangements</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Client Responsibilities</h2>
              <p className="mb-3">As a client, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Pay fees and costs as agreed</li>
                <li>Cooperate in the representation</li>
                <li>Maintain confidentiality when required</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Attorney-Client Relationship</h2>
              <p>An attorney-client relationship is established only when you have executed a written agreement with Union Law Firm. Visiting our website or submitting information does not create an attorney-client relationship.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Fees and Payment</h2>
              <p>Legal fees and costs will be as agreed in your written agreement. Payment is due as specified in your agreement. We reserve the right to withdraw from representation if fees are not paid as agreed.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
              <p>Union Law Firm's liability is limited to the amount of fees paid by the client. We are not liable for any consequential, indirect, or punitive damages.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Governing Law</h2>
              <p>These terms are governed by the laws of Lebanon. Any disputes will be resolved in the courts of Lebanon.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
              <p>For questions about these Terms of Service, contact us at:</p>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <p>Union Law Firm</p>
                <p>123 Legal Street, Beirut, Lebanon</p>
                <p>Email: legal@unionlaw.com</p>
                <p>Phone: +961 1 234 567</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-400">
              {t('footer.contact.title')}
            </h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-1 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{t('footer.contact.address')}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm">{t('footer.contact.phone')}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">{t('footer.contact.email')}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{t('footer.contact.hours')}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-400">
              {t('footer.services.title')}
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('submit-case');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.services.divorce')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('submit-case');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.services.inheritance')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('submit-case');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.services.custody')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('submit-case');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.services.alimony')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('booking');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.services.consultation')}
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-400">
              {t('footer.quickLinks.title')}
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('about');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.quickLinks.about')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('home');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.quickLinks.services')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('videos');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.quickLinks.videos')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('contact');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.quickLinks.contact')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('privacy');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.quickLinks.privacy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigateToPage('terms');
                  }}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  {t('footer.quickLinks.terms')}
                </button>
              </li>
            </ul>
          </div>

          {/* Social Media & Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-400">
              {t('footer.social.title')}
            </h3>
            {/* Logo and Name */}
            <div className="flex items-center mb-4">
              <img src="/assets/logo.png" alt="Union Law Firm Logo" className="h-8 w-auto mr-2" />
              <span className="text-white font-semibold text-lg">Union Law Firm</span>
            </div>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.739.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.750-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.001 12.017z"/>
                </svg>
              </a>
            </div>
            
            <div className="text-sm text-gray-400">
              <p className="mb-2">{t('footer.legal.licensed')}</p>
              <p>{t('footer.legal.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              {t('footer.legal.copyright')}
            </p>
            <div className="flex items-center mt-2 md:mt-0">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">⚖</span>
              </div>
              <span className="text-sm text-gray-400">Union Law Firm</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-[#fefefe]">
      {/* Hero Section */}
      <div className="relative bg-[#0d1b2a] overflow-hidden" data-aos="fade-up">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1702628771524-25d5174e919b"
            alt="Professional Law Office"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-wide mb-6">
              {t('hero.title')}
              <span className="text-[#fcbf49] block">{t('hero.subtitle')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentPage(isAuthenticated ? 'submit-case' : 'register')}
                className="bg-[#fcbf49] text-[#0d1b2a] px-8 py-3 rounded-lg text-lg font-semibold shadow hover:bg-[#fcbf49]/90 transition-transform transform hover:scale-105 ring-1 ring-[#fcbf49] ring-offset-2"
              >
                {t('hero.submitCase')}
              </button>
              <button
                onClick={() => setCurrentPage('videos')}
                className="border-2 border-[#fcbf49] text-[#fcbf49] px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#fcbf49] hover:text-[#0d1b2a] transition-colors ring-1 ring-[#fcbf49] ring-offset-2"
              >
                {t('hero.watchVideos')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-[#fefefe]" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-wide text-[#0d1b2a] mb-4">
              {t('services.title')}
            </h2>
            <p className="text-lg text-[#0d1b2a]/80 max-w-2xl mx-auto">
              {t('services.description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                key: 'divorce',
                title: t('services.divorce.title'),
                description: t('services.divorce.description'),
                icon: "⚖️",
                image: "https://images.unsplash.com/photo-1600506451234-9e555c0c8d05"
              },
              {
                key: 'inheritance',
                title: t('services.inheritance.title'),
                description: t('services.inheritance.description'),
                icon: "🏛️",
                image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85"
              },
              {
                key: 'custody',
                title: t('services.custody.title'),
                description: t('services.custody.description'),
                icon: "👨‍👩‍👧‍👦",
                image: "https://images.unsplash.com/photo-1619418602850-35ad20aa1700"
              },
              {
                key: 'alimony',
                title: t('services.alimony.title'),
                description: t('services.alimony.description'),
                icon: "💼",
                image: "https://images.unsplash.com/photo-1600506451234-9e555c0c8d05"
              }
            ].map((service, index) => (
              <div
                key={index}
                className="bg-[#fefefe] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-transform duration-300 hover:scale-105 ring-1 ring-[#fcbf49]/30"
                data-aos="zoom-in"
              >
                <div className="h-48 bg-[#fcbf49]/20 flex items-center justify-center">
                  <span className="text-6xl">{service.icon}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#0d1b2a] mb-3">{service.title}</h3>
                  <p className="text-[#0d1b2a]/80 mb-4">{service.description}</p>
                  <button
                    onClick={() => setCurrentPage(isAuthenticated ? 'submit-case' : 'register')}
                    className="text-[#0d1b2a] hover:text-[#fcbf49] font-semibold transition-colors ring-1 ring-[#fcbf49] rounded-md px-2 py-1"
                  >
                    {t('services.learnMore')} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#0d1b2a] py-16" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-[#fcbf49] mb-8 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage(isAuthenticated ? 'booking' : 'register')}
              className="bg-[#fcbf49] text-[#0d1b2a] px-8 py-3 rounded-lg text-lg font-semibold shadow hover:bg-[#fcbf49]/90 transition-transform transform hover:scale-105 ring-1 ring-[#fcbf49] ring-offset-2"
            >
              {t('cta.bookConsultation')}
            </button>
            <button
              onClick={() => setCurrentPage(isAuthenticated ? 'submit-case' : 'register')}
              className="border-2 border-[#fcbf49] text-[#fcbf49] px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#fcbf49] hover:text-[#0d1b2a] transition-transform transform hover:scale-105 ring-1 ring-[#fcbf49] ring-offset-2"
            >
              {t('cta.submitCase')}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky CTA for mobile only */}
      <div className="fixed left-0 right-0 z-50 bg-yellow-500 text-white text-center py-3 shadow-lg md:hidden pb-4 bottom-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => {
            window.scrollTo(0, 0);
            navigateToPage('booking');
          }}
          className="text-lg font-semibold w-full"
        >
          📅 Book Consultation
        </button>
      </div>
    </div>
  );

  const renderLogin = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoginLoading(true);
      setLoginError('');

      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          setToken(data.access_token);
          setUser(data.user);
          setIsAuthenticated(true);
          setCurrentPage('dashboard');
        } else {
          setLoginError(data.detail || 'Login failed');
        }
      } catch (error) {
        setLoginError('Network error. Please try again.');
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8" data-aos="fade-up">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('auth.signInTitle')}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {loginError}
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.emailAddress')}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.password')}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-transform transform hover:scale-105 ring-1 ring-yellow-500"
              >
                {loginLoading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('register')}
                className="text-yellow-600 hover:text-yellow-800"
              >
                {t('auth.noAccount')}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    );
  };

  const renderRegister = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      setRegisterLoading(true);
      setRegisterError('');

      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerFormData),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          setToken(data.access_token);
          setUser(data.user);
          setIsAuthenticated(true);
          setCurrentPage('dashboard');
        } else {
          setRegisterError(data.detail || 'Registration failed');
        }
      } catch (error) {
        setRegisterError('Network error. Please try again.');
      } finally {
        setRegisterLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8" data-aos="fade-up">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('auth.createAccountTitle')}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {registerError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {registerError}
              </div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder={t('auth.fullName')}
                value={registerFormData.name}
                onChange={(e) => setRegisterFormData({...registerFormData, name: e.target.value})}
              />
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder={t('auth.emailAddress')}
                value={registerFormData.email}
                onChange={(e) => setRegisterFormData({...registerFormData, email: e.target.value})}
              />
              <input
                type="tel"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder={t('auth.phoneNumber')}
                value={registerFormData.phone}
                onChange={(e) => setRegisterFormData({...registerFormData, phone: e.target.value})}
              />
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder={t('auth.password')}
                value={registerFormData.password}
                onChange={(e) => setRegisterFormData({...registerFormData, password: e.target.value})}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={registerLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-transform transform hover:scale-105 ring-1 ring-yellow-500"
              >
                {registerLoading ? t('auth.creatingAccount') : t('auth.signUp')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="text-yellow-600 hover:text-yellow-800"
              >
                {t('auth.hasAccount')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSubmitCase = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      setCaseLoading(true);
      setCaseError('');

      const formDataToSend = new FormData();
      formDataToSend.append('case_type', caseFormData.case_type);
      formDataToSend.append('title', caseFormData.title);
      formDataToSend.append('description', caseFormData.description);

      Array.from(caseFiles).forEach(file => {
        formDataToSend.append('files', file);
      });

      try {
        const response = await fetch(`${API_URL}/api/cases`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });

        const data = await response.json();

        if (response.ok) {
          setCaseSuccess(true);
          setCaseFormData({ case_type: 'divorce', title: '', description: '' });
          setCaseFiles([]);
        } else {
          setCaseError(data.detail || 'Failed to submit case');
        }
      } catch (error) {
        setCaseError('Network error. Please try again.');
      } finally {
        setCaseLoading(false);
      }
    };

    if (caseSuccess) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Case Submitted Successfully!</h3>
              <p>Your case has been submitted and is now pending review. We'll contact you soon.</p>
            </div>
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigateToPage('dashboard');
              }}
              className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Submit Your Legal Case</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {caseError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {caseError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Type
                </label>
                <select
                  value={caseFormData.case_type}
                  onChange={(e) => setCaseFormData({...caseFormData, case_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="divorce">Divorce</option>
                  <option value="inheritance">Inheritance</option>
                  <option value="custody">Child Custody</option>
                  <option value="alimony">Alimony</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Title
                </label>
                <input
                  type="text"
                  required
                  value={caseFormData.title}
                  onChange={(e) => setCaseFormData({...caseFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Brief title for your case"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Description
                </label>
                <textarea
                  required
                  rows={6}
                  value={caseFormData.description}
                  onChange={(e) => setCaseFormData({...caseFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Detailed description of your legal case..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                  onChange={(e) => setCaseFiles(e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Accepted formats: PDF, Word, Excel, Images (JPG, PNG, GIF)
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={caseLoading}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 transition-all duration-200"
                >
                  {caseLoading ? 'Submitting...' : 'Submit Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (dashboardLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="text-gray-600 mt-2">Manage your cases and appointments</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Cases Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Cases</h2>
                <button
                  onClick={() => setCurrentPage('submit-case')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                >
                  Submit New Case
                </button>
              </div>

              {cases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No cases submitted yet</p>
                  <button
                    onClick={() => setCurrentPage('submit-case')}
                    className="mt-2 text-yellow-600 hover:text-yellow-800"
                  >
                    Submit your first case
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cases.map((case_item) => (
                    <div key={case_item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{case_item.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          case_item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          case_item.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          case_item.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                          case_item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {case_item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{case_item.description.substring(0, 100)}...</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Type: {case_item.case_type}</span>
                        <span>Files: {case_item.files.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Appointments Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Appointments</h2>
                <button
                  onClick={() => setCurrentPage('booking')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                >
                  Book Appointment
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No appointments scheduled</p>
                  <button
                    onClick={() => setCurrentPage('booking')}
                    className="mt-2 text-yellow-600 hover:text-yellow-800"
                  >
                    Book your first appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Time: {new Date(appointment.appointment_date).toLocaleTimeString()}
                      </p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Amount: ${appointment.amount}</span>
                        <span>Payment: {appointment.payment_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBooking = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      setBookingLoading(true);
      setBookingError('');

      try {
        const response = await fetch(`${API_URL}/api/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            appointment_date: appointmentDate,
            notes: appointmentNotes
          })
        });

        const data = await response.json();

        if (response.ok) {
          setBookingSuccess(true);
          setAppointmentDate('');
          setAppointmentNotes('');
        } else {
          setBookingError(data.detail || 'Failed to book appointment');
        }
      } catch (error) {
        setBookingError('Network error. Please try again.');
      } finally {
        setBookingLoading(false);
      }
    };

    if (bookingSuccess) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Appointment Booked Successfully!</h3>
              <p>Your appointment has been scheduled. Payment will be processed separately.</p>
            </div>
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigateToPage('dashboard');
              }}
              className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Book a Consultation</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {bookingError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {bookingError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  min={minDate}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Any specific topics you'd like to discuss..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Consultation Fee</h3>
                <p className="text-yellow-700">
                  Standard consultation fee: $100
                  <br />
                  Payment will be processed after confirmation.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 transition-all duration-200"
                >
                  {bookingLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {renderFooter()}
      </div>
    );
  };

  const renderAdmin = () => {
    if (user?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    if (adminLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage cases, users, and appointments</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{adminCases.length}</p>
                  <p className="text-gray-600">Total Cases</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {adminCases.filter(c => c.status === 'pending').length}
                  </p>
                  <p className="text-gray-600">Pending Cases</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {adminCases.filter(c => c.status === 'in_progress').length}
                  </p>
                  <p className="text-gray-600">Active Cases</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Cases</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminCases.map((case_item) => (
                    <tr key={case_item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{case_item.title}</div>
                        <div className="text-sm text-gray-500">{case_item.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{case_item.user_name}</div>
                        <div className="text-sm text-gray-500">{case_item.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {case_item.case_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          case_item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          case_item.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          case_item.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                          case_item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {case_item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(case_item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedCase(case_item);
                            setShowCaseModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => updateCaseStatus(case_item.id, 'under_review')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Case Modal */}
          {showCaseModal && selectedCase && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Case Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <p className="text-sm text-gray-900">{selectedCase.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="text-sm text-gray-900">{selectedCase.user_name}</p>
                      <p className="text-sm text-gray-500">{selectedCase.user_email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900">{selectedCase.case_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedCase.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Files</label>
                      <p className="text-sm text-gray-900">{selectedCase.files.length} files attached</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Update Status</label>
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={() => updateCaseStatus(selectedCase.id, 'under_review')}
                          className="w-full text-left px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          Under Review
                        </button>
                        <button
                          onClick={() => updateCaseStatus(selectedCase.id, 'in_progress')}
                          className="w-full text-left px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => updateCaseStatus(selectedCase.id, 'completed')}
                          className="w-full text-left px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => updateCaseStatus(selectedCase.id, 'rejected')}
                          className="w-full text-left px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Rejected
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowCaseModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVideos = () => {
    const categories = [
      { id: 'all', name: 'All Videos', icon: '🎬' },
      { id: 'divorce', name: 'Divorce Law', icon: '⚖️' },
      { id: 'inheritance', name: 'Inheritance', icon: '🏛️' },
      { id: 'custody', name: 'Child Custody', icon: '👨‍👩‍👧‍👦' },
      { id: 'alimony', name: 'Alimony', icon: '💼' }
    ];

    const filteredVideos = selectedCategory === 'all' 
      ? videos 
      : videos.filter(video => video.category === selectedCategory);

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Legal Education Videos
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn about common family law cases and procedures with our educational content
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {videosLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Video Library Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  We're preparing educational videos about family law topics including divorce procedures, inheritance rights, and custody matters.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Divorce proceedings and procedures</p>
                  <p>• Inheritance law and estate planning</p>
                  <p>• Child custody and support guidelines</p>
                  <p>• Alimony and financial arrangements</p>
                </div>
                <button
                  onClick={() => navigateToPage(isAuthenticated ? 'submit-case' : 'register')}
                  className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                >
                  Submit a Case Instead
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h3>
                    <p className="text-gray-600 mb-4">{video.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{video.duration} minutes</span>
                      <span>{video.views} views</span>
                    </div>
                    <button className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200">
                      Watch Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return renderLogin();
      case 'register':
        return renderRegister();
      case 'submit-case':
        return isAuthenticated ? renderSubmitCase() : renderLogin();
      case 'dashboard':
        return isAuthenticated ? renderDashboard() : renderLogin();
      case 'booking':
        return isAuthenticated ? renderBooking() : renderLogin();
      case 'videos':
        return renderVideos();
      case 'admin':
        return renderAdmin();
      case 'about':
        return renderAbout();
      case 'contact':
        return renderContact();
      case 'privacy':
        return renderPrivacy();
      case 'terms':
        return renderTerms();
      default:
        return renderHome();
    }
  };

  return (
    <div className="App">
      {renderNavigation()}
      <div className="pt-16">
        {renderCurrentPage()}
      </div>
      {renderFooter()}
    </div>
  );
}

export default App;