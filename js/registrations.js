/**
 * ========================================
 * REGISTRATIONS MODULE - Quản lý Phiếu đăng ký
 * ========================================
 * File: js/registrations.js
 * Version: 4.0
 * Description: Quản lý phiếu đăng ký học
 */

const RegistrationsModule = (function() {
    'use strict';

    // ============ PRIVATE VARIABLES ============
    let currentPage = 1;
    let pageSize = (CONFIG && CONFIG.DEFAULTS) ? CONFIG.DEFAULTS.PAGE_SIZE : 10;
    let searchKeyword = '';
    let filterStatus = 'all';
    let filterSubject = 'all';
    let sortField = 'createdAt';
    let sortOrder = 'desc';

    // ============ PRIVATE METHODS ============

    /**
     * Lấy danh sách phiếu đăng ký đã lọc
     */
    function getFilteredRegistrations() {
        let registrations = DataModule.getAll('registrations');
        const students = DataModule.getAll('students');
        const subjects = DataModule.getAll('subjects');
        const packages = DataModule.getAll('packages');

        // Gắn thông tin liên quan
        registrations = registrations.map(reg => {
            const student = students.find(s => s.id === reg.studentId);
            const subject = subjects.find(s => s.id === reg.subjectId);
            const pkg = packages.find(p => p.id === reg.packageId);
            
            return {
                ...reg,
                studentName: student ? student.name : 'Không xác định',
                studentPhone: student ? student.phone : '',
                subjectName: subject ? subject.name : 'Không xác định',
                packageName: pkg ? pkg.name : ''
            };
        });

        // Lọc theo từ khóa
        if (searchKeyword) {
            const keyword = Utils.removeVietnameseTones(searchKeyword.toLowerCase());
            registrations = registrations.filter(reg => {
                const name = Utils.removeVietnameseTones((reg.studentName || '').toLowerCase());
                const phone = (reg.studentPhone || '').toLowerCase();
                const regCode = (reg.registrationCode || '').toLowerCase();
                return name.includes(keyword) || 
                       phone.includes(keyword) ||
                       regCode.includes(keyword);
            });
        }

        // Lọc theo trạng thái
        if (filterStatus !== 'all') {
            registrations = registrations.filter(reg => reg.status === filterStatus);
        }

        // Lọc theo môn học
        if (filterSubject !== 'all') {
            registrations = registrations.filter(reg => reg.subjectId === filterSubject);
        }

        // Sắp xếp
        registrations.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (sortField === 'createdAt' || sortField === 'startDate') {
                valueA = new Date(valueA || 0);
                valueB = new Date(valueB || 0);
            } else if (sortField === 'totalAmount') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            }
            return valueA < valueB ? 1 : -1;
        });

        return registrations;
    }

    /**
     * Render danh sách phiếu đăng ký
     */
    function renderRegistrations() {
        const container = document.getElementById('registrationsList');
        if (!container) return;

        const registrations = getFilteredRegistrations();
        const { startIndex, endIndex, totalPages } = Utils.paginate(
            registrations.length,
            currentPage,
            pageSize
        );

        if (registrations.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="fas fa-file-alt fa-3x mb-3 d-block"></i>
                        Không có phiếu đăng ký nào
                    </td>
                </tr>
            `;
            renderPagination(0, 0);
            return;
        }

        const pageData = registrations.slice(startIndex, endIndex);
        let html = '';

        pageData.forEach((reg, index) => {
            const statusClass = getStatusClass(reg.status);
            const statusText = getStatusText(reg.status);
            const paidAmount = calculatePaidAmount(reg.id);
            const remaining = (reg.totalAmount || 0) - paidAmount;

            html += `
                <tr data-id="${reg.id}">
                    <td class="text-center">${startIndex + index + 1}</td>
                    <td>
                        <strong class="text-primary">${Utils.escapeHtml(reg.registrationCode || reg.id)}</strong>
                    </td>
                    <td>
                        <strong>${Utils.escapeHtml(reg.studentName)}</strong>
                        <br><small class="text-muted">${Utils.escapeHtml(reg.studentPhone)}</small>
                    </td>
                    <td>
                        ${Utils.escapeHtml(reg.subjectName)}
                        ${reg.packageName ? `<br><small class="text-muted">${Utils.escapeHtml(reg.packageName)}</small>` : ''}
                    </td>
                    <td class="text-end">
                        <strong>${Utils.formatCurrency(reg.totalAmount)}</strong>
                    </td>
                    <td class="text-end">
                        <span class="text-success">${Utils.formatCurrency(paidAmount)}</span>
                        ${remaining > 0 ? `<br><small class="text-danger">Còn: ${Utils.formatCurrency(remaining)}</small>` : ''}
                    </td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>${Utils.formatDate(reg.createdAt)}</td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-info" onclick="RegistrationsModule.view('${reg.id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-primary" onclick="RegistrationsModule.edit('${reg.id}')" title="Sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${remaining > 0 ? `
                            <button class="btn btn-outline-success" onclick="RegistrationsModule.addPayment('${reg.id}')" title="Thanh toán">
                                <i class="fas fa-money-bill"></i>
                            </button>` : ''}
                            <button class="btn btn-outline-danger" onclick="RegistrationsModule.delete('${reg.id}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        renderPagination(registrations.length, totalPages);
        updateStatistics();
    }

    /**
     * Render phân trang
     */
    function renderPagination(total, totalPages) {
        const container = document.getElementById('registrationsPagination');
        if (!container) return;

        const info = document.getElementById('registrationsInfo');
        if (info) {
            const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, total);
            info.textContent = `Hiển thị ${start}-${end} / ${total} phiếu`;
        }

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = UIModule.renderPagination(currentPage, totalPages, 'RegistrationsModule.goToPage');
    }

    /**
     * Tính số tiền đã thanh toán
     */
    function calculatePaidAmount(registrationId) {
        const receipts = DataModule.getAll('receipts');
        return receipts
            .filter(r => r.registrationId === registrationId && r.status === 'completed')
            .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }

    /**
     * Cập nhật thống kê
     */
    function updateStatistics() {
        const registrations = DataModule.getAll('registrations');
        const receipts = DataModule.getAll('receipts');

        let totalAmount = 0;
        let paidAmount = 0;

        registrations.forEach(reg => {
            totalAmount += parseFloat(reg.totalAmount) || 0;
            paidAmount += calculatePaidAmount(reg.id);
        });

        const stats = {
            total: registrations.length,
            active: registrations.filter(r => r.status === 'active').length,
            pending: registrations.filter(r => r.status === 'pending').length,
            completed: registrations.filter(r => r.status === 'completed').length,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            remainingAmount: totalAmount - paidAmount
        };

        // Cập nhật UI
        const elements = {
            'stat-registrations-total': stats.total,
            'stat-registrations-active': stats.active,
            'stat-registrations-totalAmount': Utils.formatCurrency(stats.totalAmount),
            'stat-registrations-paidAmount': Utils.formatCurrency(stats.paidAmount),
            'stat-registrations-remaining': Utils.formatCurrency(stats.remainingAmount)
        };

        Object.keys(elements).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = elements[id];
        });
    }

    /**
     * Lấy class CSS theo trạng thái
     */
    function getStatusClass(status) {
        const classes = {
            'pending': 'bg-warning text-dark',
            'active': 'bg-success',
            'completed': 'bg-info',
            'cancelled': 'bg-secondary',
            'expired': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    /**
     * Lấy text hiển thị theo trạng thái
     */
    function getStatusText(status) {
        const texts = {
            'pending': 'Chờ xử lý',
            'active': 'Đang học',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'expired': 'Hết hạn'
        };
        return texts[status] || 'Không xác định';
    }

    /**
     * Populate dropdowns
     */
    function populateDropdowns() {
        // Học viên
        const studentSelect = document.getElementById('regStudentId');
        if (studentSelect) {
            const students = DataModule.getAll('students');
            let options = '<option value="">-- Chọn học viên --</option>';
            students.forEach(s => {
                options += `<option value="${s.id}">${Utils.escapeHtml(s.name)} - ${Utils.escapeHtml(s.phone)}</option>`;
            });
            studentSelect.innerHTML = options;
        }

        // Môn học
        const subjectSelect = document.getElementById('regSubjectId');
        if (subjectSelect) {
            const subjects = DataModule.getAll('subjects');
            let options = '<option value="">-- Chọn môn học --</option>';
            subjects.forEach(s => {
                options += `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`;
            });
            subjectSelect.innerHTML = options;
        }

        // Gói học phí
        const packageSelect = document.getElementById('regPackageId');
        if (packageSelect) {
            const packages = DataModule.getAll('packages');
            let options = '<option value="">-- Chọn gói (tùy chọn) --</option>';
            packages.forEach(p => {
                options += `<option value="${p.id}" data-price="${p.price}">${Utils.escapeHtml(p.name)} - ${Utils.formatCurrency(p.price)}</option>`;
            });
            packageSelect.innerHTML = options;
        }

        // Khuyến mãi
        const promoSelect = document.getElementById('regPromotionId');
        if (promoSelect) {
            const promotions = DataModule.getAll('promotions').filter(p => p.isActive);
            let options = '<option value="">-- Không áp dụng --</option>';
            promotions.forEach(p => {
                const discountText = p.discountType === 'percent' 
                    ? `${p.discountValue}%` 
                    : Utils.formatCurrency(p.discountValue);
                options += `<option value="${p.id}" data-type="${p.discountType}" data-value="${p.discountValue}">${Utils.escapeHtml(p.name)} (-${discountText})</option>`;
            });
            promoSelect.innerHTML = options;
        }

        // Filter môn học
        const filterSubjectSelect = document.getElementById('filterRegSubject');
        if (filterSubjectSelect) {
            const subjects = DataModule.getAll('subjects');
            let options = '<option value="all">Tất cả môn học</option>';
            subjects.forEach(s => {
                options += `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`;
            });
            filterSubjectSelect.innerHTML = options;
        }
    }

    /**
     * Tính toán học phí
     */
    function calculateFee() {
        const packageSelect = document.getElementById('regPackageId');
        const sessionsInput = document.getElementById('regSessions');
        const pricePerSessionInput = document.getElementById('regPricePerSession');
        const promoSelect = document.getElementById('regPromotionId');
        const totalInput = document.getElementById('regTotalAmount');

        let baseAmount = 0;

        // Nếu chọn gói
        if (packageSelect && packageSelect.value) {
            const selectedOption = packageSelect.options[packageSelect.selectedIndex];
            baseAmount = parseFloat(selectedOption.dataset.price) || 0;
        } else {
            // Tính theo số buổi
            const sessions = parseInt(sessionsInput?.value) || 0;
            const pricePerSession = parseFloat(pricePerSessionInput?.value) || 0;
            baseAmount = sessions * pricePerSession;
        }

        // Áp dụng khuyến mãi
        let discount = 0;
        if (promoSelect && promoSelect.value) {
            const selectedPromo = promoSelect.options[promoSelect.selectedIndex];
            const discountType = selectedPromo.dataset.type;
            const discountValue = parseFloat(selectedPromo.dataset.value) || 0;

            if (discountType === 'percent') {
                discount = baseAmount * discountValue / 100;
            } else {
                discount = discountValue;
            }
        }

        const finalAmount = Math.max(0, baseAmount - discount);
        if (totalInput) {
            totalInput.value = finalAmount;
        }

        // Hiển thị chi tiết
        const detailEl = document.getElementById('regFeeDetail');
        if (detailEl) {
            detailEl.innerHTML = `
                <small class="text-muted">
                    Gốc: ${Utils.formatCurrency(baseAmount)}
                    ${discount > 0 ? ` - Giảm: ${Utils.formatCurrency(discount)}` : ''}
                    = <strong>${Utils.formatCurrency(finalAmount)}</strong>
                </small>
            `;
        }
    }

    /**
     * Reset form
     */
    function resetForm() {
        const form = document.getElementById('registrationForm');
        if (form) {
            form.reset();
            document.getElementById('regId').value = '';
        }
        populateDropdowns();
        
        // Set ngày mặc định
        const startDateInput = document.getElementById('regStartDate');
        if (startDateInput) {
            startDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Load dữ liệu vào form
     */
    function loadFormData(registration) {
        document.getElementById('regId').value = registration.id || '';
        document.getElementById('regStudentId').value = registration.studentId || '';
        document.getElementById('regSubjectId').value = registration.subjectId || '';
        document.getElementById('regPackageId').value = registration.packageId || '';
        document.getElementById('regSessions').value = registration.sessions || '';
        document.getElementById('regPricePerSession').value = registration.pricePerSession || '';
        document.getElementById('regStartDate').value = registration.startDate || '';
        document.getElementById('regEndDate').value = registration.endDate || '';
        document.getElementById('regPromotionId').value = registration.promotionId || '';
        document.getElementById('regTotalAmount').value = registration.totalAmount || '';
        document.getElementById('regNote').value = registration.note || '';
        document.getElementById('regStatus').value = registration.status || 'pending';

        calculateFee();
    }

    /**
     * Thu thập dữ liệu từ form
     */
    function collectFormData() {
        const id = document.getElementById('regId').value;
        return {
            id: id || Utils.generateId('REG'),
            registrationCode: id ? undefined : generateRegistrationCode(),
            studentId: document.getElementById('regStudentId').value,
            subjectId: document.getElementById('regSubjectId').value,
            packageId: document.getElementById('regPackageId').value || null,
            sessions: parseInt(document.getElementById('regSessions').value) || 0,
            pricePerSession: parseFloat(document.getElementById('regPricePerSession').value) || 0,
            startDate: document.getElementById('regStartDate').value,
            endDate: document.getElementById('regEndDate').value || null,
            promotionId: document.getElementById('regPromotionId').value || null,
            totalAmount: parseFloat(document.getElementById('regTotalAmount').value) || 0,
            note: document.getElementById('regNote').value.trim(),
            status: document.getElementById('regStatus').value || 'pending'
        };
    }

    /**
     * Tạo mã phiếu đăng ký
     */
    function generateRegistrationCode() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `DK${year}${month}${random}`;
    }

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo module
         */
        init: function() {
            this.bindEvents();
            populateDropdowns();
            renderRegistrations();
            console.log('RegistrationsModule initialized');
        },

        /**
         * Bind sự kiện
         */
        bindEvents: function() {
            // Search
            const searchInput = document.getElementById('searchRegistrations');
            if (searchInput) {
                searchInput.addEventListener('input', Utils.debounce((e) => {
                    searchKeyword = e.target.value;
                    currentPage = 1;
                    renderRegistrations();
                }, 300));
            }

            // Filter status
            const statusFilter = document.getElementById('filterRegStatus');
            if (statusFilter) {
                statusFilter.addEventListener('change', (e) => {
                    filterStatus = e.target.value;
                    currentPage = 1;
                    renderRegistrations();
                });
            }

            // Filter subject
            const subjectFilter = document.getElementById('filterRegSubject');
            if (subjectFilter) {
                subjectFilter.addEventListener('change', (e) => {
                    filterSubject = e.target.value;
                    currentPage = 1;
                    renderRegistrations();
                });
            }

            // Page size
            const pageSizeSelect = document.getElementById('registrationsPageSize');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    pageSize = parseInt(e.target.value);
                    currentPage = 1;
                    renderRegistrations();
                });
            }

            // Tính phí khi thay đổi
            ['regPackageId', 'regSessions', 'regPricePerSession', 'regPromotionId'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('change', calculateFee);
                    el.addEventListener('input', calculateFee);
                }
            });

            // Form submit
            const form = document.getElementById('registrationForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.save();
                });
            }
        },

        /**
         * Refresh
         */
        refresh: function() {
            populateDropdowns();
            renderRegistrations();
        },

        /**
         * Chuyển trang
         */
        goToPage: function(page) {
            currentPage = page;
            renderRegistrations();
        },

        /**
         * Mở modal thêm mới
         */
        openAddModal: function() {
            resetForm();
            document.getElementById('regModalTitle').textContent = 'Thêm phiếu đăng ký';
            UIModule.openModal('registrationModal');
        },

        /**
         * Xem chi tiết
         */
        view: function(id) {
            const reg = DataModule.getById('registrations', id);
            if (!reg) {
                UIModule.showNotification('Không tìm thấy phiếu đăng ký', 'error');
                return;
            }

            const student = DataModule.getById('students', reg.studentId);
            const subject = DataModule.getById('subjects', reg.subjectId);
            const pkg = reg.packageId ? DataModule.getById('packages', reg.packageId) : null;
            const paidAmount = calculatePaidAmount(reg.id);
            const remaining = (reg.totalAmount || 0) - paidAmount;

            const receipts = DataModule.getAll('receipts').filter(r => r.registrationId === id);

            let receiptsHtml = receipts.length > 0 
                ? receipts.map(r => `
                    <tr>
                        <td>${Utils.formatDate(r.paymentDate)}</td>
                        <td>${Utils.formatCurrency(r.amount)}</td>
                        <td>${Utils.escapeHtml(r.paymentMethod || '')}</td>
                        <td><span class="badge ${r.status === 'completed' ? 'bg-success' : 'bg-warning'}">${r.status === 'completed' ? 'Hoàn thành' : 'Chờ'}</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="4" class="text-center text-muted">Chưa có thanh toán</td></tr>';

            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Thông tin phiếu</h6>
                        <table class="table table-sm">
                            <tr><td class="text-muted">Mã phiếu:</td><td><strong>${Utils.escapeHtml(reg.registrationCode || reg.id)}</strong></td></tr>
                            <tr><td class="text-muted">Học viên:</td><td>${Utils.escapeHtml(student?.name || '')}</td></tr>
                            <tr><td class="text-muted">Môn học:</td><td>${Utils.escapeHtml(subject?.name || '')}</td></tr>
                            <tr><td class="text-muted">Gói học:</td><td>${Utils.escapeHtml(pkg?.name || 'Không')}</td></tr>
                            <tr><td class="text-muted">Số buổi:</td><td>${reg.sessions || '--'}</td></tr>
                            <tr><td class="text-muted">Ngày bắt đầu:</td><td>${Utils.formatDate(reg.startDate)}</td></tr>
                            <tr><td class="text-muted">Trạng thái:</td><td><span class="badge ${getStatusClass(reg.status)}">${getStatusText(reg.status)}</span></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Thông tin thanh toán</h6>
                        <table class="table table-sm">
                            <tr><td class="text-muted">Tổng học phí:</td><td><strong>${Utils.formatCurrency(reg.totalAmount)}</strong></td></tr>
                            <tr><td class="text-muted">Đã thanh toán:</td><td class="text-success">${Utils.formatCurrency(paidAmount)}</td></tr>
                            <tr><td class="text-muted">Còn lại:</td><td class="text-danger">${Utils.formatCurrency(remaining)}</td></tr>
                        </table>
                        <h6 class="text-primary mt-4 mb-2">Lịch sử thanh toán</h6>
                        <table class="table table-sm table-bordered">
                            <thead><tr><th>Ngày</th><th>Số tiền</th><th>Hình thức</th><th>TT</th></tr></thead>
                            <tbody>${receiptsHtml}</tbody>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('viewRegContent').innerHTML = content;
            UIModule.openModal('viewRegistrationModal');
        },

        /**
         * Sửa phiếu
         */
        edit: function(id) {
            const reg = DataModule.getById('registrations', id);
            if (!reg) {
                UIModule.showNotification('Không tìm thấy phiếu đăng ký', 'error');
                return;
            }

            resetForm();
            loadFormData(reg);
            document.getElementById('regModalTitle').textContent = 'Sửa phiếu đăng ký';
            UIModule.openModal('registrationModal');
        },

        /**
         * Lưu phiếu
         */
        save: function() {
            const data = collectFormData();

            // Validate
            const errors = Validator.validateRegistration(data);
            if (errors.length > 0) {
                UIModule.showNotification(errors.join('<br>'), 'error');
                return;
            }

            const isNew = !DataModule.getById('registrations', data.id);
            
            // Giữ lại registrationCode nếu đã có
            if (!isNew) {
                const existing = DataModule.getById('registrations', data.id);
                data.registrationCode = existing.registrationCode;
            }

            const success = DataModule.save('registrations', data);

            if (success) {
                UIModule.closeModal('registrationModal');
                renderRegistrations();
                UIModule.showNotification(
                    isNew ? 'Đã thêm phiếu đăng ký' : 'Đã cập nhật phiếu đăng ký',
                    'success'
                );
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        /**
         * Thêm thanh toán
         */
        addPayment: function(registrationId) {
            const reg = DataModule.getById('registrations', registrationId);
            if (!reg) {
                UIModule.showNotification('Không tìm thấy phiếu đăng ký', 'error');
                return;
            }

            const paidAmount = calculatePaidAmount(registrationId);
            const remaining = (reg.totalAmount || 0) - paidAmount;

            if (remaining <= 0) {
                UIModule.showNotification('Phiếu này đã thanh toán đủ', 'info');
                return;
            }

            // Chuyển sang module Receipts để tạo biên lai
            if (typeof ReceiptsModule !== 'undefined') {
                ReceiptsModule.openAddModal(registrationId);
            }
        },

        /**
         * Xóa phiếu
         */
        delete: function(id) {
            const receipts = DataModule.getAll('receipts').filter(r => r.registrationId === id);
            
            let confirmMsg = 'Bạn có chắc muốn xóa phiếu đăng ký này?';
            if (receipts.length > 0) {
                confirmMsg += `\n\n⚠️ Lưu ý: Phiếu này có ${receipts.length} biên lai liên quan. Các biên lai sẽ KHÔNG bị xóa.`;
            }

            UIModule.showConfirm(confirmMsg, () => {
                const success = DataModule.delete('registrations', id);
                if (success) {
                    renderRegistrations();
                    UIModule.showNotification('Đã xóa phiếu đăng ký', 'success');
                } else {
                    UIModule.showNotification('Có lỗi khi xóa', 'error');
                }
            });
        },

        /**
         * Export
         */
        export: function(format = 'excel') {
            const registrations = getFilteredRegistrations();
            const data = registrations.map((reg, index) => ({
                'STT': index + 1,
                'Mã phiếu': reg.registrationCode || reg.id,
                'Học viên': reg.studentName,
                'SĐT': reg.studentPhone,
                'Môn học': reg.subjectName,
                'Gói học': reg.packageName || '',
                'Số buổi': reg.sessions || '',
                'Ngày ĐK': Utils.formatDate(reg.createdAt),
                'Ngày bắt đầu': Utils.formatDate(reg.startDate),
                'Tổng phí': reg.totalAmount,
                'Đã TT': calculatePaidAmount(reg.id),
                'Trạng thái': getStatusText(reg.status)
            }));

            if (format === 'excel') {
                ExportModule.toExcel(data, 'DanhSachPhieuDK');
            }
        }
    };
})();

// Export global
window.AppointmentsModule = AppointmentsModule;  // hoặc RegistrationsModule, ReceiptsModule
