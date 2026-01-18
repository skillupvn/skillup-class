/* ============================================================
   ⚙️ CONFIG.JS - Cấu hình hệ thống
   Version: 4.0 - FIXED
   ============================================================ */

const CONFIG = {
    // ==========================================
    // 📋 THÔNG TIN ỨNG DỤNG
    // ==========================================
    APP: {
        NAME: 'EduCenter',
        FULL_NAME: 'Hệ Thống Quản Lý Trung Tâm',
        VERSION: '4.0',
        AUTHOR: 'Admin Fz',
        DEBUG: true
    },

    // ==========================================
    // 📊 PHÂN TRANG - THÊM DEFAULTS ĐỂ TƯƠNG THÍCH
    // ==========================================
    PAGINATION: {
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
        DEFAULT_PAGE_SIZE: 10
    },
    
    // DEFAULTS - Alias để các module khác gọi được
    DEFAULTS: {
        PAGE_SIZE: 10,
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
        DATE_FORMAT: 'DD/MM/YYYY',
        CURRENCY: 'VND'
    },

    // ==========================================
    // 🏷️ TRẠNG THÁI HỌC VIÊN
    // ==========================================
    STUDENT_STATUS: {
        HOC_THU: 'Học Thử',
        CHO_DANG_KY: 'Chờ Đăng Ký',
        DA_DANG_KY: 'Đã Đăng Ký',
        HOAN_THANH: 'Hoàn Thành',
        CANCEL: 'Cancel'
    },

    STUDENT_STATUS_DISPLAY: {
        'Học Thử': { icon: '🆕', label: 'Học Thử', class: 'status-hoc-thu' },
        'Chờ Đăng Ký': { icon: '⏳', label: 'Chờ ĐK', class: 'status-cho-dang-ky' },
        'Đã Đăng Ký': { icon: '✅', label: 'Đã ĐK', class: 'status-da-dang-ky' },
        'Hoàn Thành': { icon: '🎓', label: 'Hoàn Thành', class: 'status-hoan-thanh' },
        'Cancel': { icon: '❌', label: 'Cancel', class: 'status-cancel' }
    },

    // ==========================================
    // 📅 TRẠNG THÁI LỊCH HẸN
    // ==========================================
    APPOINTMENT_STATUS: {
        SCHEDULED: 'scheduled',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        NO_SHOW: 'no_show'
    },

    // ==========================================
    // 💾 LOCALSTORAGE KEYS
    // ==========================================
    STORAGE_KEYS: {
        STUDENTS: 'students',
        PARENTS: 'parents',
        TEACHERS: 'teachers',
        CLASSES: 'classes',
        APPOINTMENTS: 'appointments',
        REGISTRATIONS: 'registrations',
        RECEIPTS: 'receipts',
        ATTENDANCE: 'attendance',
        SUBJECTS: 'subjects',
        PACKAGES: 'packages',
        PROMOTIONS: 'promotions',
        USERS: 'users',
        CURRENT_USER: 'currentUser',
        CENTER_INFO: 'centerInfo',
        BANK_INFO: 'bankInfo',
        SETTINGS: 'settings',
        BACKUP_HISTORY: 'backupHistory',
        AUTO_BACKUP_ENABLED: 'autoBackupEnabled'
    },

    // ==========================================
    // ✅ VALIDATION RULES
    // ==========================================
    VALIDATION: {
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 50,
        PHONE_REGEX: /^(0[3|5|7|8|9])[0-9]{8}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        AGE_MIN: 3,
        AGE_MAX: 100
    },

    // ==========================================
    // 🎨 MÔN HỌC MẶC ĐỊNH
    // ==========================================
    DEFAULT_SUBJECTS: [
        { id: 'subj_1', icon: '♟️', name: 'Cờ Vua', defaultFee: 2000000 },
        { id: 'subj_2', icon: '🎨', name: 'Vẽ Tranh', defaultFee: 1800000 },
        { id: 'subj_3', icon: '📚', name: 'Tiền Tiểu Học', defaultFee: 1500000 },
        { id: 'subj_4', icon: '✍️', name: 'Rèn Chữ', defaultFee: 1600000 }
    ],

    // ==========================================
    // ⏱️ THỜI GIAN
    // ==========================================
    TIME: {
        NOTIFICATION_DURATION: 3000,
        AUTO_BACKUP_INTERVAL: 300000,
        SESSION_TIMEOUT: 3600000,
        DEBOUNCE_DELAY: 300
    },

    // ==========================================
    // 📊 GIỚI HẠN
    // ==========================================
    LIMITS: {
        MAX_BACKUP_HISTORY: 10,
        MAX_FILE_SIZE: 5 * 1024 * 1024
    }
};

// Freeze để không bị thay đổi
Object.freeze(CONFIG);

// ĐẢM BẢO CÓ THỂ TRUY CẬP GLOBAL
window.CONFIG = CONFIG;

console.log('✅ CONFIG loaded:', CONFIG.APP.VERSION);
