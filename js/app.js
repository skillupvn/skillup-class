/**
 * ========================================
 * APP MODULE - Khởi tạo và điều phối
 * ========================================
 * File: js/app.js
 * Version: 4.0
 * Description: File chính khởi tạo ứng dụng
 */

const App = (function() {
    'use strict';

    // ============ PRIVATE VARIABLES ============
    let isInitialized = false;
    let currentTab = 'dashboard';

    // ============ PRIVATE METHODS ============

    /**
     * Khởi tạo tất cả modules
     */
    function initModules() {
        try {
            // Core modules (theo thứ tự dependency)
            if (typeof DataModule !== 'undefined') {
                DataModule.init();
            }

            if (typeof UIModule !== 'undefined') {
                UIModule.init();
            }

            // Feature modules
            const modules = [
                { name: 'DashboardModule', instance: typeof DashboardModule !== 'undefined' ? DashboardModule : null },
                { name: 'StudentsModule', instance: typeof StudentsModule !== 'undefined' ? StudentsModule : null },
                { name: 'TrialModule', instance: typeof TrialModule !== 'undefined' ? TrialModule : null },
                { name: 'AppointmentsModule', instance: typeof AppointmentsModule !== 'undefined' ? AppointmentsModule : null },
                { name: 'RegistrationsModule', instance: typeof RegistrationsModule !== 'undefined' ? RegistrationsModule : null },
                { name: 'ReceiptsModule', instance: typeof ReceiptsModule !== 'undefined' ? ReceiptsModule : null },
                { name: 'CategoriesModule', instance: typeof CategoriesModule !== 'undefined' ? CategoriesModule : null },
                { name: 'ExportModule', instance: typeof ExportModule !== 'undefined' ? ExportModule : null },
                { name: 'SettingsModule', instance: typeof SettingsModule !== 'undefined' ? SettingsModule : null }
            ];

            modules.forEach(mod => {
                if (mod.instance && typeof mod.instance.init === 'function') {
                    mod.instance.init();
                    console.log(`✓ ${mod.name} initialized`);
                }
            });

            console.log('All modules initialized successfully');

        } catch (error) {
            console.error('Error initializing modules:', error);
            UIModule.showNotification('Có lỗi khi khởi tạo ứng dụng', 'error');
        }
    }

    /**
     * Setup navigation
     */
    function setupNavigation() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                if (mainContent) {
                    mainContent.classList.toggle('expanded');
                }
                
                // Lưu trạng thái
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });

            // Restore trạng thái
            const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (wasCollapsed) {
                sidebar.classList.add('collapsed');
                if (mainContent) mainContent.classList.add('expanded');
            }
        }

        // Tab navigation
        document.querySelectorAll('[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.dataset.tab;
                switchTab(tab);
            });
        });

        // Submenu toggle (tree structure)
        document.querySelectorAll('.nav-item.has-submenu > .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = e.currentTarget.parentElement;
                parent.classList.toggle('open');
            });
        });
    }

    /**
     * Chuyển tab
     */
    function switchTab(tab) {
        currentTab = tab;

        // Update active state in sidebar
        document.querySelectorAll('[data-tab]').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.tab === tab) {
                link.classList.add('active');
                
                // Mở parent submenu nếu có
                const parentSubmenu = link.closest('.nav-item.has-submenu');
                if (parentSubmenu) {
                    parentSubmenu.classList.add('open');
                }
            }
        });

        // Show/hide tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const activeContent = document.getElementById(`${tab}Tab`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }

        // Refresh module tương ứng
        refreshCurrentModule(tab);

        // Lưu tab hiện tại
        localStorage.setItem('currentTab', tab);

        // Đóng sidebar trên mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('collapsed');
        }
    }

    /**
     * Refresh module hiện tại
     */
    function refreshCurrentModule(tab) {
        const moduleMap = {
            'dashboard': DashboardModule,
            'students': StudentsModule,
            'trial': TrialModule,
            'appointments': AppointmentsModule,
            'registrations': RegistrationsModule,
            'receipts': ReceiptsModule,
            'categories': CategoriesModule,
            'export': ExportModule,
            'settings': SettingsModule
        };

        const module = moduleMap[tab];
        if (module && typeof module.refresh === 'function') {
            module.refresh();
        }
    }

    /**
     * Setup responsive behavior
     */
    function setupResponsive() {
        const handleResize = Utils.debounce(() => {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');

            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.add('collapsed');
                if (mainContent) mainContent.classList.add('expanded');
            }
        }, 250);

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }

    /**
     * Setup keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save (prevent default)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                UIModule.showNotification('Dữ liệu được lưu tự động', 'info');
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    UIModule.closeModal(modal.id);
                });
            }

            // Ctrl/Cmd + B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                const toggleBtn = document.getElementById('sidebarToggle');
                if (toggleBtn) toggleBtn.click();
            }
        });
    }

    /**
     * Hiển thị thông tin version
     */
    function showVersionInfo() {
        const versionEl = document.getElementById('appVersion');
        if (versionEl) {
            versionEl.textContent = `v${CONFIG.APP.VERSION}`;
        }

        console.log(`
╔═══════════════════════════════════════════╗
║  ${CONFIG.APP.NAME}
║  Version: ${CONFIG.APP.VERSION}
║  Build: ${CONFIG.APP.BUILD_DATE}
╚═══════════════════════════════════════════╝
        `);
    }

    /**
     * Kiểm tra và migrate dữ liệu cũ
     */
    function checkDataMigration() {
        const dataVersion = localStorage.getItem('dataVersion');
        
        if (!dataVersion || dataVersion < CONFIG.APP.VERSION) {
            console.log('Checking for data migration...');
            
            if (typeof DataModule !== 'undefined' && typeof DataModule.migrate === 'function') {
                DataModule.migrate(dataVersion);
            }
            
            localStorage.setItem('dataVersion', CONFIG.APP.VERSION);
        }
    }

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo ứng dụng
         */
        init: function() {
            if (isInitialized) {
                console.warn('App already initialized');
                return;
            }

            console.log('Initializing application...');

            try {
                // Check browser compatibility
                if (!this.checkBrowserSupport()) {
                    alert('Trình duyệt của bạn không được hỗ trợ. Vui lòng sử dụng Chrome, Firefox, Edge hoặc Safari phiên bản mới.');
                    return;
                }

                // Check and migrate data
                checkDataMigration();

                // Initialize modules
                initModules();

                // Setup UI
                setupNavigation();
                setupResponsive();
                setupKeyboardShortcuts();

                // Show version
                showVersionInfo();

                // Restore last tab
                const lastTab = localStorage.getItem('currentTab') || 'dashboard';
                switchTab(lastTab);

                isInitialized = true;
                console.log('Application initialized successfully!');

                // Dispatch event
                document.dispatchEvent(new CustomEvent('appReady'));

            } catch (error) {
                console.error('Failed to initialize application:', error);
                alert('Có lỗi khi khởi tạo ứng dụng. Vui lòng tải lại trang.');
            }
        },

        /**
         * Kiểm tra browser support
         */
        checkBrowserSupport: function() {
            const features = [
                typeof localStorage !== 'undefined',
                typeof JSON !== 'undefined',
                typeof Promise !== 'undefined',
                typeof document.querySelector === 'function'
            ];

            return features.every(f => f === true);
        },

        /**
         * Chuyển tab (public)
         */
        switchTab: function(tab) {
            switchTab(tab);
        },

        /**
         * Lấy tab hiện tại
         */
        getCurrentTab: function() {
            return currentTab;
        },

        /**
         * Refresh module hiện tại
         */
        refreshCurrent: function() {
            refreshCurrentModule(currentTab);
        },

        /**
         * Refresh tất cả modules
         */
        refreshAll: function() {
            const modules = [
                DashboardModule,
                StudentsModule,
                TrialModule,
                AppointmentsModule,
                RegistrationsModule,
                ReceiptsModule,
                CategoriesModule,
                SettingsModule
            ];

            modules.forEach(mod => {
                if (mod && typeof mod.refresh === 'function') {
                    mod.refresh();
                }
            });
        },

        /**
         * Lấy trạng thái khởi tạo
         */
        isReady: function() {
            return isInitialized;
        }
    };
})();

// ============ DOCUMENT READY ============
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// ============ ERROR HANDLING ============
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', { msg, url, lineNo, columnNo, error });
    
    // Không hiển thị lỗi cho user trong production
    if (CONFIG.APP.DEBUG) {
        UIModule.showNotification(`Lỗi: ${msg}`, 'error');
    }
    
    return false;
};

window.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (CONFIG.APP.DEBUG) {
        UIModule.showNotification('Có lỗi xảy ra', 'error');
    }
};
