#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class SimpleLawFirmAPITester:
    def __init__(self, base_url="https://651b091e-61dc-4fcb-b532-218f2320b51c.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        self.test_user_password = "TestPass123!"

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details and success:
            print(f"   Details: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200, timeout=10):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if data:
            headers['Content-Type'] = 'application/json'
            data = json.dumps(data)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, headers=headers, data=data, timeout=timeout)
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return success, response.status_code, response_data
            
        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        success, status, data = self.make_request('GET', 'api/')
        expected_message = "Union Law Firm API is running"
        
        if success and data.get('message') == expected_message:
            self.log_test("Basic API Connectivity", True, f"API is running")
            return True
        else:
            self.log_test("Basic API Connectivity", False, f"Status: {status}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": "Test User",
            "phone": "+961-70-123456"
        }
        
        success, status, data = self.make_request('POST', 'api/auth/register', user_data)
        
        if success and 'access_token' in data and 'user' in data:
            self.token = data['access_token']
            self.log_test("User Registration", True, f"User created successfully")
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status}")
            return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, status, data = self.make_request('POST', 'api/auth/login', login_data)
        
        if success and 'access_token' in data and 'user' in data:
            self.token = data['access_token']
            self.log_test("User Login", True, f"Login successful")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}")
            return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, status, data = self.make_request('GET', 'api/auth/me')
        
        if success and data.get('email') == self.test_user_email:
            self.log_test("Get Current User", True, f"User info retrieved")
            return True
        else:
            self.log_test("Get Current User", False, f"Status: {status}")
            return False

    def test_get_videos(self):
        """Test retrieving videos (public endpoint)"""
        success, status, data = self.make_request('GET', 'api/videos')
        
        if success and isinstance(data, list):
            self.log_test("Get Videos", True, f"Retrieved {len(data)} videos")
            return True
        else:
            self.log_test("Get Videos", False, f"Status: {status}")
            return False

    def test_admin_login(self):
        """Test admin login with predefined credentials"""
        admin_login_data = {
            "email": "admin@unionlaw.com",
            "password": "admin123"
        }
        
        success, status, data = self.make_request('POST', 'api/auth/login', admin_login_data)
        
        if success and 'access_token' in data and data.get('user', {}).get('role') == 'admin':
            self.log_test("Admin Login", True, f"Admin login successful")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}")
            return False

    def run_key_tests(self):
        """Run key API tests for multilingual testing"""
        print("🚀 Starting Key Lebanese Law Firm API Tests")
        print("=" * 50)
        
        # Test sequence - only essential tests
        tests = [
            self.test_basic_connectivity,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_get_videos,
            self.test_admin_login
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
            print()  # Add spacing between tests
        
        # Print summary
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All key tests passed! API is working correctly.")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed.")
            return 1

def main():
    tester = SimpleLawFirmAPITester()
    return tester.run_key_tests()

if __name__ == "__main__":
    sys.exit(main())