/* ==========================================================
   TaskPulse - Complete Client-Side App Logic
   Interactive Todo & Task Manager with Calendar & SMTP Reminders
   ========================================================== */

(function () {
  'use strict';

  // --- STATE MANAGEMENT ---
  const STORAGE_KEYS = {
    TASKS: 'taskpulse_tasks_v1',
    CATEGORIES: 'taskpulse_categories_v1',
    SMTP: 'taskpulse_smtp_config_v1',
    THEME: 'taskpulse_theme_v1'
  };

  const DEFAULT_CATEGORIES = [
    { name: 'Work', color: '#6366f1' },
    { name: 'Personal', color: '#10b981' },
    { name: 'Urgent', color: '#ef4444' },
    { name: 'Health', color: '#06b6d4' },
    { name: 'Finance', color: '#f59e0b' }
  ];

  let state = {
    tasks: [],
    categories: [],
    smtpConfig: null,
    currentView: 'dashboard',
    currentCalendarDate: new Date(),
    dashboardFilter: 'all',
    searchQuery: ''
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    setupTheme();
    setupEventListeners();
    renderAll();

    // Start SMTP Background Reminder Ticker (Every 30 seconds)
    setInterval(checkUpcomingTaskReminders, 30000);
    // Initial check right after load
    setTimeout(checkUpcomingTaskReminders, 2000);
  });

  // Load persisted data or set defaults
  function loadStateFromStorage() {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (savedTasks) {
      state.tasks = JSON.parse(savedTasks);
    } else {
      // Seed sample tasks for immediate interactive demo
      const todayStr = getFormattedDate(new Date());
      const tomorrowStr = getFormattedDate(new Date(Date.now() + 86400000));

      state.tasks = [
        {
          id: generateId(),
          title: 'Review Q3 Project Deliverables',
          category: 'Work',
          priority: 'high',
          dueDate: todayStr,
          dueTime: '15:00',
          description: 'Prepare presentation deck for the leadership sync.',
          completed: false,
          reminderEnabled: true,
          reminderOffset: '15',
          recipientEmail: 'krishnarohith417@gmail.com',
          createdAt: new Date().toISOString()
        },
        {
          id: generateId(),
          title: 'Weekly Gym Workout Session',
          category: 'Health',
          priority: 'medium',
          dueDate: todayStr,
          dueTime: '18:30',
          description: 'Leg day routine & 30 min cardio.',
          completed: false,
          reminderEnabled: false,
          createdAt: new Date().toISOString()
        },
        {
          id: generateId(),
          title: 'Pay Monthly Utility Bills',
          category: 'Finance',
          priority: 'high',
          dueDate: tomorrowStr,
          dueTime: '10:00',
          description: 'Electricity, Water, Internet subscriptions.',
          completed: false,
          reminderEnabled: true,
          reminderOffset: '60',
          recipientEmail: 'krishnarohith417@gmail.com',
          createdAt: new Date().toISOString()
        }
      ];
      saveTasksToStorage();
    }

    const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    state.categories = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;

    const DEFAULT_SMTP_CONFIG = {
      host: 'smtp.gmail.com',
      port: '587',
      user: 'krishnarohith417@gmail.com',
      pass: 'beblzukehtmmiitg',
      senderEmail: 'krishnarohith417@gmail.com',
      defaultRecipient: 'krishnarohith417@gmail.com',
      secure: true
    };

    const savedSmtp = localStorage.getItem(STORAGE_KEYS.SMTP);
    if (savedSmtp) {
      state.smtpConfig = JSON.parse(savedSmtp);
      state.smtpConfig.user = state.smtpConfig.user || 'krishnarohith417@gmail.com';
      state.smtpConfig.senderEmail = state.smtpConfig.senderEmail || 'krishnarohith417@gmail.com';
      state.smtpConfig.defaultRecipient = state.smtpConfig.defaultRecipient || 'krishnarohith417@gmail.com';
      state.smtpConfig.pass = state.smtpConfig.pass || 'beblzukehtmmiitg';
    } else {
      state.smtpConfig = DEFAULT_SMTP_CONFIG;
    }
    localStorage.setItem(STORAGE_KEYS.SMTP, JSON.stringify(state.smtpConfig));
  }

  function saveTasksToStorage() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  }

  function saveSmtpToStorage(config) {
    state.smtpConfig = config;
    localStorage.setItem(STORAGE_KEYS.SMTP, JSON.stringify(config));
    updateSmtpStatusUI();
  }

  // --- THEME MANAGEMENT ---
  function setupTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.checked = isDark;
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Mobile Drawer Controls
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');

    function openMobileSidebar() {
      if (sidebar) sidebar.classList.add('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    function closeMobileSidebar() {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Navigation items
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        switchView(view);
        closeMobileSidebar();
      });
    });

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        document.body.classList.toggle('dark-theme', isDark);
        document.body.classList.toggle('light-theme', !isDark);
        localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
      });
    }

    // Quick Add Task Button & Calendar Link
    document.getElementById('quickAddTaskBtn').addEventListener('click', () => openTaskModal());
    document.getElementById('goToFullCalendar').addEventListener('click', () => switchView('calendar'));

    // Task Modal Controls
    document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskModal').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleTaskFormSubmit);

    // Send Immediate Email from Modal Button
    const sendModalEmailNowBtn = document.getElementById('sendModalEmailNowBtn');
    if (sendModalEmailNowBtn) {
      sendModalEmailNowBtn.addEventListener('click', () => {
        const title = document.getElementById('taskTitleInput').value.trim() || 'Untitled Task';
        const category = document.getElementById('taskCategorySelect').value;
        const priority = document.getElementById('taskPrioritySelect').value;
        const dueDate = document.getElementById('taskDueDateInput').value || getFormattedDate(new Date());
        const dueTime = document.getElementById('taskDueTimeInput').value || '12:00';
        const description = document.getElementById('taskDescriptionInput').value.trim();
        const recipient = document.getElementById('taskRecipientEmail').value.trim() || 'krishnarohith417@gmail.com';

        const tempTask = {
          title, category, priority, dueDate, dueTime, description
        };

        triggerTaskEmailReminderManually(tempTask, recipient);
      });
    }

    // Reminder toggle inside Task Modal
    const reminderCheckbox = document.getElementById('taskEnableReminder');
    const reminderDetails = document.getElementById('reminderDetails');
    reminderCheckbox.addEventListener('change', (e) => {
      reminderDetails.classList.toggle('show', e.target.checked);
      if (e.target.checked && state.smtpConfig && state.smtpConfig.defaultRecipient) {
        document.getElementById('taskRecipientEmail').value = state.smtpConfig.defaultRecipient;
      }
    });

    // SMTP Config Modal Controls
    document.getElementById('smtpConfigBtn').addEventListener('click', openSmtpModal);
    document.getElementById('smtpConfigureQuickBtn').addEventListener('click', openSmtpModal);
    document.getElementById('closeSmtpModal').addEventListener('click', closeSmtpModal);
    document.getElementById('cancelSmtpModal').addEventListener('click', closeSmtpModal);
    document.getElementById('smtpForm').addEventListener('submit', handleSmtpFormSubmit);
    document.getElementById('sendTestEmailBtn').addEventListener('click', handleSendTestEmail);

    // Quick Provider Preset Selector in SMTP Modal
    document.getElementById('smtpProviderSelect').addEventListener('change', (e) => {
      applySmtpPreset(e.target.value);
    });

    // Toggle SMTP Password Visibility
    document.getElementById('toggleSmtpPass').addEventListener('click', () => {
      const passInput = document.getElementById('smtpPassInput');
      const icon = document.querySelector('#toggleSmtpPass i');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        passInput.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });

    // Search Input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderTaskList();
      renderDashboardTasks();
    });

    // Dashboard Filters
    document.getElementById('dashboardFilterPills').addEventListener('click', (e) => {
      if (e.target.classList.contains('pill')) {
        document.querySelectorAll('#dashboardFilterPills .pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        state.dashboardFilter = e.target.getAttribute('data-filter');
        renderDashboardTasks();
      }
    });

    // Tasks Toolbar Filters
    ['taskCategoryFilter', 'taskPriorityFilter', 'taskStatusFilter'].forEach(id => {
      document.getElementById(id).addEventListener('change', renderTaskList);
    });

    // Calendar Navigation Controls
    document.getElementById('calPrevBtn').addEventListener('click', () => {
      state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
      renderCalendar();
    });

    document.getElementById('calNextBtn').addEventListener('click', () => {
      state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
      renderCalendar();
    });

    document.getElementById('calTodayBtn').addEventListener('click', () => {
      state.currentCalendarDate = new Date();
      renderCalendar();
    });
  }

  // --- VIEW SWITCHING ---
  function switchView(viewName) {
    state.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    if (viewName === 'dashboard') {
      document.getElementById('dashboardView').classList.add('active');
      pageTitle.textContent = 'Dashboard';
      pageSubtitle.textContent = "Welcome back! Here's an overview of your schedule.";
    } else if (viewName === 'tasks') {
      document.getElementById('tasksView').classList.add('active');
      pageTitle.textContent = 'My Tasks';
      pageSubtitle.textContent = 'Manage, edit, and organize all your upcoming and past tasks.';
    } else if (viewName === 'calendar') {
      document.getElementById('calendarView').classList.add('active');
      pageTitle.textContent = 'Interactive Calendar';
      pageSubtitle.textContent = 'Click any date to assign tasks directly to your calendar grid.';
      renderCalendar();
    } else if (viewName === 'analytics') {
      document.getElementById('analyticsView').classList.add('active');
      pageTitle.textContent = 'Analytics & Reminders';
      pageSubtitle.textContent = 'Completion progress metrics and active SMTP email notification logs.';
      renderAnalytics();
    }

    renderAll();
  }

  // --- RENDERERS ---
  function renderAll() {
    renderStats();
    renderCategoryList();
    renderDashboardTasks();
    renderTaskList();
    renderMiniCalendar();
    updateSmtpStatusUI();
    document.getElementById('taskCountBadge').textContent = state.tasks.filter(t => !t.completed).length;
  }

  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const todayStr = getFormattedDate(new Date());

    const overdue = state.tasks.filter(t => !t.completed && t.dueDate < todayStr).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statOverdue').textContent = overdue;
  }

  function renderCategoryList() {
    const container = document.getElementById('categoryList');
    const selectFilter = document.getElementById('taskCategoryFilter');
    const modalSelect = document.getElementById('taskCategorySelect');

    let html = '';
    let selectOptions = '<option value="all">All Categories</option>';
    let modalOptions = '';

    state.categories.forEach(cat => {
      html += `
        <div class="category-item" onclick="filterByCategory('${cat.name}')">
          <span class="cat-dot" style="background-color: ${cat.color}"></span>
          <span>${cat.name}</span>
        </div>
      `;
      selectOptions += `<option value="${cat.name}">${cat.name}</option>`;
      modalOptions += `<option value="${cat.name}">${cat.name}</option>`;
    });

    container.innerHTML = html;
    if (selectFilter) selectFilter.innerHTML = selectOptions;
    if (modalSelect) modalSelect.innerHTML = modalOptions;
  }

  window.filterByCategory = function(categoryName) {
    switchView('tasks');
    document.getElementById('taskCategoryFilter').value = categoryName;
    renderTaskList();
  };

  // Render Dashboard Tasks List
  function renderDashboardTasks() {
    const container = document.getElementById('dashboardTaskList');
    const todayStr = getFormattedDate(new Date());

    let filtered = state.tasks.filter(task => {
      if (state.searchQuery && !task.title.toLowerCase().includes(state.searchQuery)) {
        return false;
      }
      if (state.dashboardFilter === 'today') return task.dueDate === todayStr;
      if (state.dashboardFilter === 'upcoming') return task.dueDate >= todayStr && !task.completed;
      if (state.dashboardFilter === 'high') return task.priority === 'high';
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted" style="padding: 40px 0;">
          <i class="fa-solid fa-clipboard-check" style="font-size: 32px; margin-bottom: 10px;"></i>
          <p>No tasks found for this view filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(task => createTaskCardHTML(task)).join('');
  }

  // Render Tasks Page List
  function renderTaskList() {
    const container = document.getElementById('fullTaskList');
    const categoryFilter = document.getElementById('taskCategoryFilter').value;
    const priorityFilter = document.getElementById('taskPriorityFilter').value;
    const statusFilter = document.getElementById('taskStatusFilter').value;

    let filtered = state.tasks.filter(task => {
      if (state.searchQuery && !task.title.toLowerCase().includes(state.searchQuery)) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      return true;
    });

    document.getElementById('taskListCount').textContent = `Showing ${filtered.length} tasks`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted" style="padding: 50px 0;">
          <i class="fa-solid fa-folder-open" style="font-size: 36px; margin-bottom: 12px;"></i>
          <p>No tasks match the selected filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(task => createTaskCardHTML(task)).join('');
  }

  // Helper to generate Task Card HTML
  function createTaskCardHTML(task) {
    const isChecked = task.completed ? 'checked' : '';
    const completedClass = task.completed ? 'completed' : '';
    const reminderBadge = task.reminderEnabled ? `<span class="task-badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;"><i class="fa-solid fa-envelope"></i> SMTP Alert</span>` : '';

    return `
      <div class="task-card ${completedClass}">
        <div class="task-checkbox ${isChecked}" onclick="toggleTaskComplete('${task.id}')">
          ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
        </div>
        <div class="task-info">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">
            <span class="task-badge badge-${task.priority}">${task.priority}</span>
            <span class="task-category-tag"><i class="fa-solid fa-tag"></i> ${escapeHtml(task.category)}</span>
            <span><i class="fa-regular fa-calendar"></i> ${task.dueDate} ${task.dueTime ? 'at ' + task.dueTime : ''}</span>
            ${reminderBadge}
          </div>
        </div>
        <div class="task-actions">
          <button class="action-btn email-now" onclick="triggerManualTaskEmail('${task.id}')" title="Send Instant Email Reminder Now"><i class="fa-solid fa-paper-plane"></i></button>
          <button class="action-btn" onclick="openTaskModal('${task.id}')" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="Delete Task"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }

  // Instant Manual Email Trigger
  window.triggerManualTaskEmail = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const recipient = task.recipientEmail || (state.smtpConfig && state.smtpConfig.defaultRecipient) || 'krishnarohith417@gmail.com';
    
    showToast(`Sending email reminder for "${task.title}" to ${recipient}...`, 'info');

    triggerTaskEmailReminderManually(task, recipient);
  };

  function triggerTaskEmailReminderManually(task, recipient) {
    const subject = `📌 Instant Task Reminder: "${task.title}"`;
    const body = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 16px 20px; border-radius: 8px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">TaskPulse Immediate Task Alert</h2>
        </div>
        <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #6366f1; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">${escapeHtml(task.title)}</h3>
          <p style="margin: 4px 0;"><strong>Category:</strong> ${escapeHtml(task.category)}</p>
          <p style="margin: 4px 0;"><strong>Priority:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${task.priority === 'high' ? '#ef4444' : '#f59e0b'};">${task.priority}</span></p>
          <p style="margin: 4px 0;"><strong>Scheduled Due Date:</strong> ${task.dueDate} ${task.dueTime ? 'at ' + task.dueTime : ''}</p>
          <p style="margin: 10px 0 0 0; font-style: italic; color: #475569;">"${escapeHtml(task.description || 'No additional notes provided.')}"</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">This reminder was manually triggered on demand via TaskPulse SMTP Notification Engine.</p>
      </div>
    `;

    const host = (state.smtpConfig && state.smtpConfig.host) || 'smtp.gmail.com';
    const user = (state.smtpConfig && state.smtpConfig.user) || 'krishnarohith417@gmail.com';
    const pass = (state.smtpConfig && state.smtpConfig.pass) || 'beblzukehtmmiitg';

    sendSmtpEmail({
      host, user, pass, recipient, subject, body
    }).then(() => {
      task.reminderSent = true;
      saveTasksToStorage();
      showToast(`✅ Email reminder sent successfully to ${recipient}!`, 'success');
    }).catch(err => {
      showToast(`❌ SMTP Dispatch Error: ${err}`, 'error');
    });
  }

  // --- CALENDAR GENERATOR & ASSIGNMENT ---
  function renderCalendar() {
    const grid = document.getElementById('fullCalendarGrid');
    const monthDisplay = document.getElementById('calendarMonthYearDisplay');

    const year = state.currentCalendarDate.getFullYear();
    const month = state.currentCalendarDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthDisplay.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    let daysHtml = '';
    const todayStr = getFormattedDate(new Date());

    // Previous month filler days
    for (let i = firstDayIndex; i > 0; i--) {
      const prevDay = prevLastDay - i + 1;
      daysHtml += `<div class="calendar-day-cell other-month"><span class="day-number">${prevDay}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= lastDay; day++) {
      const currentFormattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = currentFormattedDate === todayStr ? 'is-today' : '';

      // Find tasks assigned to this date
      const dayTasks = state.tasks.filter(t => t.dueDate === currentFormattedDate);

      let taskChipsHtml = dayTasks.map(t => `
        <div class="cal-task-chip ${t.priority}" title="${escapeHtml(t.title)}">
          <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${escapeHtml(t.title)}
        </div>
      `).join('');

      daysHtml += `
        <div class="calendar-day-cell ${isToday}" onclick="openTaskModalForDate('${currentFormattedDate}')">
          <span class="day-number">${day}</span>
          ${taskChipsHtml}
        </div>
      `;
    }

    // Next month filler days to complete grid
    const totalCells = firstDayIndex + lastDay;
    const nextDays = (7 - (totalCells % 7)) % 7;
    for (let j = 1; j <= nextDays; j++) {
      daysHtml += `<div class="calendar-day-cell other-month"><span class="day-number">${j}</span></div>`;
    }

    grid.innerHTML = daysHtml;
  }

  // Mini calendar in Dashboard
  function renderMiniCalendar() {
    const grid = document.getElementById('miniCalendarGrid');
    const label = document.getElementById('miniCalMonthYear');
    if (!grid) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    label.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const todayStr = getFormattedDate(now);

    let html = '';
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="mini-day-cell"></div>`;
    }

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr ? 'today' : 'active-month';
      const hasTask = state.tasks.some(t => t.dueDate === dateStr && !t.completed) ? 'has-task' : '';

      html += `<div class="mini-day-cell ${isToday} ${hasTask}">${day}</div>`;
    }

    grid.innerHTML = html;
  }

  // --- TASK OPERATIONS ---
  window.toggleTaskComplete = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      saveTasksToStorage();
      renderAll();
      showToast(task.completed ? 'Task marked as completed! 🎉' : 'Task restored to pending.', 'info');
    }
  };

  window.deleteTask = function(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      saveTasksToStorage();
      renderAll();
      showToast('Task deleted successfully.', 'info');
    }
  };

  window.openTaskModalForDate = function(dateStr) {
    openTaskModal(null, dateStr);
  };

  function openTaskModal(taskId = null, presetDate = null) {
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('taskModalTitle');
    const form = document.getElementById('taskForm');
    form.reset();

    if (taskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
        document.getElementById('taskIdInput').value = task.id;
        document.getElementById('taskTitleInput').value = task.title;
        document.getElementById('taskCategorySelect').value = task.category;
        document.getElementById('taskPrioritySelect').value = task.priority;
        document.getElementById('taskDueDateInput').value = task.dueDate;
        document.getElementById('taskDueTimeInput').value = task.dueTime || '12:00';
        document.getElementById('taskDescriptionInput').value = task.description || '';

        const reminderCheckbox = document.getElementById('taskEnableReminder');
        reminderCheckbox.checked = !!task.reminderEnabled;
        document.getElementById('reminderDetails').classList.toggle('show', !!task.reminderEnabled);
        if (task.reminderOffset) document.getElementById('taskReminderTimeSelect').value = task.reminderOffset;
        if (task.recipientEmail) document.getElementById('taskRecipientEmail').value = task.recipientEmail;
      }
    } else {
      title.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Create New Task';
      document.getElementById('taskIdInput').value = '';
      document.getElementById('taskDueDateInput').value = presetDate || getFormattedDate(new Date());
      document.getElementById('reminderDetails').classList.remove('show');
      if (state.smtpConfig && state.smtpConfig.defaultRecipient) {
        document.getElementById('taskRecipientEmail').value = state.smtpConfig.defaultRecipient;
      }
    }

    modal.classList.add('open');
  }

  function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('open');
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const taskId = document.getElementById('taskIdInput').value;
    const title = document.getElementById('taskTitleInput').value.trim();
    const category = document.getElementById('taskCategorySelect').value;
    const priority = document.getElementById('taskPrioritySelect').value;
    const dueDate = document.getElementById('taskDueDateInput').value;
    const dueTime = document.getElementById('taskDueTimeInput').value;
    const description = document.getElementById('taskDescriptionInput').value.trim();
    const reminderEnabled = document.getElementById('taskEnableReminder').checked;
    const reminderOffset = document.getElementById('taskReminderTimeSelect').value;
    const recipientEmail = document.getElementById('taskRecipientEmail').value.trim();

    if (!title || !dueDate) {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    if (reminderEnabled && !recipientEmail) {
      showToast('Please specify a Recipient Email ID for SMTP reminder.', 'error');
      return;
    }

    if (taskId) {
      // Update
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          title, category, priority, dueDate, dueTime, description,
          reminderEnabled, reminderOffset, recipientEmail,
          reminderSent: false
        };
        showToast('Task updated successfully!', 'success');
      }
    } else {
      // Create new
      const newTask = {
        id: generateId(),
        title, category, priority, dueDate, dueTime, description,
        completed: false,
        reminderEnabled, reminderOffset, recipientEmail,
        reminderSent: false,
        createdAt: new Date().toISOString()
      };
      state.tasks.push(newTask);
      showToast('New task added & assigned to calendar!', 'success');
    }

    saveTasksToStorage();
    closeTaskModal();
    renderAll();
    if (state.currentView === 'calendar') renderCalendar();
  }

  // --- SMTP CONFIGURATION & MAIL SENDING ENGINE ---
  function openSmtpModal() {
    const modal = document.getElementById('smtpModal');
    const providerSelect = document.getElementById('smtpProviderSelect');

    if (state.smtpConfig) {
      document.getElementById('smtpHostInput').value = state.smtpConfig.host || 'smtp.gmail.com';
      document.getElementById('smtpPortInput').value = state.smtpConfig.port || 587;
      document.getElementById('smtpUserInput').value = state.smtpConfig.user || '';
      document.getElementById('smtpPassInput').value = state.smtpConfig.pass || 'beblzukehtmmiitg';
      document.getElementById('smtpSenderEmail').value = state.smtpConfig.senderEmail || '';
      document.getElementById('smtpDefaultRecipient').value = state.smtpConfig.defaultRecipient || '';
      document.getElementById('smtpSecureSelect').value = state.smtpConfig.secure !== undefined ? String(state.smtpConfig.secure) : 'true';

      if (state.smtpConfig.host === 'smtp.gmail.com' && providerSelect) {
        providerSelect.value = 'gmail';
      }
    } else {
      document.getElementById('smtpHostInput').value = 'smtp.gmail.com';
      document.getElementById('smtpPortInput').value = '587';
      document.getElementById('smtpPassInput').value = 'beblzukehtmmiitg';
      if (providerSelect) providerSelect.value = 'gmail';
    }
    modal.classList.add('open');
  }

  function closeSmtpModal() {
    document.getElementById('smtpModal').classList.remove('open');
    document.getElementById('testResultMsg').textContent = '';
  }

  function applySmtpPreset(preset) {
    const hostInput = document.getElementById('smtpHostInput');
    const portInput = document.getElementById('smtpPortInput');
    const secureSelect = document.getElementById('smtpSecureSelect');
    const passInput = document.getElementById('smtpPassInput');

    if (preset === 'gmail') {
      hostInput.value = 'smtp.gmail.com';
      portInput.value = '587';
      secureSelect.value = 'true';
      if (passInput && !passInput.value) {
        passInput.value = 'beblzukehtmmiitg';
      }
    } else if (preset === 'outlook') {
      hostInput.value = 'smtp.office365.com';
      portInput.value = '587';
      secureSelect.value = 'true';
    } else if (preset === 'elastic') {
      hostInput.value = 'smtp.elasticemail.com';
      portInput.value = '2525';
      secureSelect.value = 'false';
    }
  }

  function handleSmtpFormSubmit(e) {
    e.preventDefault();
    const config = {
      host: document.getElementById('smtpHostInput').value.trim(),
      port: document.getElementById('smtpPortInput').value.trim(),
      user: document.getElementById('smtpUserInput').value.trim(),
      pass: document.getElementById('smtpPassInput').value.trim(),
      senderEmail: document.getElementById('smtpSenderEmail').value.trim() || document.getElementById('smtpUserInput').value.trim(),
      defaultRecipient: document.getElementById('smtpDefaultRecipient').value.trim(),
      secure: document.getElementById('smtpSecureSelect').value === 'true'
    };

    saveSmtpToStorage(config);
    closeSmtpModal();
    showToast('SMTP Configuration saved successfully!', 'success');
  }

  function updateSmtpStatusUI() {
    const dot = document.getElementById('smtpStatusDot');
    const text = document.getElementById('smtpStatusText');
    const isConfigured = state.smtpConfig && state.smtpConfig.host && state.smtpConfig.user;

    if (dot) dot.classList.toggle('active', isConfigured);
    if (text) {
      text.textContent = isConfigured
        ? `Configured: ${state.smtpConfig.user} (${state.smtpConfig.host})`
        : 'Configure your email credentials to get automated email alerts before deadlines.';
    }
  }

  // Send Test Email using SmtpJS / SMTP payload
  function handleSendTestEmail() {
    const host = document.getElementById('smtpHostInput').value.trim();
    const user = document.getElementById('smtpUserInput').value.trim();
    const pass = document.getElementById('smtpPassInput').value.trim();
    const recipient = document.getElementById('smtpDefaultRecipient').value.trim() || user;
    const msgEl = document.getElementById('testResultMsg');

    if (!host || !user || !pass) {
      msgEl.textContent = 'Please fill Host, Username & Password first.';
      msgEl.className = 'test-result-msg error';
      return;
    }

    msgEl.textContent = 'Sending test email via SMTP...';
    msgEl.className = 'test-result-msg';

    sendSmtpEmail({
      host, user, pass, recipient,
      subject: 'TaskPulse SMTP Test Connection',
      body: '<h3>SMTP Configuration Successful!</h3><p>Your TaskPulse SMTP email reminder system is connected and functioning properly.</p>'
    }).then(res => {
      msgEl.textContent = '✅ Email sent successfully to ' + recipient;
      msgEl.className = 'test-result-msg success';
      showToast('Test email sent successfully via SMTP!', 'success');
    }).catch(err => {
      msgEl.textContent = '❌ SMTP Error: ' + err;
      msgEl.className = 'test-result-msg error';
      showToast('SMTP connection test failed. Check settings.', 'error');
    });
  }

  // Core function to send real SMTP email via backend server endpoint /api/send-email
  function sendSmtpEmail({ host, user, pass, recipient, subject, body, port = 587 }) {
    return fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        host: host || 'smtp.gmail.com',
        port: port || 587,
        user: user || 'krishnarohith417@gmail.com',
        pass: pass || 'beblzukehtmmiitg',
        recipient: recipient || 'krishnarohith417@gmail.com',
        subject: subject || 'TaskPulse Alert',
        body: body || ''
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        return data.message;
      } else {
        throw new Error(data.error || 'Failed to dispatch email');
      }
    });
  }

  // --- AUTOMATED BACKGROUND REMINDER SCHEDULER TICKER ---
  function checkUpcomingTaskReminders() {
    if (!state.tasks || state.tasks.length === 0) return;

    const now = new Date();

    state.tasks.forEach(task => {
      if (!task.completed && task.reminderEnabled && !task.reminderSent && task.recipientEmail) {
        const taskDueDateTime = new Date(`${task.dueDate}T${task.dueTime || '12:00'}`);
        const offsetMinutes = parseInt(task.reminderOffset || '15', 10);
        const reminderTargetTime = new Date(taskDueDateTime.getTime() - offsetMinutes * 60000);

        // If current time is past or at reminder target time and before due date window
        if (now >= reminderTargetTime && now <= new Date(taskDueDateTime.getTime() + 1800000)) {
          triggerTaskEmailReminder(task);
        }
      }
    });
  }

  function triggerTaskEmailReminder(task) {
    task.reminderSent = true;
    saveTasksToStorage();

    const recipient = task.recipientEmail;
    const subject = `⏰ Reminder: Task "${task.title}" is Due Soon!`;
    const body = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #6366f1;">TaskPulse Email Reminder</h2>
        <p>This is an automated notification for your upcoming task:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0;">${escapeHtml(task.title)}</h3>
          <p><strong>Category:</strong> ${task.category} | <strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Due Date:</strong> ${task.dueDate} at ${task.dueTime || '12:00'}</p>
          <p><strong>Notes:</strong> ${escapeHtml(task.description || 'No additional notes.')}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">Sent via TaskPulse SMTP Notification Engine.</p>
      </div>
    `;

    if (state.smtpConfig && state.smtpConfig.host) {
      sendSmtpEmail({
        host: state.smtpConfig.host,
        user: state.smtpConfig.user,
        pass: state.smtpConfig.pass,
        recipient,
        subject,
        body
      }).then(() => {
        showToast(`SMTP Email alert sent to ${recipient} for task: "${task.title}"`, 'success');
      }).catch(() => {
        showToast(`Failed to send SMTP email to ${recipient}`, 'error');
      });
    } else {
      // Prompt user or display notification toast
      showToast(`⏰ Task Reminder Alert: "${task.title}" due at ${task.dueTime}! (Configure SMTP for email delivery)`, 'info');
    }
  }

  // --- ANALYTICS VIEW ---
  function renderAnalytics() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const circle = document.getElementById('analyticsProgressCircle');
    const pctText = document.getElementById('analyticsPercentage');
    const subText = document.getElementById('analyticsProgressText');

    if (circle) circle.style.background = `conic-gradient(var(--accent-primary) ${pct}%, rgba(255, 255, 255, 0.1) ${pct}%)`;
    if (pctText) pctText.textContent = `${pct}%`;
    if (subText) subText.textContent = `${completed} of ${total} tasks completed`;

    // Category Breakdown
    const breakdownContainer = document.getElementById('categoryBreakdownList');
    if (breakdownContainer) {
      let breakdownHtml = '';
      state.categories.forEach(cat => {
        const catTasks = state.tasks.filter(t => t.category === cat.name);
        const catCompleted = catTasks.filter(t => t.completed).length;
        const catPct = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0;

        breakdownHtml += `
          <div class="cat-bar-item">
            <div class="cat-bar-label">
              <span>${cat.name} (${catCompleted}/${catTasks.length})</span>
              <span>${catPct}%</span>
            </div>
            <div class="cat-progress-track">
              <div class="cat-progress-fill" style="width: ${catPct}%; background-color: ${cat.color};"></div>
            </div>
          </div>
        `;
      });
      breakdownContainer.innerHTML = breakdownHtml;
    }

    // Reminders summary
    const remindersContainer = document.getElementById('remindersSummaryList');
    if (remindersContainer) {
      const scheduled = state.tasks.filter(t => t.reminderEnabled && !t.completed);
      if (scheduled.length === 0) {
        remindersContainer.innerHTML = '<p class="text-muted">No scheduled email reminders.</p>';
      } else {
        remindersContainer.innerHTML = scheduled.map(t => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
            <span><i class="fa-solid fa-bell" style="color: var(--accent-primary);"></i> ${escapeHtml(t.title)}</span>
            <span class="text-muted">${t.dueDate} ${t.dueTime}</span>
          </div>
        `).join('');
      }
    }
  }

  // --- UTILITIES ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconMap = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${iconMap[type]}"></i> <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function getFormattedDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function generateId() {
    return 'task_' + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, match => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[match];
    });
  }

})();
