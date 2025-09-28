// Global Data Store
const hospitalData = {
    patients: JSON.parse(localStorage.getItem('patients')) || [],
    appointments: JSON.parse(localStorage.getItem('appointments')) || [],
    users: JSON.parse(localStorage.getItem('users')) || [
        { username: 'patient', password: 'patient123', role: 'patient', name: 'John Patient' },
        { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' }
    ],
    doctors: [
        { id: 'dr-carter', name: 'Dr. Emily Carter', specialty: 'Cardiology', available: true },
        { id: 'dr-chen', name: 'Dr. Michael Chen', specialty: 'Orthopedics', available: true },
        { id: 'dr-johnson', name: 'Dr. Sarah Johnson', specialty: 'Pediatrics', available: true },
        { id: 'dr-wilson', name: 'Dr. James Wilson', specialty: 'Neurology', available: true },
        { id: 'dr-taylor', name: 'Dr. Lisa Taylor', specialty: 'Dermatology', available: true }
    ],
    departments: ['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Surgery', 'Radiology'],
    tracking: JSON.parse(localStorage.getItem('tracking')) || []
};

// Utility Functions
const utils = {
    saveData() {
        localStorage.setItem('patients', JSON.stringify(hospitalData.patients));
        localStorage.setItem('appointments', JSON.stringify(hospitalData.appointments));
        localStorage.setItem('tracking', JSON.stringify(hospitalData.tracking));
        localStorage.setItem('users', JSON.stringify(hospitalData.users));
    },

    generateId(prefix = 'P') {
        return prefix + String(hospitalData.patients.length + 1).padStart(4, '0');
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
    }
};

// Authentication System
// Fixed Authentication System
// Enhanced Authentication System with Proper Admin Redirects
// Role-Based Login System
let selectedRole = null;

// Enhanced Authentication System
// Enhanced Authentication System with Null Checking
const auth = {
    currentUser: null,

    init() {
        // Safely get current user from sessionStorage
        try {
            const storedUser = sessionStorage.getItem('currentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
        } catch (error) {
            console.error('Error loading user from sessionStorage:', error);
            this.currentUser = null;
            sessionStorage.removeItem('currentUser');
        }
    },

    login(username, password, role = null) {
        // Show loading state
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.classList.add('loading');
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const user = hospitalData.users.find(u => 
                    (u.username === username || u.email === username) && 
                    u.password === password &&
                    (!role || u.role === role) // Check role if specified
                );
                
                if (user) {
                    this.currentUser = user;
                    try {
                        sessionStorage.setItem('currentUser', JSON.stringify(user));
                        sessionStorage.setItem(`is${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`, 'true');
                        sessionStorage.setItem('userName', user.name || user.username);
                    } catch (error) {
                        console.error('Error saving to sessionStorage:', error);
                    }
                    
                    utils.showToast('Login successful!', 'success');
                    resolve(true);
                } else {
                    let errorMsg = 'Invalid username or password';
                    if (role) {
                        errorMsg += ` or not authorized as ${role}`;
                    }
                    utils.showToast(errorMsg, 'error');
                    if (loginBtn) {
                        loginBtn.classList.remove('loading');
                    }
                    resolve(false);
                }
            }, 1000);
        });
    },

    // ... rest of auth functions remain the same but add null checks ...

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
            utils.showToast('Access denied.', 'error');
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
    }
};

// Fixed Success Modal Function
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    
    // Add null checking
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
    
    // Auto-redirect after 2 seconds
    setTimeout(() => {
        continueToDashboard();
    }, 2000);
}

// Fixed Continue to Dashboard Function
function continueToDashboard() {
    // Add null checking
    if (!auth.currentUser) {
        utils.showToast('Cannot redirect: User not logged in', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    let redirectTo;
    
    if (auth.currentUser.role === 'admin') {
        redirectTo = 'index.html'; // Admin dashboard
    } else {
        redirectTo = 'patient-portal.html'; // Patient homepage
    }
    
    // Clear any stored redirects
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectTo;
}

// Enhanced Initialization with Proper Error Handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize auth first
        auth.init();
        
        // Update UI based on auth state
        auth.updateUI();
        
        // Check if user should be redirected from login page
        const currentPage = window.location.pathname.split('/').pop();
        
        if (auth.currentUser && currentPage === 'login.html') {
            console.log('User already logged in, redirecting...');
            
            // Use safe role checking
            if (auth.currentUser.role === 'admin') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'patient-portal.html';
            }
            return;
        }
        
        // Page-specific initializations with safe checks
        if (document.body.classList.contains('login-page')) {
            initLoginPage();
        } else if (document.body.classList.contains('patient-portal')) {
            if (!auth.requireAuth()) return;
            initPatientPortal();
        } else if (document.body.classList.contains('admin-dashboard')) {
            if (!auth.requireAuth('admin')) return;
            initAdminDashboard();
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
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showToast('System error occurred. Please refresh the page.', 'error');
        
        // Clear potentially corrupted session data
        sessionStorage.clear();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
});

