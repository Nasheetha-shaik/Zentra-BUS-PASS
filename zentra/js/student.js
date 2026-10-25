/**
 * ZENTRA - Student Dashboard Controller
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Dynamic student dashboard metrics & cards
 * - Dynamic 5-step Application Timeline visualization
 * - Quick action handlers (Pay Fee, Apply, View Pass, Edit Profile)
 * - Profile modal management with ID protection
 */

document.addEventListener('DOMContentLoaded', () => {
  // Guard page for STUDENT role only
  if (typeof protectPage === 'function' && !protectPage('STUDENT')) return;
  initStudentDashboard();
});

/**
 * Initializes student dashboard
 */
function initStudentDashboard() {
  const user = getLoggedInUser();
  if (!user) return;

  // Render greeting
  const welcomeEl = document.getElementById('studentWelcomeName');
  if (welcomeEl) welcomeEl.textContent = user.name;

  // Find user's active application & pass
  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const userApp = applications.find(a => a.applicantId.toUpperCase() === user.id.toUpperCase());

  const passes = loadData(STORAGE_KEYS.BUS_PASSES, []);
  const userPass = passes.find(p => p.applicantId.toUpperCase() === user.id.toUpperCase() && p.status === 'ACTIVE');

  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const selectedRoute = userApp ? routes.find(r => r.routeId === userApp.routeId) : null;

  const isFeePaid = isStudentFeePaid(user.id);

  // Render Metric Cards
  renderStudentMetricCards(isFeePaid, userApp, userPass, selectedRoute);

  // Render Visual Timeline
  renderApplicationTimeline(userApp);

  // Render Fee Payment Section
  if (typeof renderStudentPaymentSection === 'function') {
    renderStudentPaymentSection('paymentSection');
  }

  // Render Application Details Card
  renderApplicationDetailsCard(userApp, userPass);
}

/**
 * Renders the 5 KPI Cards on Student Dashboard
 */
function renderStudentMetricCards(isFeePaid, userApp, userPass, selectedRoute) {
  const container = document.getElementById('studentMetricsGrid');
  if (!container) return;

  const feeStatusHtml = isFeePaid 
    ? `<span class="badge badge-paid">PAID</span>` 
    : `<span class="badge badge-failed">UNPAID</span>`;

  let passStatusHtml = `<span class="badge badge-inactive">NOT ISSUED</span>`;
  if (userPass) {
    passStatusHtml = `<span class="badge badge-approved">ACTIVE</span>`;
  } else if (userApp && userApp.status === 'PENDING') {
    passStatusHtml = `<span class="badge badge-pending">PENDING APPROVAL</span>`;
  } else if (userApp && userApp.status === 'REJECTED') {
    passStatusHtml = `<span class="badge badge-rejected">REJECTED</span>`;
  }

  let appStatusHtml = `<span class="badge badge-inactive">NOT APPLIED</span>`;
  if (userApp) {
    if (userApp.status === 'APPROVED') appStatusHtml = `<span class="badge badge-approved">APPROVED</span>`;
    else if (userApp.status === 'PENDING') appStatusHtml = `<span class="badge badge-pending">IN REVIEW</span>`;
    else if (userApp.status === 'REJECTED') appStatusHtml = `<span class="badge badge-rejected">REJECTED</span>`;
  }

  const routeName = selectedRoute ? `${selectedRoute.routeNumber}` : 'None';
  const routeSub = selectedRoute ? selectedRoute.routeName : 'No route enrolled';
  const availSeats = selectedRoute ? Math.max(0, selectedRoute.capacity - selectedRoute.occupiedSeats) : '-';

  container.innerHTML = `
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Fee Status</span>
        <span class="metric-icon">💳</span>
      </div>
      <div class="metric-value">${feeStatusHtml}</div>
      <div class="metric-sub">${isFeePaid ? 'Cleared for Academic Year' : 'Required before application'}</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Pass Status</span>
        <span class="metric-icon">🎫</span>
      </div>
      <div class="metric-value">${passStatusHtml}</div>
      <div class="metric-sub">${userPass ? `Pass ID: ${userPass.passId}` : 'Awaiting admin pass issue'}</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Application</span>
        <span class="metric-icon">📋</span>
      </div>
      <div class="metric-value">${appStatusHtml}</div>
      <div class="metric-sub">${userApp ? `Ref: ${userApp.applicationId}` : 'Ready to apply'}</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Selected Route</span>
        <span class="metric-icon">🚍</span>
      </div>
      <div class="metric-value" style="font-size:1.45rem;">${routeName}</div>
      <div class="metric-sub" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${routeSub}</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Available Seats</span>
        <span class="metric-icon">💺</span>
      </div>
      <div class="metric-value" style="color:var(--status-approved);">${availSeats}</div>
      <div class="metric-sub">${selectedRoute ? `Capacity: ${selectedRoute.capacity}` : 'Select a route to view'}</div>
    </div>
  `;
}

