/* ============================================================
   💾 DATA.JS - Quản lý dữ liệu & LocalStorage
   Version: 4.0
   Description: CRUD operations, Data management, Error handling
   ============================================================ */

// ==========================================
// 🗄️ DATA STORE - Lưu trữ dữ liệu trong RAM
// ==========================================
const DataStore = {
    // Dữ liệu chính
    students: [],
    parents: [],
    teachers: [],
    classes: [],
    appointments: [],
    registrations: [],
    receipts: [],
    attendance: [],
    
    // Danh mục
    subjects: [],
    packages: [],
    promotions: [],
    
    // Người dùng (Phase 2)
    users: [],
    currentUser: null,
    
    // Cài đặt
    centerInfo: {},
    bankInfo: {},
    
    // Backup
    backupHistory: [],
    autoBackupEnabled: false,
    
    // Sync queue (Phase 4)
    syncQueue: [],

    // ==========================================
    // 📥 LOAD DATA FROM LOCALSTORAGE
    // ==========================================
    
    /**
     * Load tất cả dữ liệu từ LocalStorage
     */
    loadAll: function() {
        try {
            const keys = CONFIG.STORAGE_KEYS;
            
            // Load dữ liệu chính
            this.students = this._loadFromStorage(keys.STUDENTS, []);
            this.parents = this._loadFromStorage(keys.PARENTS, []);
            this.teachers = this._loadFromStorage(keys.TEACHERS, []);
            this.classes = this._loadFromStorage(keys.CLASSES, []);
            this.appointments = this._loadFromStorage(keys.APPOINTMENTS, []);
            this.registrations = this._loadFromStorage(keys.REGISTRATIONS, []);
            this.receipts = this._loadFromStorage(keys.RECEIPTS, []);
            this.attendance = this._loadFromStorage(keys.ATTENDANCE, []);
            
            // Load danh mục
            this.subjects = this._loadFromStorage(keys.SUBJECTS, CONFIG.DEFAULT_SUBJECTS);
            this.packages = this._loadFromStorage(keys.PACKAGES, []);
            this.promotions = this._loadFromStorage(keys.PROMOTIONS, []);
            
            // Load users (Phase 2)
            this.users = this._loadFromStorage(keys.USERS, []);
            this.currentUser = this._loadFromStorage(keys.CURRENT_USER, null);
            
            // Load cài đặt
            this.centerInfo = this._loadFromStorage(keys.CENTER_INFO, {});
            this.bankInfo = this._loadFromStorage(keys.BANK_INFO, {});
            
            // Load backup
            this.backupHistory = this._loadFromStorage(keys.BACKUP_HISTORY, []);
            this.autoBackupEnabled = this._loadFromStorage(keys.AUTO_BACKUP_ENABLED, false);
            
            // Migrate dữ liệu cũ (nếu có)
            this._migrateOldData();
            
            console.log('✅ DataStore: Loaded all data successfully');
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'DataStore.loadAll');
            return false;
        }
    },

    /**
     * Load dữ liệu từ LocalStorage với key
     * @private
     */
    _loadFromStorage: function(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn(`Warning: Could not parse ${key}`, error);
            return defaultValue;
        }
    },

    // ==========================================
    // 💾 SAVE DATA TO LOCALSTORAGE
    // ==========================================

    /**
     * Lưu dữ liệu vào LocalStorage
     * @param {string} key - Storage key
     * @param {any} data - Dữ liệu cần lưu
     * @returns {boolean} Thành công hay không
     */
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            
            // Trigger auto backup nếu được bật
            if (this.autoBackupEnabled) {
                this._triggerAutoBackup();
            }
            
            return true;
        } catch (error) {
            // Xử lý lỗi QuotaExceeded (bộ nhớ đầy)
            if (error.name === 'QuotaExceededError') {
                ErrorHandler.handleStorageFull();
            } else {
                ErrorHandler.handle(error, 'DataStore.save');
            }
            return false;
        }
    },

    /**
     * Lưu nhanh một collection
     * @param {string} collectionName - Tên collection (students, appointments,...)
     */
    saveCollection: function(collectionName) {
        const keyMap = {
            'students': CONFIG.STORAGE_KEYS.STUDENTS,
            'parents': CONFIG.STORAGE_KEYS.PARENTS,
            'teachers': CONFIG.STORAGE_KEYS.TEACHERS,
            'classes': CONFIG.STORAGE_KEYS.CLASSES,
            'appointments': CONFIG.STORAGE_KEYS.APPOINTMENTS,
            'registrations': CONFIG.STORAGE_KEYS.REGISTRATIONS,
            'receipts': CONFIG.STORAGE_KEYS.RECEIPTS,
            'attendance': CONFIG.STORAGE_KEYS.ATTENDANCE,
            'subjects': CONFIG.STORAGE_KEYS.SUBJECTS,
            'packages': CONFIG.STORAGE_KEYS.PACKAGES,
            'promotions': CONFIG.STORAGE_KEYS.PROMOTIONS,
            'users': CONFIG.STORAGE_KEYS.USERS
        };
        
        const key = keyMap[collectionName];
        if (key) {
            return this.save(key, this[collectionName]);
        }
        return false;
    },

    // ==========================================
    // 📝 CRUD OPERATIONS
    // ==========================================

    /**
     * Tạo item mới trong collection
     * @param {string} collectionName - Tên collection
     * @param {object} item - Item cần tạo
     * @returns {object|null} Item đã tạo với ID
     */
    create: function(collectionName, item) {
        try {
            if (!this[collectionName]) {
                throw new Error(`Collection "${collectionName}" không tồn tại`);
            }
            
            const newItem = {
                id: Utils.generateId(),
                ...item,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending'
            };
            
            this[collectionName].push(newItem);
            this.saveCollection(collectionName);
            
            // Thêm vào sync queue (Phase 4)
            this._addToSyncQueue('create', collectionName, newItem);
            
            return newItem;
        } catch (error) {
            ErrorHandler.handle(error, 'DataStore.create');
            return null;
        }
    },

    /**
     * Đọc item theo ID
     * @param {string} collectionName - Tên collection
     * @param {string} id - ID của item
     * @returns {object|null} Item tìm được
     */
    read: function(collectionName, id) {
        if (!this[collectionName]) return null;
        return this[collectionName].find(item => item.id === id) || null;
    },

    /**
     * Cập nhật item
     * @param {string} collectionName - Tên collection
     * @param {string} id - ID của item
     * @param {object} updates - Dữ liệu cập nhật
     * @returns {object|null} Item đã cập nhật
     */
    update: function(collectionName, id, updates) {
        try {
            if (!this[collectionName]) {
                throw new Error(`Collection "${collectionName}" không tồn tại`);
            }
            
            const index = this[collectionName].findIndex(item => item.id === id);
            if (index === -1) {
                throw new Error(`Item với ID "${id}" không tồn tại`);
            }
            
            const updatedItem = {
                ...this[collectionName][index],
                ...updates,
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending'
            };
            
            this[collectionName][index] = updatedItem;
            this.saveCollection(collectionName);
            
            // Thêm vào sync queue (Phase 4)
            this._addToSyncQueue('update', collectionName, updatedItem);
            
            return updatedItem;
        } catch (error) {
            ErrorHandler.handle(error, 'DataStore.update');
            return null;
        }
    },

    /**
     * Xóa item
     * @param {string} collectionName - Tên collection
     * @param {string} id - ID của item
     * @returns {boolean} Thành công hay không
     */
    delete: function(collectionName, id) {
        try {
            if (!this[collectionName]) {
                throw new Error(`Collection "${collectionName}" không tồn tại`);
            }
            
            const index = this[collectionName].findIndex(item => item.id === id);
            if (index === -1) {
                throw new Error(`Item với ID "${id}" không tồn tại`);
            }
            
            const deletedItem = this[collectionName][index];
            this[collectionName].splice(index, 1);
            this.saveCollection(collectionName);
            
            // Thêm vào sync queue (Phase 4)
            this._addToSyncQueue('delete', collectionName, deletedItem);
            
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'DataStore.delete');
            return false;
        }
    },

    // ==========================================
    // 🔍 QUERY HELPERS
    // ==========================================

    /**
     * Tìm một item theo điều kiện
     * @param {string} collectionName - Tên collection
     * @param {Function} predicate - Hàm điều kiện
     * @returns {object|null}
     */
    find: function(collectionName, predicate) {
        if (!this[collectionName]) return null;
        return this[collectionName].find(predicate) || null;
    },

    /**
     * Lọc items theo điều kiện
     * @param {string} collectionName - Tên collection
     * @param {Function} predicate - Hàm điều kiện
     * @returns {Array}
     */
    filter: function(collectionName, predicate) {
        if (!this[collectionName]) return [];
        return this[collectionName].filter(predicate);
    },

    /**
     * Đếm số items theo điều kiện
     * @param {string} collectionName - Tên collection
     * @param {Function} predicate - Hàm điều kiện (optional)
     * @returns {number}
     */
    count: function(collectionName, predicate = null) {
        if (!this[collectionName]) return 0;
        if (predicate) {
            return this[collectionName].filter(predicate).length;
        }
        return this[collectionName].length;
    },

    /**
     * Kiểm tra item tồn tại
     * @param {string} collectionName - Tên collection
     * @param {string} id - ID của item
     * @returns {boolean}
     */
    exists: function(collectionName, id) {
        return this.read(collectionName, id) !== null;
    },

    // ==========================================
    // 🔄 MIGRATION
    // ==========================================

    /**
     * Migrate dữ liệu cũ sang format mới
     * @private
     */
    _migrateOldData: function() {
        let needSave = false;
        
        // Migrate students
        this.students.forEach(student => {
            // Thêm field mới nếu chưa có
            if (!student.status) {
                student.status = CONFIG.STUDENT_STATUS.HOC_THU;
                needSave = true;
            }
            if (student.previousStatus === undefined) {
                student.previousStatus = null;
                needSave = true;
            }
            if (!student.syncStatus) {
                student.syncStatus = 'synced';
                needSave = true;
            }
        });
        
        // Migrate registrations từ students sang array riêng (nếu cần)
        if (this.registrations.length === 0) {
            this.students.forEach(student => {
                if (student.registrations && student.registrations.length > 0) {
                    student.registrations.forEach(reg => {
                        this.registrations.push({
                            ...reg,
                            studentId: student.id,
                            syncStatus: 'synced'
                        });
                    });
                    needSave = true;
                }
            });
        }
        
        if (needSave) {
            this.saveCollection('students');
            this.saveCollection('registrations');
            console.log('✅ DataStore: Migration completed');
        }
    },

    // ==========================================
    // 🔄 AUTO BACKUP
    // ==========================================

    _autoBackupTimeout: null,

    /**
     * Trigger auto backup (debounced)
     * @private
     */
    _triggerAutoBackup: function() {
        if (this._autoBackupTimeout) {
            clearTimeout(this._autoBackupTimeout);
        }
        
        this._autoBackupTimeout = setTimeout(() => {
            this.createAutoBackup();
        }, 5000); // 5 giây sau thay đổi cuối cùng
    },

    /**
     * Tạo auto backup
     */
    createAutoBackup: function() {
        try {
            const backup = {
                id: Utils.generateId(),
                date: new Date().toISOString(),
                type: 'auto',
                data: this._getAllData()
            };
            
            this.backupHistory.unshift(backup);
            
            // Giữ tối đa 10 bản backup
            if (this.backupHistory.length > CONFIG.LIMITS.MAX_BACKUP_HISTORY) {
                this.backupHistory = this.backupHistory.slice(0, CONFIG.LIMITS.MAX_BACKUP_HISTORY);
            }
            
            this.save(CONFIG.STORAGE_KEYS.BACKUP_HISTORY, this.backupHistory);
            console.log('✅ Auto backup created');
        } catch (error) {
            console.warn('Warning: Auto backup failed', error);
        }
    },

    /**
     * Tạo manual backup
     */
    createManualBackup: function() {
        const backup = {
            id: Utils.generateId(),
            date: new Date().toISOString(),
            type: 'manual',
            data: this._getAllData()
        };
        
        this.backupHistory.unshift(backup);
        
        if (this.backupHistory.length > CONFIG.LIMITS.MAX_BACKUP_HISTORY) {
            this.backupHistory = this.backupHistory.slice(0, CONFIG.LIMITS.MAX_BACKUP_HISTORY);
        }
        
        this.save(CONFIG.STORAGE_KEYS.BACKUP_HISTORY, this.backupHistory);
        return backup;
    },

    /**
     * Lấy tất cả dữ liệu để backup
     * @private
     */
    _getAllData: function() {
        return {
            students: this.students,
            parents: this.parents,
            teachers: this.teachers,
            classes: this.classes,
            appointments: this.appointments,
            registrations: this.registrations,
            receipts: this.receipts,
            attendance: this.attendance,
            subjects: this.subjects,
            packages: this.packages,
            promotions: this.promotions,
            users: this.users,
            centerInfo: this.centerInfo,
            bankInfo: this.bankInfo
        };
    },

    /**
     * Khôi phục từ backup
     * @param {object} backup - Backup data
     */
    restoreFromBackup: function(backup) {
        try {
            const data = backup.data;
            
            this.students = data.students || [];
            this.parents = data.parents || [];
            this.teachers = data.teachers || [];
            this.classes = data.classes || [];
            this.appointments = data.appointments || [];
            this.registrations = data.registrations || [];
            this.receipts = data.receipts || [];
            this.attendance = data.attendance || [];
            this.subjects = data.subjects || CONFIG.DEFAULT_SUBJECTS;
            this.packages = data.packages || [];
            this.promotions = data.promotions || [];
            this.users = data.users || [];
            this.centerInfo = data.centerInfo || {};
            this.bankInfo = data.bankInfo || {};
            
            // Save tất cả
            this._saveAll();
            
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'DataStore.restoreFromBackup');
            return false;
        }
    },

    /**
     * Save tất cả collections
     * @private
     */
    _saveAll: function() {
        const keys = CONFIG.STORAGE_KEYS;
        this.save(keys.STUDENTS, this.students);
        this.save(keys.PARENTS, this.parents);
        this.save(keys.TEACHERS, this.teachers);
        this.save(keys.CLASSES, this.classes);
        this.save(keys.APPOINTMENTS, this.appointments);
        this.save(keys.REGISTRATIONS, this.registrations);
        this.save(keys.RECEIPTS, this.receipts);
        this.save(keys.ATTENDANCE, this.attendance);
        this.save(keys.SUBJECTS, this.subjects);
        this.save(keys.PACKAGES, this.packages);
        this.save(keys.PROMOTIONS, this.promotions);
        this.save(keys.USERS, this.users);
        this.save(keys.CENTER_INFO, this.centerInfo);
        this.save(keys.BANK_INFO, this.bankInfo);
    },

    // ==========================================
    // 🔄 SYNC QUEUE (Phase 4)
    // ==========================================

    /**
     * Thêm vào sync queue
     * @private
     */
    _addToSyncQueue: function(action, collection, item) {
        // Sẽ implement ở Phase 4
        // this.syncQueue.push({
        //     id: Utils.generateId(),
        //     action,
        //     collection,
        //     itemId: item.id,
        //     data: item,
        //     timestamp: new Date().toISOString()
        // });
        // this.save(CONFIG.STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    },

    // ==========================================
    // 🗑️ CLEAR DATA
    // ==========================================

    /**
     * Xóa toàn bộ dữ liệu
     */
    clearAll: function() {
        localStorage.clear();
        this.students = [];
        this.parents = [];
        this.teachers = [];
        this.classes = [];
        this.appointments = [];
        this.registrations = [];
        this.receipts = [];
        this.attendance = [];
        this.subjects = CONFIG.DEFAULT_SUBJECTS;
        this.packages = [];
        this.promotions = [];
        this.users = [];
        this.currentUser = null;
        this.centerInfo = {};
        this.bankInfo = {};
        this.backupHistory = [];
        this.syncQueue = [];
        
        // Lưu lại subjects mặc định
        this.save(CONFIG.STORAGE_KEYS.SUBJECTS, this.subjects);
    }
};