// Fixed Admin Dashboard with Safe Checks
function initAdminDashboard() {
    // Safe role checking
    if (!auth.currentUser || auth.currentUser.role !== 'admin') {
        utils.showToast('Admin access required', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    console.log('Admin dashboard loaded for:', auth.currentUser.name);
    
    // Update welcome message with admin name
    const adminNameElement = document.querySelector('.admin-name');
    if (adminNameElement && auth.currentUser.name) {
        adminNameElement.textContent = auth.currentUser.name;
    }
    
    updateLiveClock();
    updateTodayDate();
    setInterval(updateLiveClock, 1000);
    
    // Load admin-specific data
    loadAdminDashboardData();
}

// Add this utility function for safe role checking
function getCurrentUserRole() {
    return auth.currentUser ? auth.currentUser.role : null;
}

// Enhanced requireAuth with better error handling
auth.requireAuth = function(role = null) {
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
};

// Clear any corrupted data on load
function clearCorruptedData() {
    try {
        // Test if sessionStorage is working
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
    } catch (error) {
        console.error('sessionStorage error, clearing data:', error);
        sessionStorage.clear();
    }
}

// Call this at the very beginning
clearCorruptedData();

// Role Selection Functions
function selectRole(role) {
    selectedRole = role;
    
    // Update UI for selected role
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Show login form for selected role
    showLoginForm(role);
}

function showLoginForm(role) {
    document.getElementById('roleStep').classList.remove('active');
    document.getElementById('loginStep').classList.add('active');
    
    // Update login form for role
    const loginTitle = document.getElementById('loginTitle');
    const loginSubtitle = document.getElementById('loginSubtitle');
    const loginBtnText = document.getElementById('loginBtnText');
    
    if (role === 'admin') {
        loginTitle.textContent = 'Admin Login';
        loginSubtitle.textContent = 'Sign in to hospital management system';
        loginBtnText.textContent = 'Sign In as Admin';
    } else {
        loginTitle.textContent = 'Patient Login';
        loginSubtitle.textContent = 'Sign in to your patient portal';
        loginBtnText.textContent = 'Sign In as Patient';
    }
}

function goBackToRoleSelection() {
    document.getElementById('loginStep').classList.remove('active');
    document.getElementById('roleStep').classList.add('active');
    selectedRole = null;
    
    // Clear form
    document.getElementById('loginForm').reset();
}

// Quick Login for Demo
function quickLogin(username, password) {
    const role = username === 'admin' ? 'admin' : 'patient';
    selectRole(role);
    
    // Auto-fill credentials
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    
    // Auto-submit after a delay
    setTimeout(() => {
        handleLogin();
    }, 500);
}

// Enhanced Login Handler
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        utils.showToast('Please enter both username and password', 'error');
        return;
    }
    
    if (!selectedRole) {
        utils.showToast('Please select a role first', 'error');
        return;
    }
    
    const success = await auth.login(username, password, selectedRole);
    
    if (success) {
        // Show success modal
        showSuccessModal();
    }
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    
    if (auth.currentUser.role === 'admin') {
        successTitle.textContent = 'Admin Login Successful!';
        successMessage.textContent = 'Welcome to Hospital Management System';
    } else {
        successTitle.textContent = 'Patient Login Successful!';
        successMessage.textContent = 'Welcome to Patient Portal';
    }
    
    modal.style.display = 'flex';
    
    // Auto-redirect after 2 seconds
    setTimeout(() => {
        continueToDashboard();
    }, 2000);
}

function continueToDashboard() {
    let redirectTo;
    
    if (auth.currentUser.role === 'admin') {
        redirectTo = 'index.html'; // Admin dashboard
    } else {
        redirectTo = 'patient-portal.html'; // Patient homepage
    }
    
    // Clear any stored redirects
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectTo;
}

// Registration Functions
function showRegistration() {
    const modal = document.getElementById('registrationModal');
    modal.style.display = 'flex';
}

function closeRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    modal.style.display = 'none';
    document.getElementById('registrationForm').reset();
}

function handleRegistration() {
    const formData = {
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        dateOfBirth: document.getElementById('regDateOfBirth').value,
        password: document.getElementById('regPassword').value,
        username: document.getElementById('regEmail').value // Use email as username
    };
    
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const consent = document.getElementById('regConsent').checked;
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone || !formData.dateOfBirth) {
        utils.showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (formData.password !== confirmPassword) {
        utils.showToast('Passwords do not match', 'error');
        return;
    }
    
    if (formData.password.length < 6) {
        utils.showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (!consent) {
        utils.showToast('Please agree to the terms and conditions', 'error');
        return;
    }
    
    // Register user
    const success = auth.register(formData);
    
    if (success) {
        closeRegistrationModal();
    }
}

// Enhanced Initialization
function initLoginPage() {
    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }
    
    // Registration form submission
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistration();
        });
    }
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// Initialize demo accounts
hospitalData.users = JSON.parse(localStorage.getItem('users')) || [
    { 
        id: 'U1', 
        username: 'patient', 
        password: 'patient123', 
        role: 'patient', 
        name: 'John Patient',
        email: 'patient@demo.com',
        phone: '0400 000 001',
        dateOfBirth: '1985-05-15'
    },
    { 
        id: 'U2', 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin', 
        name: 'Admin User',
        email: 'admin@demo.com',
        phone: '0400 000 002'
    }
];
utils.saveData();

