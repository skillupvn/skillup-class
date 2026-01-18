/* ============================================================
   🛠️ UTILS.JS - Các hàm tiện ích dùng chung
   Version: 4.0
   Description: Format, Validation, Helper functions
   ============================================================ */

// ==========================================
// 🔧 UTILS - Các hàm tiện ích chung
// ==========================================
const Utils = {
    
    // ==========================================
    // 🔑 ID GENERATION
    // ==========================================
    
    /**
     * Tạo ID unique
     * @returns {string} ID dạng: "lxyz123abc"
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Tạo mã code với prefix
     * @param {string} prefix - Tiền tố (VD: 'DK', 'BL')
     * @returns {string} Mã dạng: "DK250118-ABCD"
     */
    generateCode: function(prefix = '') {
        const now = new Date();
        const y = now.getFullYear().toString().slice(2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}${y}${m}${d}-${rand}`;
    },

    // ==========================================
    // 📅 DATE FORMATTING
    // ==========================================

    /**
     * Format ngày dạng DD/MM/YYYY
     * @param {string|Date} dateStr - Ngày cần format
     * @returns {string} Ngày đã format
     */
    formatDate: function(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    /**
     * Format ngày đầy đủ với thứ
     * @param {string|Date} dateStr - Ngày cần format
     * @returns {string} VD: "T2 18/01/2026"
     */
    formatDateFull: function(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return `${days[d.getDay()]} ${this.formatDate(dateStr)}`;
    },

    /**
     * Format ngày giờ đầy đủ
     * @param {string|Date} dateStr - Ngày giờ cần format
     * @returns {string} VD: "18/01/2026 14:30"
     */
    formatDateTime: function(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `${this.formatDate(dateStr)} ${time}`;
    },

    /**
     * Format ngày cho tên file
     * @returns {string} VD: "20260118"
     */
    formatDateFile: function() {
        const d = new Date();
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    },

    /**
     * Format ngày cho input date
     * @param {Date} date - Date object
     * @returns {string} VD: "2026-01-18"
     */
    formatDateInput: function(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    // ==========================================
    // 💰 CURRENCY FORMATTING
    // ==========================================

    /**
     * Format số tiền VND
     * @param {number} amount - Số tiền
     * @returns {string} VD: "2.000.000 ₫"
     */
    formatCurrency: function(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    /**
     * Format số tiền ngắn gọn
     * @param {number} amount - Số tiền
     * @returns {string} VD: "2tr" hoặc "500k"
     */
    formatCurrencyShort: function(amount) {
        if (!amount || isNaN(amount)) return '0';
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1).replace('.0', '') + 'tr';
        }
        if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'k';
        }
        return amount.toString();
    },

    /**
     * Format số tiền chỉ có số và dấu chấm
     * @param {number} amount - Số tiền
     * @returns {string} VD: "2.000.000"
     */
    formatNumber: function(amount) {
        if (!amount || isNaN(amount)) return '0';
        return new Intl.NumberFormat('vi-VN').format(amount);
    },

    /**
     * Parse số tiền từ string
     * @param {string} str - String chứa số tiền (VD: "2.000.000")
     * @returns {number} Số tiền
     */
    parseCurrency: function(str) {
        if (!str) return 0;
        return parseInt(String(str).replace(/\D/g, '')) || 0;
    },

    /**
     * Format input tiền tệ (realtime khi nhập)
     * @param {HTMLInputElement} input - Input element
     */
    formatCurrencyInput: function(input) {
        let value = input.value.replace(/\D/g, '');
        if (value) {
            input.value = parseInt(value).toLocaleString('vi-VN');
        } else {
            input.value = '';
        }
    },

    // ==========================================
    // 📱 PHONE FORMATTING
    // ==========================================

    /**
     * Chuẩn hóa số điện thoại về dạng 0xxxxxxxxx
     * @param {string} phone - Số điện thoại
     * @returns {string} Số điện thoại đã chuẩn hóa
     */
    normalizePhone: function(phone) {
        if (!phone) return '';
        let normalized = phone.replace(/[\s\-\.]/g, '');
        
        // Chuyển +84 hoặc 84 về 0
        if (normalized.startsWith('+84')) {
            normalized = '0' + normalized.substring(3);
        } else if (normalized.startsWith('84') && normalized.length > 10) {
            normalized = '0' + normalized.substring(2);
        }
        
        return normalized;
    },

    /**
     * Format số điện thoại hiển thị
     * @param {string} phone - Số điện thoại
     * @returns {string} VD: "0901 234 567"
     */
    formatPhone: function(phone) {
        const normalized = this.normalizePhone(phone);
        if (normalized.length === 10) {
            return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
        }
        return normalized;
    },

    // ==========================================
    // 📝 TEXT UTILITIES
    // ==========================================

    /**
     * Chuyển số thành chữ (đọc tiền)
     * @param {number} num - Số cần đọc
     * @returns {string} Số đọc bằng chữ
     */
    numberToWords: function(num) {
        if (!num || num === 0) return 'Không đồng';
        
        const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
        const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
        
        const readBlock = (n) => {
            if (n === 0) return '';
            let str = '';
            const h = Math.floor(n / 100);
            const remainder = n % 100;
            const t = Math.floor(remainder / 10);
            const o = remainder % 10;
            
            if (h > 0) {
                str += ones[h] + ' trăm ';
            }
            
            if (t > 1) {
                str += tens[t] + ' ';
                if (o === 1) str += 'mốt ';
                else if (o === 5) str += 'lăm ';
                else if (o > 0) str += ones[o] + ' ';
            } else if (t === 1) {
                str += 'mười ';
                if (o === 5) str += 'lăm ';
                else if (o > 0) str += ones[o] + ' ';
            } else if (o > 0) {
                if (h > 0) str += 'lẻ ';
                str += ones[o] + ' ';
            }
            
            return str;
        };
        
        let result = '';
        const billion = Math.floor(num / 1000000000);
        const million = Math.floor((num % 1000000000) / 1000000);
        const thousand = Math.floor((num % 1000000) / 1000);
        const rest = num % 1000;
        
        if (billion > 0) result += readBlock(billion) + 'tỷ ';
        if (million > 0) result += readBlock(million) + 'triệu ';
        if (thousand > 0) result += readBlock(thousand) + 'nghìn ';
        if (rest > 0) result += readBlock(rest);
        
        result = result.trim() + ' đồng';
        return result.charAt(0).toUpperCase() + result.slice(1);
    },

    /**
     * Cắt text với ellipsis
     * @param {string} text - Text gốc
     * @param {number} maxLength - Độ dài tối đa
     * @returns {string} Text đã cắt
     */
    truncate: function(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Escape HTML để tránh XSS
     * @param {string} text - Text cần escape
     * @returns {string} Text đã escape
     */
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Tạo initials từ tên (cho avatar)
     * @param {string} name - Tên đầy đủ
     * @returns {string} VD: "NV" từ "Nguyễn Văn"
     */
    getInitials: function(name) {
        if (!name) return '?';
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    },

    // ==========================================
    // 📅 DATE HELPERS
    // ==========================================

    /**
     * Kiểm tra ngày có phải hôm nay không
     * @param {string|Date} dateStr - Ngày cần kiểm tra
     * @returns {boolean}
     */
    isToday: function(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },

    /**
     * Kiểm tra ngày đã qua chưa
     * @param {string|Date} dateStr - Ngày cần kiểm tra
     * @returns {boolean}
     */
    isPast: function(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        return date < now;
    },

    /**
     * Kiểm tra ngày trong tương lai
     * @param {string|Date} dateStr - Ngày cần kiểm tra
     * @returns {boolean}
     */
    isFuture: function(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        return date > now;
    },

    /**
     * Tính số ngày chênh lệch
     * @param {string|Date} date1 
     * @param {string|Date} date2 
     * @returns {number} Số ngày chênh lệch
     */
    getDaysDiff: function(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Lấy ngày đầu tháng
     * @param {Date} date 
     * @returns {Date}
     */
    getFirstDayOfMonth: function(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    /**
     * Lấy ngày cuối tháng
     * @param {Date} date 
     * @returns {Date}
     */
    getLastDayOfMonth: function(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    },

    // ==========================================
    // 🔧 MISC HELPERS
    // ==========================================

    /**
     * Debounce function
     * @param {Function} func - Hàm cần debounce
     * @param {number} wait - Thời gian chờ (ms)
     * @returns {Function}
     */
    debounce: function(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     * @param {any} obj - Object cần clone
     * @returns {any} Object đã clone
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check object is empty
     * @param {object} obj 
     * @returns {boolean}
     */
    isEmpty: function(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    },

    /**
     * Group array by key
     * @param {Array} array 
     * @param {string} key 
     * @returns {object}
     */
    groupBy: function(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    },

    /**
     * Sort array by key
     * @param {Array} array 
     * @param {string} key 
     * @param {string} order - 'asc' hoặc 'desc'
     * @returns {Array}
     */
    sortBy: function(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
};


// ==========================================
// ✅ VALIDATOR - Kiểm tra dữ liệu đầu vào
// ==========================================
const Validator = {

    // ==========================================
    // 🔍 BASIC VALIDATIONS
    // ==========================================

    /**
     * Kiểm tra số điện thoại Việt Nam hợp lệ
     * @param {string} phone - Số điện thoại
     * @returns {boolean}
     */
    isValidPhone: function(phone) {
        if (!phone) return false;
        const normalized = Utils.normalizePhone(phone);
        return CONFIG.VALIDATION.PHONE_REGEX.test(normalized);
    },

    /**
     * Kiểm tra email hợp lệ
     * @param {string} email - Email
     * @returns {boolean}
     */
    isValidEmail: function(email) {
        if (!email) return true; // Email không bắt buộc
        return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    },

    /**
     * Kiểm tra tuổi hợp lệ
     * @param {number|string} age - Tuổi
     * @returns {boolean}
     */
    isValidAge: function(age) {
        const num = parseInt(age);
        return !isNaN(num) && num >= CONFIG.VALIDATION.AGE_MIN && num <= CONFIG.VALIDATION.AGE_MAX;
    },

    /**
     * Kiểm tra tên hợp lệ
     * @param {string} name - Tên
     * @returns {boolean}
     */
    isValidName: function(name) {
        if (!name) return false;
        const trimmed = name.trim();
        return trimmed.length >= CONFIG.VALIDATION.NAME_MIN_LENGTH && 
               trimmed.length <= CONFIG.VALIDATION.NAME_MAX_LENGTH;
    },

    /**
     * Kiểm tra số tiền hợp lệ
     * @param {number|string} amount - Số tiền
     * @returns {boolean}
     */
    isValidAmount: function(amount) {
        const num = parseInt(amount);
        return !isNaN(num) && num > 0;
    },

    /**
     * Kiểm tra ngày hợp lệ
     * @param {string} dateStr - Ngày
     * @returns {boolean}
     */
    isValidDate: function(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    /**
     * Kiểm tra ngày không trong quá khứ
     * @param {string} dateStr - Ngày
     * @returns {boolean}
     */
    isNotPastDate: function(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    },

    // ==========================================
    // 📋 FORM VALIDATIONS
    // ==========================================

    /**
     * Validate form học viên
     * @param {object} data - Dữ liệu học viên
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateStudent: function(data) {
        const errors = [];

        if (!this.isValidName(data.name)) {
            errors.push(`Tên học viên phải từ ${CONFIG.VALIDATION.NAME_MIN_LENGTH}-${CONFIG.VALIDATION.NAME_MAX_LENGTH} ký tự`);
        }

        if (!this.isValidAge(data.age)) {
            errors.push(`Tuổi phải từ ${CONFIG.VALIDATION.AGE_MIN}-${CONFIG.VALIDATION.AGE_MAX}`);
        }

        if (!this.isValidName(data.parentName)) {
            errors.push(`Tên phụ huynh phải từ ${CONFIG.VALIDATION.NAME_MIN_LENGTH}-${CONFIG.VALIDATION.NAME_MAX_LENGTH} ký tự`);
        }

        if (!this.isValidPhone(data.parentPhone)) {
            errors.push('Số điện thoại không hợp lệ (10 số, bắt đầu 03/05/07/08/09)');
        }

        if (!this.isValidEmail(data.parentEmail)) {
            errors.push('Email không đúng định dạng');
        }

        if (!data.subjects || data.subjects.length === 0) {
            errors.push('Vui lòng chọn ít nhất 1 môn học');
        }

        if (!data.status) {
            errors.push('Vui lòng chọn trạng thái');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form lịch hẹn
     * @param {object} data - Dữ liệu lịch hẹn
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateAppointment: function(data) {
        const errors = [];

        if (!data.studentId) {
            errors.push('Vui lòng chọn học viên');
        }

        if (!data.subject) {
            errors.push('Vui lòng chọn môn học');
        }

        if (!this.isValidDate(data.date)) {
            errors.push('Ngày hẹn không hợp lệ');
        }

        if (!this.isNotPastDate(data.date)) {
            errors.push('Ngày hẹn không được trong quá khứ');
        }

        if (!data.time) {
            errors.push('Vui lòng chọn giờ hẹn');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form phiếu đăng ký
     * @param {object} data - Dữ liệu phiếu ĐK
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateRegistration: function(data) {
        const errors = [];

        if (!data.studentId) {
            errors.push('Vui lòng chọn học viên');
        }

        if (!data.subject) {
            errors.push('Vui lòng chọn môn học');
        }

        if (!this.isValidAmount(data.tuitionFee)) {
            errors.push('Học phí phải lớn hơn 0');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form biên lai
     * @param {object} data - Dữ liệu biên lai
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateReceipt: function(data) {
        const errors = [];

        if (!data.type) {
            errors.push('Vui lòng chọn loại biên lai');
        }

        if (!data.studentId) {
            errors.push('Vui lòng chọn học viên');
        }

        if (!data.description || data.description.trim().length === 0) {
            errors.push('Vui lòng nhập nội dung');
        }

        if (!this.isValidAmount(data.amount)) {
            errors.push('Số tiền phải lớn hơn 0');
        }

        if (!this.isValidDate(data.date)) {
            errors.push('Ngày không hợp lệ');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form giáo viên
     * @param {object} data - Dữ liệu giáo viên
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateTeacher: function(data) {
        const errors = [];

        if (!this.isValidName(data.fullName)) {
            errors.push(`Tên giáo viên phải từ ${CONFIG.VALIDATION.NAME_MIN_LENGTH}-${CONFIG.VALIDATION.NAME_MAX_LENGTH} ký tự`);
        }

        if (!this.isValidPhone(data.phone)) {
            errors.push('Số điện thoại không hợp lệ');
        }

        if (!this.isValidEmail(data.email)) {
            errors.push('Email không đúng định dạng');
        }

        if (!data.subjectIds || data.subjectIds.length === 0) {
            errors.push('Vui lòng chọn ít nhất 1 môn dạy');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form lớp học
     * @param {object} data - Dữ liệu lớp học
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateClass: function(data) {
        const errors = [];

        if (!this.isValidName(data.name)) {
            errors.push('Tên lớp không hợp lệ');
        }

        if (!data.subjectId) {
            errors.push('Vui lòng chọn môn học');
        }

        if (!data.teacherId) {
            errors.push('Vui lòng chọn giáo viên');
        }

        if (!data.schedule || data.schedule.length === 0) {
            errors.push('Vui lòng thiết lập lịch học');
        }

        if (data.maxStudents && (isNaN(data.maxStudents) || data.maxStudents < 1)) {
            errors.push('Sĩ số tối đa không hợp lệ');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form môn học
     * @param {object} data - Dữ liệu môn học
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateSubject: function(data) {
        const errors = [];

        if (!data.icon || data.icon.trim().length === 0) {
            errors.push('Vui lòng nhập icon');
        }

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Vui lòng nhập tên môn học');
        }

        if (!this.isValidAmount(data.defaultFee)) {
            errors.push('Học phí mặc định phải lớn hơn 0');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form gói học phí
     * @param {object} data - Dữ liệu gói học phí
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validatePackage: function(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Vui lòng nhập tên gói');
        }

        if (!data.subjectName) {
            errors.push('Vui lòng chọn môn học');
        }

        if (!data.sessions || isNaN(data.sessions) || data.sessions < 1) {
            errors.push('Số buổi phải lớn hơn 0');
        }

        if (!this.isValidAmount(data.fee)) {
            errors.push('Học phí phải lớn hơn 0');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form khuyến mãi
     * @param {object} data - Dữ liệu khuyến mãi
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validatePromotion: function(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Vui lòng nhập tên khuyến mãi');
        }

        if (!data.type) {
            errors.push('Vui lòng chọn loại khuyến mãi');
        }

        if (data.value === undefined || isNaN(data.value) || data.value < 0) {
            errors.push('Giá trị khuyến mãi không hợp lệ');
        }

        if (data.type === 'percent' && data.value > 100) {
            errors.push('Phần trăm giảm không được vượt quá 100%');
        }

        if (!this.isValidDate(data.startDate)) {
            errors.push('Ngày bắt đầu không hợp lệ');
        }

        if (!this.isValidDate(data.endDate)) {
            errors.push('Ngày kết thúc không hợp lệ');
        }

        if (new Date(data.startDate) > new Date(data.endDate)) {
            errors.push('Ngày kết thúc phải sau ngày bắt đầu');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate form người dùng (cho Phase 2)
     * @param {object} data - Dữ liệu người dùng
     * @returns {object} { isValid: boolean, errors: string[] }
     */
    validateUser: function(data) {
        const errors = [];

        if (!data.username || data.username.trim().length < 3) {
            errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            errors.push('Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới');
        }

        if (!data.password || data.password.length < 6) {
            errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        }

        if (!this.isValidName(data.fullName)) {
            errors.push('Họ tên không hợp lệ');
        }

        if (!data.role) {
            errors.push('Vui lòng chọn vai trò');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, Validator };
}
