// Storage management for notes
class StorageManager {
    constructor() {
        this.storageKey = 'notesAppData';
        this.defaultData = {
            notes: [],
            settings: {
                theme: 'light',
                view: 'grid',
                categories: {
                    personal: 0,
                    work: 0,
                    ideas: 0
                }
            }
        };
    }

    // Get all data from localStorage
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.defaultData;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return this.defaultData;
        }
    }

    // Save all data to localStorage
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showToast('Error saving data', 'error');
            return false;
        }
    }

    // Get notes from storage
    getNotes() {
        const data = this.getData();
        return data.notes || [];
    }

    // Save notes to storage
    saveNotes(notes) {
        const data = this.getData();
        data.notes = notes;
        
        // Update category counts
        data.settings.categories = this.calculateCategoryCounts(notes);
        
        return this.saveData(data);
    }

    // Get settings from storage
    getSettings() {
        const data = this.getData();
        return data.settings || this.defaultData.settings;
    }

    // Save settings to storage
    saveSettings(settings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...settings };
        return this.saveData(data);
    }

    // Calculate category counts
    calculateCategoryCounts(notes) {
        const counts = {
            personal: 0,
            work: 0,
            ideas: 0,
            all: notes.length,
            favorites: notes.filter(note => note.favorite).length
        };

        notes.forEach(note => {
            if (counts[note.category] !== undefined) {
                counts[note.category]++;
            }
        });

        return counts;
    }

    // Export notes as JSON file
    exportNotes() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import notes from JSON file
    importNotes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (this.validateImportedData(importedData)) {
                        this.saveData(importedData);
                        resolve(true);
                    } else {
                        reject(new Error('Invalid file format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    // Validate imported data structure
    validateImportedData(data) {
        return data && 
               Array.isArray(data.notes) && 
               data.settings && 
               typeof data.settings === 'object';
    }

    // Show toast notification
    showToast(message, type = 'success') {
        // This will be implemented in UI.js
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
}

// Create global storage instance
const storage = new StorageManager();