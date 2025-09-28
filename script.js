// Enhanced Patient Management System - PHP Backend Integration
// Updated to work with PHP API endpoints instead of localStorage

// API Configuration
const API_BASE_URL = '/api';

// Global Data Store (now acts as a cache)
const hospitalData = {
    patients: [],
    appointments: [],
    users: [],
    doctors: [
        { id: 'dr-carter', name: 'Dr. Emily Carter', specialty: 'Cardiology', available: true },
        { id: 'dr-chen', name: 'Dr. Michael Chen', specialty: 'Orthopedics', available: true },
        { id: 'dr-johnson', name: 'Dr. Sarah Johnson', specialty: 'Pediatrics', available: true },
        { id: 'dr-wilson', name: 'Dr. James Wilson', specialty: 'Neurology', available: true },
        { id: 'dr-taylor', name: 'Dr. Lisa Taylor', specialty: 'Dermatology', available: true }
    ],
    departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Surgery', 'Radiology'],
    tracking: []
};

// API Helper Functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const config = { ...defaultOptions, ...options };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Authentication endpoints
    async login(username, password, role = null) {
        return await this.request('/auth.php?action=login', {
            method: 'POST',
            body: { username, password, role }
        });
    },

    async logout() {
        return await this.request('/auth.php?action=logout', {
            method: 'POST'
        });
    },

    async getSession() {
        return await this.request('/auth.php?action=session');
    },

    // Patient endpoints
    async enrollPatient(patientData) {
        return await this.request('/patients.php?action=enroll', {
            method: 'POST',
            body: patientData
        });
    },

    async getPatients() {
        return await this.request('/patients.php?action=list');
    },

    async searchPatients(query) {
        return await this.request(`/patients.php?action=search&q=${encodeURIComponent(query)}`);
    },

    async getPatient(id) {
        return await this.request(`/patients.php?action=get&id=${id}`);
    },

    // Appointment endpoints
    async bookAppointment(appointmentData) {
        return await this.request('/appointments.php?action=book', {
            method: 'POST',
            body: appointmentData
        });
    },

    async getAppointments() {
        return await this.request('/appointments.php?action=list');
    },

    async updateAppointment(appointmentId, status) {
        return await this.request('/appointments.php?action=update', {
            method: 'PUT',
            body: { appointment_id: appointmentId, status }
        });
    },

    async getDoctors() {
        return await this.request('/appointments.php?action=doctors');
    },

    // Tracking endpoints
    async getTrackingStats() {
        return await this.request('/tracking.php?action=stats');
    },

    async getTrackingList() {
        return await this.request('/tracking.php?action=list');
    },

    async searchTracking(query, status = '', location = '') {
        const params = new URLSearchParams({ action: 'search' });
        if (query) params.append('q', query);
        if (status) params.append('status', status);
        if (location) params.append('location', location);
        
        return await this.request(`/tracking.php?${params.toString()}`);
    },

    async checkinPatient(patientId, status = 'checked-in', location = 'Reception') {
        return await this.request('/tracking.php?action=checkin', {
            method: 'POST',
            body: { patient_id: patientId, status, location }
        });
    },

    async updateTracking(patientId, status, location) {
        return await this.request('/tracking.php?action=update', {
            method: 'PUT',
            body: { patient_id: patientId, status, location }
        });
    }
};

// Utility Functions
const utils = {
    async saveData() {
        // Data is now saved via API calls, this is a no-op for compatibility
        console.log('Data saved via API');
    },

    generateId(prefix = 'P') {
        // Patient codes are now generated server-side
        return prefix + String(Date.now()).substr(-4);
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    },

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }
};