/**
 * Renders the Visual Application Timeline
 * Steps:
 * 1. Application Submitted
 * 2. Fee Verified
 * 3. Seat Availability Checked
 * 4. Admin Review
 * 5. Approved / Rejected
 * @param {object|null} app 
 */
function renderApplicationTimeline(app) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;

  if (!app) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2rem 1rem; color:var(--text-muted);">
        <p style="font-size:0.95rem; margin-bottom:0.75rem;">You haven't submitted a bus-pass application yet.</p>
        <a href="application.html" class="btn btn-primary btn-sm">Start Application Now</a>
      </div>
    `;
    return;
  }

  const isFeePaid = app.paymentStatus === 'PAID';
  const isPending = app.status === 'PENDING';
  const isApproved = app.status === 'APPROVED';
  const isRejected = app.status === 'REJECTED';

  container.innerHTML = `
    <div class="timeline">
      <!-- Step 1: Application Submitted -->
      <div class="timeline-step completed">
        <div class="timeline-dot">✓</div>
        <div class="timeline-step-title">Submitted</div>
        <div class="timeline-step-desc">${app.applicationDate}</div>
      </div>

      <!-- Step 2: Fee Verified -->
      <div class="timeline-step ${isFeePaid ? 'completed' : 'active'}">
        <div class="timeline-dot">${isFeePaid ? '✓' : '●'}</div>
        <div class="timeline-step-title">Fee Verified</div>
        <div class="timeline-step-desc">${isFeePaid ? 'Cleared' : 'Pending Payment'}</div>
      </div>

      <!-- Step 3: Seat Availability Checked -->
      <div class="timeline-step completed">
        <div class="timeline-dot">✓</div>
        <div class="timeline-step-title">Seats Checked</div>
        <div class="timeline-step-desc">Allocation Validated</div>
      </div>

      <!-- Step 4: Admin Review -->
      <div class="timeline-step ${isApproved || isRejected ? 'completed' : 'active'}">
        <div class="timeline-dot">${isApproved || isRejected ? '✓' : '●'}</div>
        <div class="timeline-step-title">Admin Review</div>
        <div class="timeline-step-desc">${isPending ? 'In Progress' : 'Completed'}</div>
      </div>

      <!-- Step 5: Final Status -->
      <div class="timeline-step ${isApproved ? 'completed' : isRejected ? 'rejected' : ''}">
        <div class="timeline-dot">${isApproved ? '✓' : isRejected ? '✕' : '○'}</div>
        <div class="timeline-step-title">${isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Final Status'}</div>
        <div class="timeline-step-desc">${isApproved ? 'Pass Generated' : isRejected ? 'See Reason' : 'Pending'}</div>
      </div>
    </div>

    ${isRejected ? `
      <div style="background:var(--status-rejected-bg); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); padding:1rem; margin-top:1rem;">
        <strong style="color:var(--status-rejected);">Rejection Reason:</strong>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin-top:0.25rem;">
          ${app.rejectionReason || 'Application could not be approved at this time.'}
        </p>
      </div>
    ` : ''}
  `;
}

/**
 * Renders Application Details Card
 */
function renderApplicationDetailsCard(app, pass) {
  const container = document.getElementById('applicationDetailsCard');
  if (!container) return;

  if (!app) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2.5rem 1rem;">
        <h3 style="color:var(--primary-navy); margin-bottom:0.5rem;">No Active Bus Pass Application</h3>
        <p style="color:var(--text-secondary); max-width:480px; margin:0 auto 1.25rem; font-size:0.9rem;">
          You are currently not enrolled in campus transit. Complete fee payment and apply for your designated route to obtain a digital pass.
        </p>
        <a href="application.html" class="btn btn-primary">Apply for Bus Pass</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
      <div>
        <h3 style="color:var(--primary-navy); margin-bottom:0.25rem;">
          ${app.routeNumber}: ${app.routeName}
        </h3>
        <div style="font-size:0.85rem; color:var(--text-secondary);">
          Application ID: <strong>${app.applicationId}</strong> • Submitted: <strong>${app.applicationDate}</strong>
        </div>
      </div>
      <div>
        <span class="badge ${app.status === 'APPROVED' ? 'badge-approved' : app.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'}">
          ${app.status}
        </span>
      </div>
    </div>

    <div class="form-row" style="margin-bottom:1.5rem;">
      <div style="background:var(--bg-subtle); padding:0.85rem; border-radius:var(--radius-md);">
        <div style="font-size:0.75rem; color:var(--text-muted);">Assigned Bus</div>
        <div style="font-weight:700;">${app.busNumber}</div>
      </div>
      <div style="background:var(--bg-subtle); padding:0.85rem; border-radius:var(--radius-md);">
        <div style="font-size:0.75rem; color:var(--text-muted);">Boarding Point</div>
        <div style="font-weight:700; color:var(--accent-blue);">${app.boardingPoint}</div>
      </div>
      <div style="background:var(--bg-subtle); padding:0.85rem; border-radius:var(--radius-md);">
        <div style="font-size:0.75rem; color:var(--text-muted);">Fee Clearance</div>
        <div style="font-weight:700; color:var(--status-approved);">${app.paymentStatus}</div>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; border-top:1px solid var(--border-color); padding-top:1.25rem;">
      <div style="font-size:0.85rem; color:var(--text-secondary);">
        ${app.status === 'APPROVED' 
          ? '🎉 Digital pass has been issued and is ready for conductor scanning.' 
          : app.status === 'PENDING' 
          ? '⏳ Transport authority is reviewing your boarding location and seat allotment.' 
          : '✕ Application was rejected. Please contact the transport desk for assistance.'}
      </div>
      ${app.status === 'APPROVED' ? `
        <a href="bus-pass.html" class="btn btn-success">
          🎫 View & Download Digital Pass
        </a>
      ` : ''}
    </div>
  `;
}

