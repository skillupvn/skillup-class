/* ============================================================
   🎓 TRIAL.JS - Tab Học thử & Chờ đăng ký
   Version: 4.0
   Description: Quản lý học viên đang học thử và chờ đăng ký
   ============================================================ */

// ==========================================
// 🔍 FILTER STATE
// ==========================================
let currentTrialFilter = 'all';

// ==========================================
// 📊 RENDER FUNCTIONS
// ==========================================

/**
 * Render bảng học viên học thử
 */
function renderTrialStudentsTable() {
    const tbody = document.getElementById('trialStudentsTableBody');
    if (!tbody) return;

    // Khởi tạo pagination
    UI.initPagination('trial');

    // Lấy dữ liệu đã filter
    const filteredData = getFilteredTrialStudents();

    // Phân trang
    const { data, total, totalPages, currentPage } = UI.getPaginatedData(filteredData, 'trial');

    // Render empty state
    if (data.length === 0) {
        tbody.innerHTML = UI.renderEmptyTableRow(8, '🎓', 'Không có học viên học thử');
        UI.renderPagination('trialPagination', 'trial', 0, 0, 1);
        return;
    }

    // Render rows
    tbody.innerHTML = data.map(student => {
        // Tìm lịch hẹn sắp tới của học viên
        const upcomingAppointment = getUpcomingAppointmentForStudent(student.id);

        return `
            <tr data-id="${student.id}">
                <td>
                    <div class="d-flex align-center gap-8">
                        <div class="avatar avatar-sm">${Utils.getInitials(student.name)}</div>
                        <strong>${Utils.escapeHtml(student.name)}</strong>
                    </div>
                </td>
                <td>${student.age || '-'}</td>
                <td>${Utils.escapeHtml(student.parentName)}</td>
                <td>
                    <a href="tel:${student.parentPhone}" class="text-primary">
                        ${Utils.formatPhone(student.parentPhone)}
                    </a>
                </td>
                <td>
                    ${(student.subjects || []).map(sub => 
                        `<span class="subject-tag">${Utils.escapeHtml(sub)}</span>`
                    ).join('')}
                </td>
                <td>${UI.getStatusBadge(student.status)}</td>
                <td>
                    ${upcomingAppointment 
                        ? `<span class="text-success font-bold">
                             ${Utils.formatDate(upcomingAppointment.date)} ${upcomingAppointment.time}
                           </span>`
                        : '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    <div class="action-buttons">
                        ${getTrialActionButtons(student)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Render pagination
    UI.renderPagination('trialPagination', 'trial', total, totalPages, currentPage);
}

/**
 * Lấy danh sách học viên học thử đã filter
 */
function getFilteredTrialStudents() {
    const searchTerm = document.getElementById('searchTrialStudent')?.value?.toLowerCase() || '';

    // Chỉ lấy học viên "Học Thử" và "Chờ Đăng Ký"
    let filtered = DataStore.students.filter(s => 
        s.status === CONFIG.STUDENT_STATUS.HOC_THU || 
        s.status === CONFIG.STUDENT_STATUS.CHO_DANG_KY
    );

    // Filter theo trạng thái
    if (currentTrialFilter !== 'all') {
        filtered = filtered.filter(s => s.status === currentTrialFilter);
    }

    // Filter theo search term
    if (searchTerm) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.parentName.toLowerCase().includes(searchTerm) ||
            s.parentPhone.includes(searchTerm)
        );
    }

    // Sắp xếp: Học Thử trước, rồi đến Chờ ĐK, theo ngày tạo mới nhất
    filtered.sort((a, b) => {
        // Ưu tiên Học Thử
        if (a.status === CONFIG.STUDENT_STATUS.HOC_THU && b.status !== CONFIG.STUDENT_STATUS.HOC_THU) {
            return -1;
        }
        if (a.status !== CONFIG.STUDENT_STATUS.HOC_THU && b.status === CONFIG.STUDENT_STATUS.HOC_THU) {
            return 1;
        }
        // Cùng trạng thái: sắp xếp theo ngày tạo
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return filtered;
}

/**
 * Lấy lịch hẹn sắp tới của học viên
 */
function getUpcomingAppointmentForStudent(studentId) {
    const now = new Date();
    
    return DataStore.appointments
        .filter(a => {
            if (a.studentId !== studentId) return false;
            const appointmentDate = new Date(a.date + ' ' + a.time);
            return appointmentDate >= now;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateA - dateB;
        })[0] || null;
}

/**
 * Tạo action buttons cho học viên học thử
 */
function getTrialActionButtons(student) {
    const id = student.id;
    let buttons = [];

    // Nút xem
    buttons.push(`
        <button class="action-btn action-btn-view" 
                onclick="viewStudent('${id}')" 
                title="Xem chi tiết">👁️</button>
    `);

    if (student.status === CONFIG.STUDENT_STATUS.HOC_THU) {
        // Đặt lịch hẹn
        buttons.push(`
            <button class="action-btn action-btn-schedule" 
                    onclick="openAppointmentModalForStudent('${id}')" 
                    title="Đặt lịch hẹn">📅</button>
        `);
        // Xác nhận hoàn thành học thử
        buttons.push(`
            <button class="action-btn action-btn-confirm" 
                    onclick="confirmTrialCompleted('${id}')" 
                    title="Xác nhận đã học thử xong">✅</button>
        `);
        // Cancel
        buttons.push(`
            <button class="action-btn action-btn-cancel" 
                    onclick="cancelStudent('${id}')" 
                    title="Cancel">❌</button>
        `);
    } else if (student.status === CONFIG.STUDENT_STATUS.CHO_DANG_KY) {
        // Tạo phiếu đăng ký
        buttons.push(`
            <button class="action-btn action-btn-reg" 
                    onclick="openRegistrationModalForStudent('${id}')" 
                    title="Tạo phiếu đăng ký">📋</button>
        `);
        // Cancel
        buttons.push(`
            <button class="action-btn action-btn-cancel" 
                    onclick="cancelStudent('${id}')" 
                    title="Cancel">❌</button>
        `);
    }

    return buttons.join('');
}

/**
 * Cập nhật số lượng học viên học thử
 */
function updateTrialCounts() {
    const students = DataStore.students;

    const trialStudents = students.filter(s => 
        s.status === CONFIG.STUDENT_STATUS.HOC_THU || 
        s.status === CONFIG.STUDENT_STATUS.CHO_DANG_KY
    );

    const counts = {
        all: trialStudents.length,
        'Học Thử': students.filter(s => s.status === CONFIG.STUDENT_STATUS.HOC_THU).length,
        'Chờ Đăng Ký': students.filter(s => s.status === CONFIG.STUDENT_STATUS.CHO_DANG_KY).length
    };

    // Cập nhật UI
    const countAllEl = document.getElementById('trialCountAll');
    const countHocThuEl = document.getElementById('trialCountHocThu');
    const countChoDangKyEl = document.getElementById('trialCountChoDangKy');

    if (countAllEl) countAllEl.textContent = counts.all;
    if (countHocThuEl) countHocThuEl.textContent = counts['Học Thử'];
    if (countChoDangKyEl) countChoDangKyEl.textContent = counts['Chờ Đăng Ký'];
}

// ==========================================
// 🔍 FILTER & SEARCH
// ==========================================

/**
 * Filter học viên học thử theo trạng thái
 */
function filterTrialStudents(status) {
    currentTrialFilter = status;
    UI.resetPagination('trial');

    // Cập nhật active state cho filter buttons
    document.querySelectorAll('#trial .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === status);
    });

    renderTrialStudentsTable();
}

/**
 * Tìm kiếm học viên học thử
 */
function searchTrialStudents() {
    UI.resetPagination('trial');
    renderTrialStudentsTable();
}

// ==========================================
// 🔄 QUICK ACTIONS
// ==========================================

/**
 * Xác nhận học thử từ lịch hẹn
 */
function confirmTrialFromAppointment(appointmentId) {
    const appointment = DataStore.read('appointments', appointmentId);
    if (appointment) {
        confirmTrialCompleted(appointment.studentId);
    }
}


// ==========================================
// 📤 EXPORT
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderTrialStudentsTable,
        updateTrialCounts,
        filterTrialStudents,
        searchTrialStudents
    };
}
