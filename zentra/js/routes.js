/**
 * ZENTRA - Bus Routes & Seat Availability Engine
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Dynamic generation of Route Cards (No hard-coded cards)
 * - Real-time seat calculations (availableSeats = capacity - occupiedSeats)
 * - Live filtering (Search by name/stop, Filter by status: All, Available, Low, Full)
 * - "Notify Transport Authority" action for full routes (persists notification in localStorage)
 */

let allRoutesData = [];

/**
 * Initializes and loads routes on the page
 */
function initRoutesExplorer() {
  allRoutesData = loadData(STORAGE_KEYS.ROUTES, []);
  renderRouteCards(allRoutesData);

  // Setup search & filter listeners
  const searchInput = document.getElementById('routeSearchInput');
  const filterSelect = document.getElementById('routeStatusFilter');

  if (searchInput) {
    searchInput.addEventListener('input', applyRouteFilters);
  }
  if (filterSelect) {
    filterSelect.addEventListener('change', applyRouteFilters);
  }
}

/**
 * Filters routes based on user query and dropdown selection
 */
function applyRouteFilters() {
  const query = (document.getElementById('routeSearchInput')?.value || '').toLowerCase().trim();
  const filter = document.getElementById('routeStatusFilter')?.value || 'ALL';

  const filtered = allRoutesData.filter(route => {
    // Text search
    const matchesQuery = 
      route.routeName.toLowerCase().includes(query) ||
      route.routeNumber.toLowerCase().includes(query) ||
      route.startingPoint.toLowerCase().includes(query) ||
      route.busNumber.toLowerCase().includes(query) ||
      route.stops.some(stop => stop.toLowerCase().includes(query));

    // Status filter
    const avail = route.capacity - route.occupiedSeats;
    let matchesFilter = true;

    if (filter === 'AVAILABLE') {
      matchesFilter = avail > 0;
    } else if (filter === 'LOW') {
      matchesFilter = avail > 0 && avail <= 5;
    } else if (filter === 'FULL') {
      matchesFilter = avail === 0;
    }

    return matchesQuery && matchesFilter;
  });

  renderRouteCards(filtered);
}

/**
 * Generates and mounts Route Cards dynamically into the DOM
 * @param {Array} routes 
 */
