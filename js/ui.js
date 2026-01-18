/* ============================================================
   🎨 UI.JS - Các hàm giao diện dùng chung
   Version: 4.0
   Description: Modal, Notification, Pagination, UI helpers
   ============================================================ */

// ==========================================
// 🎨 UI - Các hàm giao diện
// ==========================================
const UI = {

    // ==========================================
    // 🔔 NOTIFICATIONS
    // ==========================================

    /**
     * Hiển thị thông báo
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    showNotification: function(message, type = 'success', duration = CONFIG.TIME.NOTIFICATION_DURATION) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const iconEl = document.getElementById('notificationIcon');
        const messageEl = document.getElementById('notificationMessage');
        
        if (iconEl) iconEl.textContent = icons[type] || icons.info;
        if (messageEl) messageEl.innerHTML = message;
        
        // Remove old classes và add new
        notification.className = 'notification show ' + type;
        
        // Auto hide
        if (this._notificationTimeout) {
            clearTimeout(this._notificationTimeout);
        }
        
        this._notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, duration);
    },

    /**
     * Ẩn thông báo
     */
    hideNotification: function() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
        }
    },

    _notificationTimeout: null,

    // ==========================================
    // 🔲 MODALS
    // ==========================================

    /**
     * Mở modal
     * @param {string} modalId - ID của modal
     */
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Đóng modal
     * @param {string} modalId - ID của modal
     */
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Đóng tất cả modals
     */
    closeAllModals: function() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    // ==========================================
    // 📄 PAGINATION
    // ==========================================

    // Lưu trạng thái pagination cho mỗi tab
    paginationState: {},

    /**
     * Khởi tạo pagination state
     * @param {string} tabKey - Key của tab
     * @param {number} pageSize - Số items mỗi trang
     */
    initPagination: function(tabKey, pageSize = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) {
        if (!this.paginationState[tabKey]) {
            this.paginationState[tabKey] = {
                page: 1,
                pageSize: pageSize
            };
        }
    },

    /**
     * Lấy dữ liệu đã phân trang
     * @param {Array} data - Dữ liệu gốc
     * @param {string} tabKey - Key của tab
     * @returns {object} { data, total, totalPages, currentPage, pageSize }
     */
    getPaginatedData: function(data, tabKey) {
        this.initPagination(tabKey);
        const state = this.paginationState[tabKey];
        
        const total = data.length;
        const totalPages = Math.ceil(total / state.pageSize) || 1;
        
        // Điều chỉnh trang hiện tại nếu vượt quá
        if (state.page > totalPages) {
            state.page = totalPages;
        }
        
        const start = (state.page - 1) * state.pageSize;
        const end = start + state.pageSize;
        
        return {
            data: data.slice(start, end),
            total: total,
            totalPages: totalPages,
            currentPage: state.page,
            pageSize: state.pageSize,
            start: start + 1,
            end: Math.min(end, total)
        };
    },

    /**
     * Render pagination UI
     * @param {string} containerId - ID của container
     * @param {string} tabKey - Key của tab
     * @param {number} totalItems - Tổng số items
     * @param {number} totalPages - Tổng số trang
     * @param {number} currentPage - Trang hiện tại
     */
    renderPagination: function(containerId, tabKey, totalItems, totalPages, currentPage) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (totalItems === 0) {
            container.innerHTML = '';
            return;
        }
        
        const state = this.paginationState[tabKey];
        const start = (currentPage - 1) * state.pageSize + 1;
        const end = Math.min(currentPage * state.pageSize, totalItems);
        
        // Tính các trang cần hiển thị
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        let pagesHtml = '';
        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `
                <button class="${i === currentPage ? 'active' : ''}" 
                        onclick="UI.goToPage('${tabKey}', ${i})">
                    ${i}
                </button>
            `;
        }
        
        // Page size options
        const pageSizeOptions = CONFIG.PAGINATION.PAGE_SIZE_OPTIONS
            .map(size => `<option value="${size}" ${size === state.pageSize ? 'selected' : ''}>${size}</option>`)
            .join('');
        
        container.innerHTML = `
            <div class="pagination-info">
                Hiển thị ${start}-${end} / ${totalItems}
            </div>
            <div class="pagination">
                <button onclick="UI.goToPage('${tabKey}', 1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>
                <button onclick="UI.goToPage('${tabKey}', ${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
                ${pagesHtml}
                <button onclick="UI.goToPage('${tabKey}', ${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
                <button onclick="UI.goToPage('${tabKey}', ${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>
            </div>
            <div class="page-size-select">
                <span>Hiển thị:</span>
                <select onchange="UI.changePageSize('${tabKey}', this.value)">
                    ${pageSizeOptions}
                </select>
            </div>
        `;
    },

    /**
     * Chuyển đến trang
     * @param {string} tabKey - Key của tab
     * @param {number} page - Số trang
     */
    goToPage: function(tabKey, page) {
        if (!this.paginationState[tabKey]) return;
        
        this.paginationState[tabKey].page = page;
        this._triggerRender(tabKey);
    },

    /**
     * Thay đổi page size
     * @param {string} tabKey - Key của tab
     * @param {number} size - Số items mỗi trang
     */
    changePageSize: function(tabKey, size) {
        if (!this.paginationState[tabKey]) return;
        
        this.paginationState[tabKey].pageSize = parseInt(size);
        this.paginationState[tabKey].page = 1; // Reset về trang 1
        this._triggerRender(tabKey);
    },

    /**
     * Reset pagination về trang 1
     * @param {string} tabKey - Key của tab
     */
    resetPagination: function(tabKey) {
        if (this.paginationState[tabKey]) {
            this.paginationState[tabKey].page = 1;
        }
    },

    /**
     * Trigger render table sau khi thay đổi pagination
     * @private
     */
    _triggerRender: function(tabKey) {
        // Map tabKey -> render function
        const renderMap = {
            'students': () => typeof renderStudentsTable === 'function' && renderStudentsTable(),
            'trial': () => typeof renderTrialStudentsTable === 'function' && renderTrialStudentsTable(),
            'appointments': () => typeof renderAppointmentsTable === 'function' && renderAppointmentsTable(),
            'registrations': () => typeof renderRegistrationsTable === 'function' && renderRegistrationsTable(),
            'receipts': () => typeof renderReceiptsTable === 'function' && renderReceiptsTable()
        };
        
        if (renderMap[tabKey]) {
            renderMap[tabKey]();
        }
    },

    // ==========================================
    // 🏷️ STATUS BADGES
    // ==========================================

    /**
     * Tạo HTML cho status badge
     * @param {string} status - Trạng thái
     * @returns {string} HTML
     */
    getStatusBadge: function(status) {
        const statusConfig = CONFIG.STUDENT_STATUS_DISPLAY[status];
        if (!statusConfig) {
            return `<span class="status-badge">${status}</span>`;
        }
        
        return `
            <span class="status-badge ${statusConfig.class}">
                ${statusConfig.icon} ${statusConfig.label}
            </span>
        `;
    },

    // ==========================================
    // 📊 LOADING
    // ==========================================

    /**
     * Hiển thị loading overlay
     */
    showLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },

    /**
     * Ẩn loading overlay
     */
    hideLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    // ==========================================
    // 🎛️ SIDEBAR
    // ==========================================

    /**
     * Toggle sidebar (thu gọn/mở rộng)
     */
    toggleSidebar: function() {
        const container = document.getElementById('appContainer');
        if (container) {
            container.classList.toggle('sidebar-collapsed');
            
            // Lưu trạng thái
            const isCollapsed = container.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
        
        // Mobile: toggle sidebar-open class
        if (window.innerWidth <= 768) {
            container.classList.toggle('sidebar-open');
        }
    },

    /**
     * Khôi phục trạng thái sidebar từ localStorage
     */
    restoreSidebarState: function() {
        const container = document.getElementById('appContainer');
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        if (container && isCollapsed) {
            container.classList.add('sidebar-collapsed');
        }
    },

    /**
     * Toggle submenu trong sidebar
     * @param {HTMLElement} element - Menu link element
     */
    toggleSubmenu: function(element) {
        const menuItem = element.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.toggle('open');
        }
    },

    // ==========================================
    // 📑 TABS
    // ==========================================

    /**
     * Chuyển tab
     * @param {string} tabName - Tên tab
     * @param {HTMLElement} menuElement - Menu element (optional)
     */
    switchTab: function(tabName, menuElement = null) {
        // Ẩn tất cả tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Hiện tab được chọn
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Cập nhật active state cho menu
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Tìm menu item tương ứng và set active
        const menuItem = document.querySelector(`.menu-item[data-tab="${tabName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
            
            // Mở parent submenu nếu có
            const parentSubmenu = menuItem.closest('.submenu');
            if (parentSubmenu) {
                const parentMenuItem = parentSubmenu.closest('.menu-item');
                if (parentMenuItem) {
                    parentMenuItem.classList.add('open');
                }
            }
        }
        
        // Trigger render cho tab (nếu cần)
        this._onTabSwitch(tabName);
        
        // Đóng sidebar trên mobile
        if (window.innerWidth <= 768) {
            const container = document.getElementById('appContainer');
            if (container) {
                container.classList.remove('sidebar-open');
            }
        }
        
        return false; // Prevent default link behavior
    },

    /**
     * Xử lý khi chuyển tab
     * @private
     */
    _onTabSwitch: function(tabName) {
        const renderMap = {
            'dashboard': () => typeof renderDashboard === 'function' && renderDashboard(),
            'students': () => {
                if (typeof renderStudentsTable === 'function') renderStudentsTable();
                if (typeof updateStudentCounts === 'function') updateStudentCounts();
            },
            'trial': () => {
                if (typeof renderTrialStudentsTable === 'function') renderTrialStudentsTable();
                if (typeof updateTrialCounts === 'function') updateTrialCounts();
            },
            'appointments': () => typeof renderAppointmentsTable === 'function' && renderAppointmentsTable(),
            'registrations': () => typeof renderRegistrationsTable === 'function' && renderRegistrationsTable(),
            'receipts': () => typeof renderReceiptsTable === 'function' && renderReceiptsTable(),
            'categories': () => typeof renderSubjectsTable === 'function' && renderSubjectsTable(),
            'export': () => typeof renderBackupHistory === 'function' && renderBackupHistory(),
            'settings': () => {
                if (typeof loadCenterInfo === 'function') loadCenterInfo();
                if (typeof loadBankInfo === 'function') loadBankInfo();
            }
        };
        
        if (renderMap[tabName]) {
            renderMap[tabName]();
        }
    },

    /**
     * Chuyển category tab (trong tab Danh mục)
     * @param {string} categoryName - Tên category
     */
    switchCategoryTab: function(categoryName) {
        // Ẩn tất cả category contents
        document.querySelectorAll('.category-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Bỏ active tất cả category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hiện category được chọn
        const targetContent = document.getElementById(categoryName + 'Content');
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Set active cho tab button
        event.target.classList.add('active');
        
        // Trigger render
        const renderMap = {
            'subjects': () => typeof renderSubjectsTable === 'function' && renderSubjectsTable(),
            'packages': () => typeof renderPackagesTable === 'function' && renderPackagesTable(),
            'promotions': () => typeof renderPromotionsTable === 'function' && renderPromotionsTable()
        };
        
        if (renderMap[categoryName]) {
            renderMap[categoryName]();
        }
    },

    // ==========================================
    // 📝 FORM HELPERS
    // ==========================================

    /**
     * Reset form
     * @param {string} formId - ID của form
     */
    resetForm: function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Clear hidden inputs
            form.querySelectorAll('input[type="hidden"]').forEach(input => {
                if (!input.id.includes('csrf')) { // Giữ CSRF token nếu có
                    input.value = '';
                }
            });
            
            // Clear error states
            form.querySelectorAll('.error').forEach(el => {
                el.classList.remove('error');
            });
            form.querySelectorAll('.error-message').forEach(el => {
                el.remove();
            });
        }
    },

    /**
     * Hiển thị lỗi validation trên form
     * @param {string} formId - ID của form
     * @param {Array} errors - Mảng các lỗi
     */
    showFormErrors: function(formId, errors) {
        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error', 5000);
        }
    },

    /**
     * Toggle hiển thị form section
     * @param {string} sectionId - ID của section
     */
    toggleFormSection: function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('show');
            
            if (section.classList.contains('show')) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },

    // ==========================================
    // 🔍 SEARCHABLE SELECT
    // ==========================================

    /**
     * Đóng tất cả dropdown
     */
    closeAllDropdowns: function() {
        document.querySelectorAll('.searchable-select-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    },

    // ==========================================
    // 📊 EMPTY STATE
    // ==========================================

    /**
     * Render empty state
     * @param {string} icon - Icon emoji
     * @param {string} title - Tiêu đề
     * @param {string} text - Mô tả
     * @returns {string} HTML
     */
    renderEmptyState: function(icon = '📋', title = 'Không có dữ liệu', text = '') {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-title">${title}</div>
                ${text ? `<p class="empty-state-text">${text}</p>` : ''}
            </div>
        `;
    },

    /**
     * Render empty table row
     * @param {number} colspan - Số cột
     * @param {string} icon - Icon
     * @param {string} message - Thông báo
     * @returns {string} HTML
     */
    renderEmptyTableRow: function(colspan, icon = '📋', message = 'Không có dữ liệu') {
        return `
            <tr>
                <td colspan="${colspan}">
                    ${this.renderEmptyState(icon, message)}
                </td>
            </tr>
        `;
    },

    // ==========================================
    // 🔧 MISC HELPERS
    // ==========================================

    /**
     * Confirm dialog
     * @param {string} message - Nội dung
     * @returns {boolean}
     */
    confirm: function(message) {
        return window.confirm(message);
    },

    /**
     * Prompt dialog
     * @param {string} message - Nội dung
     * @param {string} defaultValue - Giá trị mặc định
     * @returns {string|null}
     */
    prompt: function(message, defaultValue = '') {
        return window.prompt(message, defaultValue);
    },

    /**
     * Scroll to element
     * @param {string} elementId - ID của element
     */
    scrollTo: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text cần copy
     */
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Đã copy!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('Đã copy!', 'success');
        }
    }
};


