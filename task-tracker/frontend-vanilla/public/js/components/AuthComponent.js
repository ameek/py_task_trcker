class AuthComponent {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            this.handleRegister(e);
        });

        // Tab switching - Fix the selectors
        document.getElementById('loginTab')?.addEventListener('click', () => {
            this.switchTab('login');
        });

        document.getElementById('registerTab')?.addEventListener('click', () => {
            this.switchTab('register');
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.getElementById(`${tab}Tab`).classList.add('active');

        // Update form visibility
        if (tab === 'login') {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
        } else {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        }

        // Clear any previous messages
        Utils.showMessage('authMessage', '', 'info');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            Utils.showMessage('authMessage', 'Please fill in all fields', 'error');
            return;
        }

        Utils.showLoading(true);

        try {
            const response = await apiService.login(email, password);
            
            if (response && response.user) {
                // Set the user in both the app and API service
                this.app.setCurrentUser(response.user);
                
                this.app.showDashboard();
                Utils.showMessage('authMessage', 'Login successful!', 'success');
                this.clearForms();
                
                // Load initial data after successful login and user is set
                await this.app.loadInitialData();
            } else {
                throw new Error('Login response missing user data');
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showMessage('authMessage', `Login failed: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!fullName || !email || !password) {
            Utils.showMessage('authMessage', 'Please fill in all fields', 'error');
            return;
        }

        if (password.length < 4) {
            Utils.showMessage('authMessage', 'Password must be at least 4 characters', 'error');
            return;
        }

        Utils.showLoading(true);

        try {
            const response = await apiService.register({
                full_name: fullName,
                email: email,
                password: password
            });

            if (response && response.user) {
                // Automatically log in the user after successful registration
                this.app.setCurrentUser(response.user);
                
                this.app.showDashboard();
                Utils.showMessage('authMessage', 'Registration successful! Welcome!', 'success');
                this.clearForms();
                
                // Load initial data after successful registration and user is set
                await this.app.loadInitialData();
            } else {
                Utils.showMessage('authMessage', 'Registration successful! Please login.', 'success');
                this.switchTab('login');
                this.clearForms();
            }
        } catch (error) {
            console.error('Registration error:', error);
            Utils.showMessage('authMessage', `Registration failed: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    logout() {
        this.app.setCurrentUser(null);
        apiService.setCurrentUser(null);
        
        // Clear localStorage
        localStorage.removeItem('currentUser');
        
        this.app.showAuth();
        this.clearForms();
        Utils.showMessage('authMessage', 'Logged out successfully', 'success');
    }

    clearForms() {
        document.getElementById('loginForm')?.reset();
        document.getElementById('registerForm')?.reset();
    }

    showAuth() {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('userNav').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('userNav').style.display = 'flex';
        
        const user = this.app.currentUser;
        if (user) {
            document.getElementById('welcomeText').textContent = `Welcome, ${user.full_name || 'User'}!`;
        }
    }
}

window.AuthComponent = AuthComponent;