// Fixed Login Handler with Proper Admin Redirect
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        utils.showToast('Please enter both username and password', 'error');
        return;
    }
    
    const success = await auth.login(username, password);
    
    if (success) {
        // Redirect based on role - ADMIN goes to index.html, PATIENT goes to patient-portal.html
        setTimeout(() => {
            let redirectTo;
            
            if (auth.currentUser.role === 'admin') {
                redirectTo = 'index.html'; // Admin dashboard
            } else {
                redirectTo = 'patient-portal.html'; // Patient homepage
            }
            
            console.log('Redirecting to:', redirectTo, 'for role:', auth.currentUser.role);
            
            // Clear any stored redirects to ensure we go to correct homepage
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectTo;
        }, 1500);
    }
}

// Enhanced Initialization with Admin Dashboard Check
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize auth UI
        auth.updateUI();
        
        // Check if user should be redirected from login page
        if (auth.currentUser && window.location.pathname.includes('login.html')) {
            console.log('User already logged in, redirecting from login page...');
            
            // Immediately redirect based on role
            if (auth.currentUser.role === 'admin') {
                window.location.href = 'index.html'; // Admin dashboard
            } else {
                window.location.href = 'patient-portal.html'; // Patient homepage
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
            initAdminDashboard();
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
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showToast('System error occurred. Please refresh the page.', 'error');
    }
});

// Enhanced Admin Dashboard with Logged-in State
function initAdminDashboard() {
    if (!auth.requireAuth('admin')) return;
    
    console.log('Admin dashboard loaded for:', auth.currentUser.name);
    
    // Update welcome message with admin name
    const adminNameElement = document.querySelector('.admin-name');
    if (adminNameElement && auth.currentUser.name) {
        adminNameElement.textContent = auth.currentUser.name;
    }
    
    updateLiveClock();
    updateTodayDate();
    setInterval(updateLiveClock, 1000);
    
    // Load admin-specific data
    loadAdminDashboardData();
    
    // Animate stats cards
    const stats = ['totalPatients', 'todayAppointments', 'pendingCheckins', 'systemUptime'];
    stats.forEach((stat, index) => {
        setTimeout(() => {
            const element = document.getElementById(stat);
            if (element) {
                element.style.transform = 'scale(1.1)';
                setTimeout(() => element.style.transform = 'scale(1)', 300);
            }
        }, index * 200);
    });
}

function loadAdminDashboardData() {
    // Update patient count
    const totalPatients = document.getElementById('totalPatients');
    if (totalPatients) {
        totalPatients.textContent = hospitalData.patients.length;
        utils.animateValue(totalPatients, 0, hospitalData.patients.length, 1000);
    }
    
    // Update today's appointments
    const todayAppointments = document.getElementById('todayAppointments');
    if (todayAppointments) {
        const today = new Date().toISOString().split('T')[0];
        const todayApps = appointmentSystem.getAppointments({ date: today });
        todayAppointments.textContent = todayApps.length;
        utils.animateValue(todayAppointments, 0, todayApps.length, 1000);
    }
    
    // Update pending check-ins
    const pendingCheckins = document.getElementById('pendingCheckins');
    if (pendingCheckins) {
        const pending = trackingSystem.getCurrentPatients().filter(p => p.status === 'waiting').length;
        pendingCheckins.textContent = pending;
        utils.animateValue(pendingCheckins, 0, pending, 1000);
    }
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    // Get recent appointments and enrollments
    const recentAppointments = hospitalData.appointments
        .sort((a, b) => new Date(b.bookedDate) - new Date(a.bookedDate))
        .slice(0, 5);
    
    const recentEnrollments = hospitalData.patients
        .sort((a, b) => new Date(b.enrolledDate) - new Date(a.enrolledDate))
        .slice(0, 3);
    
    activityList.innerHTML = '';
    
    // Add enrollment activities
    recentEnrollments.forEach(patient => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item success';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="activity-content">
                <p><strong>${patient.firstName} ${patient.lastName}</strong> enrolled as new patient</p>
                <span>${utils.formatDate(patient.enrolledDate)} • Patient ID: ${patient.id}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
    
    // Add appointment activities
    recentAppointments.forEach(appointment => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item info';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-calendar-check"></i>
            </div>
            <div class="activity-content">
                <p>New appointment booked for <strong>${appointment.patientName}</strong></p>
                <span>${utils.formatDate(appointment.bookedDate)} • ${appointment.doctorName}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Enhanced Navigation with Admin Access
function navigateTo(page) {
    // Check if user has access to the page
    if (page.includes('admin') && auth.currentUser.role !== 'admin') {
        utils.showToast('Access denied. Admin privileges required.', 'error');
        return;
    }
    
    window.location.href = page;
}

// Demo Accounts with Clear Roles
hospitalData.users = JSON.parse(localStorage.getItem('users')) || [
    { 
        id: 'U1', 
        username: 'patient', 
        password: 'patient123', 
        role: 'patient', 
        name: 'John Patient',
        email: 'patient@demo.com',
        phone: '0400 000 001'
    },
    { 
        id: 'U2', 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin', 
        name: 'Admin User',
        email: 'admin@demo.com',
        phone: '0400 000 002'
    }
];
utils.saveData();

// Fixed Login Page Functions
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const demoButtons = document.querySelectorAll('.demo-btn');
    
    // Password visibility toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }
    
    // Demo account buttons
    demoButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const username = this.getAttribute('data-username');
            const password = this.getAttribute('data-password');
            
            document.getElementById('username').value = username;
            document.getElementById('password').value = password;
            
            await handleLogin();
        });
    });
    
    // Initialize registration modal
    const registerLink = document.querySelector('.register-link');
    const registrationModal = document.getElementById('registrationModal');
    const registrationForm = document.getElementById('registrationForm');
    
    if (registerLink && registrationModal) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            registrationModal.style.display = 'flex';
        });
    }
    
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistration();
        });
    }
    
    // Close modals
    const closeButtons = document.querySelectorAll('.modal-close');
    const modals = document.querySelectorAll('.modal');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Forgot password modal
    const forgotLink = document.querySelector('.forgot-link');
    const forgotModal = document.getElementById('forgotModal');
    
    if (forgotLink && forgotModal) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotModal.style.display = 'flex';
        });
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        utils.showToast('Please enter both username and password', 'error');
        return;
    }
    
    const success = await auth.login(username, password);
    
    if (success) {
        // Redirect based on role and intended destination
        setTimeout(() => {
            const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 
                              (auth.currentUser.role === 'admin' ? 'index.html' : 'patient-portal.html');
            
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectTo;
        }, 1000);
    }
}

