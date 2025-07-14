import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import './i18n';

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

  // Language state
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
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
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚖</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Union Law Firm</span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => navigateToPage('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'home' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-700 hover:text-yellow-600'
                }`}
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => navigateToPage('videos')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'videos' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-700 hover:text-yellow-600'
                }`}
              >
                {t('nav.videos')}
              </button>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigateToPage('submit-case')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 'submit-case' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'text-gray-700 hover:text-yellow-600'
                    }`}
                  >
                    {t('nav.submitCase')}
                  </button>
                  <button
                    onClick={() => navigateToPage('booking')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 'booking' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'text-gray-700 hover:text-yellow-600'
                    }`}
                  >
                    {t('nav.booking')}
                  </button>
                  <button
                    onClick={() => navigateToPage('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 'dashboard' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'text-gray-700 hover:text-yellow-600'
                    }`}
                  >
                    {t('nav.dashboard')}
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => navigateToPage('admin')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === 'admin' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'text-gray-700 hover:text-yellow-600'
                      }`}
                    >
                      {t('nav.admin')}
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigateToPage('login')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 'login' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'text-gray-700 hover:text-yellow-600'
                    }`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => navigateToPage('register')}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                  >
                    {t('nav.register')}
                  </button>
                </>
              )}
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600"
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
        </div>
      </div>
    </nav>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1702628771524-25d5174e919b"
            alt="Professional Law Office"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Expert Family Law
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent block">
                Legal Services
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Specialized in divorce, inheritance, custody, and alimony cases. 
              Professional legal counsel with years of experience in Lebanese family law.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentPage(isAuthenticated ? 'submit-case' : 'register')}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105"
              >
                Submit Your Case
              </button>
              <button
                onClick={() => setCurrentPage('videos')}
                className="border-2 border-yellow-400 text-yellow-400 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-400 hover:text-white transition-all duration-200"
              >
                Watch Legal Videos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Legal Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive family law services tailored to your specific needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Divorce Proceedings",
                description: "Complete divorce legal support including asset division and custody arrangements",
                icon: "⚖️",
                image: "https://images.unsplash.com/photo-1600506451234-9e555c0c8d05"
              },
              {
                title: "Inheritance Cases",
                description: "Expert guidance on inheritance law and estate distribution",
                icon: "🏛️",
                image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85"
              },
              {
                title: "Child Custody",
                description: "Protecting your parental rights and child's best interests",
                icon: "👨‍👩‍👧‍👦",
                image: "https://images.unsplash.com/photo-1619418602850-35ad20aa1700"
              },
              {
                title: "Alimony & Support",
                description: "Fair financial support arrangements and modifications",
                icon: "💼",
                image: "https://images.unsplash.com/photo-1600506451234-9e555c0c8d05"
              }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                  <span className="text-6xl">{service.icon}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <button
                    onClick={() => setCurrentPage(isAuthenticated ? 'submit-case' : 'register')}
                    className="text-yellow-600 hover:text-yellow-800 font-medium"
                  >
                    Learn More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
            Schedule a consultation or submit your case today. Our experienced team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage(isAuthenticated ? 'booking' : 'register')}
              className="bg-white text-yellow-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200"
            >
              Book Consultation
            </button>
            <button
              onClick={() => setCurrentPage(isAuthenticated ? 'submit-case' : 'register')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-yellow-600 transition-all duration-200"
            >
              Submit Case
            </button>
          </div>
        </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
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
                  placeholder="Email address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {loginLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('register')}
                className="text-yellow-600 hover:text-yellow-800"
              >
                Don't have an account? Register here
              </button>
            </div>
          </form>
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
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
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
                placeholder="Full Name"
                value={registerFormData.name}
                onChange={(e) => setRegisterFormData({...registerFormData, name: e.target.value})}
              />
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder="Email address"
                value={registerFormData.email}
                onChange={(e) => setRegisterFormData({...registerFormData, email: e.target.value})}
              />
              <input
                type="tel"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder="Phone Number (optional)"
                value={registerFormData.phone}
                onChange={(e) => setRegisterFormData({...registerFormData, phone: e.target.value})}
              />
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder="Password"
                value={registerFormData.password}
                onChange={(e) => setRegisterFormData({...registerFormData, password: e.target.value})}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={registerLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {registerLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="text-yellow-600 hover:text-yellow-800"
              >
                Already have an account? Sign in here
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
              onClick={() => navigateToPage('dashboard')}
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
              onClick={() => navigateToPage('dashboard')}
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
    </div>
  );
}

export default App;