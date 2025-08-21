class CategoryComponent {
    constructor(app) {
        this.app = app;
        this.categories = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add category button
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.handleCreateCategory();
        });
    }

    async loadCategories() {
        try {
            this.categories = await apiService.getCategories();
            this.updateCategorySelects();
            this.renderCategoriesList();
            return this.categories;
        } catch (error) {
            console.error('Failed to load categories:', error);
            Utils.showMessage('taskMessage', `Failed to load categories: ${error.message}`, 'error');
            return [];
        }
    }

    updateCategorySelects() {
        const selects = ['taskCategory', 'editTaskCategory'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            select.innerHTML = '<option value="">No Category</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id; // Use id from backend
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    renderCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;

        if (this.categories.length === 0) {
            categoriesList.innerHTML = '<p class="no-categories">No categories found. Create your first category!</p>';
            return;
        }

        categoriesList.innerHTML = this.categories.map(category => `
            <div class="category-tag" style="background-color: ${category.color}; color: white;" data-category-id="${category.id}">
                ${Utils.escapeHtml(category.name)}
                <button class="delete-category" data-category-id="${category.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Bind delete events
        this.bindCategoryEvents();
    }

    bindCategoryEvents() {
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.delete-category').dataset.categoryId;
                this.deleteCategory(categoryId);
            });
        });
    }

    async handleCreateCategory() {
        const name = document.getElementById('newCategoryName').value?.trim();
        const color = document.getElementById('newCategoryColor').value || '#007bff';

        if (!name) {
            Utils.showMessage('taskMessage', 'Category name is required', 'error');
            return;
        }

        Utils.showLoading(true);

        try {
            await apiService.createCategory({ name, color });
            
            // Clear form
            document.getElementById('newCategoryName').value = '';
            document.getElementById('newCategoryColor').value = '#007bff';
            
            await this.loadCategories();
            Utils.showMessage('taskMessage', 'Category created successfully!', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to create category: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        Utils.showLoading(true);

        try {
            await apiService.deleteCategory(categoryId);
            await this.loadCategories();
            Utils.showMessage('categoryMessage', 'Category deleted successfully!', 'success');
        } catch (error) {
            Utils.showMessage('categoryMessage', `Failed to delete category: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    openCategoryModal() {
        const modal = document.getElementById('categoryModal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadCategories();
        }
    }

    closeCategoryModal() {
        const modal = document.getElementById('categoryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    getCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId); // Use id from backend
    }

    getCategoryColor(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.color : '#6c757d';
    }

    getCategoryName(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.name : 'Unknown';
    }
}

window.CategoryComponent = CategoryComponent;