function handleRegistration() {
    const formData = {
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        username: document.getElementById('regEmail').value, // Use email as username
        password: document.getElementById('regPassword').value
    };
    
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const consent = document.getElementById('regConsent').checked;
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        utils.showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (formData.password !== confirmPassword) {
        utils.showToast('Passwords do not match', 'error');
        return;
    }
    
    if (formData.password.length < 6) {
        utils.showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (!consent) {
        utils.showToast('Please agree to the terms and conditions', 'error');
        return;
    }
    
    // Register user
    const success = auth.register(formData);
    
    if (success) {
        // Close modal and clear form
        document.getElementById('registrationModal').style.display = 'none';
        document.getElementById('registrationForm').reset();
    }
}

// Enhanced initialization with better error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize auth UI
        auth.updateUI();
        
        // Check if user should be redirected
        if (auth.currentUser) {
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'login.html') {
                // Already logged in, redirect to appropriate page
                const redirectTo = auth.currentUser.role === 'admin' ? 'index.html' : 'patient-portal.html';
                window.location.href = redirectTo;
                return;
            }
        }
        
        // Page-specific initializations
        if (document.body.classList.contains('login-page')) {
            initLoginPage();
        } else if (document.body.classList.contains('patient-portal')) {
            if (!auth.requireAuth()) return;
            initPatientPortal();
        } else if (document.body.classList.contains('admin-dashboard')) {
            if (!auth.requireAuth('admin')) return;
            initAdminDashboard();
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
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showToast('System error occurred. Please refresh the page.', 'error');
    }
});

// Enhanced logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
    }
}

// Add this to your hospitalData initialization to ensure demo accounts exist:
hospitalData.users = JSON.parse(localStorage.getItem('users')) || [
    { 
        id: 'U1', 
        username: 'patient', 
        password: 'patient123', 
        role: 'patient', 
        name: 'John Patient',
        email: 'patient@demo.com',
        phone: '0400 000 001'
    },
    { 
        id: 'U2', 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin', 
        name: 'Admin User',
        email: 'admin@demo.com',
        phone: '0400 000 002'
    }
];
utils.saveData(); // Save initial users

// Patient Management System
const patientManager = {
    enrollPatient(patientData) {
        const patientId = utils.generateId();
        const patient = {
            id: patientId,
            ...patientData,
            enrolledDate: new Date().toISOString(),
            status: 'active'
        };
        
        hospitalData.patients.push(patient);
        utils.saveData();
        
        // Add to tracking system
        trackingSystem.addToTracking(patientId, 'checked-in');
        
        return patientId;
    },

    getPatient(patientId) {
        return hospitalData.patients.find(p => p.id === patientId);
    },

    searchPatients(query) {
        return hospitalData.patients.filter(patient =>
            patient.firstName?.toLowerCase().includes(query.toLowerCase()) ||
            patient.lastName?.toLowerCase().includes(query.toLowerCase()) ||
            patient.id?.toLowerCase().includes(query.toLowerCase())
        );
    },

    updatePatient(patientId, updates) {
        const index = hospitalData.patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            hospitalData.patients[index] = { ...hospitalData.patients[index], ...updates };
            utils.saveData();
            return true;
        }
        return false;
    }
};