// ==========================================================================
// PROFILE MODAL (ID is protected from editing)
// ==========================================================================

function openStudentProfileModal() {
  const user = getLoggedInUser();
  if (!user) return;

  let modal = document.getElementById('profileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">👤 Student Profile</h3>
        <button class="modal-close" onclick="closeStudentProfileModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="profName" value="${user.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Registration ID (Locked / Read-Only)</label>
          <input type="text" class="form-control" id="profId" value="${user.id}" readonly>
          <small style="font-size:0.72rem; color:var(--text-muted);">Registration ID cannot be modified.</small>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Department</label>
            <input type="text" class="form-control" id="profDept" value="${user.department}">
          </div>
          <div class="form-group">
            <label class="form-label">Year</label>
            <input type="text" class="form-control" id="profYear" value="${user.year}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" id="profEmail" value="${user.email}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-control" id="profPhone" value="${user.phone}">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeStudentProfileModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveStudentProfileChanges()">Save Changes</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeStudentProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('active');
}

function saveStudentProfileChanges() {
  const user = getLoggedInUser();
  if (!user) return;

  const newName = document.getElementById('profName')?.value.trim();
  const newDept = document.getElementById('profDept')?.value.trim();
  const newYear = document.getElementById('profYear')?.value.trim();
  const newEmail = document.getElementById('profEmail')?.value.trim();
  const newPhone = document.getElementById('profPhone')?.value.trim();

  if (!newName || !newEmail || !newPhone) {
    showToast('Please fill out all required fields.', 'warning');
    return;
  }

  // Update in USERS_STUDENTS
  updateData(STORAGE_KEYS.USERS_STUDENTS, students => {
    return (students || []).map(s => {
      if (s.id.toUpperCase() === user.id.toUpperCase()) {
        return {
          ...s,
          name: newName,
          department: newDept,
          year: newYear,
          email: newEmail,
          phone: newPhone
        };
      }
      return s;
    });
  });

  // Update session
  user.name = newName;
  user.department = newDept;
  user.year = newYear;
  user.email = newEmail;
  user.phone = newPhone;
  setLoggedInUser(user);

  closeStudentProfileModal();
  showToast('Profile updated successfully.', 'success');
  initStudentDashboard();
}
