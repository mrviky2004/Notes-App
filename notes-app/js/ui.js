// UI Management and DOM manipulation
class UIManager {
    constructor() {
        this.currentView = 'grid';
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyStoredSettings();
    }

    // Bind all event listeners
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterNotes();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // Category filter
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.closest('.category-btn').dataset.category);
            });
        });

        // Theme toggle
        document.getElementById('theme-btn').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Character counters
        document.getElementById('title-input').addEventListener('input', (e) => {
            this.updateCharCount('title', e.target.value.length);
        });

        document.getElementById('content-textarea').addEventListener('input', (e) => {
            this.updateCharCount('content', e.target.value.length);
        });

        // Quick actions
        document.getElementById('new-note-btn').addEventListener('click', () => {
            this.clearForm();
        });

        document.getElementById('create-first-note').addEventListener('click', () => {
            this.clearForm();
            document.getElementById('title-input').focus();
        });
    }

    // Apply stored settings
    applyStoredSettings() {
        const settings = storage.getSettings();
        
        // Apply theme
        this.applyTheme(settings.theme);
        
        // Apply view
        this.switchView(settings.view, false);
        
        // Update category counts
        this.updateCategoryCounts();
    }

    // Switch between grid and list view
    switchView(view, save = true) {
        this.currentView = view;
        const container = document.getElementById('notes-container');
        const viewBtns = document.querySelectorAll('.view-btn');

        // Update active button
        viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update container class
        container.className = `notes-container ${view}-view`;

        // Update note cards
        document.querySelectorAll('.note-card').forEach(card => {
            card.className = `note-card ${view}-view fade-in`;
        });

        // Save preference
        if (save) {
            const settings = storage.getSettings();
            settings.view = view;
            storage.saveSettings(settings);
        }
    }

    // Filter notes by category
    filterByCategory(category) {
        this.currentCategory = category;
        
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.filterNotes();
    }

    // Filter notes based on search and category
    filterNotes() {
        const notes = storage.getNotes();
        const filteredNotes = notes.filter(note => {
            const matchesSearch = this.searchTerm === '' || 
                note.title.toLowerCase().includes(this.searchTerm) ||
                note.content.toLowerCase().includes(this.searchTerm);
            
            const matchesCategory = this.currentCategory === 'all' || 
                note.category === this.currentCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderNotes(filteredNotes);
    }

    // Render notes to the DOM
    renderNotes(notes = null) {
        const notesToRender = notes || storage.getNotes();
        const container = document.getElementById('notes-container');
        const emptyState = document.getElementById('empty-state');
        const clearAllBtn = document.getElementById('clear-all-btn');

        // Show/hide empty state and clear all button
        if (notesToRender.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            clearAllBtn.style.display = 'none';
            return;
        }

        container.style.display = this.currentView === 'grid' ? 'grid' : 'flex';
        emptyState.style.display = 'none';
        clearAllBtn.style.display = 'inline-flex';

        // Render notes
        container.innerHTML = notesToRender.map(note => this.createNoteCard(note)).join('');

        // Update counts
        this.updateNotesCount(notesToRender.length);
        this.updateCategoryCounts();
    }

    // Create note card HTML
    createNoteCard(note) {
        const isFavorite = note.favorite ? 'active' : '';
        const isGridView = this.currentView === 'grid';
        const truncatedContent = isGridView && note.content.length > 150 
            ? note.content.substring(0, 150) + '...' 
            : note.content;

        return `
            <div class="note-card ${this.currentView}-view ${note.favorite ? 'favorite' : ''} slide-up" 
                 data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <div class="note-actions">
                        <button class="note-action-btn favorite-btn ${isFavorite}" 
                                onclick="app.toggleFavorite(${note.id})"
                                title="${note.favorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="note-action-btn" onclick="app.editNote(${note.id})" title="Edit note">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn" onclick="app.deleteNote(${note.id})" title="Delete note">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <span class="note-category">${note.category}</span>
                
                <div class="note-content">${this.escapeHtml(truncatedContent)}</div>
                
                <div class="note-footer">
                    <span class="note-date">Created: ${new Date(note.createdAt).toLocaleDateString()}</span>
                    ${note.updatedAt !== note.createdAt ? 
                        `<span class="note-date">Updated: ${new Date(note.updatedAt).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
    }

    // Update notes count display
    updateNotesCount(count) {
        document.getElementById('notes-count').textContent = `(${count})`;
        document.getElementById('total-notes').textContent = count;
        document.getElementById('all-count').textContent = count;
    }

    // Update category counts
    updateCategoryCounts() {
        const counts = storage.getSettings().categories;
        document.getElementById('favorite-notes').textContent = counts.favorites || 0;
        
        // Update category counts in sidebar
        document.querySelectorAll('.category-btn').forEach(btn => {
            const category = btn.dataset.category;
            if (counts[category] !== undefined) {
                const countElement = btn.querySelector('.count');
                if (countElement) {
                    countElement.textContent = counts[category];
                }
            }
        });
    }

    // Update character count
    updateCharCount(type, count) {
        const maxLength = type === 'title' ? 100 : 2000;
        const element = document.getElementById(`${type}-count`);
        element.textContent = `${count}/${maxLength}`;
        
        // Add warning class when approaching limit
        if (count > maxLength * 0.9) {
            element.style.color = 'var(--danger-color)';
        } else if (count > maxLength * 0.75) {
            element.style.color = 'var(--warning-color)';
        } else {
            element.style.color = 'var(--text-light)';
        }
    }

    // Clear form
    clearForm() {
        document.getElementById('title-input').value = '';
        document.getElementById('content-textarea').value = '';
        document.getElementById('category-select').value = 'personal';
        document.getElementById('favorite-check').checked = false;
        document.getElementById('cancel-btn').style.display = 'none';
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Create New Note';
        document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Save Note';
        
        this.updateCharCount('title', 0);
        this.updateCharCount('content', 0);
        
        document.getElementById('title-input').focus();
    }

    // Fill form for editing
    fillForm(note) {
        document.getElementById('title-input').value = note.title;
        document.getElementById('content-textarea').value = note.content;
        document.getElementById('category-select').value = note.category;
        document.getElementById('favorite-check').checked = note.favorite;
        document.getElementById('cancel-btn').style.display = 'inline-flex';
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Note';
        document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Update Note';
        
        this.updateCharCount('title', note.title.length);
        this.updateCharCount('content', note.content.length);
        
        document.getElementById('title-input').focus();
    }

    // Toggle theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Update theme button icon
        const themeIcon = document.querySelector('#theme-btn i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Save preference
        const settings = storage.getSettings();
        settings.theme = newTheme;
        storage.saveSettings(settings);
    }

    // Apply theme
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme button icon
        const themeIcon = document.querySelector('#theme-btn i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Show loading state
    showLoading(show = true) {
        const app = document.querySelector('.notes-app');
        if (show) {
            app.classList.add('loading');
        } else {
            app.classList.remove('loading');
        }
    }
}

// Create global UI instance
const ui = new UIManager();

// Make showToast globally available
window.showToast = ui.showToast.bind(ui);