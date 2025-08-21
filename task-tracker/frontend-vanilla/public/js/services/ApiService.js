class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:8000';
        this.currentUser = null;
    }

    setCurrentUser(user) {
        // Normalize _id to string if needed
        if (user && (user._id || user.id)) {
            // Ensure we have both _id and id for compatibility
            user._id = user._id || user.id;
            user.id = user.id || user._id;
            
            // Normalize to string
            if (typeof user._id === 'object' && user._id.$oid) {
                user._id = user._id.$oid;
            }
            if (typeof user.id === 'object' && user.id.$oid) {
                user.id = user.id.$oid;
            }
            
            user._id = String(user._id);
            user.id = String(user.id);
        }
        this.currentUser = user;
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.currentUser && (this.currentUser._id || this.currentUser.id)) {
            headers['x-user-id'] = this.currentUser._id || this.currentUser.id;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || `HTTP ${response.status}`;
                } catch (e) {
                    errorMessage = `HTTP ${response.status} - ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Handle empty responses
            if (response.status === 204) {
                return null;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else if (contentType && contentType.includes('text/csv')) {
                return await response.text();
            }

            return await response.text();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        // Send credentials as JSON body, not query params
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Task methods
    async getTasks(filters = {}) {
        const params = new URLSearchParams(filters);
        const query = params.toString() ? `?${params}` : '';
        return await this.request(`/tasks${query}`);
    }

    async getTask(taskId) {
        return await this.request(`/tasks/${taskId}`);
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTask(taskId, updates) {
        return await this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteTask(taskId) {
        return await this.request(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }

    async startTask(taskId) {
        return await this.request(`/tasks/${taskId}/start`, {
            method: 'POST'
        });
    }

    async pauseTask(taskId) {
        return await this.request(`/tasks/${taskId}/pause`, {
            method: 'POST'
        });
    }

    async finishTask(taskId) {
        return await this.request(`/tasks/${taskId}/finish`, {
            method: 'POST'
        });
    }

    async pauseAllTasks() {
        return await this.request('/tasks/pause-all', {
            method: 'POST'
        });
    }

    async getActiveTask() {
        return await this.request('/tasks/active');
    }

    // Task links
    async getTaskLinks(taskId) {
        return await this.request(`/tasks/${taskId}/links`);
    }

    async createTaskLink(taskId, linkData) {
        return await this.request(`/tasks/${taskId}/links`, {
            method: 'POST',
            body: JSON.stringify(linkData)
        });
    }

    async deleteTaskLink(taskId, linkId) {
        return await this.request(`/tasks/${taskId}/links/${linkId}`, {
            method: 'DELETE'
        });
    }

    // Category methods
    async getCategories() {
        return await this.request('/categories');
    }

    async createCategory(categoryData) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategory(categoryId) {
        return await this.request(`/categories/${categoryId}`, {
            method: 'DELETE'
        });
    }

    // Report methods
    async getDailyReport(date) {
        const params = date ? `?date=${date}` : '';
        return await this.request(`/reports/daily${params}`);
    }

    async getWeeklyReport() {
        return await this.request('/reports/weekly');
    }

    async getCompletionStats() {
        return await this.request('/reports/stats');
    }

    async exportData(format) {
        return await this.request(`/reports/export/${format}`);
    }
}

// Create a global instance
window.apiService = new ApiService();
