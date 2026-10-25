/**
 * ZENTRA - Admin & Transport Authority Engine
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Real-time dynamic KPI calculation (Total, Pending, Approved, Rejected, Seats, Fees)
 * - Applications table with instant multi-facet Search & Filter (No page reloads)
 * - Approval workflow: Increments route occupancy, generates digital pass, dispatches notification
 * - Rejection workflow: Prompts rejection reason modal, preserves seat count, dispatches notification
 * - Route & Seat management interface
 * - Pure JavaScript & CSS visual reports (Bar charts & Donut gauge)
 */

let activeAdminTab = 'applications';
let selectedApplicationForAction = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof protectPage === 'function' && !protectPage('ADMIN')) return;
  initAdminDashboard();
});

/**
 * Initializes Admin Dashboard
 */
function initAdminDashboard() {
  updateAdminMetrics();
  renderApplicationsTable();
  setupAdminEventListeners();
  renderAdminReports();
  renderRouteSeatManagement();
}

/**
 * Calculates and updates all Admin Metric Cards dynamically
 */
function updateAdminMetrics() {
  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const payments = loadData(STORAGE_KEYS.PAYMENTS, []);
  const students = loadData(STORAGE_KEYS.USERS_STUDENTS, []);

  // Counts
  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === 'PENDING').length;
  const approvedApps = applications.filter(a => a.status === 'APPROVED').length;
  const rejectedApps = applications.filter(a => a.status === 'REJECTED').length;

  const totalRoutes = routes.length;
  const totalCapacity = routes.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalOccupied = routes.reduce((acc, r) => acc + (r.occupiedSeats || 0), 0);
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);

  // Unpaid students alert count
  const unpaidStudents = students.filter(s => s.feeStatus !== 'PAID').length;

  // Set card values in DOM
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('metricTotalApps', totalApps);
  setEl('metricPendingApps', pendingApps);
  setEl('metricApprovedApps', approvedApps);
  setEl('metricRejectedApps', rejectedApps);
  setEl('metricTotalRoutes', totalRoutes);
  setEl('metricOccupiedSeats', totalOccupied);
  setEl('metricAvailableSeats', totalAvailable);
  setEl('metricPaymentAlerts', unpaidStudents);
}

/**
 * Sets up Search & Filter event listeners for applications table
 */
function setupAdminEventListeners() {
  const searchInput = document.getElementById('adminAppSearch');
  const typeFilter = document.getElementById('adminAppTypeFilter');
  const statusFilter = document.getElementById('adminAppStatusFilter');
  const routeFilter = document.getElementById('adminAppRouteFilter');

  if (searchInput) searchInput.addEventListener('input', renderApplicationsTable);
  if (typeFilter) typeFilter.addEventListener('change', renderApplicationsTable);
  if (statusFilter) statusFilter.addEventListener('change', renderApplicationsTable);
  if (routeFilter) {
    // Populate routes filter
    const routes = loadData(STORAGE_KEYS.ROUTES, []);
    routeFilter.innerHTML = '<option value="ALL">All Routes</option>' +
      routes.map(r => `<option value="${r.routeId}">${r.routeNumber} (${r.startingPoint})</option>`).join('');
    routeFilter.addEventListener('change', renderApplicationsTable);
  }
}

/**
 * Renders Applications Table with Search & Filter Applied
 */