// Appointment System
const appointmentSystem = {
    bookAppointment(appointmentData) {
        const appointmentId = 'A' + Date.now();
        const appointment = {
            id: appointmentId,
            ...appointmentData,
            status: 'scheduled',
            bookedDate: new Date().toISOString(),
            patientName: `${appointmentData.firstName} ${appointmentData.lastName}`
        };
        
        hospitalData.appointments.push(appointment);
        utils.saveData();
        
        // Add to tracking system
        trackingSystem.addToTracking(appointmentData.patientId || appointmentData.email, 'scheduled');
        
        return appointmentId;
    },

    getAppointments(filters = {}) {
        let appointments = hospitalData.appointments;
        
        if (filters.status) {
            appointments = appointments.filter(a => a.status === filters.status);
        }
        
        if (filters.doctor) {
            appointments = appointments.filter(a => a.doctorId === filters.doctor);
        }
        
        if (filters.date) {
            appointments = appointments.filter(a => a.date === filters.date);
        }
        
        if (filters.patientId) {
            appointments = appointments.filter(a => a.patientId === filters.patientId);
        }
        
        return appointments;
    },

    updateAppointment(appointmentId, updates) {
        const index = hospitalData.appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
            hospitalData.appointments[index] = { ...hospitalData.appointments[index], ...updates };
            utils.saveData();
            
            // Update tracking if status changed
            if (updates.status) {
                trackingSystem.updateStatus(hospitalData.appointments[index].patientId, updates.status);
            }
            
            return true;
        }
        return false;
    },

    cancelAppointment(appointmentId) {
        return this.updateAppointment(appointmentId, { status: 'cancelled' });
    },

    getAvailableSlots(doctorId, date) {
        // Mock available slots - in real system, this would check against existing appointments
        const baseSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'];
        const bookedAppointments = this.getAppointments({
            doctor: doctorId,
            date: date
        }).filter(a => a.status !== 'cancelled');
        
        const bookedTimes = bookedAppointments.map(a => a.time);
        return baseSlots.filter(slot => !bookedTimes.includes(slot));
    }
};

// Tracking System
const trackingSystem = {
    addToTracking(patientIdentifier, status) {
        const trackingEntry = {
            id: 'T' + Date.now(),
            patientIdentifier,
            status,
            timestamp: new Date().toISOString(),
            department: 'general'
        };
        
        hospitalData.tracking.push(trackingEntry);
        utils.saveData();
        return trackingEntry.id;
    },

    updateStatus(patientIdentifier, newStatus) {
        const existing = hospitalData.tracking.find(t => 
            t.patientIdentifier === patientIdentifier && !t.endTime
        );
        
        if (existing) {
            existing.status = newStatus;
            existing.lastUpdate = new Date().toISOString();
        } else {
            this.addToTracking(patientIdentifier, newStatus);
        }
        
        utils.saveData();
    },

    getCurrentPatients() {
        const recentEntries = {};
        
        hospitalData.tracking.forEach(entry => {
            if (!recentEntries[entry.patientIdentifier] || 
                new Date(entry.timestamp) > new Date(recentEntries[entry.patientIdentifier].timestamp)) {
                recentEntries[entry.patientIdentifier] = entry;
            }
        });
        
        return Object.values(recentEntries).filter(entry => 
            !['discharged', 'cancelled'].includes(entry.status)
        );
    },

    getPatientHistory(patientIdentifier) {
        return hospitalData.tracking
            .filter(entry => entry.patientIdentifier === patientIdentifier)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
};

// Login Page Functionality
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const demoButtons = document.querySelectorAll('.demo-btn');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    demoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            const password = this.getAttribute('data-password');
            
            document.getElementById('username').value = username;
            document.getElementById('password').value = password;
            
            handleLogin();
        });
    });
    
    // Initialize registration modal
    const registerLink = document.querySelector('.register-link');
    const registrationModal = document.getElementById('registrationModal');
    
    if (registerLink && registrationModal) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            registrationModal.style.display = 'flex';
        });
    }
    
    // Close modals
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!username || !password) {
        utils.showToast('Please enter both username and password', 'error');
        return;
    }
    
    // Show loading state
    loginBtn.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        if (auth.login(username, password)) {
            utils.showToast('Login successful!', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (auth.currentUser.role === 'admin') {
                    window.location.href = 'index.html';
                } else {
                    const redirect = sessionStorage.getItem('redirectAfterLogin') || 'patient-portal.html';
                    window.location.href = redirect;
                }
            }, 1000);
        } else {
            utils.showToast('Invalid username or password', 'error');
            loginBtn.classList.remove('loading');
        }
    }, 1500);
}

// Appointment Booking Wizard
let currentStep = 1;
let appointmentData = {};

function nextStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
    
    currentStep = step;
    
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
    
    updateAppointmentData();
}

function prevStep(step) {
    nextStep(step);
}

function updateAppointmentData() {
    // Collect data from current step
    if (currentStep === 1) {
        appointmentData.firstName = document.getElementById('firstName')?.value;
        appointmentData.lastName = document.getElementById('lastName')?.value;
        appointmentData.dob = document.getElementById('dob')?.value;
        appointmentData.phone = document.getElementById('phone')?.value;
        appointmentData.email = document.getElementById('email')?.value;
    }
}

