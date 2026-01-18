/* ============================================================
   ⚙️ CONFIG.JS - Cấu hình hệ thống
   Version: 4.0
   Description: Chứa các hằng số, cấu hình dùng chung toàn app
   ============================================================ */

const CONFIG = {
    // ==========================================
    // 📋 THÔNG TIN ỨNG DỤNG
    // ==========================================
    APP: {
        NAME: 'EduCenter',
        FULL_NAME: 'Hệ Thống Quản Lý Trung Tâm',
        VERSION: '4.0',
        AUTHOR: 'Admin Fz'
    },

    // ==========================================
    // 📊 PHÂN TRANG
    // ==========================================
    PAGINATION: {
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
        DEFAULT_PAGE_SIZE: 10
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

    // ==========================================
    // 🏷️ TRẠNG THÁI HỌC VIÊN - HIỂN THỊ
    // ==========================================
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
    // ✅ TRẠNG THÁI ĐIỂM DANH
    // ==========================================
    ATTENDANCE_STATUS: {
        PRESENT: 'Có mặt',
        ABSENT: 'Vắng',
        ABSENT_EXCUSED: 'Vắng có phép',
        LATE: 'Đi trễ'
    },

    // ==========================================
    // 🧾 LOẠI BIÊN LAI
    // ==========================================
    RECEIPT_TYPES: [
        { value: 'Biên Lai Điện Tử', label: '💳 Biên Lai Điện Tử' },
        { value: 'Phiếu Thu', label: '💵 Phiếu Thu' }
    ],

    // ==========================================
    // 🎁 LOẠI KHUYẾN MÃI
    // ==========================================
    PROMOTION_TYPES: {
        PERCENT: 'percent',
        FIXED: 'fixed'
    },

    // ==========================================
    // 👤 VAI TRÒ NGƯỜI DÙNG (Phase 2)
    // ==========================================
    USER_ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        USER: 'user'
    },

    // ==========================================
    // 💾 LOCALSTORAGE KEYS
    // ==========================================
    STORAGE_KEYS: {
        // Dữ liệu chính
        STUDENTS: 'students',
        PARENTS: 'parents',
        TEACHERS: 'teachers',
        CLASSES: 'classes',
        APPOINTMENTS: 'appointments',
        REGISTRATIONS: 'registrations',
        RECEIPTS: 'receipts',
        ATTENDANCE: 'attendance',
        
        // Danh mục
        SUBJECTS: 'subjects',
        PACKAGES: 'packages',
        PROMOTIONS: 'promotions',
        
        // Người dùng & Auth (Phase 2)
        USERS: 'users',
        CURRENT_USER: 'currentUser',
        SESSION: 'session',
        
        // Cài đặt
        CENTER_INFO: 'centerInfo',
        BANK_INFO: 'bankInfo',
        SETTINGS: 'settings',
        
        // Backup
        BACKUP_HISTORY: 'backupHistory',
        AUTO_BACKUP_ENABLED: 'autoBackupEnabled',
        
        // Sync (Phase 4)
        SYNC_QUEUE: 'syncQueue',
        LAST_SYNC: 'lastSync'
    },

    // ==========================================
    // 🔐 GOOGLE SHEET CONFIG (Phase 4)
    // ==========================================
    GOOGLE: {
        SHEET_ID: '',
        API_KEY: '',
        CLIENT_ID: '',
        SCOPES: 'https://www.googleapis.com/auth/spreadsheets'
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
    // 📅 NGÀY TRONG TUẦN
    // ==========================================
    DAYS_OF_WEEK: [
        { value: 0, short: 'CN', full: 'Chủ Nhật' },
        { value: 1, short: 'T2', full: 'Thứ Hai' },
        { value: 2, short: 'T3', full: 'Thứ Ba' },
        { value: 3, short: 'T4', full: 'Thứ Tư' },
        { value: 4, short: 'T5', full: 'Thứ Năm' },
        { value: 5, short: 'T6', full: 'Thứ Sáu' },
        { value: 6, short: 'T7', full: 'Thứ Bảy' }
    ],

    // ==========================================
    // ⏱️ THỜI GIAN
    // ==========================================
    TIME: {
        NOTIFICATION_DURATION: 3000,  // 3 giây
        AUTO_BACKUP_INTERVAL: 300000, // 5 phút
        SESSION_TIMEOUT: 3600000,     // 1 giờ
        DEBOUNCE_DELAY: 300           // 300ms cho search
    },

    // ==========================================
    // 📊 GIỚI HẠN
    // ==========================================
    LIMITS: {
        MAX_BACKUP_HISTORY: 10,
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_STUDENTS_PER_CLASS: 20
    }
};

// Freeze config để không bị thay đổi
Object.freeze(CONFIG);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.PAGINATION);
Object.freeze(CONFIG.STUDENT_STATUS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.VALIDATION);

// Export cho module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