// ==========================================
// 🛡️ ERROR HANDLER - Xử lý lỗi
// ==========================================
const ErrorHandler = {
    
    /**
     * Xử lý lỗi chung
     * @param {Error} error - Lỗi
     * @param {string} context - Ngữ cảnh xảy ra lỗi
     */
    handle: function(error, context = '') {
        // Log ra console để debug
        console.error(`[${context}]`, error);
        
        // Phân loại lỗi để hiện thông báo phù hợp
        let message = 'Đã xảy ra lỗi, vui lòng thử lại!';
        let type = 'error';
        
        if (error.name === 'QuotaExceededError') {
            message = 'Bộ nhớ trình duyệt đã đầy! Vui lòng xóa bớt dữ liệu hoặc tải backup.';
        } else if (error.message) {
            message = error.message;
        }
        
        // Hiện thông báo cho người dùng (nếu UI đã load)
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(message, type);
        } else {
            alert(message);
        }
    },

    /**
     * Xử lý lỗi bộ nhớ đầy
     */
    handleStorageFull: function() {
        const message = 'Bộ nhớ trình duyệt đã đầy!';
        
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(message, 'error');
        }
        
        // Gợi ý người dùng backup
        if (confirm('Bộ nhớ đầy! Bạn có muốn tải file backup không?')) {
            if (typeof exportBackupJSON === 'function') {
                exportBackupJSON();
            }
        }
    },

    /**
     * Wrapper cho async function
     * @param {Function} fn - Async function
     * @param {string} context - Ngữ cảnh
     * @returns {Function}
     */
    wrapAsync: function(fn, context) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                ErrorHandler.handle(error, context);
                return null;
            }
        };
    },

    /**
     * Wrapper cho sync function
     * @param {Function} fn - Sync function
     * @param {string} context - Ngữ cảnh
     * @returns {Function}
     */
    wrapSync: function(fn, context) {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                ErrorHandler.handle(error, context);
                return null;
            }
        };
    }
};


// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataStore, ErrorHandler };
}
// ==========================================
// 🔗 ALIAS - Để các module khác gọi được
// ==========================================
const DataModule = {
    init: function() {
        DataStore.loadAll();
        console.log('✅ DataModule initialized');
    },
    
    getAll: function(collectionName) {
        return DataStore[collectionName] || [];
    },
    
    getById: function(collectionName, id) {
        return DataStore.read(collectionName, id);
    },
    
    save: function(collectionName, item) {
        if (item.id && DataStore.exists(collectionName, item.id)) {
            return DataStore.update(collectionName, item.id, item) !== null;
        } else {
            return DataStore.create(collectionName, item) !== null;
        }
    },
    
    delete: function(collectionName, id) {
        return DataStore.delete(collectionName, id);
    },
    
    get: function(key) {
        return DataStore[key] || null;
    },
    
    set: function(key, value) {
        DataStore[key] = value;
        const storageKey = CONFIG.STORAGE_KEYS[key.toUpperCase()] || key;
        return DataStore.save(storageKey, value);
    }
};

// Export global
window.DataStore = DataStore;
window.DataModule = DataModule;
window.ErrorHandler = ErrorHandler;

console.log('✅ DataModule loaded');