function renderRouteCards(routes) {
  const container = document.getElementById('routesContainer');
  if (!container) return;

  if (routes.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 0.5rem;">No bus routes found matching your criteria.</p>
        <button class="btn btn-outline btn-sm" onclick="resetRouteFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = routes.map(route => {
    const available = Math.max(0, route.capacity - route.occupiedSeats);
    const occupancyPercent = Math.min(100, Math.round((route.occupiedSeats / route.capacity) * 100));

    // Official 2026-27 Fee
    const feeAmount = route.applicableFee || (typeof getFeeForRoute === 'function' ? getFeeForRoute(route.routeId) : 29300);
    const formattedFee = `₹${feeAmount.toLocaleString('en-IN')}`;

    // Determine badge and bar styling
    let statusBadgeHtml = '';
    let barColorClass = 'seat-fill-green';

    if (available === 0) {
      statusBadgeHtml = `<span class="badge badge-full">Route Full</span>`;
      barColorClass = 'seat-fill-red';
    } else if (available <= 5) {
      statusBadgeHtml = `<span class="badge badge-pending">Low Seats (${available} left)</span>`;
      barColorClass = 'seat-fill-orange';
    } else {
      statusBadgeHtml = `<span class="badge badge-available">Seats Available</span>`;
      barColorClass = 'seat-fill-green';
    }

    // Determine action buttons
    let actionBtnHtml = '';
    if (available > 0) {
      actionBtnHtml = `
        <a href="application.html?routeId=${route.routeId}" class="btn btn-primary btn-sm" style="width: 100%;">
          Apply For This Route
        </a>
      `;
    } else {
      actionBtnHtml = `
        <div style="display:flex; flex-direction:column; gap:0.5rem; width:100%;">
          <div style="font-size:0.78rem; color:var(--status-rejected); font-weight:600; text-align:center;">
            ✕ No seats are currently available on this route.
          </div>
          <button class="btn btn-outline btn-sm" onclick="notifyAuthorityForRoute('${route.routeId}', '${route.routeName}')" style="border-color:var(--status-pending); color:var(--status-pending);">
            🔔 Notify Transport Authority
          </button>
        </div>
      `;
    }

    return `
      <div class="route-card" data-route-id="${route.routeId}">
        <div>
          <div class="route-card-top">
            <span class="route-badge-num">${route.routeNumber}</span>
            ${statusBadgeHtml}
          </div>

          <h3 class="route-name">${route.routeName}</h3>
          
          <div class="route-bus-info">
            <span>🚍 Bus: <strong>${route.busNumber}</strong></span>
            <span>•</span>
            <span>📍 Start: <strong>${route.startingPoint}</strong></span>
          </div>

          <!-- Official 2026-27 Bus Fee Slab Badge -->
          <div style="background: rgba(0, 119, 182, 0.05); border: 1px solid rgba(0, 180, 216, 0.25); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Applicable Fee (AY 2026–27):</span>
              <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem;"><span style="color:var(--accent-blue);">₹</span>${feeAmount.toLocaleString('en-IN')}</div>
            </div>
            <span class="badge-ay" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">2026–27</span>
          </div>

          <div class="route-meta">
            <div class="route-meta-item">
              <span class="route-meta-label">Departure</span>
              <span class="route-meta-val">${route.departureTime}</span>
            </div>
            <div class="route-meta-item">
              <span class="route-meta-label">Campus Arrival</span>
              <span class="route-meta-val">${route.arrivalTime}</span>
            </div>
          </div>

          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.25rem;">Key Stops:</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
              ${route.stops.join(' ➔ ')}
            </div>
          </div>

          <!-- Seat Availability Gauge / Bar -->
          <div class="seat-bar-wrap">
            <div class="seat-bar-labels">
              <span>Seats: ${route.occupiedSeats} / ${route.capacity} occupied</span>
              <span style="color: ${available === 0 ? 'var(--status-rejected)' : available <= 5 ? 'var(--status-pending)' : 'var(--status-approved)'};">
                ${available} Available
              </span>
            </div>
            <div class="seat-bar-track">
              <div class="seat-bar-fill ${barColorClass}" style="width: ${occupancyPercent}%;"></div>
            </div>
          </div>
        </div>

        <div style="margin-top: 1rem;">
          ${actionBtnHtml}
          <a href="fee-structure.html?boardingPoint=${encodeURIComponent(route.startingPoint)}" style="font-size:0.75rem; color:var(--accent-blue); text-align:center; display:block; margin-top:0.4rem; text-decoration:none;">
            View Official Fee Breakdown ➔
          </a>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Resets search and dropdown filters
 */
function resetRouteFilters() {
  const searchInput = document.getElementById('routeSearchInput');
  const filterSelect = document.getElementById('routeStatusFilter');
  if (searchInput) searchInput.value = '';
  if (filterSelect) filterSelect.value = 'ALL';
  renderRouteCards(allRoutesData);
}

/**
 * Handles "Notify Transport Authority" when route is full
 * Creates an admin notification in localStorage
 * @param {string} routeId 
 * @param {string} routeName 
 */
function notifyAuthorityForRoute(routeId, routeName) {
  const user = getLoggedInUser();
  const applicantInfo = user ? `${user.name} (${user.id})` : 'An applicant';

  const newNotification = {
    id: `NOTIF-REQ-${Date.now()}`,
    targetId: 'ADMIN01',
    title: 'Seat Allocation Request (Full Route)',
    message: `${applicantInfo} requested seat expansion or an additional bus for ${routeName} (${routeId}).`,
    type: 'warning',
    timestamp: new Date().toLocaleString(),
    read: false
  };

  updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => {
    return [newNotification, ...(notifs || [])];
  });

  showToast(`Transport Authority notified about seat demand on ${routeName}.`, 'success');
}