function confirmAppointment() {
    const reason = document.getElementById('appointmentReason').value;
    const consent = document.getElementById('consentAgreement').checked;
    
    if (!reason || !consent) {
        utils.showToast('Please fill all required fields', 'error');
        return;
    }
    
    appointmentData.reason = reason;
    
    // Book the appointment
    const appointmentId = appointmentSystem.bookAppointment(appointmentData);
    
    // Show success modal
    const modal = document.getElementById('successModal');
    const details = document.getElementById('appointmentDetails');
    
    if (details) {
        details.innerHTML = `
            <p><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Patient:</strong> ${appointmentData.firstName} ${appointmentData.lastName}</p>
            <p><strong>Doctor:</strong> ${appointmentData.doctorName}</p>
            <p><strong>Date:</strong> ${appointmentData.date} at ${appointmentData.time}</p>
        `;
    }
    
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Initialize functions for different pages
function initPatientPortal() {
    // Animate stats counters
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        utils.animateValue(counter, 0, target, 2000);
    });
    
    // Initialize doctors section
    initializeDoctorsSection();
    
    // Smooth scrolling
    setupSmoothScrolling();
}

function initializeDoctorsSection() {
    const grid = document.getElementById('doctorsGrid');
    if (!grid) return;
    
    const doctors = [
        {
            name: "Dr. Emily Carter",
            specialty: "Cardiologist",
            experience: "15+ years",
            education: "MBBS, MD (Cardiology)",
            description: "Specializes in heart diseases and cardiovascular treatments. Expert in angioplasty and cardiac rehabilitation."
        },
        {
            name: "Dr. Michael Chen",
            specialty: "Orthopedic Surgeon", 
            experience: "12+ years",
            education: "MBBS, MS (Orthopedics)",
            description: "Specialist in joint replacement and sports injuries. Performs minimally invasive surgeries."
        },
        {
            name: "Dr. Sarah Johnson",
            specialty: "Pediatrician",
            experience: "10+ years", 
            education: "MBBS, DCH",
            description: "Expert in child healthcare, vaccinations, and developmental disorders. Gentle and caring approach."
        }
    ];
    
    grid.innerHTML = doctors.map(doctor => `
        <div class="doctor-card fade-in-up">
            <div class="doctor-avatar">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="doctor-info">
                <h3>${doctor.name}</h3>
                <p class="specialty">${doctor.specialty}</p>
                <p class="experience">${doctor.experience} experience</p>
                <p class="description">${doctor.description}</p>
            </div>
            <button class="btn btn-primary" onclick="handleBookAppointment('${doctor.specialty}')">
                Book Consultation
            </button>
        </div>
    `).join('');
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function handleBookAppointment(service = null) {
    if (!auth.currentUser) {
        if (confirm('To book an appointment, you need to login to your patient account. Would you like to login now?')) {
            if (service) {
                sessionStorage.setItem('selectedService', service);
            }
            sessionStorage.setItem('redirectAfterLogin', 'appointments.html');
            window.location.href = 'login.html';
        }
        return;
    }
    
    if (service) {
        sessionStorage.setItem('selectedService', service);
    }
    window.location.href = 'appointments.html';
}

// Admin Dashboard Functions
function initAdminDashboard() {
    if (!auth.requireAuth('admin')) return;
    
    updateLiveClock();
    updateTodayDate();
    setInterval(updateLiveClock, 1000);
    
    // Animate stats cards
    const stats = ['totalPatients', 'todayAppointments', 'pendingCheckins', 'systemUptime'];
    stats.forEach((stat, index) => {
        setTimeout(() => {
            const element = document.getElementById(stat);
            if (element) {
                element.style.transform = 'scale(1.1)';
                setTimeout(() => element.style.transform = 'scale(1)', 300);
            }
        }, index * 200);
    });
    
    // Load dashboard data
    loadDashboardData();
}

function updateLiveClock() {
    const clock = document.getElementById('liveClock');
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleDateString('en-AU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

function updateTodayDate() {
    const dateElement = document.getElementById('todayDate');
    if (dateElement) {
        dateElement.textContent = utils.formatDate(new Date());
    }
}

function loadDashboardData() {
    // Update patient count
    const totalPatients = document.getElementById('totalPatients');
    if (totalPatients) {
        totalPatients.textContent = hospitalData.patients.length;
    }
    
    // Update today's appointments
    const todayAppointments = document.getElementById('todayAppointments');
    if (todayAppointments) {
        const today = new Date().toISOString().split('T')[0];
        const todayApps = appointmentSystem.getAppointments({ date: today });
        todayAppointments.textContent = todayApps.length;
    }
}

// Initialize page based on current page
document.addEventListener('DOMContentLoaded', function() {
    auth.updateUI();
    
    // Page-specific initializations
    if (document.body.classList.contains('login-page')) {
        initLoginPage();
    } else if (document.body.classList.contains('patient-portal')) {
        initPatientPortal();
    } else if (document.body.classList.contains('admin-dashboard')) {
        initAdminDashboard();
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
    }
});

// Global logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
    }
}

// Navigation function
function navigateTo(page) {
    window.location.href = page;
}

// Emergency functions
function triggerEmergency(type) {
    const messages = {
        lockdown: 'Emergency lockdown protocol activated. All systems secured.',
        evacuation: 'Evacuation protocol initiated. Follow emergency procedures.',
        contacts: 'Displaying emergency contact list...'
    };
    alert(`🚨 ${messages[type]}`);
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
});// Additional JavaScript for All Pages

