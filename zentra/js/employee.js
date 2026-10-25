/**
 * ZENTRA - Employee & Faculty Dashboard Controller
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Employee profile & transport exemption verification (No fee required)
 * - Real-time pass status tracking
 * - Visual 4-step Employee Application Timeline
 * - Pass viewing and profile management
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof protectPage === 'function' && !protectPage('EMPLOYEE')) return;
  initEmployeeDashboard();
});

/**
 * Initializes employee dashboard
 */
function initEmployeeDashboard() {
  const user = getLoggedInUser();
  if (!user) return;

  // Set greeting
  const welcomeEl = document.getElementById('empWelcomeName');
  if (welcomeEl) welcomeEl.textContent = user.name;

  // Verify employee exists in system
  const employees = loadData(STORAGE_KEYS.USERS_EMPLOYEES, []);
  const validEmployee = employees.find(e => e.id.toUpperCase() === user.id.toUpperCase());

  if (!validEmployee) {
    showToast('Employee ID could not be verified in university records.', 'error');
    return;
  }

  // Load employee's application and pass
  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const userApp = applications.find(a => a.applicantId.toUpperCase() === user.id.toUpperCase());

  const passes = loadData(STORAGE_KEYS.BUS_PASSES, []);
  const userPass = passes.find(p => p.applicantId.toUpperCase() === user.id.toUpperCase() && p.status === 'ACTIVE');

  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const selectedRoute = userApp ? routes.find(r => r.routeId === userApp.routeId) : null;

  renderEmployeeMetrics(userApp, userPass, selectedRoute);
  renderEmployeeTimeline(userApp);
  renderEmployeeApplicationDetails(userApp, userPass);
}

/**
 * Renders Employee Metric Cards
 */
function renderEmployeeMetrics(userApp, userPass, selectedRoute) {
  const container = document.getElementById('empMetricsGrid');
  if (!container) return;

  let passBadge = `<span class="badge badge-inactive">NOT ISSUED</span>`;
  if (userPass) {
    passBadge = `<span class="badge badge-approved">ACTIVE PASS</span>`;
  } else if (userApp && userApp.status === 'PENDING') {
    passBadge = `<span class="badge badge-pending">PENDING</span>`;
  }

  let appBadge = `<span class="badge badge-inactive">NOT APPLIED</span>`;
  if (userApp) {
    if (userApp.status === 'APPROVED') appBadge = `<span class="badge badge-approved">APPROVED</span>`;
    else if (userApp.status === 'PENDING') appBadge = `<span class="badge badge-pending">IN REVIEW</span>`;
    else if (userApp.status === 'REJECTED') appBadge = `<span class="badge badge-rejected">REJECTED</span>`;
  }

  const routeName = selectedRoute ? selectedRoute.routeNumber : 'None';
  const routeSub = selectedRoute ? selectedRoute.routeName : 'No route assigned';
  const availSeats = selectedRoute ? Math.max(0, selectedRoute.capacity - selectedRoute.occupiedSeats) : '-';

  container.innerHTML = `
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Transport Benefit</span>
        <span class="metric-icon">🎓</span>
      </div>
      <div class="metric-value"><span class="badge badge-paid">100% SUBSIDIZED</span></div>
      <div class="metric-sub">Faculty/Staff fee waiver active</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Pass Status</span>
        <span class="metric-icon">🎫</span>
      </div>
      <div class="metric-value">${passBadge}</div>
      <div class="metric-sub">${userPass ? userPass.passId : 'Awaiting approval'}</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Application</span>
        <span class="metric-icon">📋</span>
      </div>
      <div class="metric-value">${appBadge}</div>
      <div class="metric-sub">${userApp ? userApp.applicationId : 'Ready to submit'}</div>
    </div>

    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-label">Assigned Route</span>
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
 * Renders Employee Application Timeline
 */
function renderEmployeeTimeline(app) {
  const container = document.getElementById('empTimelineContainer');
  if (!container) return;

  if (!app) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2rem 1rem; color:var(--text-muted);">
        <p style="font-size:0.95rem; margin-bottom:0.75rem;">You haven't submitted an employee bus-pass application yet.</p>
        <a href="application.html" class="btn btn-primary btn-sm">Apply for Employee Pass</a>
      </div>
    `;
    return;
  }

  const isPending = app.status === 'PENDING';
  const isApproved = app.status === 'APPROVED';
  const isRejected = app.status === 'REJECTED';

  container.innerHTML = `
    <div class="timeline">
      <div class="timeline-step completed">
        <div class="timeline-dot">✓</div>
        <div class="timeline-step-title">Employee Verified</div>
        <div class="timeline-step-desc">Faculty Records Verified</div>
      </div>

      <div class="timeline-step completed">
        <div class="timeline-dot">✓</div>
        <div class="timeline-step-title">Submitted</div>
        <div class="timeline-step-desc">${app.applicationDate}</div>
      </div>

      <div class="timeline-step ${isApproved || isRejected ? 'completed' : 'active'}">
        <div class="timeline-dot">${isApproved || isRejected ? '✓' : '●'}</div>
        <div class="timeline-step-title">Admin Review</div>
        <div class="timeline-step-desc">${isPending ? 'Under Authority Review' : 'Verified'}</div>
      </div>

      <div class="timeline-step ${isApproved ? 'completed' : isRejected ? 'rejected' : ''}">
        <div class="timeline-dot">${isApproved ? '✓' : isRejected ? '✕' : '○'}</div>
        <div class="timeline-step-title">${isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Status'}</div>
        <div class="timeline-step-desc">${isApproved ? 'Pass Ready' : isRejected ? 'Declined' : 'Pending'}</div>
      </div>
    </div>

    ${isRejected ? `
      <div style="background:var(--status-rejected-bg); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); padding:1rem; margin-top:1rem;">
        <strong style="color:var(--status-rejected);">Rejection Reason:</strong>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin-top:0.25rem;">
          ${app.rejectionReason || 'Application was not approved by administration.'}
        </p>
      </div>
    ` : ''}
  `;
}

