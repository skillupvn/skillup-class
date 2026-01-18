/* ============================================================
   🔧 UTILS.JS - Các hàm tiện ích
   Version: 4.0 - FIXED
   ============================================================ */

const Utils = {
    /**
     * Tạo ID ngẫu nhiên
     */
    generateId: function(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
    },

    /**
     * Format ngày
     */
    formatDate: function(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('vi-VN');
    },

    /**
     * Format ngày giờ
     */
    formatDateTime: function(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('vi-VN');
    },

    /**
     * Format tiền tệ
     */
    formatCurrency: function(amount) {
        if (amount === null || amount === undefined) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    /**
     * Format input tiền tệ
     */
    formatCurrencyInput: function(input) {
        let value = input.value.replace(/[^\d]/g, '');
        if (value) {
            value = parseInt(value).toLocaleString('vi-VN');
        }
        input.value = value;
    },

    /**
     * Parse tiền tệ từ string
     */
    parseCurrency: function(str) {
        if (!str) return 0;
        return parseInt(str.replace(/[^\d]/g, '')) || 0;
    },

    /**
     * Escape HTML
     */
    escapeHtml: function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Xóa dấu tiếng Việt
     */
    removeVietnameseTones: function(str) {
        if (!str) return '';
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    },

    /**
     * Debounce function
     */
    debounce: function(func, wait) {
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
     * Phân trang
     */
    paginate: function(totalItems, currentPage, pageSize) {
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const validPage = Math.max(1, Math.min(currentPage, totalPages));
        const startIndex = (validPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        
        return {
            totalItems,
            currentPage: validPage,
            pageSize,
            totalPages,
            startIndex,
            endIndex
        };
    },

    /**
     * Chuyển số thành chữ
     */
    numberToWords: function(num) {
        if (num === 0) return 'Không đồng';
        
        const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
        const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
        const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
        
        function convertHundreds(n) {
            let result = '';
            if (n >= 100) {
                result += units[Math.floor(n / 100)] + ' trăm ';
                n %= 100;
            }
            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
                if (n > 0) result += units[n] + ' ';
            } else if (n >= 10) {
                result += teens[n - 10] + ' ';
            } else if (n > 0) {
                result += units[n] + ' ';
            }
            return result;
        }
        
        let result = '';
        if (num >= 1000000000) {
            result += convertHundreds(Math.floor(num / 1000000000)) + 'tỷ ';
            num %= 1000000000;
        }
        if (num >= 1000000) {
            result += convertHundreds(Math.floor(num / 1000000)) + 'triệu ';
            num %= 1000000;
        }
        if (num >= 1000) {
            result += convertHundreds(Math.floor(num / 1000)) + 'nghìn ';
            num %= 1000;
        }
        if (num > 0) {
            result += convertHundreds(num);
        }
        
        result = result.trim() + ' đồng';
        return result.charAt(0).toUpperCase() + result.slice(1);
    }
};

// ==========================================
// ✅ VALIDATOR
// ==========================================
const Validator = {
    isValidPhone: function(phone) {
        if (!phone) return false;
        return CONFIG.VALIDATION.PHONE_REGEX.test(phone);
    },

    isValidEmail: function(email) {
        if (!email) return true; // Email không bắt buộc
        return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    },

    isValidName: function(name) {
        if (!name) return false;
        return name.length >= CONFIG.VALIDATION.NAME_MIN_LENGTH && 
               name.length <= CONFIG.VALIDATION.NAME_MAX_LENGTH;
    },

    isValidAge: function(age) {
        const ageNum = parseInt(age);
        return ageNum >= CONFIG.VALIDATION.AGE_MIN && ageNum <= CONFIG.VALIDATION.AGE_MAX;
    },

    validateStudent: function(data) {
        const errors = [];
        if (!this.isValidName(data.name)) errors.push('Tên học viên không hợp lệ');
        if (!this.isValidPhone(data.phone || data.parentPhone)) errors.push('Số điện thoại không hợp lệ');
        if (data.email && !this.isValidEmail(data.email)) errors.push('Email không hợp lệ');
        return errors;
    },

    validateAppointment: function(data) {
        const errors = [];
        if (!data.studentId) errors.push('Vui lòng chọn học viên');
        if (!data.appointmentDate) errors.push('Vui lòng chọn ngày hẹn');
        return errors;
    },

    validateRegistration: function(data) {
        const errors = [];
        if (!data.studentId) errors.push('Vui lòng chọn học viên');
        if (!data.subjectId) errors.push('Vui lòng chọn môn học');
        if (!data.totalAmount || data.totalAmount <= 0) errors.push('Số tiền không hợp lệ');
        return errors;
    },

    validateReceipt: function(data) {
        const errors = [];
        if (!data.amount || data.amount <= 0) errors.push('Số tiền không hợp lệ');
        if (!data.paymentDate) errors.push('Vui lòng chọn ngày thanh toán');
        return errors;
    }
};

// Export global
window.Utils = Utils;
window.Validator = Validator;

console.log('✅ Utils loaded');