// Initialize Appointments Page
function initAppointmentsPage() {
    if (!auth.requireAuth()) return;
    
    // Load doctors for selection
    loadDoctorsForSelection();
    
    // Initialize calendar
    initializeCalendar();
    
    // Load user appointments
    loadUserAppointments();
}

// Initialize Admin Appointments
function initAdminAppointments() {
    if (!auth.requireAuth('admin')) return;
    
    // Load appointments table
    loadAppointmentsTable();
    
    // Load today's appointments
    loadTodaysAppointments();
    
    // Initialize quick appointment form
    initQuickAppointmentForm();
}

// Initialize Enrollment Page
function initEnrollmentPage() {
    if (!auth.requireAuth('admin')) return;
    
    // Initialize enrollment form
    initEnrollmentForm();
    
    // Load recent enrollments
    loadRecentEnrollments();
}

// Initialize Tracking Page
function initTrackingPage() {
    if (!auth.requireAuth('admin')) return;
    
    // Load tracking data
    loadTrackingData();
    
    // Initialize hospital map
    initializeHospitalMap();
    
    // Load recent activity
    loadRecentActivity();
}

// Wizard Navigation Functions
function nextStep(step) {
    if (!validateCurrentStep()) return;
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    
    currentStep = step;
    
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
    
    updateStepData();
}

function prevStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    
    currentStep = step;
    
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
}

function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            return validatePatientInfo();
        case 2:
            return validateDoctorSelection();
        case 3:
            return validateTimeSelection();
        case 4:
            return validateConfirmation();
        default:
            return true;
    }
}

function validatePatientInfo() {
    const required = ['firstName', 'lastName', 'dob', 'phone', 'email'];
    for (let field of required) {
        const element = document.getElementById(field);
        if (!element || !element.value) {
            utils.showToast(`Please fill in ${field}`, 'error');
            element?.focus();
            return false;
        }
    }
    return true;
}

function updateStepData() {
    // Update appointment data based on current step
    switch(currentStep) {
        case 1:
            updatePatientInfo();
            break;
        case 2:
            updateDoctorSelection();
            break;
        case 3:
            updateTimeSelection();
            break;
        case 4:
            updateConfirmationSummary();
            break;
    }
}

function updatePatientInfo() {
    appointmentData.firstName = document.getElementById('firstName')?.value;
    appointmentData.lastName = document.getElementById('lastName')?.value;
    appointmentData.dob = document.getElementById('dob')?.value;
    appointmentData.phone = document.getElementById('phone')?.value;
    appointmentData.email = document.getElementById('email')?.value;
}

// Calendar Functions
function initializeCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    const today = new Date();
    const currentMonth = document.getElementById('currentMonth');
    
    renderCalendar(today.getFullYear(), today.getMonth());
}

function renderCalendar(year, month) {
    const calendar = document.getElementById('calendar');
    const currentMonth = document.getElementById('currentMonth');
    
    if (!calendar || !currentMonth) return;
    
    const date = new Date(year, month, 1);
    currentMonth.textContent = date.toLocaleDateString('en-AU', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    calendar.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    // Add empty cells for days before the first day of month
    const firstDay = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'calendar-day empty';
        calendar.appendChild(emptyElement);
    }
    
    // Add days of the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.setAttribute('data-date', `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        
        const cellDate = new Date(year, month, day);
        if (cellDate < today) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(dayElement));
        }
        
        calendar.appendChild(dayElement);
    }
}

function changeMonth(direction) {
    const currentMonth = document.getElementById('currentMonth');
    if (!currentMonth) return;
    
    const currentDate = new Date(currentMonth.textContent + ' 1, 2000');
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    
    renderCalendar(newDate.getFullYear(), newDate.getMonth());
}

function selectDate(element) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked element
    element.classList.add('selected');
    
    // Update appointment data
    appointmentData.date = element.getAttribute('data-date');
    
    // Load available time slots
    loadTimeSlots(appointmentData.doctorId, appointmentData.date);
}

// Doctor Selection Functions
function loadDoctorsForSelection() {
    const doctorsGrid = document.getElementById('doctorsGrid');
    if (!doctorsGrid) return;
    
    doctorsGrid.innerHTML = hospitalData.doctors.map(doctor => `
        <div class="doctor-card" onclick="selectDoctor('${doctor.id}')">
            <div class="doctor-avatar">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="doctor-info">
                <h3>${doctor.name}</h3>
                <p class="specialty">${doctor.specialty}</p>
                <p class="availability">${doctor.available ? 'Available Today' : 'Not Available'}</p>
            </div>
            <div class="doctor-actions">
                <button class="btn btn-primary" onclick="selectDoctor('${doctor.id}')">
                    Select Doctor
                </button>
            </div>
        </div>
    `).join('');
}

