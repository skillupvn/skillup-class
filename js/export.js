/**
 * ========================================
 * EXPORT MODULE - Xuất dữ liệu
 * ========================================
 * File: js/export.js
 * Version: 4.0
 * Description: Xuất dữ liệu ra Excel, PDF, JSON
 */

const ExportModule = (function() {
    'use strict';

    // ============ PRIVATE METHODS ============

    /**
     * Chuẩn hóa dữ liệu trước khi xuất
     */
    function normalizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(item => {
            const normalized = {};
            Object.keys(item).forEach(key => {
                let value = item[key];
                // Xử lý các kiểu đặc biệt
                if (value === null || value === undefined) {
                    value = '';
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                normalized[key] = value;
            });
            return normalized;
        });
    }

    /**
     * Tạo tên file với timestamp
     */
    function generateFileName(baseName, extension) {
        const date = new Date();
        const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
        return `${baseName}_${timestamp}.${extension}`;
    }

    /**
     * Download file
     */
    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Chuyển dữ liệu sang CSV
     */
    function toCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Header row
        csvRows.push(headers.map(h => `"${h}"`).join(','));

        // Data rows
        data.forEach(row => {
            const values = headers.map(h => {
                let value = row[h];
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                }
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        });

        // Add BOM for UTF-8
        return '\ufeff' + csvRows.join('\n');
    }

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo module
         */
        init: function() {
            this.bindEvents();
            console.log('ExportModule initialized');
        },

        /**
         * Bind sự kiện
         */
        bindEvents: function() {
            // Export buttons
            document.querySelectorAll('[data-export]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.currentTarget.dataset.export;
                    const format = e.currentTarget.dataset.format || 'excel';
                    this.exportData(type, format);
                });
            });
        },

        /**
         * Xuất ra Excel (XLSX)
         */
        toExcel: function(data, fileName = 'Export') {
            try {
                if (typeof XLSX === 'undefined') {
                    UIModule.showNotification('Thư viện XLSX chưa được tải', 'error');
                    return false;
                }

                const normalizedData = normalizeData(data);
                if (normalizedData.length === 0) {
                    UIModule.showNotification('Không có dữ liệu để xuất', 'warning');
                    return false;
                }

                // Tạo workbook
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(normalizedData);

                // Auto-width columns
                const colWidths = [];
                const headers = Object.keys(normalizedData[0]);
                headers.forEach((h, i) => {
                    let maxWidth = h.length;
                    normalizedData.forEach(row => {
                        const cellValue = String(row[h] || '');
                        maxWidth = Math.max(maxWidth, cellValue.length);
                    });
                    colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
                });
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, 'Data');

                // Xuất file
                const fullFileName = generateFileName(fileName, 'xlsx');
                XLSX.writeFile(wb, fullFileName);

                UIModule.showNotification(`Đã xuất file: ${fullFileName}`, 'success');
                return true;

            } catch (error) {
                console.error('Export Excel error:', error);
                UIModule.showNotification('Có lỗi khi xuất Excel', 'error');
                return false;
            }
        },

        /**
         * Xuất ra CSV
         */
        toCSV: function(data, fileName = 'Export') {
            try {
                const normalizedData = normalizeData(data);
                if (normalizedData.length === 0) {
                    UIModule.showNotification('Không có dữ liệu để xuất', 'warning');
                    return false;
                }

                const csvContent = toCSV(normalizedData);
                const fullFileName = generateFileName(fileName, 'csv');
                downloadFile(csvContent, fullFileName, 'text/csv;charset=utf-8');

                UIModule.showNotification(`Đã xuất file: ${fullFileName}`, 'success');
                return true;

            } catch (error) {
                console.error('Export CSV error:', error);
                UIModule.showNotification('Có lỗi khi xuất CSV', 'error');
                return false;
            }
        },

        /**
         * Xuất ra JSON
         */
        toJSON: function(data, fileName = 'Export') {
            try {
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    UIModule.showNotification('Không có dữ liệu để xuất', 'warning');
                    return false;
                }

                const jsonContent = JSON.stringify(data, null, 2);
                const fullFileName = generateFileName(fileName, 'json');
                downloadFile(jsonContent, fullFileName, 'application/json');

                UIModule.showNotification(`Đã xuất file: ${fullFileName}`, 'success');
                return true;

            } catch (error) {
                console.error('Export JSON error:', error);
                UIModule.showNotification('Có lỗi khi xuất JSON', 'error');
                return false;
            }
        },

        /**
         * Xuất ra PDF (sử dụng html2pdf)
         */
        toPDF: function(elementId, fileName = 'Export', options = {}) {
            try {
                if (typeof html2pdf === 'undefined') {
                    UIModule.showNotification('Thư viện html2pdf chưa được tải', 'error');
                    return false;
                }

                const element = document.getElementById(elementId);
                if (!element) {
                    UIModule.showNotification('Không tìm thấy nội dung để xuất', 'error');
                    return false;
                }

                const defaultOptions = {
                    margin: 10,
                    filename: generateFileName(fileName, 'pdf'),
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                const mergedOptions = { ...defaultOptions, ...options };

                html2pdf().set(mergedOptions).from(element).save();

                UIModule.showNotification('Đang tạo PDF...', 'info');
                return true;

            } catch (error) {
                console.error('Export PDF error:', error);
                UIModule.showNotification('Có lỗi khi xuất PDF', 'error');
                return false;
            }
        },

        /**
         * Xuất dữ liệu theo loại
         */
        exportData: function(dataType, format = 'excel') {
            let data = [];
            let fileName = '';

            switch (dataType) {
                case 'students':
                    data = this.prepareStudentsExport();
                    fileName = 'DanhSachHocVien';
                    break;

                case 'registrations':
                    data = this.prepareRegistrationsExport();
                    fileName = 'DanhSachPhieuDK';
                    break;

                case 'receipts':
                    data = this.prepareReceiptsExport();
                    fileName = 'DanhSachBienLai';
                    break;

                case 'appointments':
                    data = this.prepareAppointmentsExport();
                    fileName = 'DanhSachLichHen';
                    break;

                case 'all':
                    return this.exportAllData();

                default:
                    UIModule.showNotification('Loại dữ liệu không hợp lệ', 'error');
                    return false;
            }

            switch (format) {
                case 'excel':
                    return this.toExcel(data, fileName);
                case 'csv':
                    return this.toCSV(data, fileName);
                case 'json':
                    return this.toJSON(data, fileName);
                default:
                    return this.toExcel(data, fileName);
            }
        },

        /**
         * Chuẩn bị dữ liệu học viên
         */
        prepareStudentsExport: function() {
            const students = DataModule.getAll('students');
            return students.map((s, index) => ({
                'STT': index + 1,
                'Họ tên': s.name || '',
                'Ngày sinh': Utils.formatDate(s.birthDate) || '',
                'Giới tính': s.gender === 'male' ? 'Nam' : (s.gender === 'female' ? 'Nữ' : ''),
                'SĐT': s.phone || '',
                'Email': s.email || '',
                'Địa chỉ': s.address || '',
                'Phụ huynh': s.parentName || '',
                'SĐT PH': s.parentPhone || '',
                'Trạng thái': s.status === 'active' ? 'Đang học' : 'Nghỉ học',
                'Ngày tạo': Utils.formatDate(s.createdAt) || '',
                'Ghi chú': s.note || ''
            }));
        },

        /**
         * Chuẩn bị dữ liệu phiếu đăng ký
         */
        prepareRegistrationsExport: function() {
            const registrations = DataModule.getAll('registrations');
            const students = DataModule.getAll('students');
            const subjects = DataModule.getAll('subjects');

            return registrations.map((r, index) => {
                const student = students.find(s => s.id === r.studentId);
                const subject = subjects.find(s => s.id === r.subjectId);

                return {
                    'STT': index + 1,
                    'Mã phiếu': r.registrationCode || r.id,
                    'Học viên': student?.name || '',
                    'SĐT': student?.phone || '',
                    'Môn học': subject?.name || '',
                    'Số buổi': r.sessions || '',
                    'Tổng phí': r.totalAmount || 0,
                    'Ngày ĐK': Utils.formatDate(r.createdAt),
                    'Ngày bắt đầu': Utils.formatDate(r.startDate),
                    'Trạng thái': this.getRegistrationStatus(r.status),
                    'Ghi chú': r.note || ''
                };
            });
        },

        /**
         * Chuẩn bị dữ liệu biên lai
         */
        prepareReceiptsExport: function() {
            const receipts = DataModule.getAll('receipts');
            const students = DataModule.getAll('students');
            const registrations = DataModule.getAll('registrations');

            return receipts.map((r, index) => {
                const reg = registrations.find(reg => reg.id === r.registrationId);
                const student = reg 
                    ? students.find(s => s.id === reg.studentId)
                    : students.find(s => s.id === r.studentId);

                return {
                    'STT': index + 1,
                    'Mã biên lai': r.receiptCode || r.id,
                    'Học viên': student?.name || '',
                    'SĐT': student?.phone || '',
                    'Số tiền': r.amount || 0,
                    'Hình thức': this.getPaymentMethodText(r.paymentMethod),
                    'Ngày TT': Utils.formatDate(r.paymentDate),
                    'Trạng thái': r.status === 'completed' ? 'Hoàn thành' : 'Chờ',
                    'Ghi chú': r.note || ''
                };
            });
        },

        /**
         * Chuẩn bị dữ liệu lịch hẹn
         */
        prepareAppointmentsExport: function() {
            const appointments = DataModule.getAll('appointments');
            const students = DataModule.getAll('students');

            return appointments.map((a, index) => {
                const student = students.find(s => s.id === a.studentId);

                return {
                    'STT': index + 1,
                    'Học viên': student?.name || '',
                    'SĐT': student?.phone || '',
                    'Loại hẹn': a.appointmentType || '',
                    'Ngày hẹn': Utils.formatDate(a.appointmentDate),
                    'Giờ hẹn': a.appointmentTime || '',
                    'Người PTC': a.handler || '',
                    'Trạng thái': this.getAppointmentStatus(a.status),
                    'Ghi chú': a.note || ''
                };
            });
        },

        /**
         * Xuất toàn bộ dữ liệu (backup)
         */
        exportAllData: function() {
            const allData = {
                exportDate: new Date().toISOString(),
                version: CONFIG.APP.VERSION,
                data: {
                    students: DataModule.getAll('students'),
                    parents: DataModule.getAll('parents'),
                    appointments: DataModule.getAll('appointments'),
                    registrations: DataModule.getAll('registrations'),
                    receipts: DataModule.getAll('receipts'),
                    subjects: DataModule.getAll('subjects'),
                    packages: DataModule.getAll('packages'),
                    promotions: DataModule.getAll('promotions'),
                    teachers: DataModule.getAll('teachers'),
                    classes: DataModule.getAll('classes'),
                    centerInfo: DataModule.get('centerInfo'),
                    bankInfo: DataModule.get('bankInfo')
                }
            };

            return this.toJSON(allData, 'BackupData');
        },

        /**
         * Import dữ liệu từ JSON
         */
        importFromJSON: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        const imported = JSON.parse(e.target.result);

                        if (!imported.data) {
                            throw new Error('File không đúng định dạng');
                        }

                        // Xác nhận trước khi import
                        UIModule.showConfirm(
                            `<div>
                                <p><strong>Xác nhận import dữ liệu?</strong></p>
                                <p class="text-danger">⚠️ Dữ liệu hiện tại sẽ bị ghi đè!</p>
                                <p>File backup từ: ${Utils.formatDateTime(imported.exportDate)}</p>
                            </div>`,
                            () => {
                                // Import từng loại dữ liệu
                                Object.keys(imported.data).forEach(key => {
                                    if (Array.isArray(imported.data[key])) {
                                        localStorage.setItem(
                                            CONFIG.STORAGE_KEYS[key.toUpperCase()] || `app_${key}`,
                                            JSON.stringify(imported.data[key])
                                        );
                                    } else if (imported.data[key]) {
                                        localStorage.setItem(
                                            CONFIG.STORAGE_KEYS[key.toUpperCase()] || `app_${key}`,
                                            JSON.stringify(imported.data[key])
                                        );
                                    }
                                });

                                UIModule.showNotification('Import dữ liệu thành công! Đang tải lại trang...', 'success');
                                setTimeout(() => location.reload(), 1500);
                                resolve(true);
                            },
                            'Import dữ liệu'
                        );

                    } catch (error) {
                        console.error('Import error:', error);
                        UIModule.showNotification('Có lỗi khi đọc file: ' + error.message, 'error');
                        reject(error);
                    }
                };

                reader.onerror = () => {
                    UIModule.showNotification('Không thể đọc file', 'error');
                    reject(new Error('File read error'));
                };

                reader.readAsText(file);
            });
        },

        // ========== HELPER METHODS ==========
        getRegistrationStatus: function(status) {
            const statuses = {
                'pending': 'Chờ xử lý',
                'active': 'Đang học',
                'completed': 'Hoàn thành',
                'cancelled': 'Đã hủy',
                'expired': 'Hết hạn'
            };
            return statuses[status] || status;
        },

        getAppointmentStatus: function(status) {
            const statuses = {
                'pending': 'Chờ xác nhận',
                'confirmed': 'Đã xác nhận',
                'completed': 'Hoàn thành',
                'cancelled': 'Đã hủy',
                'no-show': 'Không đến'
            };
            return statuses[status] || status;
        },

        getPaymentMethodText: function(method) {
            const methods = {
                'cash': 'Tiền mặt',
                'transfer': 'Chuyển khoản',
                'card': 'Thẻ',
                'momo': 'MoMo',
                'vnpay': 'VNPay'
            };
            return methods[method] || method;
        }
    };
})();