// Enhanced Authentication System
const auth = {
    currentUser: null,

    async init() {
        try {
            const response = await api.getSession();
            if (response.authenticated) {
                this.currentUser = response.user;
            } else {
                // Clear user if session is not authenticated
                this.currentUser = null;
            }
        } catch (error) {
            console.error('Session check failed:', error);
            this.currentUser = null;
        }
    },

    async login(username, password, role = null) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.classList.add('loading');
        }

        try {
            const response = await api.login(username, password, role);
            this.currentUser = response.user;
            utils.showToast('Login successful!', 'success');
            return true;
        } catch (error) {
            let errorMsg = 'Invalid username or password';
            if (role) {
                errorMsg += ` or not authorized as ${role}`;
            }
            utils.showToast(errorMsg, 'error');
            return false;
        } finally {
            if (loginBtn) {
                loginBtn.classList.remove('loading');
            }
        }
    },

    async logout() {
        try {
            await api.logout();
            this.currentUser = null;
            utils.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (error) {
            console.error('Logout failed:', error);
            // Force logout on client side even if server call fails
            this.currentUser = null;
            window.location.href = 'login.html';
        }
    },

    requireAuth(role = null) {
        if (!this.currentUser) {
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'login.html' && currentPage !== 'patient-portal.html') {
                sessionStorage.setItem('redirectAfterLogin', currentPage);
            }
            window.location.href = 'login.html';
            return false;
        }
        
        if (role && this.currentUser.role !== role) {
            utils.showToast(`Access denied. ${role} role required.`, 'error');
            setTimeout(() => {
                window.location.href = this.currentUser.role === 'admin' ? 'index.html' : 'patient-portal.html';
            }, 2000);
            return false;
        }
        
        return true;
    },

    updateUI() {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const userNameDisplay = document.getElementById('userNameDisplay');

        if (userInfo && loginBtn) {
            if (this.currentUser) {
                userInfo.style.display = 'flex';
                loginBtn.style.display = 'none';
                if (userNameDisplay) {
                    userNameDisplay.textContent = this.currentUser.name || this.currentUser.username;
                }
            } else {
                userInfo.style.display = 'none';
                loginBtn.style.display = 'flex';
            }
        }

        // Update admin name in welcome section
        const adminNameElement = document.querySelector('.admin-name');
        if (adminNameElement && this.currentUser && this.currentUser.name) {
            adminNameElement.textContent = this.currentUser.name;
        }
    }
};

// Login Functions
async function quickLogin(role, password) {
    const username = role; // demo users have same username as role
    
    try {
        const success = await auth.login(username, password, role);
        if (success) {
            showSuccessModal();
        }
    } catch (error) {
        utils.showToast('Login failed', 'error');
    }
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    
    if (!auth.currentUser) {
        utils.showToast('Login error: User not found', 'error');
        return;
    }
    
    if (auth.currentUser.role === 'admin') {
        successTitle.textContent = 'Admin Login Successful!';
        successMessage.textContent = 'Welcome to Hospital Management System';
    } else {
        successTitle.textContent = 'Patient Login Successful!';
        successMessage.textContent = 'Welcome to Patient Portal';
    }
    
    if (modal) {
        modal.style.display = 'flex';
    }
    
    setTimeout(() => {
        continueToDashboard();
    }, 2000);
}

