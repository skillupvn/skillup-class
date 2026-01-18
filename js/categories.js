/**
 * ========================================
 * CATEGORIES MODULE - Quản lý Danh mục
 * ========================================
 * File: js/categories.js
 * Version: 4.0
 * Description: Quản lý Môn học, Gói học phí, Khuyến mãi
 */

const CategoriesModule = (function() {
    'use strict';

    // ============ PRIVATE VARIABLES ============
    let activeTab = 'subjects'; // subjects | packages | promotions

    // ============ SUBJECTS (Môn học) ============
    const SubjectsManager = {
        render: function() {
            const container = document.getElementById('subjectsList');
            if (!container) return;

            const subjects = DataModule.getAll('subjects');

            if (subjects.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted py-4">
                            <i class="fas fa-book fa-3x mb-3 d-block"></i>
                            Chưa có môn học nào
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            subjects.forEach((subject, index) => {
                html += `
                    <tr data-id="${subject.id}">
                        <td class="text-center">${index + 1}</td>
                        <td>
                            <strong>${Utils.escapeHtml(subject.name)}</strong>
                            ${subject.code ? `<br><small class="text-muted">Mã: ${Utils.escapeHtml(subject.code)}</small>` : ''}
                        </td>
                        <td>${Utils.escapeHtml(subject.description || '--')}</td>
                        <td class="text-center">
                            <span class="badge ${subject.isActive !== false ? 'bg-success' : 'bg-secondary'}">
                                ${subject.isActive !== false ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="CategoriesModule.editSubject('${subject.id}')" title="Sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="CategoriesModule.deleteSubject('${subject.id}')" title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            container.innerHTML = html;
        },

        resetForm: function() {
            const form = document.getElementById('subjectForm');
            if (form) {
                form.reset();
                document.getElementById('subjectId').value = '';
                document.getElementById('subjectIsActive').checked = true;
            }
        },

        loadForm: function(subject) {
            document.getElementById('subjectId').value = subject.id || '';
            document.getElementById('subjectName').value = subject.name || '';
            document.getElementById('subjectCode').value = subject.code || '';
            document.getElementById('subjectDescription').value = subject.description || '';
            document.getElementById('subjectIsActive').checked = subject.isActive !== false;
        },

        collectForm: function() {
            return {
                id: document.getElementById('subjectId').value || Utils.generateId('SUB'),
                name: document.getElementById('subjectName').value.trim(),
                code: document.getElementById('subjectCode').value.trim().toUpperCase(),
                description: document.getElementById('subjectDescription').value.trim(),
                isActive: document.getElementById('subjectIsActive').checked
            };
        },

        validate: function(data) {
            const errors = [];
            if (!data.name || data.name.length < 2) {
                errors.push('Tên môn học phải có ít nhất 2 ký tự');
            }
            // Kiểm tra trùng tên
            const existing = DataModule.getAll('subjects').find(s => 
                s.name.toLowerCase() === data.name.toLowerCase() && s.id !== data.id
            );
            if (existing) {
                errors.push('Tên môn học đã tồn tại');
            }
            return errors;
        }
    };

    // ============ PACKAGES (Gói học phí) ============
    const PackagesManager = {
        render: function() {
            const container = document.getElementById('packagesList');
            if (!container) return;

            const packages = DataModule.getAll('packages');
            const subjects = DataModule.getAll('subjects');

            if (packages.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="fas fa-box fa-3x mb-3 d-block"></i>
                            Chưa có gói học phí nào
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            packages.forEach((pkg, index) => {
                const subject = subjects.find(s => s.id === pkg.subjectId);
                html += `
                    <tr data-id="${pkg.id}">
                        <td class="text-center">${index + 1}</td>
                        <td>
                            <strong>${Utils.escapeHtml(pkg.name)}</strong>
                        </td>
                        <td>${Utils.escapeHtml(subject?.name || '--')}</td>
                        <td class="text-center">${pkg.sessions || '--'}</td>
                        <td class="text-end"><strong class="text-primary">${Utils.formatCurrency(pkg.price)}</strong></td>
                        <td class="text-center">
                            <span class="badge ${pkg.isActive !== false ? 'bg-success' : 'bg-secondary'}">
                                ${pkg.isActive !== false ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="CategoriesModule.editPackage('${pkg.id}')" title="Sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="CategoriesModule.deletePackage('${pkg.id}')" title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            container.innerHTML = html;
        },

        populateSubjects: function() {
            const select = document.getElementById('packageSubjectId');
            if (!select) return;

            const subjects = DataModule.getAll('subjects').filter(s => s.isActive !== false);
            let options = '<option value="">-- Chọn môn học (tùy chọn) --</option>';
            subjects.forEach(s => {
                options += `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`;
            });
            select.innerHTML = options;
        },

        resetForm: function() {
            const form = document.getElementById('packageForm');
            if (form) {
                form.reset();
                document.getElementById('packageId').value = '';
                document.getElementById('packageIsActive').checked = true;
            }
            this.populateSubjects();
        },

        loadForm: function(pkg) {
            document.getElementById('packageId').value = pkg.id || '';
            document.getElementById('packageName').value = pkg.name || '';
            document.getElementById('packageSubjectId').value = pkg.subjectId || '';
            document.getElementById('packageSessions').value = pkg.sessions || '';
            document.getElementById('packagePrice').value = pkg.price || '';
            document.getElementById('packageDescription').value = pkg.description || '';
            document.getElementById('packageIsActive').checked = pkg.isActive !== false;
        },

        collectForm: function() {
            return {
                id: document.getElementById('packageId').value || Utils.generateId('PKG'),
                name: document.getElementById('packageName').value.trim(),
                subjectId: document.getElementById('packageSubjectId').value || null,
                sessions: parseInt(document.getElementById('packageSessions').value) || 0,
                price: parseFloat(document.getElementById('packagePrice').value) || 0,
                description: document.getElementById('packageDescription').value.trim(),
                isActive: document.getElementById('packageIsActive').checked
            };
        },

        validate: function(data) {
            const errors = [];
            if (!data.name || data.name.length < 2) {
                errors.push('Tên gói phải có ít nhất 2 ký tự');
            }
            if (data.price <= 0) {
                errors.push('Giá gói phải lớn hơn 0');
            }
            return errors;
        }
    };

    // ============ PROMOTIONS (Khuyến mãi) ============
    const PromotionsManager = {
        render: function() {
            const container = document.getElementById('promotionsList');
            if (!container) return;

            const promotions = DataModule.getAll('promotions');

            if (promotions.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="fas fa-tags fa-3x mb-3 d-block"></i>
                            Chưa có khuyến mãi nào
                        </td>
                    </tr>
                `;
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            let html = '';

            promotions.forEach((promo, index) => {
                const discountText = promo.discountType === 'percent' 
                    ? `${promo.discountValue}%` 
                    : Utils.formatCurrency(promo.discountValue);
                
                // Kiểm tra còn hiệu lực
                let statusClass = 'bg-secondary';
                let statusText = 'Tạm dừng';
                
                if (promo.isActive) {
                    const isExpired = promo.endDate && promo.endDate < today;
                    const isNotStarted = promo.startDate && promo.startDate > today;
                    
                    if (isExpired) {
                        statusClass = 'bg-danger';
                        statusText = 'Hết hạn';
                    } else if (isNotStarted) {
                        statusClass = 'bg-warning text-dark';
                        statusText = 'Chưa bắt đầu';
                    } else {
                        statusClass = 'bg-success';
                        statusText = 'Đang áp dụng';
                    }
                }

                html += `
                    <tr data-id="${promo.id}">
                        <td class="text-center">${index + 1}</td>
                        <td>
                            <strong>${Utils.escapeHtml(promo.name)}</strong>
                            ${promo.code ? `<br><small class="text-muted">Mã: <code>${Utils.escapeHtml(promo.code)}</code></small>` : ''}
                        </td>
                        <td class="text-center">
                            <span class="badge bg-primary fs-6">-${discountText}</span>
                        </td>
                        <td class="text-center">
                            ${promo.startDate ? Utils.formatDate(promo.startDate) : '--'}
                        </td>
                        <td class="text-center">
                            ${promo.endDate ? Utils.formatDate(promo.endDate) : 'Không giới hạn'}
                        </td>
                        <td class="text-center">
                            <span class="badge ${statusClass}">${statusText}</span>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="CategoriesModule.editPromotion('${promo.id}')" title="Sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="CategoriesModule.deletePromotion('${promo.id}')" title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            container.innerHTML = html;
        },

        resetForm: function() {
            const form = document.getElementById('promotionForm');
            if (form) {
                form.reset();
                document.getElementById('promotionId').value = '';
                document.getElementById('promotionIsActive').checked = true;
                document.getElementById('promotionDiscountType').value = 'percent';
            }
        },

        loadForm: function(promo) {
            document.getElementById('promotionId').value = promo.id || '';
            document.getElementById('promotionName').value = promo.name || '';
            document.getElementById('promotionCode').value = promo.code || '';
            document.getElementById('promotionDiscountType').value = promo.discountType || 'percent';
            document.getElementById('promotionDiscountValue').value = promo.discountValue || '';
            document.getElementById('promotionStartDate').value = promo.startDate || '';
            document.getElementById('promotionEndDate').value = promo.endDate || '';
            document.getElementById('promotionDescription').value = promo.description || '';
            document.getElementById('promotionIsActive').checked = promo.isActive !== false;
        },

        collectForm: function() {
            return {
                id: document.getElementById('promotionId').value || Utils.generateId('PROMO'),
                name: document.getElementById('promotionName').value.trim(),
                code: document.getElementById('promotionCode').value.trim().toUpperCase(),
                discountType: document.getElementById('promotionDiscountType').value,
                discountValue: parseFloat(document.getElementById('promotionDiscountValue').value) || 0,
                startDate: document.getElementById('promotionStartDate').value || null,
                endDate: document.getElementById('promotionEndDate').value || null,
                description: document.getElementById('promotionDescription').value.trim(),
                isActive: document.getElementById('promotionIsActive').checked
            };
        },

        validate: function(data) {
            const errors = [];
            if (!data.name || data.name.length < 2) {
                errors.push('Tên khuyến mãi phải có ít nhất 2 ký tự');
            }
            if (data.discountValue <= 0) {
                errors.push('Giá trị giảm phải lớn hơn 0');
            }
            if (data.discountType === 'percent' && data.discountValue > 100) {
                errors.push('Phần trăm giảm không được vượt quá 100%');
            }
            if (data.startDate && data.endDate && data.startDate > data.endDate) {
                errors.push('Ngày kết thúc phải sau ngày bắt đầu');
            }
            return errors;
        }
    };

    // ============ PUBLIC METHODS ============
    return {
        /**
         * Khởi tạo module
         */
        init: function() {
            this.bindEvents();
            this.renderAll();
            console.log('CategoriesModule initialized');
        },

        /**
         * Bind sự kiện
         */
        bindEvents: function() {
            // Tab switching
            const tabBtns = document.querySelectorAll('[data-category-tab]');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.dataset.categoryTab;
                    this.switchTab(tab);
                });
            });

            // Subject form
            const subjectForm = document.getElementById('subjectForm');
            if (subjectForm) {
                subjectForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveSubject();
                });
            }

            // Package form
            const packageForm = document.getElementById('packageForm');
            if (packageForm) {
                packageForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.savePackage();
                });
            }

            // Promotion form
            const promotionForm = document.getElementById('promotionForm');
            if (promotionForm) {
                promotionForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.savePromotion();
                });
            }
        },

        /**
         * Chuyển tab
         */
        switchTab: function(tab) {
            activeTab = tab;
            
            // Update tab buttons
            document.querySelectorAll('[data-category-tab]').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.categoryTab === tab) {
                    btn.classList.add('active');
                }
            });

            // Update tab contents
            document.querySelectorAll('.category-tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });

            const activeContent = document.getElementById(`${tab}Tab`);
            if (activeContent) {
                activeContent.classList.add('active');
                activeContent.style.display = 'block';
            }
        },

        /**
         * Render tất cả danh mục
         */
        renderAll: function() {
            SubjectsManager.render();
            PackagesManager.render();
            PromotionsManager.render();
        },

        /**
         * Refresh
         */
        refresh: function() {
            this.renderAll();
        },

        // ========== SUBJECTS ==========
        openAddSubjectModal: function() {
            SubjectsManager.resetForm();
            document.getElementById('subjectModalTitle').textContent = 'Thêm môn học mới';
            UIModule.openModal('subjectModal');
        },

        editSubject: function(id) {
            const subject = DataModule.getById('subjects', id);
            if (!subject) {
                UIModule.showNotification('Không tìm thấy môn học', 'error');
                return;
            }
            SubjectsManager.resetForm();
            SubjectsManager.loadForm(subject);
            document.getElementById('subjectModalTitle').textContent = 'Sửa môn học';
            UIModule.openModal('subjectModal');
        },

        saveSubject: function() {
            const data = SubjectsManager.collectForm();
            const errors = SubjectsManager.validate(data);

            if (errors.length > 0) {
                UIModule.showNotification(errors.join('<br>'), 'error');
                return;
            }

            const isNew = !DataModule.getById('subjects', data.id);
            const success = DataModule.save('subjects', data);

            if (success) {
                UIModule.closeModal('subjectModal');
                SubjectsManager.render();
                UIModule.showNotification(
                    isNew ? 'Đã thêm môn học' : 'Đã cập nhật môn học',
                    'success'
                );
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        deleteSubject: function(id) {
            // Kiểm tra có đang được sử dụng không
            const registrations = DataModule.getAll('registrations').filter(r => r.subjectId === id);
            if (registrations.length > 0) {
                UIModule.showNotification(`Không thể xóa! Môn học đang được sử dụng trong ${registrations.length} phiếu đăng ký`, 'error');
                return;
            }

            UIModule.showConfirm('Bạn có chắc muốn xóa môn học này?', () => {
                const success = DataModule.delete('subjects', id);
                if (success) {
                    SubjectsManager.render();
                    UIModule.showNotification('Đã xóa môn học', 'success');
                }
            });
        },

        // ========== PACKAGES ==========
        openAddPackageModal: function() {
            PackagesManager.resetForm();
            document.getElementById('packageModalTitle').textContent = 'Thêm gói học phí mới';
            UIModule.openModal('packageModal');
        },

        editPackage: function(id) {
            const pkg = DataModule.getById('packages', id);
            if (!pkg) {
                UIModule.showNotification('Không tìm thấy gói học phí', 'error');
                return;
            }
            PackagesManager.resetForm();
            PackagesManager.loadForm(pkg);
            document.getElementById('packageModalTitle').textContent = 'Sửa gói học phí';
            UIModule.openModal('packageModal');
        },

        savePackage: function() {
            const data = PackagesManager.collectForm();
            const errors = PackagesManager.validate(data);

            if (errors.length > 0) {
                UIModule.showNotification(errors.join('<br>'), 'error');
                return;
            }

            const isNew = !DataModule.getById('packages', data.id);
            const success = DataModule.save('packages', data);

            if (success) {
                UIModule.closeModal('packageModal');
                PackagesManager.render();
                UIModule.showNotification(
                    isNew ? 'Đã thêm gói học phí' : 'Đã cập nhật gói học phí',
                    'success'
                );
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        deletePackage: function(id) {
            const registrations = DataModule.getAll('registrations').filter(r => r.packageId === id);
            if (registrations.length > 0) {
                UIModule.showNotification(`Không thể xóa! Gói đang được sử dụng trong ${registrations.length} phiếu đăng ký`, 'error');
                return;
            }

            UIModule.showConfirm('Bạn có chắc muốn xóa gói học phí này?', () => {
                const success = DataModule.delete('packages', id);
                if (success) {
                    PackagesManager.render();
                    UIModule.showNotification('Đã xóa gói học phí', 'success');
                }
            });
        },

        // ========== PROMOTIONS ==========
        openAddPromotionModal: function() {
            PromotionsManager.resetForm();
            document.getElementById('promotionModalTitle').textContent = 'Thêm khuyến mãi mới';
            UIModule.openModal('promotionModal');
        },

        editPromotion: function(id) {
            const promo = DataModule.getById('promotions', id);
            if (!promo) {
                UIModule.showNotification('Không tìm thấy khuyến mãi', 'error');
                return;
            }
            PromotionsManager.resetForm();
            PromotionsManager.loadForm(promo);
            document.getElementById('promotionModalTitle').textContent = 'Sửa khuyến mãi';
            UIModule.openModal('promotionModal');
        },

        savePromotion: function() {
            const data = PromotionsManager.collectForm();
            const errors = PromotionsManager.validate(data);

            if (errors.length > 0) {
                UIModule.showNotification(errors.join('<br>'), 'error');
                return;
            }

            const isNew = !DataModule.getById('promotions', data.id);
            const success = DataModule.save('promotions', data);

            if (success) {
                UIModule.closeModal('promotionModal');
                PromotionsManager.render();
                UIModule.showNotification(
                    isNew ? 'Đã thêm khuyến mãi' : 'Đã cập nhật khuyến mãi',
                    'success'
                );
            } else {
                UIModule.showNotification('Có lỗi khi lưu', 'error');
            }
        },

        deletePromotion: function(id) {
            UIModule.showConfirm('Bạn có chắc muốn xóa khuyến mãi này?', () => {
                const success = DataModule.delete('promotions', id);
                if (success) {
                    PromotionsManager.render();
                    UIModule.showNotification('Đã xóa khuyến mãi', 'success');
                }
            });
        },

        // ========== UTILITIES ==========
        /**
         * Lấy danh sách môn học active
         */
        getActiveSubjects: function() {
            return DataModule.getAll('subjects').filter(s => s.isActive !== false);
        },

        /**
         * Lấy danh sách gói active
         */
        getActivePackages: function() {
            return DataModule.getAll('packages').filter(p => p.isActive !== false);
        },

        /**
         * Lấy danh sách khuyến mãi đang áp dụng
         */
        getActivePromotions: function() {
            const today = new Date().toISOString().split('T')[0];
            return DataModule.getAll('promotions').filter(p => {
                if (!p.isActive) return false;
                if (p.startDate && p.startDate > today) return false;
                if (p.endDate && p.endDate < today) return false;
                return true;
            });
        }
    };
})();
