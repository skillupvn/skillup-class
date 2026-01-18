/**
 * ========================================
 * APPOINTMENTS MODULE - Quản lý Lịch hẹn
 * ========================================
 * File: js/appointments.js
 * Version: 4.0
 * Description: Quản lý lịch hẹn tư vấn, học thử
 */

const AppointmentsModule = (function() {
    'use strict';

    // ============ PRIVATE VARIABLES ============
    let currentPage = 1;
    let pageSize = CONFIG.DEFAULTS.PAGE_SIZE;
    let searchKeyword = '';
    let filterStatus = 'all';
    let filterDate = '';
    let sortField = 'appointmentDate';
    let sortOrder = 'desc';

    // ============ PRIVATE METHODS ============

    /**
     * Lấy danh sách lịch hẹn đã lọc và sắp xếp
     */
    function getFilteredAppointments() {
        let appointments = DataModule.getAll('appointments');
        const students = DataModule.getAll('students');
        
        // Gắn thông tin học viên
        appointments = appointments.map(apt => {
            const student = students.find(s => s.id === apt.studentId);
            return {
                ...apt,
                studentName: student ? student.name : 'Không xác định',
                studentPhone: student ? student.phone : ''
            };
        });

        // Lọc theo từ khóa
        if (searchKeyword) {
            const keyword = Utils.removeVietnameseTones(searchKeyword.toLowerCase());
            appointments = appointments.filter(apt => {
                const name = Utils.removeVietnameseTones((apt.studentName || '').toLowerCase());
                const phone = (apt.studentPhone || '').toLowerCase();
                const note = Utils.removeVietnameseTones((apt.note || '').toLowerCase());
                return name.includes(keyword) || 
                       phone.includes(keyword) || 
                       note.includes(keyword);
            });
        }

        // Lọc theo trạng thái
        if (filterStatus !== 'all') {
            appointments = appointments.filter(apt => apt.status === filterStatus);
        }

        // Lọc theo ngày
        if (filterDate) {
            appointments = appointments.filter(apt => apt.appointmentDate === filterDate);
        }

        // Sắp xếp
        appointments.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (sortField === 'appointmentDate' || sortField === 'createdAt') {
                valueA = new Date(valueA || 0);
                valueB = new Date(valueB || 0);
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            }
            return valueA < valueB ? 1 : -1;
        });

        return appointments;
    }

    /**
     * Render danh sách lịch hẹn
     */
    function renderAppointments() {
        const container = document.getElementById('appointmentsList');
        if (!container) return;

        const appointments = getFilteredAppointments();
        const { startIndex, endIndex, totalPages } = Utils.paginate(
            appointments.length, 
            currentPage, 
            pageSize
        );

        if (appointments.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-calendar-times fa-3x mb-3 d-block"></i>
                        Không có lịch hẹn nào
                    </td>
                </tr>
            `;
            renderPagination(0, 0);
            return;
        }

        const pageData = appointments.slice(startIndex, endIndex);
        let html = '';

        pageData.forEach((apt, index) => {
            const statusClass = getStatusClass(apt.status);
            const statusText = getStatusText(apt.status);
            
            html += `
                <tr data-id="${apt.id}">
                    <td class="text-center">${startIndex + index + 1}</td>
                    <td>
                        <strong>${Utils.escapeHtml(apt.studentName)}</strong>
                        <br><small class="text-muted">${Utils.escapeHtml(apt.studentPhone)}</small>
                    </td>
                    <td>${Utils.escapeHtml(apt.appointmentType || 'Tư vấn')}</td>
                    <td>
                        <i class="far fa-calendar-alt me-1"></i>
                        ${Utils.formatDate(apt.appointmentDate)}
                        <br>
                        <small><i class="far fa-clock me-1"></i>${Utils.escapeHtml(apt.appointmentTime || '--:--')}</small>
                    </td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>${Utils.escapeHtml(apt.handler || '--')}</td>
                    <td class="text-truncate" style="max-width: 150px;" title="${Utils.escapeHtml(apt.note || '')}">
                        ${Utils.escapeHtml(apt.note || '--')}
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="AppointmentsModule.edit('${apt.id}')" title="Sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="AppointmentsModule.updateStatus('${apt.id}')" title="Cập nhật trạng thái">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="AppointmentsModule.delete('${apt.id}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        renderPagination(appointments.length, totalPages);
        updateStatistics();
    }

    /**
     * Render phân trang
     */
    function renderPagination(total, totalPages) {
        const container = document.getElementById('appointmentsPagination');
        if (!container) return;

        const info = document.getElementById('appointmentsInfo');
        if (info) {
            const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, total);
            info.textContent = `Hiển thị ${start}-${end} / ${total} lịch hẹn`;
        }

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = UIModule.renderPagination(currentPage, totalPages, 'AppointmentsModule.goToPage');
    }

    /**
     * Cập nhật thống kê
     */
    function updateStatistics() {
        const appointments = DataModule.getAll('appointments');
        const today = new Date().toISOString().split('T')[0];

        const stats = {
            total: appointments.length,
            pending: appointments.filter(a => a.status === 'pending').length,
            confirmed: appointments.filter(a => a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            today: appointments.filter(a => a.appointmentDate === today).length
        };

        // Cập nhật các element thống kê nếu có
        Object.keys(stats).forEach(key => {
            const el = document.getElementById(`stat-appointments-${key}`);
            if (el) el.textContent = stats[key];
        });
    }

    /**
     * Lấy class CSS theo trạng thái
     */
    function getStatusClass(status) {
        const classes = {
            'pending': 'bg-warning text-dark',
            'confirmed': 'bg-info',
            'completed': 'bg-success',
            'cancelled': 'bg-secondary',
            'no-show': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    /**
     * Lấy text hiển thị theo trạng thái
     */
    function getStatusText(status) {
        const texts = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'no-show': 'Không đến'
        };
        return texts[status] || 'Không xác định';
    }

    /**
     * Populate dropdown học viên
     */
    function populateStudentDropdown() {
        const select = document.getElementById('appointmentStudentId');
        if (!select) return;

        const students = DataModule.getAll('students');
        let options = '<option value="">-- Chọn học viên --</option>';
        
        students.forEach(student => {
            options += `<option value="${student.id}">${Utils.escapeHtml(student.name)} - ${Utils.escapeHtml(student.phone)}</option>`;
        });

        select.innerHTML = options;
    }

    /**
     * Reset form
     */
    function resetForm() {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.reset();
            document.getElementById('appointmentId').value = '';
        }
        populateStudentDropdown();
    }

    /**
     * Load dữ liệu vào form để sửa
     */
    function loadFormData(appointment) {
        document.getElementById('appointmentId').value = appointment.id || '';
        document.getElementById('appointmentStudentId').value = appointment.studentId || '';
        document.getElementById('appointmentType').value = appointment.appointmentType || 'consult';
        document.getElementById('appointmentDate').value = appointment.appointmentDate || '';
        document.getElementById('appointmentTime').value = appointment.appointmentTime || '';
        document.getElementById('appointmentHandler').value = appointment.handler || '';
        document.getElementById('appointmentNote').value = appointment.note || '';
        document.getElementById('appointmentStatus').value = appointment.status || 'pending';
    }

    /**
     * Thu thập dữ liệu từ form
     */
    function collectFormData() {
        return {
            id: document.getElementById('appointmentId').value || Utils.generateId('APT'),
            studentId: document.getElementById('appointmentStudentId').value,
            appointmentType: document.getElementById('appointmentType').value,
            appointmentDate: document.getElementById('appointmentDate').value,
            appointmentTime: document.getElementById('appointmentTime').value,
            handler: document.getElementById('appointmentHandler').value.trim(),
            note: document.getElementById('appointmentNote').value.trim(),
            status: document.getElementById('appointmentStatus').value || 'pending'
        };
    }

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo module
         */
        init: function() {
            this.bindEvents();
            populateStudentDropdown();
            renderAppointments();
            console.log('AppointmentsModule initialized');
        },

        /**
         * Bind các sự kiện
         */
        bindEvents: function() {
            // Search
            const searchInput = document.getElementById('searchAppointments');
            if (searchInput) {
                searchInput.addEventListener('input', Utils.debounce((e) => {
                    searchKeyword = e.target.value;
                    currentPage = 1;
                    renderAppointments();
                }, 300));
            }

            // Filter status
            const statusFilter = document.getElementById('filterAppointmentStatus');
            if (statusFilter) {
                statusFilter.addEventListener('change', (e) => {
                    filterStatus = e.target.value;
                    currentPage = 1;
                    renderAppointments();
                });
            }

            // Filter date
            const dateFilter = document.getElementById('filterAppointmentDate');
            if (dateFilter) {
                dateFilter.addEventListener('change', (e) => {
                    filterDate = e.target.value;
                    currentPage = 1;
                    renderAppointments();
                });
            }

            // Page size
            const pageSizeSelect = document.getElementById('appointmentsPageSize');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    pageSize = parseInt(e.target.value);
                    currentPage = 1;
                    renderAppointments();
                });
            }

            // Form submit
            const form = document.getElementById('appointmentForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.save();
                });
            }
        },

        /**
         * Refresh danh sách
         */
        refresh: function() {
            populateStudentDropdown();
            renderAppointments();
        },

        /**
         * Chuyển trang
         */
        goToPage: function(page) {
            currentPage = page;
            renderAppointments();
        },

        /**
         * Mở modal thêm mới
         */
        openAddModal: function() {
            resetForm();
            document.getElementById('appointmentModalTitle').textContent = 'Thêm lịch hẹn mới';
            UIModule.openModal('appointmentModal');
        },

        /**
         * Sửa lịch hẹn
         */
        edit: function(id) {
            const appointment = DataModule.getById('appointments', id);
            if (!appointment) {
                UIModule.showNotification('Không tìm thấy lịch hẹn', 'error');
                return;
            }

            resetForm();
            loadFormData(appointment);
            document.getElementById('appointmentModalTitle').textContent = 'Sửa lịch hẹn';
            UIModule.openModal('appointmentModal');
        },

        /**
         * Lưu lịch hẹn
         */
        save: function() {
            const data = collectFormData();

            // Validate
            const errors = Validator.validateAppointment(data);
            if (errors.length > 0) {
                UIModule.showNotification(errors.join('<br>'), 'error');
                return;
            }

            const isNew = !DataModule.getById('appointments', data.id);
            const success = DataModule.save('appointments', data);

            if (success) {
                UIModule.closeModal('appointmentModal');
                renderAppointments();
                UIModule.showNotification(
                    isNew ? 'Đã thêm lịch hẹn thành công' : 'Đã cập nhật lịch hẹn',
                    'success'
                );
            } else {
                UIModule.showNotification('Có lỗi khi lưu lịch hẹn', 'error');
            }
        },

        /**
         * Cập nhật trạng thái nhanh
         */
        updateStatus: function(id) {
            const appointment = DataModule.getById('appointments', id);
            if (!appointment) {
                UIModule.showNotification('Không tìm thấy lịch hẹn', 'error');
                return;
            }

            // Hiển thị dialog chọn trạng thái
            const statusOptions = [
                { value: 'pending', text: 'Chờ xác nhận' },
                { value: 'confirmed', text: 'Đã xác nhận' },
                { value: 'completed', text: 'Hoàn thành' },
                { value: 'cancelled', text: 'Đã hủy' },
                { value: 'no-show', text: 'Không đến' }
            ];

            let optionsHtml = statusOptions.map(opt => 
                `<option value="${opt.value}" ${appointment.status === opt.value ? 'selected' : ''}>${opt.text}</option>`
            ).join('');

            UIModule.showConfirm(
                `<div class="mb-3">
                    <label class="form-label">Chọn trạng thái mới:</label>
                    <select id="newAppointmentStatus" class="form-select">${optionsHtml}</select>
                </div>`,
                () => {
                    const newStatus = document.getElementById('newAppointmentStatus').value;
                    appointment.status = newStatus;
                    DataModule.save('appointments', appointment);
                    renderAppointments();
                    UIModule.showNotification('Đã cập nhật trạng thái', 'success');
                },
                'Cập nhật trạng thái'
            );
        },

        /**
         * Xóa lịch hẹn
         */
        delete: function(id) {
            UIModule.showConfirm(
                'Bạn có chắc muốn xóa lịch hẹn này?',
                () => {
                    const success = DataModule.delete('appointments', id);
                    if (success) {
                        renderAppointments();
                        UIModule.showNotification('Đã xóa lịch hẹn', 'success');
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
            const appointments = getFilteredAppointments();
            const data = appointments.map((apt, index) => ({
                'STT': index + 1,
                'Học viên': apt.studentName,
                'SĐT': apt.studentPhone,
                'Loại hẹn': apt.appointmentType,
                'Ngày hẹn': Utils.formatDate(apt.appointmentDate),
                'Giờ hẹn': apt.appointmentTime,
                'Trạng thái': getStatusText(apt.status),
                'Người phụ trách': apt.handler || '',
                'Ghi chú': apt.note || ''
            }));

            if (format === 'excel') {
                ExportModule.toExcel(data, 'DanhSachLichHen');
            }
        }
    };
})();