function continueToDashboard() {
    if (!auth.currentUser) {
        utils.showToast('Cannot redirect: User not logged in', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    let redirectTo;
    
    if (auth.currentUser.role === 'admin') {
        redirectTo = 'index.html';
    } else {
        redirectTo = 'patient-portal.html';
    }
    
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectTo;
}

// Enhanced Patient Management Functions
async function enrollPatient(patientData) {
    try {
        utils.showLoading('enrollmentLoading');
        const response = await api.enrollPatient(patientData);
        utils.showToast(`Patient enrolled successfully! Code: ${response.patient_code}`, 'success');
        return response;
    } catch (error) {
        utils.showToast(`Enrollment failed: ${error.message}`, 'error');
        throw error;
    } finally {
        utils.hideLoading('enrollmentLoading');
    }
}

async function loadPatients() {
    try {
        const response = await api.getPatients();
        hospitalData.patients = response.patients;
        return response.patients;
    } catch (error) {
        utils.showToast(`Failed to load patients: ${error.message}`, 'error');
        return [];
    }
}

async function searchPatients(query) {
    try {
        utils.showLoading('searchLoading');
        const response = await api.searchPatients(query);
        return response.patients;
    } catch (error) {
        utils.showToast(`Search failed: ${error.message}`, 'error');
        return [];
    } finally {
        utils.hideLoading('searchLoading');
    }
}

// Enhanced Appointment Functions
async function bookAppointment(appointmentData) {
    try {
        const response = await api.bookAppointment(appointmentData);
        utils.showToast('Appointment booked successfully!', 'success');
        return response;
    } catch (error) {
        utils.showToast(`Booking failed: ${error.message}`, 'error');
        throw error;
    }
}

async function loadAppointments() {
    try {
        const response = await api.getAppointments();
        hospitalData.appointments = response.appointments;
        return response.appointments;
    } catch (error) {
        utils.showToast(`Failed to load appointments: ${error.message}`, 'error');
        return [];
    }
}

async function loadDoctors() {
    try {
        const response = await api.getDoctors();
        hospitalData.doctors = response.doctors;
        return response.doctors;
    } catch (error) {
        console.error('Failed to load doctors:', error);
        // Fall back to static doctors data
        return hospitalData.doctors;
    }
}

// Enhanced Tracking Functions
async function loadTrackingStats() {
    try {
        const response = await api.getTrackingStats();
        return response.stats;
    } catch (error) {
        utils.showToast(`Failed to load stats: ${error.message}`, 'error');
        return {};
    }
}

async function loadTrackingData() {
    try {
        const response = await api.getTrackingList();
        hospitalData.tracking = response.patients;
        return response.patients;
    } catch (error) {
        utils.showToast(`Failed to load tracking data: ${error.message}`, 'error');
        return [];
    }
}

async function updatePatientTracking(patientId, status, location) {
    try {
        await api.updateTracking(patientId, status, location);
        utils.showToast('Patient status updated', 'success');
    } catch (error) {
        utils.showToast(`Update failed: ${error.message}`, 'error');
        throw error;
    }
}

// Page Initialization Functions
async function initAdminDashboard() {
    if (!auth.currentUser || auth.currentUser.role !== 'admin') {
        utils.showToast('Admin access required', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    console.log('Admin dashboard loaded for:', auth.currentUser.name);
    
    auth.updateUI();
    updateLiveClock();
    updateTodayDate();
    setInterval(updateLiveClock, 1000);
    
    await loadAdminDashboardData();
}

async function loadAdminDashboardData() {
    try {
        // Load dashboard statistics
        const [patients, appointments, stats] = await Promise.all([
            loadPatients(),
            loadAppointments(),
            loadTrackingStats()
        ]);

        updateDashboardStats(patients, appointments, stats);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateDashboardStats(patients, appointments, stats) {
    // Update patient count
    const totalPatientsEl = document.getElementById('totalPatients');
    if (totalPatientsEl) {
        utils.animateValue(totalPatientsEl, 0, patients.length, 1000);
    }

    // Update appointments count
    const todayAppointmentsEl = document.getElementById('todayAppointments');
    if (todayAppointmentsEl) {
        const todayAppts = appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            const today = new Date();
            return aptDate.toDateString() === today.toDateString();
        });
        utils.animateValue(todayAppointmentsEl, 0, todayAppts.length, 1000);
    }

    // Update tracking stats
    const pendingCheckinsEl = document.getElementById('pendingCheckins');
    if (pendingCheckinsEl && stats.waiting) {
        utils.animateValue(pendingCheckinsEl, 0, stats.waiting, 1000);
    }
}

// Clock and Date Functions
function updateLiveClock() {
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        clockElement.textContent = timeString;
    }
}

function updateTodayDate() {
    const dateElements = document.querySelectorAll('.current-date, .today-date');
    const today = new Date().toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dateElements.forEach(el => {
        el.textContent = today;
    });
}

// Navigation and Routing
function navigateTo(page) {
    window.location.href = page;
}

function logout() {
    auth.logout();
}

// Enhanced Initialization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize auth first
        await auth.init();
        
        // Update UI based on auth state
        auth.updateUI();
        
        // Check if user should be redirected from login page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (auth.currentUser && currentPage === 'login.html') {
            console.log('User already logged in, redirecting...');
            
            if (auth.currentUser.role === 'admin') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'patient-portal.html';
            }
            return;
        }
        
        // Page-specific initializations
        if (document.body.classList.contains('login-page')) {
            initLoginPage();
        } else if (document.body.classList.contains('patient-portal')) {
            if (!auth.requireAuth()) return;
            initPatientPortal();
        } else if (document.body.classList.contains('admin-dashboard')) {
            if (!auth.requireAuth('admin')) return;
            await initAdminDashboard();
        } else if (document.body.classList.contains('appointments-page')) {
            if (!auth.requireAuth()) return;
            initAppointmentsPage();
        } else if (document.body.classList.contains('admin-appointments')) {
            if (!auth.requireAuth('admin')) return;
            initAdminAppointments();
        } else if (document.body.classList.contains('enrollment-page')) {
            if (!auth.requireAuth('admin')) return;
            initEnrollmentPage();
        } else if (document.body.classList.contains('tracking-page')) {
            if (!auth.requireAuth('admin')) return;
            initTrackingPage();
        } else if (document.body.classList.contains('search-page')) {
            if (!auth.requireAuth('admin')) return;
            initSearchPage();
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showToast('System error occurred. Please refresh the page.', 'error');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
});

// Login Page Functions
let selectedRole = null;