function selectDoctor(doctorId) {
    const doctor = hospitalData.doctors.find(d => d.id === doctorId);
    if (!doctor) return;
    
    appointmentData.doctorId = doctorId;
    appointmentData.doctorName = doctor.name;
    appointmentData.specialty = doctor.specialty;
    
    // Enable next button
    const nextButton = document.getElementById('nextToTime');
    if (nextButton) {
        nextButton.disabled = false;
    }
    
    // Update selected doctor info
    const selectedDoctorInfo = document.getElementById('selectedDoctorInfo');
    if (selectedDoctorInfo) {
        selectedDoctorInfo.innerHTML = `
            <div class="selected-doctor-card">
                <h4>Selected Doctor</h4>
                <p><strong>${doctor.name}</strong> - ${doctor.specialty}</p>
            </div>
        `;
    }
}

// Time Slot Functions
function loadTimeSlots(doctorId, date) {
    const timeSlots = document.getElementById('timeSlots');
    if (!timeSlots) return;
    
    const availableSlots = appointmentSystem.getAvailableSlots(doctorId, date);
    
    timeSlots.innerHTML = availableSlots.map(slot => `
        <div class="time-slot" onclick="selectTimeSlot(this, '${slot}')">
            ${utils.formatTime(slot)}
        </div>
    `).join('');
    
    // Enable next button
    const nextButton = document.getElementById('nextToConfirm');
    if (nextButton) {
        nextButton.disabled = false;
    }
}

function selectTimeSlot(element, time) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked element
    element.classList.add('selected');
    
    // Update appointment data
    appointmentData.time = time;
}

// Enrollment Functions
function initEnrollmentForm() {
    // Set up date of birth and age calculation
    const dobInput = document.getElementById('dateOfBirth');
    const ageInput = document.getElementById('age');
    
    if (dobInput && ageInput) {
        dobInput.addEventListener('change', function() {
            const dob = new Date(this.value);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            ageInput.value = age;
        });
    }
}

function submitEnrollment() {
    const formData = collectEnrollmentData();
    
    if (!validateEnrollmentData(formData)) {
        return;
    }
    
    const patientId = patientManager.enrollPatient(formData);
    
    // Show success modal
    showEnrollmentSuccess(patientId, formData);
}

function collectEnrollmentData() {
    return {
        firstName: document.getElementById('firstName')?.value,
        lastName: document.getElementById('lastName')?.value,
        dateOfBirth: document.getElementById('dateOfBirth')?.value,
        // ... collect all other form fields
    };
}

function showEnrollmentSuccess(patientId, patientData) {
    const modal = document.getElementById('successModal');
    const patientIdElement = document.getElementById('generatedPatientId');
    const detailsElement = document.getElementById('enrollmentDetails');
    
    if (patientIdElement) {
        patientIdElement.textContent = patientId;
    }
    
    if (detailsElement) {
        detailsElement.innerHTML = `
            <p><strong>Patient:</strong> ${patientData.firstName} ${patientData.lastName}</p>
            <p><strong>Date of Birth:</strong> ${patientData.dateOfBirth}</p>
            <p><strong>Enrolled:</strong> ${new Date().toLocaleDateString()}</p>
        `;
    }
    
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Tracking Functions
function loadTrackingData() {
    const currentPatients = trackingSystem.getCurrentPatients();
    
    // Update stats
    document.getElementById('totalPatients').textContent = currentPatients.length;
    document.getElementById('inTreatment').textContent = currentPatients.filter(p => p.status === 'in-treatment').length;
    document.getElementById('waiting').textContent = currentPatients.filter(p => p.status === 'waiting').length;
    document.getElementById('admitted').textContent = currentPatients.filter(p => p.status === 'admitted').length;
    
    // Load patient list
    loadPatientsList(currentPatients);
}

function initializeHospitalMap() {
    // Initialize department patient lists
    hospitalData.departments.forEach(dept => {
        const deptElement = document.getElementById(dept.toLowerCase() + 'Patients');
        if (deptElement) {
            const deptPatients = trackingSystem.getCurrentPatients()
                .filter(p => p.department === dept.toLowerCase());
            
            deptElement.innerHTML = deptPatients.map(patient => `
                <div class="patient-marker">
                    <span>${getPatientName(patient.patientIdentifier)}</span>
                    <span class="status-badge status-${patient.status}">${patient.status}</span>
                </div>
            `).join('');
        }
    });
}

function getPatientName(patientIdentifier) {
    const patient = hospitalData.patients.find(p => p.id === patientIdentifier) ||
                   hospitalData.patients.find(p => p.email === patientIdentifier);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientIdentifier;
}

// Remove ALL inline JavaScript from HTML files and replace with:
// <script src="script.js"></script>

// Remove ALL inline CSS from HTML files