/**
 * Renders Employee Application Details Card
 */
function renderEmployeeApplicationDetails(app, pass) {
  const container = document.getElementById('empApplicationDetails');
  if (!container) return;

  if (!app) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2.5rem 1rem;">
        <h3 style="color:var(--primary-navy); margin-bottom:0.5rem;">No Bus Pass Enrolled</h3>
        <p style="color:var(--text-secondary); max-width:480px; margin:0 auto 1.25rem; font-size:0.9rem;">
          University faculty & staff members are eligible for fully subsidized campus transportation. Apply for your route below.
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
          Application ID: <strong>${app.applicationId}</strong> • Date: <strong>${app.applicationDate}</strong>
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
        <div style="font-size:0.75rem; color:var(--text-muted);">Designated Boarding Point</div>
        <div style="font-weight:700; color:var(--accent-blue);">${app.boardingPoint}</div>
      </div>
      <div style="background:var(--bg-subtle); padding:0.85rem; border-radius:var(--radius-md);">
        <div style="font-size:0.75rem; color:var(--text-muted);">Transport Fee Status</div>
        <div style="font-weight:700; color:var(--status-approved);">EXEMPTED (STAFF BENEFIT)</div>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; border-top:1px solid var(--border-color); padding-top:1.25rem;">
      <div style="font-size:0.85rem; color:var(--text-secondary);">
        ${app.status === 'APPROVED' ? '✓ Your digital bus pass is active.' : 'Application is currently under administrative processing.'}
      </div>
      ${app.status === 'APPROVED' ? `
        <a href="bus-pass.html" class="btn btn-success">
          🎫 View Digital Bus Pass
        </a>
      ` : ''}
    </div>
  `;
}

// ==========================================================================
// EMPLOYEE PROFILE MODAL (ID is protected)
// ==========================================================================

function openEmployeeProfileModal() {
  const user = getLoggedInUser();
  if (!user) return;

  let modal = document.getElementById('empProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'empProfileModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">👤 Faculty / Staff Profile</h3>
        <button class="modal-close" onclick="closeEmployeeProfileModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="empProfName" value="${user.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Employee ID (Locked / Read-Only)</label>
          <input type="text" class="form-control" id="empProfId" value="${user.id}" readonly>
          <small style="font-size:0.72rem; color:var(--text-muted);">Employee ID cannot be edited.</small>
        </div>
        <div class="form-group">
          <label class="form-label">Department / School</label>
          <input type="text" class="form-control" id="empProfDept" value="${user.department}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" id="empProfEmail" value="${user.email}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-control" id="empProfPhone" value="${user.phone}">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeEmployeeProfileModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveEmployeeProfileChanges()">Save Changes</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeEmployeeProfileModal() {
  const modal = document.getElementById('empProfileModal');
  if (modal) modal.classList.remove('active');
}

function saveEmployeeProfileChanges() {
  const user = getLoggedInUser();
  if (!user) return;

  const newName = document.getElementById('empProfName')?.value.trim();
  const newDept = document.getElementById('empProfDept')?.value.trim();
  const newEmail = document.getElementById('empProfEmail')?.value.trim();
  const newPhone = document.getElementById('empProfPhone')?.value.trim();

  if (!newName || !newEmail || !newPhone) {
    showToast('Please fill out all required fields.', 'warning');
    return;
  }

  updateData(STORAGE_KEYS.USERS_EMPLOYEES, emps => {
    return (emps || []).map(e => {
      if (e.id.toUpperCase() === user.id.toUpperCase()) {
        return {
          ...e,
          name: newName,
          department: newDept,
          email: newEmail,
          phone: newPhone
        };
      }
      return e;
    });
  });

  user.name = newName;
  user.department = newDept;
  user.email = newEmail;
  user.phone = newPhone;
  setLoggedInUser(user);

  closeEmployeeProfileModal();
  showToast('Profile updated successfully.', 'success');
  initEmployeeDashboard();
}
