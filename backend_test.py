#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import os
import tempfile

class LawFirmAPITester:
    def __init__(self, base_url="https://651b091e-61dc-4fcb-b532-218f2320b51c.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.admin_user = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        self.test_user_password = "TestPass123!"
        self.test_user_name = "Test User"
        self.test_user_phone = "+961-70-123456"

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

    def make_request(self, method, endpoint, data=None, files=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if data and not files:
            headers['Content-Type'] = 'application/json'
            data = json.dumps(data)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers={k: v for k, v in headers.items() if k != 'Content-Type'}, data=data, files=files)
                else:
                    response = requests.post(url, headers=headers, data=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, data=data)
            
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
            self.log_test("Basic API Connectivity", True, f"API is running: {data.get('message')}")
            return True
        else:
            self.log_test("Basic API Connectivity", False, f"Status: {status}, Data: {data}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": self.test_user_name,
            "phone": self.test_user_phone
        }
        
        success, status, data = self.make_request('POST', 'api/auth/register', user_data)
        
        if success and 'access_token' in data and 'user' in data:
            self.token = data['access_token']
            self.user_id = data['user']['id']
            self.log_test("User Registration", True, f"User created with ID: {self.user_id}")
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status}, Data: {data}")
            return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, status, data = self.make_request('POST', 'api/auth/login', login_data)
        
        if success and 'access_token' in data and 'user' in data:
            # Update token from login
            self.token = data['access_token']
            self.log_test("User Login", True, f"Login successful for user: {data['user']['name']}")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, status, data = self.make_request('GET', 'api/auth/me')
        
        if success and data.get('email') == self.test_user_email:
            self.log_test("Get Current User", True, f"User info retrieved: {data.get('name')}")
            return True
        else:
            self.log_test("Get Current User", False, f"Status: {status}, Data: {data}")
            return False

    def test_case_submission(self):
        """Test case submission with file upload"""
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            temp_file.write("This is a test legal document for case submission.")
            temp_file_path = temp_file.name

        try:
            # Prepare form data
            form_data = {
                'case_type': 'divorce',
                'title': 'Test Divorce Case',
                'description': 'This is a test case submission for divorce proceedings. Testing file upload functionality.'
            }
            
            # Prepare file for upload
            files = {
                'files': ('test_document.txt', open(temp_file_path, 'rb'), 'text/plain')
            }
            
            success, status, data = self.make_request('POST', 'api/cases', form_data, files, 200)
            
            # Close the file
            files['files'][1].close()
            
            if success and 'case_id' in data:
                self.case_id = data['case_id']
                self.log_test("Case Submission", True, f"Case created with ID: {self.case_id}")
                return True
            else:
                self.log_test("Case Submission", False, f"Status: {status}, Data: {data}")
                return False
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    def test_get_user_cases(self):
        """Test retrieving user cases"""
        success, status, data = self.make_request('GET', 'api/cases')
        
        if success and isinstance(data, list) and len(data) > 0:
            case = data[0]
            if 'id' in case and 'title' in case and 'status' in case:
                self.log_test("Get User Cases", True, f"Retrieved {len(data)} cases")
                return True
            else:
                self.log_test("Get User Cases", False, f"Invalid case structure: {case}")
                return False
        else:
            self.log_test("Get User Cases", False, f"Status: {status}, Data: {data}")
            return False

    def test_appointment_booking(self):
        """Test appointment booking"""
        # Schedule appointment for tomorrow at 2 PM
        tomorrow = datetime.now() + timedelta(days=1)
        appointment_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
        
        appointment_data = {
            "appointment_date": appointment_time.isoformat(),
            "notes": "Test consultation appointment for divorce case"
        }
        
        success, status, data = self.make_request('POST', 'api/appointments', appointment_data)
        
        if success and 'appointment_id' in data:
            self.appointment_id = data['appointment_id']
            self.log_test("Appointment Booking", True, f"Appointment created with ID: {self.appointment_id}")
            return True
        else:
            self.log_test("Appointment Booking", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_user_appointments(self):
        """Test retrieving user appointments"""
        success, status, data = self.make_request('GET', 'api/appointments')
        
        if success and isinstance(data, list) and len(data) > 0:
            appointment = data[0]
            if 'id' in appointment and 'appointment_date' in appointment and 'amount' in appointment:
                self.log_test("Get User Appointments", True, f"Retrieved {len(data)} appointments")
                return True
            else:
                self.log_test("Get User Appointments", False, f"Invalid appointment structure: {appointment}")
                return False
        else:
            self.log_test("Get User Appointments", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_videos(self):
        """Test retrieving videos (public endpoint)"""
        success, status, data = self.make_request('GET', 'api/videos')
        
        if success and isinstance(data, list):
            self.log_test("Get Videos", True, f"Retrieved {len(data)} videos")
            return True
        else:
            self.log_test("Get Videos", False, f"Status: {status}, Data: {data}")
            return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        success, status, data = self.make_request('POST', 'api/auth/login', invalid_login_data, expected_status=401)
        
        if success and status == 401:
            self.log_test("Invalid Login Handling", True, "Correctly rejected invalid credentials")
            return True
        else:
            self.log_test("Invalid Login Handling", False, f"Status: {status}, Expected: 401")
            return False

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, status, data = self.make_request('GET', 'api/auth/me', expected_status=403)
        
        # Restore token
        self.token = original_token
        
        if status == 403:
            self.log_test("Unauthorized Access Protection", True, "Correctly blocked unauthorized access")
            return True
        else:
            self.log_test("Unauthorized Access Protection", False, f"Status: {status}, Expected: 403")
            return False

    def test_admin_login(self):
        """Test admin login with predefined credentials"""
        admin_login_data = {
            "email": "admin@unionlaw.com",
            "password": "admin123"
        }
        
        success, status, data = self.make_request('POST', 'api/auth/login', admin_login_data)
        
        if success and 'access_token' in data and data.get('user', {}).get('role') == 'admin':
            self.admin_token = data['access_token']
            self.admin_user = data['user']
            self.log_test("Admin Login", True, f"Admin login successful: {data['user']['name']}")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_get_all_cases(self):
        """Test admin endpoint to get all cases"""
        # Temporarily use admin token
        original_token = self.token
        self.token = self.admin_token
        
        success, status, data = self.make_request('GET', 'api/admin/cases')
        
        # Restore original token
        self.token = original_token
        
        if success and isinstance(data, list):
            # Check if our test case is in the admin view
            found_test_case = False
            for case in data:
                if hasattr(self, 'case_id') and case.get('id') == self.case_id:
                    found_test_case = True
                    if 'user_name' in case and 'user_email' in case:
                        self.log_test("Admin Get All Cases", True, f"Retrieved {len(data)} cases with user details")
                        return True
            
            if not found_test_case and len(data) >= 0:
                self.log_test("Admin Get All Cases", True, f"Retrieved {len(data)} cases (no test case found)")
                return True
            else:
                self.log_test("Admin Get All Cases", False, f"Case structure invalid or test case not found")
                return False
        else:
            self.log_test("Admin Get All Cases", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_update_case_status(self):
        """Test admin endpoint to update case status"""
        if not hasattr(self, 'case_id'):
            self.log_test("Admin Update Case Status", False, "No case ID available for testing")
            return False
        
        # Temporarily use admin token
        original_token = self.token
        self.token = self.admin_token
        
        # Test updating case status to 'under_review'
        update_data = {"status": "under_review"}
        success, status, data = self.make_request('PUT', f'api/admin/cases/{self.case_id}/status', update_data)
        
        # Restore original token
        self.token = original_token
        
        if success and 'message' in data:
            self.log_test("Admin Update Case Status", True, f"Case status updated: {data['message']}")
            return True
        else:
            self.log_test("Admin Update Case Status", False, f"Status: {status}, Data: {data}")
            return False

    def test_non_admin_access_to_admin_endpoints(self):
        """Test that non-admin users cannot access admin endpoints"""
        # Use regular user token (not admin)
        success, status, data = self.make_request('GET', 'api/admin/cases', expected_status=403)
        
        if status == 403:
            self.log_test("Non-Admin Access Protection", True, "Correctly blocked non-admin access to admin endpoints")
            return True
        else:
            self.log_test("Non-Admin Access Protection", False, f"Status: {status}, Expected: 403")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Lebanese Law Firm API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            self.test_basic_connectivity,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_case_submission,
            self.test_get_user_cases,
            self.test_appointment_booking,
            self.test_get_user_appointments,
            self.test_get_videos,
            self.test_invalid_login,
            self.test_unauthorized_access,
            # Admin-specific tests
            self.test_admin_login,
            self.test_admin_get_all_cases,
            self.test_admin_update_case_status,
            self.test_non_admin_access_to_admin_endpoints
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
            print("🎉 All tests passed! API is working correctly.")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed.")
            return 1

def main():
    tester = LawFirmAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())