// ==========================================
// 🌐 GLOBAL FUNCTIONS (Để gọi từ HTML onclick)
// ==========================================

// Notification
function showNotification(message, type) {
    UI.showNotification(message, type);
}

function hideNotification() {
    UI.hideNotification();
}

// Modal
function openModal(modalId) {
    UI.openModal(modalId);
}

function closeModal(modalId) {
    UI.closeModal(modalId);
}

// Sidebar
function toggleSidebar() {
    UI.toggleSidebar();
}

function toggleSubmenu(element) {
    UI.toggleSubmenu(element);
}

// Tab
function switchTab(tabName, element) {
    UI.switchTab(tabName, element);
}

function switchCategoryTab(categoryName) {
    UI.switchCategoryTab(categoryName);
}

// Form
function formatCurrencyInput(input) {
    Utils.formatCurrencyInput(input);
}


// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI };
}

// ==========================================
// 🔗 ALIAS - UIModule để các module khác gọi được
// ==========================================
const UIModule = {
    init: function() {
        UI.restoreSidebarState();
        console.log('✅ UIModule initialized');
    },
    
    showNotification: function(message, type, duration) {
        UI.showNotification(message, type, duration);
    },
    
    openModal: function(modalId) {
        UI.openModal(modalId);
    },
    
    closeModal: function(modalId) {
        UI.closeModal(modalId);
    },
    
    renderPagination: function(currentPage, totalPages, callbackFn) {
        // Simple pagination HTML
        let html = '<div class="pagination">';
        html += `<button onclick="${callbackFn}(1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
        html += `<button onclick="${callbackFn}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<button class="active">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
                html += `<button onclick="${callbackFn}(${i})">${i}</button>`;
            } else if (Math.abs(i - currentPage) === 3) {
                html += '<span>...</span>';
            }
        }
        
        html += `<button onclick="${callbackFn}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button onclick="${callbackFn}(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
        html += '</div>';
        
        return html;
    },
    
    showConfirm: function(message, onConfirm, title = 'Xác nhận') {
        if (confirm(message.replace(/<[^>]*>/g, ''))) {
            onConfirm();
        }
    }
};

// Export global
window.UI = UI;
window.UIModule = UIModule;

console.log('✅ UIModule loaded');
