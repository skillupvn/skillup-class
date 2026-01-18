/**
 * ========================================
 * SETTINGS MODULE - Cài đặt hệ thống
 * ========================================
 * File: js/settings.js
 * Version: 4.0
 * Description: Quản lý cài đặt trung tâm, ngân hàng, backup/restore
 */

const SettingsModule = (function() {
    'use strict';

    // ============ PRIVATE METHODS ============

    /**
     * Load thông tin trung tâm vào form
     */
    function loadCenterInfo() {
        const centerInfo = DataModule.get('centerInfo') || {};

        document.getElementById('centerName').value = centerInfo.name || '';
        document.getElementById('centerAddress').value = centerInfo.address || '';
        document.getElementById('centerPhone').value = centerInfo.phone || '';
        document.getElementById('centerEmail').value = centerInfo.email || '';
        document.getElementById('centerWebsite').value = centerInfo.website || '';
        document.getElementById('centerTaxCode').value = centerInfo.taxCode || '';
        document.getElementById('centerLogo').value = centerInfo.logo || '';

        // Preview logo
        updateLogoPreview(centerInfo.logo);
    }

    /**
     * Load thông tin ngân hàng vào form
     */
    function loadBankInfo() {
        const bankInfo = DataModule.get('bankInfo') || {};

        document.getElementById('bankName').value = bankInfo.bankName || '';
        document.getElementById('bankBranch').value = bankInfo.bankBranch || '';
        document.getElementById('bankAccountNumber').value = bankInfo.accountNumber || '';
        document.getElementById('bankAccountName').value = bankInfo.accountName || '';
        document.getElementById('bankQRCode').value = bankInfo.qrCode || '';

        // Preview QR
        updateQRPreview(bankInfo.qrCode);
    }

    /**
     * Cập nhật preview logo
     */
    function updateLogoPreview(url) {
        const preview = document.getElementById('logoPreview');
        if (preview) {
            if (url) {
                preview.innerHTML = `<img src="${Utils.escapeHtml(url)}" alt="Logo" style="max-width: 150px; max-height: 150px;">`;
            } else {
                preview.innerHTML = '<span class="text-muted">Chưa có logo</span>';
            }
        }
    }

    /**
     * Cập nhật preview QR
     */
    function updateQRPreview(url) {
        const preview = document.getElementById('qrPreview');
        if (preview) {
            if (url) {
                preview.innerHTML = `<img src="${Utils.escapeHtml(url)}" alt="QR Code" style="max-width: 150px; max-height: 150px;">`;
            } else {
                preview.innerHTML = '<span class="text-muted">Chưa có QR</span>';
            }
        }
    }

    /**
     * Tính toán dung lượng storage
     */
    function calculateStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // UTF-16
            }
        }
        return total;
    }

    /**
     * Format bytes
     */
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Cập nhật thông tin storage
     */
    function updateStorageInfo() {
        const usedBytes = calculateStorageUsage();
        const maxBytes = 5 * 1024 * 1024; // 5MB typical limit
        const usedPercent = (usedBytes / maxBytes * 100).toFixed(1);

        const infoEl = document.getElementById('storageInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <div class="progress mb-2" style="height: 20px;">
                    <div class="progress-bar ${usedPercent > 80 ? 'bg-danger' : usedPercent > 50 ? 'bg-warning' : 'bg-success'}" 
                         role="progressbar" 
                         style="width: ${usedPercent}%">
                        ${usedPercent}%
                    </div>
                </div>
                <p class="mb-0">Đã sử dụng: <strong>${formatBytes(usedBytes)}</strong> / ${formatBytes(maxBytes)}</p>
            `;
        }
    }

    /**
     * Cập nhật thống kê dữ liệu
     */
    function updateDataStats() {
        const stats = {
            students: DataModule.getAll('students').length,
            parents: DataModule.getAll('parents').length,
            teachers: DataModule.getAll('teachers').length,
            classes: DataModule.getAll('classes').length,
            appointments: DataModule.getAll('appointments').length,
            registrations: DataModule.getAll('registrations').length,
            receipts: DataModule.getAll('receipts').length,
            subjects: DataModule.getAll('subjects').length,
            packages: DataModule.getAll('packages').length,
            promotions: DataModule.getAll('promotions').length
        };

        const container = document.getElementById('dataStats');
        if (container) {
            container.innerHTML = `
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr><th>Loại dữ liệu</th><th class="text-center">Số lượng</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Học viên</td><td class="text-center">${stats.students}</td></tr>
                        <tr><td>Phụ huynh</td><td class="text-center">${stats.parents}</td></tr>
                        <tr><td>Giáo viên</td><td class="text-center">${stats.teachers}</td></tr>
                        <tr><td>Lớp học</td><td class="text-center">${stats.classes}</td></tr>
                        <tr><td>Lịch hẹn</td><td class="text-center">${stats.appointments}</td></tr>
                        <tr><td>Phiếu đăng ký</td><td class="text-center">${stats.registrations}</td></tr>
                        <tr><td>Biên lai</td><td class="text-center">${stats.receipts}</td></tr>
                        <tr><td>Môn học</td><td class="text-center">${stats.subjects}</td></tr>
                        <tr><td>Gói học phí</td><td class="text-center">${stats.packages}</td></tr>
                        <tr><td>Khuyến mãi</td><td class="text-center">${stats.promotions}</td></tr>
                    </tbody>
                </table>
            `;
        }
    }

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo module
         */
        init: function() {
            this.bindEvents();
            this.loadAllSettings();
            console.log('SettingsModule initialized');
        },

        /**
         * Bind sự kiện
         */
        bindEvents: function() {
            // Center info form
            const centerForm = document.getElementById('centerInfoForm');
            if (centerForm) {
                centerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveCenterInfo();
                });
            }

            // Bank info form
            const bankForm = document.getElementById('bankInfoForm');
            if (bankForm) {
                bankForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveBankInfo();
                });
            }

            // Logo URL change
            const logoInput = document.getElementById('centerLogo');
            if (logoInput) {
                logoInput.addEventListener('input', Utils.debounce((e) => {
                    updateLogoPreview(e.target.value);
                }, 500));
            }

            // QR URL change
            const qrInput = document.getElementById('bankQRCode');
            if (qrInput) {
                qrInput.addEventListener('input', Utils.debounce((e) => {
                    updateQRPreview(e.target.value);
                }, 500));
            }

            // Backup button
            const backupBtn = document.getElementById('btnBackup');
            if (backupBtn) {
                backupBtn.addEventListener('click', () => this.backup());
            }

            // Restore button
            const restoreBtn = document.getElementById('btnRestore');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', () => {
                    document.getElementById('restoreFileInput').click();
                });
            }

            // Restore file input
            const restoreInput = document.getElementById('restoreFileInput');
            if (restoreInput) {
                restoreInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.restore(e.target.files[0]);
                        e.target.value = ''; // Reset input
                    }
                });
            }

            // Clear data button
            const clearBtn = document.getElementById('btnClearData');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearAllData());
            }

            // Generate QR button
            const genQRBtn = document.getElementById('btnGenerateQR');
            if (genQRBtn) {
                genQRBtn.addEventListener('click', () => this.generateBankQR());
            }
        },

        /**
         * Load tất cả cài đặt
         */
        loadAllSettings: function() {
            loadCenterInfo();
            loadBankInfo();
            updateStorageInfo();
            updateDataStats();
        },

        /**
         * Refresh
         */
        refresh: function() {
            this.loadAllSettings();
        },

        /**
         * Lưu thông tin trung tâm
         */
        saveCenterInfo: function() {
            const centerInfo = {
                name: document.getElementById('centerName').value.trim(),
                address: document.getElementById('centerAddress').value.trim(),
                phone: document.getElementById('centerPhone').value.trim(),
                email: document.getElementById('centerEmail').value.trim(),
                website: document.getElementById('centerWebsite').value.trim(),
                taxCode: document.getElementById('centerTaxCode').value.trim(),
                logo: document.getElementById('centerLogo').value.trim()
            };

            // Validate
            if (!centerInfo.name) {
                UIModule.showNotification('Vui lòng nhập tên trung tâm', 'error');
                return;
            }

            const success = DataModule.set('centerInfo', centerInfo);
            if (success) {
                UIModule.showNotification('Đã lưu thông tin trung tâm', 'success');
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        /**
         * Lưu thông tin ngân hàng
         */
        saveBankInfo: function() {
            const bankInfo = {
                bankName: document.getElementById('bankName').value.trim(),
                bankBranch: document.getElementById('bankBranch').value.trim(),
                accountNumber: document.getElementById('bankAccountNumber').value.trim(),
                accountName: document.getElementById('bankAccountName').value.trim(),
                qrCode: document.getElementById('bankQRCode').value.trim()
            };

            const success = DataModule.set('bankInfo', bankInfo);
            if (success) {
                UIModule.showNotification('Đã lưu thông tin ngân hàng', 'success');
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        /**
         * Tạo QR chuyển khoản
         */
        generateBankQR: function() {
            const bankName = document.getElementById('bankName').value.trim();
            const accountNumber = document.getElementById('bankAccountNumber').value.trim();
            const accountName = document.getElementById('bankAccountName').value.trim();

            if (!accountNumber) {
                UIModule.showNotification('Vui lòng nhập số tài khoản', 'error');
                return;
            }

            // Tạo VietQR URL (format chuẩn)
            // Lưu ý: Đây chỉ là ví dụ, thực tế cần dùng API của VietQR
            const bankCode = this.getBankCode(bankName);
            if (!bankCode) {
                UIModule.showNotification('Không xác định được mã ngân hàng. Vui lòng nhập URL QR thủ công.', 'warning');
                return;
            }

            const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.png?accountName=${encodeURIComponent(accountName)}`;
            
            document.getElementById('bankQRCode').value = qrUrl;
            updateQRPreview(qrUrl);
            UIModule.showNotification('Đã tạo mã QR', 'success');
        },

        /**
         * Lấy mã ngân hàng từ tên
         */
        getBankCode: function(bankName) {
            const bankCodes = {
                'vietcombank': 'VCB',
                'vcb': 'VCB',
                'techcombank': 'TCB',
                'tcb': 'TCB',
                'vietinbank': 'CTG',
                'ctg': 'CTG',
                'bidv': 'BIDV',
                'agribank': 'VBA',
                'vba': 'VBA',
                'mbbank': 'MB',
                'mb': 'MB',
                'vpbank': 'VPB',
                'vpb': 'VPB',
                'acb': 'ACB',
                'sacombank': 'STB',
                'stb': 'STB',
                'tpbank': 'TPB',
                'tpb': 'TPB',
                'hdbank': 'HDB',
                'hdb': 'HDB',
                'ocb': 'OCB',
                'shb': 'SHB',
                'msb': 'MSB',
                'vib': 'VIB',
                'seabank': 'SEAB',
                'eximbank': 'EIB'
            };

            const normalizedName = bankName.toLowerCase().replace(/\s+/g, '');
            
            for (const [key, code] of Object.entries(bankCodes)) {
                if (normalizedName.includes(key)) {
                    return code;
                }
            }

            return null;
        },

        /**
         * Backup dữ liệu
         */
        backup: function() {
            ExportModule.exportAllData();
        },

        /**
         * Restore dữ liệu
         */
        restore: function(file) {
            if (!file) return;

            if (!file.name.endsWith('.json')) {
                UIModule.showNotification('Vui lòng chọn file JSON', 'error');
                return;
            }

            ExportModule.importFromJSON(file);
        },

        /**
         * Xóa toàn bộ dữ liệu
         */
        clearAllData: function() {
            UIModule.showConfirm(
                `<div class="text-center">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5>XÓA TOÀN BỘ DỮ LIỆU?</h5>
                    <p class="text-danger">Hành động này không thể hoàn tác!</p>
                    <p>Hãy chắc chắn bạn đã backup dữ liệu trước khi xóa.</p>
                </div>`,
                () => {
                    // Xác nhận lần 2
                    UIModule.showConfirm(
                        'Nhập "XÓA" để xác nhận:',
                        () => {
                            // Xóa tất cả localStorage
                            const keysToKeep = []; // Có thể giữ lại một số key nếu cần
                            
                            Object.keys(localStorage).forEach(key => {
                                if (!keysToKeep.includes(key)) {
                                    localStorage.removeItem(key);
                                }
                            });

                            UIModule.showNotification('Đã xóa toàn bộ dữ liệu! Đang tải lại...', 'success');
                            setTimeout(() => location.reload(), 1500);
                        },
                        'Xác nhận xóa dữ liệu'
                    );
                },
                'Cảnh báo'
            );
        },

        /**
         * Lấy thông tin trung tâm
         */
        getCenterInfo: function() {
            return DataModule.get('centerInfo') || {};
        },

        /**
         * Lấy thông tin ngân hàng
         */
        getBankInfo: function() {
            return DataModule.get('bankInfo') || {};
        }
    };
})();