function selectRole(role) {
    selectedRole = role;
    
    // Remove active from all cards
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add active to selected card
    const selectedCard = document.querySelector(`.role-card[onclick="selectRole('${role}')"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Show login form
    setTimeout(() => {
        showLoginForm(role);
    }, 300);
}

function showLoginForm(role) {
    const roleStep = document.getElementById('roleStep');
    const loginStep = document.getElementById('loginStep');
    const loginTitle = document.getElementById('loginTitle');
    const loginSubtitle = document.getElementById('loginSubtitle');
    
    if (roleStep && loginStep) {
        roleStep.classList.remove('active');
        loginStep.classList.add('active');
        
        if (role === 'admin') {
            loginTitle.textContent = 'Administrator Login';
            loginSubtitle.textContent = 'Access hospital management system';
        } else {
            loginTitle.textContent = 'Patient Login';
            loginSubtitle.textContent = 'Access your patient portal';
        }
    }
}

function goBackToRoleSelection() {
    const roleStep = document.getElementById('roleStep');
    const loginStep = document.getElementById('loginStep');
    
    if (roleStep && loginStep) {
        loginStep.classList.remove('active');
        roleStep.classList.add('active');
    }
    
    selectedRole = null;
}

function showRegistration() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();
    }
}

async function quickLogin(username, password) {
    // Set appropriate role based on username
    if (username === 'admin') {
        selectRole('admin');
    } else {
        selectRole('patient');
    }
    
    // Fill form and submit
    setTimeout(async () => {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        if (usernameField && passwordField) {
            usernameField.value = username;
            passwordField.value = password;
            
            // Trigger login
            await handleLogin({ preventDefault: () => {} });
        }
    }, 500);
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    
    if (!username || !password) {
        utils.showToast('Please enter both username and password', 'error');
        return;
    }
    
    if (!selectedRole) {
        utils.showToast('Please select a role first', 'error');
        return;
    }
    
    try {
        // Show loading state
        if (loginBtn && loginBtnText) {
            loginBtn.classList.add('loading');
            loginBtnText.textContent = 'Signing In...';
        }
        
        const response = await api.login(username, password);
        
        if (response.success) {
            // Verify role matches selection
            if (response.user.role !== selectedRole) {
                throw new Error(`Account role (${response.user.role}) doesn't match selected role (${selectedRole})`);
            }
            
            // Store user session
            auth.currentUser = response.user;
            
            // Show success
            utils.showToast(`Welcome ${response.user.role === 'admin' ? 'Administrator' : response.user.username}!`, 'success');
            
            // Show success modal
            showSuccessModal(response.user.role);
            
            // Redirect after delay
            setTimeout(() => {
                redirectAfterLogin();
            }, 2000);
        }
    } catch (error) {
        utils.showToast(error.message || 'Login failed', 'error');
        console.error('Login error:', error);
    } finally {
        // Reset button state
        if (loginBtn && loginBtnText) {
            loginBtn.classList.remove('loading');
            loginBtnText.textContent = 'Sign In';
        }
    }
}

function showSuccessModal(role) {
    const modal = document.getElementById('successModal');
    const title = document.getElementById('successTitle');
    const message = document.getElementById('successMessage');
    
    if (modal && title && message) {
        title.textContent = role === 'admin' ? 'Admin Login Successful!' : 'Patient Login Successful!';
        message.textContent = role === 'admin' ? 'Redirecting to admin dashboard...' : 'Redirecting to patient portal...';
        modal.style.display = 'flex';
    }
}

function redirectAfterLogin() {
    // Get saved redirect URL or default to appropriate dashboard
    const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
    
    if (auth.currentUser) {
        let redirectUrl;
        
        if (savedRedirect && savedRedirect !== 'login.html') {
            // Use saved redirect if available and not login page
            redirectUrl = savedRedirect;
        } else {
            // Default to role-based redirect
            redirectUrl = auth.currentUser.role === 'admin' ? 'index.html' : 'patient-portal.html';
        }
        
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    }
}

function continueToDashboard() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    redirectAfterLogin();
}

function initLoginPage() {
    console.log('Login page initialized');
    
    // Set up password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    // Set up login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Set up registration form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Registration functionality can be added here
            utils.showToast('Registration functionality coming soon', 'info');
        });
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function initPatientPortal() {
    console.log('Patient portal initialized');
}

function initAppointmentsPage() {
    console.log('Appointments page initialized');
    loadDoctors();
}

function initAdminAppointments() {
    console.log('Admin appointments initialized');
    loadAppointments();
    loadDoctors();
}

function initEnrollmentPage() {
    console.log('Enrollment page initialized');
}

function initTrackingPage() {
    console.log('Tracking page initialized');
    loadTrackingData();
    loadTrackingStats();
}

function initSearchPage() {
    console.log('Search page initialized');
    loadPatients();
}

// Export functions for global access
window.auth = auth;
window.utils = utils;
window.api = api;
window.hospitalData = hospitalData;

// Export login functions for HTML onclick handlers
window.selectRole = selectRole;
window.goBackToRoleSelection = goBackToRoleSelection;
window.showRegistration = showRegistration;
window.closeRegistrationModal = closeRegistrationModal;
window.quickLogin = quickLogin;
window.continueToDashboard = continueToDashboard;