function renderApplicationsTable() {
  const tbody = document.getElementById('adminAppsTableBody');
  if (!tbody) return;

  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const query = (document.getElementById('adminAppSearch')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('adminAppTypeFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('adminAppStatusFilter')?.value || 'ALL';
  const routeFilter = document.getElementById('adminAppRouteFilter')?.value || 'ALL';

  const filtered = applications.filter(app => {
    // Search query: ID, name, reg/emp ID
    const matchesSearch = 
      app.applicationId.toLowerCase().includes(query) ||
      app.applicantName.toLowerCase().includes(query) ||
      app.applicantId.toLowerCase().includes(query);

    // Filters
    const matchesType = typeFilter === 'ALL' || app.applicantType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesRoute = routeFilter === 'ALL' || app.routeId === routeFilter;

    return matchesSearch && matchesType && matchesStatus && matchesRoute;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
          No bus-pass applications match the specified criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(app => {
    // Badge status
    let statusBadge = '';
    if (app.status === 'APPROVED') statusBadge = `<span class="badge badge-approved">Approved</span>`;
    else if (app.status === 'PENDING') statusBadge = `<span class="badge badge-pending">Pending</span>`;
    else if (app.status === 'REJECTED') statusBadge = `<span class="badge badge-rejected">Rejected</span>`;

    // Type badge
    const typeBadge = app.applicantType === 'STUDENT'
      ? `<span class="badge badge-inactive" style="color:var(--accent-blue); background:var(--accent-glow);">Student</span>`
      : `<span class="badge badge-inactive" style="color:#7c3aed; background:#f5f3ff;">Employee</span>`;

    // Fee badge
    const feeBadge = app.paymentStatus === 'PAID'
      ? `<span style="color:var(--status-approved); font-weight:700;">✓ Paid</span>`
      : app.paymentStatus.includes('EXEMPTED')
      ? `<span style="color:#7c3aed; font-weight:700;">Exempted</span>`
      : `<span style="color:var(--status-rejected); font-weight:700;">Unpaid</span>`;

    return `
      <tr>
        <td><strong>${app.applicationId}</strong></td>
        <td>
          <div style="font-weight:700; color:var(--primary-navy);">${app.applicantName}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${app.department}</div>
        </td>
        <td>${typeBadge}</td>
        <td><code>${app.applicantId}</code></td>
        <td>
          <div style="font-weight:600;">${app.routeNumber}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">Stop: ${app.boardingPoint}</div>
        </td>
        <td>${feeBadge}</td>
        <td><span style="font-size:0.82rem; font-weight:600;">${app.busNumber}</span></td>
        <td>${app.applicationDate}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-outline btn-sm" onclick="viewApplicationDetailModal('${app.applicationId}')" title="View Details">
              View
            </button>
            ${app.status === 'PENDING' ? `
              <button class="btn btn-success btn-sm" onclick="approveApplication('${app.applicationId}')" title="Approve Application">
                Approve
              </button>
              <button class="btn btn-danger btn-sm" onclick="openRejectReasonModal('${app.applicationId}')" title="Reject Application">
                Reject
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Handles Application Approval
 * - Increments occupiedSeats on route
 * - Recalculates availableSeats
 * - Generates digital pass
 * - Dispatches notification
 * @param {string} appId 
 */
function approveApplication(appId) {
  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const appIndex = applications.findIndex(a => a.applicationId === appId);

  if (appIndex === -1) {
    showToast('Application not found.', 'error');
    return;
  }

  const app = applications[appIndex];
  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const route = routes.find(r => r.routeId === app.routeId);

  // Check seat capacity
  if (!route) {
    showToast('Assigned route not found.', 'error');
    return;
  }

  const currentAvailable = route.capacity - route.occupiedSeats;
  if (currentAvailable <= 0) {
    showToast(`Cannot approve: ${route.routeNumber} has 0 available seats.`, 'error');
    return;
  }

  // 1. Update Route Occupancy
  updateData(STORAGE_KEYS.ROUTES, rList => {
    return (rList || []).map(r => {
      if (r.routeId === app.routeId) {
        const newOccupied = r.occupiedSeats + 1;
        const newAvailable = Math.max(0, r.capacity - newOccupied);
        return {
          ...r,
          occupiedSeats: newOccupied,
          availableSeats: newAvailable,
          status: newAvailable === 0 ? 'Route Full' : newAvailable <= 5 ? 'Seats Available (Low)' : 'Seats Available'
        };
      }
      return r;
    });
  });

  // 2. Generate Digital Pass
  const passId = `SP-PASS-2026-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];

  const newPass = {
    passId: passId,
    applicationId: app.applicationId,
    applicantId: app.applicantId,
    applicantName: app.applicantName,
    applicantType: app.applicantType,
    department: app.department,
    academicYear: '2026–27',
    routeId: app.routeId,
    routeNumber: app.routeNumber,
    routeName: app.routeName,
    busNumber: app.busNumber,
    boardingPoint: app.boardingPoint,
    validFrom: formattedDate,
    validUntil: '2027-06-30',
    status: 'ACTIVE',
    generatedDate: formattedDate
  };

  updateData(STORAGE_KEYS.BUS_PASSES, passes => [...(passes || []), newPass]);

  // 3. Update Application Status
  applications[appIndex].status = 'APPROVED';
  applications[appIndex].approvalDate = formattedDate;
  applications[appIndex].passId = passId;
  saveData(STORAGE_KEYS.APPLICATIONS, applications);

  // 4. Create Notification for applicant
  const approvalNotif = {
    id: `NOTIF-APP-APPR-${Date.now()}`,
    targetId: app.applicantId,
    title: 'Bus Pass Application Approved 🎉',
    message: `Your application (${app.applicationId}) has been approved. Digital Bus Pass ${passId} is generated and ready to download.`,
    type: 'success',
    timestamp: `${formattedDate} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    read: false
  };

  updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => [approvalNotif, ...(notifs || [])]);

  // Refresh UI
  updateAdminMetrics();
  renderApplicationsTable();
  renderAdminReports();
  renderRouteSeatManagement();
  showToast(`Application ${app.applicationId} approved. Pass ${passId} generated.`, 'success');
}

/**
 * Opens Rejection Reason Modal
 * @param {string} appId 
 */
function openRejectReasonModal(appId) {
  selectedApplicationForAction = appId;

  let modal = document.getElementById('rejectReasonModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rejectReasonModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title" style="color:var(--status-rejected);">Reject Application (${appId})</h3>
        <button class="modal-close" onclick="closeRejectReasonModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1rem;">
          Please state the official reason for rejecting this application. This message will be sent to the applicant's portal. (No seat will be consumed).
        </p>
        <div class="form-group">
          <label class="form-label">Rejection Reason *</label>
          <textarea class="form-control" id="rejectReasonInput" rows="3" placeholder="e.g. Route boarding point discontinued, Incomplete ID verification, etc."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeRejectReasonModal()">Cancel</button>
        <button class="btn btn-danger" onclick="confirmRejectApplication()">Confirm Rejection</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeRejectReasonModal() {
  const modal = document.getElementById('rejectReasonModal');
  if (modal) modal.classList.remove('active');
  selectedApplicationForAction = null;
}

/**
 * Confirms Application Rejection
 */
function confirmRejectApplication() {
  if (!selectedApplicationForAction) return;

  const reason = document.getElementById('rejectReasonInput')?.value.trim();
  if (!reason) {
    showToast('Please provide a reason for rejection.', 'warning');
    return;
  }

  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const appIndex = applications.findIndex(a => a.applicationId === selectedApplicationForAction);

  if (appIndex === -1) {
    showToast('Application not found.', 'error');
    return;
  }

  const app = applications[appIndex];
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];

  // Update application
  applications[appIndex].status = 'REJECTED';
  applications[appIndex].rejectionReason = reason;
  saveData(STORAGE_KEYS.APPLICATIONS, applications);

  // Dispatch notification to applicant
  const rejectNotif = {
    id: `NOTIF-APP-REJ-${Date.now()}`,
    targetId: app.applicantId,
    title: 'Bus Pass Application Rejected',
    message: `Your application (${app.applicationId}) was rejected. Reason: "${reason}". Please contact the transport authority for clarification.`,
    type: 'danger',
    timestamp: `${formattedDate} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    read: false
  };

  updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => [rejectNotif, ...(notifs || [])]);

  closeRejectReasonModal();
  updateAdminMetrics();
  renderApplicationsTable();
  renderAdminReports();
  showToast(`Application ${app.applicationId} marked as REJECTED.`, 'info');
}

/**
 * View Application Detail Modal
 * @param {string} appId 
 */
function viewApplicationDetailModal(appId) {
  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const app = applications.find(a => a.applicationId === appId);
  if (!app) return;

  let modal = document.getElementById('viewAppDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'viewAppDetailModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">📋 Application Details (${app.applicationId})</h3>
        <button class="modal-close" onclick="closeViewAppDetailModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div>
            <h4 style="color:var(--primary-navy);">${app.applicantName}</h4>
            <div style="font-size:0.8rem; color:var(--text-muted);">${app.applicantType} • ID: ${app.applicantId}</div>
          </div>
          <span class="badge ${app.status === 'APPROVED' ? 'badge-approved' : app.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'}">
            ${app.status}
          </span>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Department:</td><td style="font-weight:600; text-align:right;">${app.department}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Contact Phone:</td><td style="font-weight:600; text-align:right;">${app.phone}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Email:</td><td style="font-weight:600; text-align:right;">${app.email}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Requested Route:</td><td style="font-weight:700; text-align:right; color:var(--accent-blue);">${app.routeNumber} - ${app.routeName}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Boarding Point:</td><td style="font-weight:600; text-align:right;">${app.boardingPoint}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Bus Number:</td><td style="font-weight:600; text-align:right;">${app.busNumber}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Fee Clearance:</td><td style="font-weight:700; text-align:right; color:var(--status-approved);">${app.paymentStatus}</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:0.4rem 0; color:var(--text-muted);">Submission Date:</td><td style="font-weight:600; text-align:right;">${app.applicationDate}</td></tr>
          ${app.passId ? `<tr><td style="padding:0.4rem 0; color:var(--text-muted);">Digital Pass ID:</td><td style="font-weight:800; text-align:right; color:var(--status-approved);">${app.passId}</td></tr>` : ''}
          ${app.rejectionReason ? `<tr><td style="padding:0.4rem 0; color:var(--status-rejected);">Rejection Reason:</td><td style="font-weight:600; text-align:right; color:var(--status-rejected);">${app.rejectionReason}</td></tr>` : ''}
        </table>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeViewAppDetailModal()">Close</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeViewAppDetailModal() {
  const modal = document.getElementById('viewAppDetailModal');
  if (modal) modal.classList.remove('active');
}

// ==========================================================================
// REPORTS & ANALYTICS (Pure JS/CSS Visual Data Generation)
// ==========================================================================

function renderAdminReports() {
  const container = document.getElementById('reportsSection');
  if (!container) return;

  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const payments = loadData(STORAGE_KEYS.PAYMENTS, []);

  // 1. Applications by Status
  const pending = applications.filter(a => a.status === 'PENDING').length;
  const approved = applications.filter(a => a.status === 'APPROVED').length;
  const rejected = applications.filter(a => a.status === 'REJECTED').length;
  const total = applications.length || 1;

  const pendingPct = Math.round((pending / total) * 100);
  const approvedPct = Math.round((approved / total) * 100);
  const rejectedPct = Math.round((rejected / total) * 100);

  // 2. Student vs Employee
  const studentApps = applications.filter(a => a.applicantType === 'STUDENT').length;
  const empApps = applications.filter(a => a.applicantType === 'EMPLOYEE').length;
  const studentPct = Math.round((studentApps / total) * 100);
  const empPct = Math.round((empApps / total) * 100);

  // 3. Overall Seat Occupancy
  const totalCap = routes.reduce((acc, r) => acc + (r.capacity || 0), 0) || 1;
  const totalOcc = routes.reduce((acc, r) => acc + (r.occupiedSeats || 0), 0);
  const overallOccupancyPct = Math.round((totalOcc / totalCap) * 100);

  // 4. Fee Revenue Collected
  const totalRev = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
      <!-- Chart 1: Status Distribution -->
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">📊 Applications by Status</h4>
        </div>
        <div class="card-body">
          <div class="chart-bar-container">
            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Approved</span>
                <span>${approved} (${approvedPct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill seat-fill-green" style="width:${approvedPct}%;"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Pending</span>
                <span>${pending} (${pendingPct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill seat-fill-orange" style="width:${pendingPct}%;"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Rejected</span>
                <span>${rejected} (${rejectedPct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill seat-fill-red" style="width:${rejectedPct}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart 2: Student vs Employee -->
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">👥 Applicant Demographics</h4>
        </div>
        <div class="card-body">
          <div class="chart-bar-container">
            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Students</span>
                <span>${studentApps} (${studentPct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="background-color:var(--accent-blue); width:${studentPct}%;"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Faculty & Employees</span>
                <span>${empApps} (${empPct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="background-color:#7c3aed; width:${empPct}%;"></div>
              </div>
            </div>
          </div>
          <div style="margin-top:1.5rem; font-size:0.85rem; color:var(--text-secondary); text-align:center;">
            Total Applicants Enrolled: <strong>${applications.length}</strong>
          </div>
        </div>
      </div>

      <!-- Chart 3: Fleet Occupancy Gauge -->
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">🚍 Fleet Seat Occupancy</h4>
        </div>
        <div class="card-body occupancy-gauge-box">
          <div class="gauge-circle" style="background: conic-gradient(var(--accent-blue) ${overallOccupancyPct * 3.6}deg, var(--bg-subtle) 0deg);">
            <div class="gauge-inner">
              <div class="gauge-val">${overallOccupancyPct}%</div>
              <div class="gauge-caption">Allocated</div>
            </div>
          </div>
          <div style="font-size:0.85rem; color:var(--text-secondary);">
            <strong>${totalOcc}</strong> occupied out of <strong>${totalCap}</strong> total seats across 5 routes
          </div>
        </div>
      </div>

      <!-- Card 4: Fee Collection Summary -->
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">💰 Fee Collection Report</h4>
        </div>
        <div class="card-body" style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.25rem;">Total Fees Collected</div>
          <div style="font-size:2.25rem; font-weight:800; color:var(--status-approved); margin-bottom:0.5rem;">
            ₹${totalRev.toLocaleString()}
          </div>
          <div style="font-size:0.85rem; color:var(--text-secondary);">
            Cleared Payments: <strong>${payments.length} student transactions</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// ROUTE & SEAT MANAGEMENT
// ==========================================================================

function renderRouteSeatManagement() {
  const container = document.getElementById('seatManagementTableBody');
  if (!container) return;

  const routes = loadData(STORAGE_KEYS.ROUTES, []);

  container.innerHTML = routes.map(r => {
    const avail = Math.max(0, r.capacity - r.occupiedSeats);
    const pct = Math.min(100, Math.round((r.occupiedSeats / r.capacity) * 100));

    return `
      <tr>
        <td><strong>${r.routeNumber}</strong></td>
        <td>
          <div style="font-weight:700;">${r.routeName}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Bus: ${r.busNumber} • Time: ${r.departureTime}</div>
        </td>
        <td><strong>${r.capacity}</strong></td>
        <td><strong style="color:var(--primary-navy);">${r.occupiedSeats}</strong></td>
        <td><strong style="color:${avail === 0 ? 'var(--status-rejected)' : 'var(--status-approved)'};">${avail}</strong></td>
        <td style="width:160px;">
          <div class="seat-bar-track">
            <div class="seat-bar-fill ${avail === 0 ? 'seat-fill-red' : avail <= 5 ? 'seat-fill-orange' : 'seat-fill-green'}" style="width:${pct}%;"></div>
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">${pct}% Full</span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="promptAdjustRouteCapacity('${r.routeId}', ${r.capacity})">
            Adjust Capacity
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Adjust route capacity prompt
 * @param {string} routeId 
 * @param {number} currentCap 
 */
function promptAdjustRouteCapacity(routeId, currentCap) {
  const newCapStr = prompt(`Enter new bus seat capacity for route ${routeId}:`, currentCap);
  if (!newCapStr) return;

  const newCap = parseInt(newCapStr, 10);
  if (isNaN(newCap) || newCap < 1) {
    showToast('Invalid capacity number.', 'error');
    return;
  }

  updateData(STORAGE_KEYS.ROUTES, routes => {
    return (routes || []).map(r => {
      if (r.routeId === routeId) {
        if (newCap < r.occupiedSeats) {
          showToast(`Capacity cannot be lower than current occupied seats (${r.occupiedSeats}).`, 'error');
          return r;
        }
        const avail = newCap - r.occupiedSeats;
        return {
          ...r,
          capacity: newCap,
          availableSeats: avail,
          status: avail === 0 ? 'Route Full' : avail <= 5 ? 'Seats Available (Low)' : 'Seats Available'
        };
      }
      return r;
    });
  });

  updateAdminMetrics();
  renderRouteSeatManagement();
  renderAdminReports();
  showToast(`Route ${routeId} capacity updated to ${newCap}.`, 'success');
}
