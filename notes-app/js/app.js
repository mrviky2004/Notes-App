// Main application logic
class NotesApp {
    constructor() {
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadNotes();
    }

    // Bind event listeners
    bindEvents() {
        // Save note
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveNote();
        });

        // Cancel edit
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Clear all notes
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAllNotes();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to save note
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.saveNote();
            }

            // Escape to cancel edit
            if (e.key === 'Escape' && this.currentEditingId) {
                this.cancelEdit();
            }

            // Ctrl+N for new note
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                ui.clearForm();
            }
        });

        // Favorites filter
        document.getElementById('favorites-btn').addEventListener('click', () => {
            this.showFavorites();
        });
    }

    // Load and display notes
    loadNotes() {
        const notes = storage.getNotes();
        ui.renderNotes(notes);
    }

    // Save note (create or update)
    saveNote() {
        const title = document.getElementById('title-input').value.trim();
        const content = document.getElementById('content-textarea').value.trim();
        const category = document.getElementById('category-select').value;
        const favorite = document.getElementById('favorite-check').checked;

        // Validation
        if (!title) {
            ui.showToast('Please enter a title', 'error');
            document.getElementById('title-input').focus();
            return;
        }

        if (!content) {
            ui.showToast('Please enter note content', 'error');
            document.getElementById('content-textarea').focus();
            return;
        }

        ui.showLoading(true);

        try {
            const notes = storage.getNotes();
            let updatedNotes;

            if (this.currentEditingId) {
                // Update existing note
                updatedNotes = notes.map(note =>
                    note.id === this.currentEditingId
                        ? {
                            ...note,
                            title,
                            content,
                            category,
                            favorite,
                            updatedAt: new Date().toISOString()
                        }
                        : note
                );
                ui.showToast('Note updated successfully');
            } else {
                // Create new note
                const newNote = {
                    id: Date.now(),
                    title,
                    content,
                    category,
                    favorite,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                updatedNotes = [...notes, newNote];
                ui.showToast('Note created successfully');
            }

            // Save to storage
            if (storage.saveNotes(updatedNotes)) {
                this.loadNotes();
                ui.clearForm();
                this.currentEditingId = null;
            }
        } catch (error) {
            ui.showToast('Error saving note', 'error');
            console.error('Error saving note:', error);
        } finally {
            ui.showLoading(false);
        }
    }

    // Edit note
    editNote(id) {
        const notes = storage.getNotes();
        const note = notes.find(note => note.id === id);
        
        if (note) {
            this.currentEditingId = id;
            ui.fillForm(note);
            ui.showToast('Editing note...', 'warning');
        }
    }

    // Delete note
    deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        ui.showLoading(true);

        try {
            const notes = storage.getNotes();
            const updatedNotes = notes.filter(note => note.id !== id);
            
            if (storage.saveNotes(updatedNotes)) {
                this.loadNotes();
                ui.showToast('Note deleted successfully');
                
                // If we were editing this note, clear the form
                if (this.currentEditingId === id) {
                    this.cancelEdit();
                }
            }
        } catch (error) {
            ui.showToast('Error deleting note', 'error');
            console.error('Error deleting note:', error);
        } finally {
            ui.showLoading(false);
        }
    }

    // Toggle favorite status
    toggleFavorite(id) {
        ui.showLoading(true);

        try {
            const notes = storage.getNotes();
            const updatedNotes = notes.map(note =>
                note.id === id
                    ? { ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() }
                    : note
            );

            if (storage.saveNotes(updatedNotes)) {
                this.loadNotes();
                const note = updatedNotes.find(note => note.id === id);
                ui.showToast(note.favorite ? 'Added to favorites' : 'Removed from favorites');
            }
        } catch (error) {
            ui.showToast('Error updating note', 'error');
            console.error('Error updating note:', error);
        } finally {
            ui.showLoading(false);
        }
    }

    // Cancel edit
    cancelEdit() {
        this.currentEditingId = null;
        ui.clearForm();
        ui.showToast('Edit cancelled', 'warning');
    }

    // Clear all notes
    clearAllNotes() {
        if (!confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) {
            return;
        }

        ui.showLoading(true);

        try {
            if (storage.saveNotes([])) {
                this.loadNotes();
                this.cancelEdit();
                ui.showToast('All notes cleared');
            }
        } catch (error) {
            ui.showToast('Error clearing notes', 'error');
            console.error('Error clearing notes:', error);
        } finally {
            ui.showLoading(false);
        }
    }

    // Show only favorite notes
    showFavorites() {
        const notes = storage.getNotes();
        const favorites = notes.filter(note => note.favorite);
        ui.renderNotes(favorites);
        ui.showToast(`Showing ${favorites.length} favorite notes`);
    }

    // Export notes
    exportNotes() {
        try {
            storage.exportNotes();
            ui.showToast('Notes exported successfully');
        } catch (error) {
            ui.showToast('Error exporting notes', 'error');
            console.error('Error exporting notes:', error);
        }
    }

    // Import notes
    importNotes(file) {
        ui.showLoading(true);

        storage.importNotes(file)
            .then(() => {
                this.loadNotes();
                ui.showToast('Notes imported successfully');
            })
            .catch(error => {
                ui.showToast('Error importing notes: ' + error.message, 'error');
            })
            .finally(() => {
                ui.showLoading(false);
            });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotesApp();
});

// Make app methods globally available for onclick handlers
window.editNote = (id) => app.editNote(id);
window.deleteNote = (id) => app.deleteNote(id);
window.toggleFavorite = (id) => app.toggleFavorite(id);