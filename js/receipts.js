/**
 * ========================================
 * RECEIPTS MODULE - Quản lý Biên lai
 * ========================================
 * File: js/receipts.js
 * Version: 4.0
 * Description: Quản lý biên lai thanh toán học phí
 */

const ReceiptsModule = (function() {
    'use strict';

    // ============ PRIVATE VARIABLES ============
    let currentPage = 1;
    let pageSize = (CONFIG && CONFIG.DEFAULTS) ? CONFIG.DEFAULTS.PAGE_SIZE : 10;
    let searchKeyword = '';
    let filterStatus = 'all';
    let filterPaymentMethod = 'all';
    let filterDateFrom = '';
    let filterDateTo = '';
    let sortField = 'createdAt';
    let sortOrder = 'desc';

    // ============ PRIVATE METHODS ============

    /**
     * Lấy danh sách biên lai đã lọc
     */
    function getFilteredReceipts() {
        let receipts = DataModule.getAll('receipts');
        const students = DataModule.getAll('students');
        const registrations = DataModule.getAll('registrations');

        // Gắn thông tin liên quan
        receipts = receipts.map(receipt => {
            const registration = registrations.find(r => r.id === receipt.registrationId);
            const student = registration 
                ? students.find(s => s.id === registration.studentId)
                : students.find(s => s.id === receipt.studentId);
            
            return {
                ...receipt,
                studentName: student ? student.name : 'Không xác định',
                studentPhone: student ? student.phone : '',
                registrationCode: registration ? registration.registrationCode : ''
            };
        });

        // Lọc theo từ khóa
        if (searchKeyword) {
            const keyword = Utils.removeVietnameseTones(searchKeyword.toLowerCase());
            receipts = receipts.filter(r => {
                const name = Utils.removeVietnameseTones((r.studentName || '').toLowerCase());
                const phone = (r.studentPhone || '').toLowerCase();
                const receiptCode = (r.receiptCode || '').toLowerCase();
                return name.includes(keyword) || 
                       phone.includes(keyword) ||
                       receiptCode.includes(keyword);
            });
        }

        // Lọc theo trạng thái
        if (filterStatus !== 'all') {
            receipts = receipts.filter(r => r.status === filterStatus);
        }

        // Lọc theo hình thức thanh toán
        if (filterPaymentMethod !== 'all') {
            receipts = receipts.filter(r => r.paymentMethod === filterPaymentMethod);
        }

        // Lọc theo khoảng ngày
        if (filterDateFrom) {
            receipts = receipts.filter(r => r.paymentDate >= filterDateFrom);
        }
        if (filterDateTo) {
            receipts = receipts.filter(r => r.paymentDate <= filterDateTo);
        }

        // Sắp xếp
        receipts.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (sortField === 'createdAt' || sortField === 'paymentDate') {
                valueA = new Date(valueA || 0);
                valueB = new Date(valueB || 0);
            } else if (sortField === 'amount') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            }
            return valueA < valueB ? 1 : -1;
        });

        return receipts;
    }

    /**
     * Render danh sách biên lai
     */
    function renderReceipts() {
        const container = document.getElementById('receiptsList');
        if (!container) return;

        const receipts = getFilteredReceipts();
        const { startIndex, endIndex, totalPages } = Utils.paginate(
            receipts.length,
            currentPage,
            pageSize
        );

        if (receipts.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-receipt fa-3x mb-3 d-block"></i>
                        Không có biên lai nào
                    </td>
                </tr>
            `;
            renderPagination(0, 0);
            return;
        }

        const pageData = receipts.slice(startIndex, endIndex);
        let html = '';

        pageData.forEach((receipt, index) => {
            const statusClass = receipt.status === 'completed' ? 'bg-success' : 'bg-warning text-dark';
            const statusText = receipt.status === 'completed' ? 'Hoàn thành' : 'Chờ xác nhận';
            const paymentMethodText = getPaymentMethodText(receipt.paymentMethod);

            html += `
                <tr data-id="${receipt.id}">
                    <td class="text-center">${startIndex + index + 1}</td>
                    <td>
                        <strong class="text-primary">${Utils.escapeHtml(receipt.receiptCode || receipt.id)}</strong>
                    </td>
                    <td>
                        <strong>${Utils.escapeHtml(receipt.studentName)}</strong>
                        <br><small class="text-muted">${Utils.escapeHtml(receipt.studentPhone)}</small>
                    </td>
                    <td class="text-end">
                        <strong class="text-success">${Utils.formatCurrency(receipt.amount)}</strong>
                    </td>
                    <td>${paymentMethodText}</td>
                    <td>${Utils.formatDate(receipt.paymentDate)}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-info" onclick="ReceiptsModule.view('${receipt.id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="ReceiptsModule.print('${receipt.id}')" title="In biên lai">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="btn btn-outline-primary" onclick="ReceiptsModule.edit('${receipt.id}')" title="Sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="ReceiptsModule.delete('${receipt.id}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        renderPagination(receipts.length, totalPages);
        updateStatistics();
    }

    /**
     * Render phân trang
     */
    function renderPagination(total, totalPages) {
        const container = document.getElementById('receiptsPagination');
        if (!container) return;

        const info = document.getElementById('receiptsInfo');
        if (info) {
            const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, total);
            info.textContent = `Hiển thị ${start}-${end} / ${total} biên lai`;
        }

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = UIModule.renderPagination(currentPage, totalPages, 'ReceiptsModule.goToPage');
    }

    /**
     * Cập nhật thống kê
     */
    function updateStatistics() {
        const receipts = DataModule.getAll('receipts');
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.slice(0, 7);

        const stats = {
            total: receipts.length,
            completed: receipts.filter(r => r.status === 'completed').length,
            pending: receipts.filter(r => r.status === 'pending').length,
            totalAmount: receipts
                .filter(r => r.status === 'completed')
                .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
            todayAmount: receipts
                .filter(r => r.status === 'completed' && r.paymentDate === today)
                .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
            monthAmount: receipts
                .filter(r => r.status === 'completed' && r.paymentDate && r.paymentDate.startsWith(thisMonth))
                .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
        };

        // Cập nhật UI
        const elements = {
            'stat-receipts-total': stats.total,
            'stat-receipts-completed': stats.completed,
            'stat-receipts-totalAmount': Utils.formatCurrency(stats.totalAmount),
            'stat-receipts-todayAmount': Utils.formatCurrency(stats.todayAmount),
            'stat-receipts-monthAmount': Utils.formatCurrency(stats.monthAmount)
        };

        Object.keys(elements).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = elements[id];
        });
    }

    /**
     * Lấy text hình thức thanh toán
     */
    function getPaymentMethodText(method) {
        const methods = {
            'cash': '<i class="fas fa-money-bill-wave me-1"></i>Tiền mặt',
            'transfer': '<i class="fas fa-university me-1"></i>Chuyển khoản',
            'card': '<i class="fas fa-credit-card me-1"></i>Thẻ',
            'momo': '<i class="fas fa-wallet me-1"></i>MoMo',
            'vnpay': '<i class="fas fa-qrcode me-1"></i>VNPay'
        };
        return methods[method] || method;
    }

    /**
     * Populate dropdowns
     */
    function populateDropdowns() {
        // Phiếu đăng ký
        const regSelect = document.getElementById('receiptRegistrationId');
        if (regSelect) {
            const registrations = DataModule.getAll('registrations');
            const students = DataModule.getAll('students');
            
            let options = '<option value="">-- Chọn phiếu đăng ký --</option>';
            registrations.forEach(reg => {
                const student = students.find(s => s.id === reg.studentId);
                const studentName = student ? student.name : 'Không xác định';
                const paidAmount = calculatePaidAmount(reg.id);
                const remaining = (reg.totalAmount || 0) - paidAmount;
                
                if (remaining > 0) {
                    options += `<option value="${reg.id}" data-student="${reg.studentId}" data-remaining="${remaining}">
                        ${Utils.escapeHtml(reg.registrationCode || reg.id)} - ${Utils.escapeHtml(studentName)} (Còn: ${Utils.formatCurrency(remaining)})
                    </option>`;
                }
            });
            regSelect.innerHTML = options;
        }
    }

    /**
     * Tính số tiền đã thanh toán của phiếu ĐK
     */
    function calculatePaidAmount(registrationId) {
        const receipts = DataModule.getAll('receipts');
        return receipts
            .filter(r => r.registrationId === registrationId && r.status === 'completed')
            .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }

    /**
     * Tạo mã biên lai
     */
    function generateReceiptCode() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `BL${year}${month}${day}${random}`;
    }

    /**
     * Reset form
     */
    function resetForm() {
        const form = document.getElementById('receiptForm');
        if (form) {
            form.reset();
            document.getElementById('receiptId').value = '';
        }
        populateDropdowns();
        
        // Set ngày mặc định
        const dateInput = document.getElementById('receiptPaymentDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Load dữ liệu vào form
     */
    function loadFormData(receipt) {
        document.getElementById('receiptId').value = receipt.id || '';
        document.getElementById('receiptRegistrationId').value = receipt.registrationId || '';
        document.getElementById('receiptAmount').value = receipt.amount || '';
        document.getElementById('receiptPaymentMethod').value = receipt.paymentMethod || 'cash';
        document.getElementById('receiptPaymentDate').value = receipt.paymentDate || '';
        document.getElementById('receiptNote').value = receipt.note || '';
        document.getElementById('receiptStatus').value = receipt.status || 'completed';
    }

    /**
     * Thu thập dữ liệu từ form
     */
    function collectFormData() {
        const id = document.getElementById('receiptId').value;
        const registrationId = document.getElementById('receiptRegistrationId').value;
        
        // Lấy studentId từ registration
        let studentId = '';
        if (registrationId) {
            const reg = DataModule.getById('registrations', registrationId);
            if (reg) studentId = reg.studentId;
        }

        return {
            id: id || Utils.generateId('RCP'),
            receiptCode: id ? undefined : generateReceiptCode(),
            registrationId: registrationId,
            studentId: studentId,
            amount: parseFloat(document.getElementById('receiptAmount').value) || 0,
            paymentMethod: document.getElementById('receiptPaymentMethod').value,
            paymentDate: document.getElementById('receiptPaymentDate').value,
            note: document.getElementById('receiptNote').value.trim(),
            status: document.getElementById('receiptStatus').value || 'completed'
        };
    }

    /**
     * Generate HTML biên lai để in
     */
    function generateReceiptHTML(receipt) {
        const registration = DataModule.getById('registrations', receipt.registrationId);
        const student = registration 
            ? DataModule.getById('students', registration.studentId)
            : DataModule.getById('students', receipt.studentId);
        const subject = registration ? DataModule.getById('subjects', registration.subjectId) : null;
        const centerInfo = DataModule.get('centerInfo') || {};
        const bankInfo = DataModule.get('bankInfo') || {};

        const amountInWords = Utils.numberToWords(receipt.amount);
        const receiptNumber = (receipt.receiptCode || receipt.id).replace(/[^0-9]/g, '').slice(-6).padStart(6, '0');

        return `
            <div class="receipt-print" style="width: 80mm; padding: 10mm; font-family: Arial, sans-serif; font-size: 12px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; font-size: 16px;">${Utils.escapeHtml(centerInfo.name || 'TRUNG TÂM DẠY HỌC')}</h3>
                    <p style="margin: 5px 0; font-size: 11px;">${Utils.escapeHtml(centerInfo.address || '')}</p>
                    <p style="margin: 5px 0; font-size: 11px;">ĐT: ${Utils.escapeHtml(centerInfo.phone || '')}</p>
                </div>
                
                <div style="text-align: center; margin: 15px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0;">
                    <h2 style="margin: 0; font-size: 18px;">BIÊN LAI THU TIỀN</h2>
                    <p style="margin: 5px 0;">Số: <strong>${Utils.escapeHtml(receipt.receiptCode || receipt.id)}</strong></p>
                </div>

                <div style="margin-bottom: 15px;">
                    <p><strong>Học viên:</strong> ${Utils.escapeHtml(student?.name || '')}</p>
                    <p><strong>SĐT:</strong> ${Utils.escapeHtml(student?.phone || '')}</p>
                    ${subject ? `<p><strong>Môn học:</strong> ${Utils.escapeHtml(subject.name)}</p>` : ''}
                    ${registration ? `<p><strong>Mã ĐK:</strong> ${Utils.escapeHtml(registration.registrationCode || '')}</p>` : ''}
                </div>

                <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5;">
                    <p style="font-size: 14px;"><strong>Số tiền:</strong></p>
                    <p style="font-size: 20px; color: #d32f2f; font-weight: bold; text-align: center; margin: 10px 0;">
                        ${Utils.formatCurrency(receipt.amount)}
                    </p>
                    <p style="font-style: italic; font-size: 11px;">Bằng chữ: ${amountInWords}</p>
                </div>

                <div style="margin-bottom: 15px;">
                    <p><strong>Hình thức:</strong> ${getPaymentMethodText(receipt.paymentMethod).replace(/<[^>]*>/g, '')}</p>
                    <p><strong>Ngày TT:</strong> ${Utils.formatDate(receipt.paymentDate)}</p>
                    ${receipt.note ? `<p><strong>Ghi chú:</strong> ${Utils.escapeHtml(receipt.note)}</p>` : ''}
                </div>

                ${bankInfo.accountNumber ? `
                <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd;">
                    <p style="margin: 0 0 5px; font-weight: bold;">Thông tin chuyển khoản:</p>
                    <p style="margin: 2px 0;">Ngân hàng: ${Utils.escapeHtml(bankInfo.bankName || '')}</p>
                    <p style="margin: 2px 0;">STK: ${Utils.escapeHtml(bankInfo.accountNumber || '')}</p>
                    <p style="margin: 2px 0;">Chủ TK: ${Utils.escapeHtml(bankInfo.accountName || '')}</p>
                </div>
                ` : ''}

                <div style="margin-top: 20px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 45%;">
                        <p style="margin-bottom: 50px;"><strong>Người nộp tiền</strong></p>
                        <p>${Utils.escapeHtml(student?.name || '')}</p>
                    </div>
                    <div style="text-align: center; width: 45%;">
                        <p style="margin-bottom: 50px;"><strong>Người thu tiền</strong></p>
                        <p>________________</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #666;">
                    <p>Ngày in: ${Utils.formatDateTime(new Date())}</p>
                    <p>Cảm ơn quý khách!</p>
                </div>
            </div>
        `;
    }

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo module
         */
        init: function() {
            this.bindEvents();
            populateDropdowns();
            renderReceipts();
            console.log('ReceiptsModule initialized');
        },

        /**
         * Bind sự kiện
         */
        bindEvents: function() {
            // Search
            const searchInput = document.getElementById('searchReceipts');
            if (searchInput) {
                searchInput.addEventListener('input', Utils.debounce((e) => {
                    searchKeyword = e.target.value;
                    currentPage = 1;
                    renderReceipts();
                }, 300));
            }

            // Filter status
            const statusFilter = document.getElementById('filterReceiptStatus');
            if (statusFilter) {
                statusFilter.addEventListener('change', (e) => {
                    filterStatus = e.target.value;
                    currentPage = 1;
                    renderReceipts();
                });
            }

            // Filter payment method
            const methodFilter = document.getElementById('filterPaymentMethod');
            if (methodFilter) {
                methodFilter.addEventListener('change', (e) => {
                    filterPaymentMethod = e.target.value;
                    currentPage = 1;
                    renderReceipts();
                });
            }

            // Filter date range
            const dateFromFilter = document.getElementById('filterReceiptDateFrom');
            const dateToFilter = document.getElementById('filterReceiptDateTo');
            if (dateFromFilter) {
                dateFromFilter.addEventListener('change', (e) => {
                    filterDateFrom = e.target.value;
                    currentPage = 1;
                    renderReceipts();
                });
            }
            if (dateToFilter) {
                dateToFilter.addEventListener('change', (e) => {
                    filterDateTo = e.target.value;
                    currentPage = 1;
                    renderReceipts();
                });
            }

            // Page size
            const pageSizeSelect = document.getElementById('receiptsPageSize');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    pageSize = parseInt(e.target.value);
                    currentPage = 1;
                    renderReceipts();
                });
            }

            // Registration change - auto fill remaining amount
            const regSelect = document.getElementById('receiptRegistrationId');
            if (regSelect) {
                regSelect.addEventListener('change', (e) => {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    const remaining = parseFloat(selectedOption.dataset.remaining) || 0;
                    const amountInput = document.getElementById('receiptAmount');
                    if (amountInput && remaining > 0) {
                        amountInput.value = remaining;
                        amountInput.max = remaining;
                    }
                });
            }

            // Form submit
            const form = document.getElementById('receiptForm');
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
            renderReceipts();
        },

        /**
         * Chuyển trang
         */
        goToPage: function(page) {
            currentPage = page;
            renderReceipts();
        },

        /**
         * Mở modal thêm mới
         */
        openAddModal: function(registrationId = null) {
            resetForm();
            document.getElementById('receiptModalTitle').textContent = 'Thêm biên lai mới';
            
            // Nếu có registrationId, tự động chọn
            if (registrationId) {
                const regSelect = document.getElementById('receiptRegistrationId');
                if (regSelect) {
                    regSelect.value = registrationId;
                    regSelect.dispatchEvent(new Event('change'));
                }
            }
            
            UIModule.openModal('receiptModal');
        },

        /**
         * Xem chi tiết
         */
        view: function(id) {
            const receipt = DataModule.getById('receipts', id);
            if (!receipt) {
                UIModule.showNotification('Không tìm thấy biên lai', 'error');
                return;
            }

            const registration = DataModule.getById('registrations', receipt.registrationId);
            const student = registration 
                ? DataModule.getById('students', registration.studentId)
                : DataModule.getById('students', receipt.studentId);
            const subject = registration ? DataModule.getById('subjects', registration.subjectId) : null;

            const content = `
                <div class="row">
                    <div class="col-12">
                        <table class="table table-bordered">
                            <tr><td width="35%" class="text-muted">Mã biên lai:</td><td><strong>${Utils.escapeHtml(receipt.receiptCode || receipt.id)}</strong></td></tr>
                            <tr><td class="text-muted">Học viên:</td><td>${Utils.escapeHtml(student?.name || '')}</td></tr>
                            <tr><td class="text-muted">SĐT:</td><td>${Utils.escapeHtml(student?.phone || '')}</td></tr>
                            ${registration ? `<tr><td class="text-muted">Mã phiếu ĐK:</td><td>${Utils.escapeHtml(registration.registrationCode || '')}</td></tr>` : ''}
                            ${subject ? `<tr><td class="text-muted">Môn học:</td><td>${Utils.escapeHtml(subject.name)}</td></tr>` : ''}
                            <tr><td class="text-muted">Số tiền:</td><td><strong class="text-success fs-5">${Utils.formatCurrency(receipt.amount)}</strong></td></tr>
                            <tr><td class="text-muted">Bằng chữ:</td><td><em>${Utils.numberToWords(receipt.amount)}</em></td></tr>
                            <tr><td class="text-muted">Hình thức:</td><td>${getPaymentMethodText(receipt.paymentMethod)}</td></tr>
                            <tr><td class="text-muted">Ngày thanh toán:</td><td>${Utils.formatDate(receipt.paymentDate)}</td></tr>
                            <tr><td class="text-muted">Trạng thái:</td><td><span class="badge ${receipt.status === 'completed' ? 'bg-success' : 'bg-warning'}">${receipt.status === 'completed' ? 'Hoàn thành' : 'Chờ xác nhận'}</span></td></tr>
                            ${receipt.note ? `<tr><td class="text-muted">Ghi chú:</td><td>${Utils.escapeHtml(receipt.note)}</td></tr>` : ''}
                            <tr><td class="text-muted">Ngày tạo:</td><td>${Utils.formatDateTime(receipt.createdAt)}</td></tr>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('viewReceiptContent').innerHTML = content;
            UIModule.openModal('viewReceiptModal');
        },

        /**
         * Sửa biên lai
         */
        edit: function(id) {
            const receipt = DataModule.getById('receipts', id);
            if (!receipt) {
                UIModule.showNotification('Không tìm thấy biên lai', 'error');
                return;
            }

            resetForm();
            loadFormData(receipt);
            document.getElementById('receiptModalTitle').textContent = 'Sửa biên lai';
            UIModule.openModal('receiptModal');
        },

        /**
         * Lưu biên lai
         */
        save: function() {
            const data = collectFormData();

            // Validate
            const errors = Validator.validateReceipt(data);
            if (errors.length > 0) {
                UIModule.showNotification(errors.join('<br>'), 'error');
                return;
            }

            // Kiểm tra số tiền không vượt quá còn lại
            if (data.registrationId) {
                const reg = DataModule.getById('registrations', data.registrationId);
                const paidAmount = calculatePaidAmount(data.registrationId);
                
                // Nếu đang sửa, trừ đi số tiền cũ
                const existingReceipt = DataModule.getById('receipts', data.id);
                const oldAmount = existingReceipt ? parseFloat(existingReceipt.amount) || 0 : 0;
                
                const remaining = (reg.totalAmount || 0) - paidAmount + oldAmount;
                
                if (data.amount > remaining) {
                    UIModule.showNotification(`Số tiền vượt quá số còn lại (${Utils.formatCurrency(remaining)})`, 'error');
                    return;
                }
            }

            const isNew = !DataModule.getById('receipts', data.id);
            
            // Giữ lại receiptCode nếu đã có
            if (!isNew) {
                const existing = DataModule.getById('receipts', data.id);
                data.receiptCode = existing.receiptCode;
            }

            const success = DataModule.save('receipts', data);

            if (success) {
                UIModule.closeModal('receiptModal');
                renderReceipts();
                
                // Refresh registrations nếu có
                if (typeof RegistrationsModule !== 'undefined') {
                    RegistrationsModule.refresh();
                }
                
                UIModule.showNotification(
                    isNew ? 'Đã thêm biên lai' : 'Đã cập nhật biên lai',
                    'success'
                );
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        /**
         * In biên lai
         */
        print: function(id) {
            const receipt = DataModule.getById('receipts', id);
            if (!receipt) {
                UIModule.showNotification('Không tìm thấy biên lai', 'error');
                return;
            }

            const printContent = generateReceiptHTML(receipt);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>In biên lai - ${receipt.receiptCode || receipt.id}</title>
                    <meta charset="UTF-8">
                    <style>
                        body { margin: 0; padding: 0; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        },

        /**
         * Xóa biên lai
         */
        delete: function(id) {
            UIModule.showConfirm(
                'Bạn có chắc muốn xóa biên lai này?',
                () => {
                    const success = DataModule.delete('receipts', id);
                    if (success) {
                        renderReceipts();
                        
                        // Refresh registrations nếu có
                        if (typeof RegistrationsModule !== 'undefined') {
                            RegistrationsModule.refresh();
                        }
                        
                        UIModule.showNotification('Đã xóa biên lai', 'success');
                    } else {
                        UIModule.showNotification('Có lỗi khi xóa', 'error');
                    }
                }
            );
        },

        /**
         * Export danh sách
         */
        export: function(format = 'excel') {
            const receipts = getFilteredReceipts();
            const data = receipts.map((r, index) => ({
                'STT': index + 1,
                'Mã biên lai': r.receiptCode || r.id,
                'Học viên': r.studentName,
                'SĐT': r.studentPhone,
                'Số tiền': r.amount,
                'Hình thức': getPaymentMethodText(r.paymentMethod).replace(/<[^>]*>/g, ''),
                'Ngày TT': Utils.formatDate(r.paymentDate),
                'Trạng thái': r.status === 'completed' ? 'Hoàn thành' : 'Chờ',
                'Ghi chú': r.note || ''
            }));

            if (format === 'excel') {
                ExportModule.toExcel(data, 'DanhSachBienLai');
            }
        },

        /**
         * Thống kê theo khoảng thời gian
         */
        getStatsByDateRange: function(fromDate, toDate) {
            const receipts = DataModule.getAll('receipts').filter(r => {
                if (r.status !== 'completed') return false;
                if (!r.paymentDate) return false;
                if (fromDate && r.paymentDate < fromDate) return false;
                if (toDate && r.paymentDate > toDate) return false;
                return true;
            });

            return {
                count: receipts.length,
                total: receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
                byMethod: receipts.reduce((acc, r) => {
                    const method = r.paymentMethod || 'other';
                    acc[method] = (acc[method] || 0) + (parseFloat(r.amount) || 0);
                    return acc;
                }, {})
            };
        }
    };
})();

// Export global
window.AppointmentsModule = AppointmentsModule;  // hoặc RegistrationsModule, ReceiptsModule

