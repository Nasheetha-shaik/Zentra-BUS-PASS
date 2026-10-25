/**
 * ZENTRA - Bus Pass Application Wizard Engine
 * Vanilla JavaScript ES6+
 * 
 * Multi-Step Flow:
 * STEP 1: Applicant Details (Auto-retrieved from session)
 * STEP 2: Route Selection (Populated dynamically)
 * STEP 3: Boarding Point Selection (Dynamic based on route stops)
 * STEP 4: Seat Availability Check (Calculates capacity - occupiedSeats)
 * STEP 5: Application Review
 * STEP 6: Submission & Timeline Initialization
 * 
 * Business Rules Enforced in JavaScript:
 * - Duplicate Application Prevention: Exactly ONE active application per Reg/Emp ID
 * - Student Fee Check: Rejects submission if transport fee is UNPAID
 * - Employee Verification: Confirms Employee ID; no fee required
 * - Full Route Prevention: Blocks submission if availableSeats === 0
 * - Non-destructive: Submitting sets status to PENDING; does NOT decrement seats until Admin Approves!
 */

let currentStep = 1;
const totalSteps = 6;
let applicationFormData = {
  applicantId: '',
  applicantName: '',
  applicantType: '',
  department: '',
  year: '',
  phone: '',
  email: '',
  routeId: '',
  routeNumber: '',
  routeName: '',
  busNumber: '',
  boardingPoint: '',
  availableSeats: 0
};

/**
 * Initializes the Application Wizard page
 */
function initApplicationWizard() {
  const user = getLoggedInUser();

  if (!user) {
    showToast('Please log in as a Student or Employee to apply for a bus pass.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 600);
    return;
  }

  // Pre-check for duplicate active application
  const existingApp = checkActiveApplication(user.id);
  if (existingApp) {
    renderExistingApplicationBanner(existingApp);
    return;
  }

  // Pre-check transport fee if Student
  if (user.role === 'STUDENT' && !isStudentFeePaid(user.id)) {
    renderUnpaidFeeBlocker();
    return;
  }

  // Populate Step 1 with user details
  populateApplicantDetails(user);

  // Populate Routes dropdown in Step 2
  populateRouteOptions();

  // Check URL params for pre-selected route or boarding point
  const urlParams = new URLSearchParams(window.location.search);
  let preSelectedRoute = urlParams.get('routeId');
  const preSelectedBoarding = urlParams.get('boardingPoint');

  if (preSelectedBoarding && !preSelectedRoute) {
    const feeItem = typeof getOfficialFeeForBoardingPoint === 'function' ? getOfficialFeeForBoardingPoint(preSelectedBoarding) : null;
    if (feeItem && feeItem.routeId) {
      preSelectedRoute = feeItem.routeId;
    }
  }

  if (preSelectedRoute) {
    const routeSelect = document.getElementById('appRouteSelect');
    if (routeSelect) {
      routeSelect.value = preSelectedRoute;
      handleRouteSelectionChange(preSelectedRoute);

      if (preSelectedBoarding) {
        setTimeout(() => {
          const boardingSelect = document.getElementById('appBoardingSelect');
          if (boardingSelect) {
            boardingSelect.value = preSelectedBoarding;
            if (typeof boardingSelect.onchange === 'function') {
              boardingSelect.onchange({ target: boardingSelect });
            }
          }
        }, 100);
      }
    }
  }

  updateWizardStepUI();
}

/**
 * Checks if user already has an active application in localStorage
 * @param {string} userId 
 * @returns {object|null}
 */
function checkActiveApplication(userId) {
  const applications = loadData(STORAGE_KEYS.APPLICATIONS, []);
  return applications.find(app => 
    app.applicantId.toUpperCase() === userId.toUpperCase() && 
    (app.status === 'PENDING' || app.status === 'APPROVED')
  ) || null;
}

/**
 * Renders Duplicate Application Prevention banner if active application found
 * @param {object} app 
 */
function renderExistingApplicationBanner(app) {
  const wizardContainer = document.getElementById('wizardContainer');
  if (!wizardContainer) return;

  const user = getLoggedInUser();
  const dashboardLink = user.role === 'EMPLOYEE' ? 'employee-dashboard.html' : 'student-dashboard.html';

  wizardContainer.innerHTML = `
    <div class="card" style="border-top: 4px solid var(--status-pending); text-align: center; padding: 2.5rem 1.5rem;">
      <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📋</div>
      <h2 style="color: var(--primary-navy); margin-bottom: 0.5rem;">Active Application Already Exists</h2>
      <p style="color: var(--status-rejected); font-weight: 600; font-size: 1rem; margin-bottom: 1.5rem;">
        “You already have an active bus-pass application.”
      </p>

      <div style="max-width: 500px; margin: 0 auto 2rem; background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; text-align: left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Application ID:</span>
          <strong>${app.applicationId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Selected Route:</span>
          <strong>${app.routeNumber} (${app.routeName})</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Boarding Point:</span>
          <strong>${app.boardingPoint}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Submission Date:</span>
          <strong>${app.applicationDate}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:0.5rem; margin-top:0.5rem;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Current Status:</span>
          <span class="badge ${app.status === 'APPROVED' ? 'badge-approved' : 'badge-pending'}">${app.status}</span>
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
        <a href="${dashboardLink}" class="btn btn-primary">Go to Dashboard</a>
        ${app.status === 'APPROVED' ? `<a href="bus-pass.html" class="btn btn-success">View Digital Bus Pass</a>` : ''}
      </div>
    </div>
  `;
}

/**
 * Renders Unpaid Fee Blocker message if student attempts to apply without payment
 */
function renderUnpaidFeeBlocker() {
  const wizardContainer = document.getElementById('wizardContainer');
  if (!wizardContainer) return;

  wizardContainer.innerHTML = `
    <div class="card" style="border-top: 4px solid var(--status-rejected); text-align: center; padding: 2.5rem 1.5rem;">
      <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💳</div>
      <div style="display:flex; justify-content:center; gap:0.5rem; margin-bottom:0.75rem;">
        <span class="badge-ay badge-ay-official">Academic Year 2026–27</span>
      </div>
      <h2 style="color: var(--primary-navy); margin-bottom: 0.5rem;">Transport Fee Clearance Required</h2>
      <p style="color: var(--status-rejected); font-weight: 600; font-size: 1.05rem; margin-bottom: 0.75rem;">
        “No transport fee payment found for Academic Year 2026–27.”
      </p>
      <p style="color: var(--text-secondary); max-width: 620px; margin: 0 auto 1.5rem; font-size: 0.92rem;">
        As per official university regulations, a student cannot submit a bus-pass application until the prescribed route transport fee (₹22,400 – ₹56,400 across 28 official boarding points) is cleared.
      </p>
      <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap; margin-bottom: 1.5rem;">
        <button class="btn btn-primary btn-lg" onclick="openPaymentGatewayModal()">
          💳 Select Stop & Clear Fee Now
        </button>
        <a href="fee-structure.html" class="btn btn-outline btn-lg">
          📋 View 2026–27 Fee Schedule
        </a>
      </div>
      <div style="font-size:0.8rem; color:var(--text-muted);">
        Account: Punjab National Bank, Station Road, Guntur • A/C: <code>0195000109168835</code>
      </div>
    </div>
  `;
}

/**
 * Step 1: Pre-fills applicant details from session
 * @param {object} user 
 */
function populateApplicantDetails(user) {
  applicationFormData.applicantId = user.id;
  applicationFormData.applicantName = user.name;
  applicationFormData.applicantType = user.role;
  applicationFormData.department = user.department || 'N/A';
  applicationFormData.year = user.year || (user.role === 'EMPLOYEE' ? 'Staff' : 'N/A');
  applicationFormData.phone = user.phone || '';
  applicationFormData.email = user.email || '';

  const idField = document.getElementById('step1Id');
  const nameField = document.getElementById('step1Name');
  const typeField = document.getElementById('step1Type');
  const deptField = document.getElementById('step1Department');
  const yearField = document.getElementById('step1Year');
  const phoneField = document.getElementById('step1Phone');
  const emailField = document.getElementById('step1Email');

  if (idField) idField.value = user.id;
  if (nameField) nameField.value = user.name;
  if (typeField) typeField.value = user.role === 'STUDENT' ? 'Student' : 'University Employee / Faculty';
  if (deptField) deptField.value = user.department;
  if (yearField) yearField.value = applicationFormData.year;
  if (phoneField) phoneField.value = user.phone;
  if (emailField) emailField.value = user.email;
}

/**
 * Step 2: Populates Routes dropdown
 */
function populateRouteOptions() {
  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const select = document.getElementById('appRouteSelect');
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose a Bus Route --</option>' +
    routes.map(r => {
      const avail = Math.max(0, r.capacity - r.occupiedSeats);
      return `<option value="${r.routeId}">${r.routeNumber}: ${r.routeName} (${avail} seats available)</option>`;
    }).join('');

  select.addEventListener('change', (e) => handleRouteSelectionChange(e.target.value));
}

/**
 * Step 3 & 4: Handles Route selection change, updates boarding points and seat count
 * @param {string} routeId 
 */
function handleRouteSelectionChange(routeId) {
  const routes = loadData(STORAGE_KEYS.ROUTES, []);
  const route = routes.find(r => r.routeId === routeId);

  const boardingSelect = document.getElementById('appBoardingSelect');
  const seatCheckCard = document.getElementById('seatCheckCard');

  if (!route) {
    if (boardingSelect) boardingSelect.innerHTML = '<option value="">-- Select Route First --</option>';
    if (seatCheckCard) seatCheckCard.innerHTML = '<p style="color:var(--text-muted);">Please select a route to inspect seat metrics.</p>';
    applicationFormData.routeId = '';
    return;
  }

  // Save selected route in state
  applicationFormData.routeId = route.routeId;
  applicationFormData.routeNumber = route.routeNumber;
  applicationFormData.routeName = route.routeName;
  applicationFormData.busNumber = route.busNumber;

  const avail = Math.max(0, route.capacity - route.occupiedSeats);
  applicationFormData.availableSeats = avail;

  const feeAmount = route.applicableFee || (typeof getFeeForRoute === 'function' ? getFeeForRoute(route.routeId) : 29300);

  // Render Step 2 Fee Notice
  const step2Notice = document.getElementById('step2FeeNotice');
  if (step2Notice) {
    step2Notice.innerHTML = `
      <div style="background: rgba(0, 119, 182, 0.05); border: 1px solid rgba(0, 180, 216, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Official Route Fee (AY 2026–27):</span>
          <div style="font-size:1.25rem; font-weight:800; color:var(--primary-navy);">
            <span style="color:var(--accent-blue);">₹</span>${feeAmount.toLocaleString('en-IN')}
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge-ay">Academic Year 2026–27</span>
          <div style="font-size:0.75rem; color:var(--status-approved); margin-top:2px;">Official VFSTR Rate</div>
        </div>
      </div>
    `;
  }

  // Populate Boarding Points (Stops)
  if (boardingSelect) {
    boardingSelect.innerHTML = '<option value="">-- Select Boarding Point --</option>' +
      route.stops.map(stop => `<option value="${stop}">${stop}</option>`).join('');

    boardingSelect.onchange = (e) => {
      const stop = e.target.value;
      applicationFormData.boardingPoint = stop;
      const step3Notice = document.getElementById('step3FeeNotice');
      if (step3Notice) {
        if (!stop) {
          step3Notice.innerHTML = '';
          return;
        }
        const stopFeeItem = (typeof getOfficialFeeForBoardingPoint === 'function' ? getOfficialFeeForBoardingPoint(stop) : null) || { amount: feeAmount, boardingPoint: stop, region: route.routeName };
        step3Notice.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Official Boarding Point Fee:</span>
              <div style="font-size:1.2rem; font-weight:800; color:var(--status-approved);">
                ₹${stopFeeItem.amount.toLocaleString('en-IN')} <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">(${stopFeeItem.boardingPoint})</span>
              </div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-align:right;">
              <div>Category: <strong>${stopFeeItem.region || 'Campus Corridor'}</strong></div>
              <div style="color:var(--accent-blue);">AY 2026–27 Approved</div>
            </div>
          </div>
        `;
      }
    };
  }

  // Populate Step 4 (Seat Availability Meter)
  if (seatCheckCard) {
    const isFull = avail === 0;
    const occupancyPercent = Math.min(100, Math.round((route.occupiedSeats / route.capacity) * 100));

    seatCheckCard.innerHTML = `
      <div style="background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <h4 style="color:var(--primary-navy); margin-bottom:0.2rem;">${route.routeNumber}: ${route.routeName}</h4>
            <div style="font-size:0.82rem; color:var(--text-secondary);">Bus No: <strong>${route.busNumber}</strong> | Departure: <strong>${route.departureTime}</strong></div>
          </div>
          <span class="badge ${isFull ? 'badge-full' : avail <= 5 ? 'badge-pending' : 'badge-available'}">
            ${isFull ? 'Route Full' : `${avail} Seats Available`}
          </span>
        </div>

        <div class="seat-bar-wrap" style="margin-bottom:0.75rem;">
          <div class="seat-bar-labels">
            <span>Seat Allocation: ${route.occupiedSeats} / ${route.capacity} occupied</span>
            <span style="font-weight:700; color:${isFull ? 'var(--status-rejected)' : 'var(--status-approved)'};">
              ${avail} remaining
            </span>
          </div>
          <div class="seat-bar-track">
            <div class="seat-bar-fill ${isFull ? 'seat-fill-red' : avail <= 5 ? 'seat-fill-orange' : 'seat-fill-green'}" style="width: ${occupancyPercent}%;"></div>
          </div>
        </div>

        ${isFull ? `
          <div style="padding:0.75rem; background:var(--status-rejected-bg); border-radius:var(--radius-sm); border:1px solid rgba(239,68,68,0.3); margin-top:1rem;">
            <div style="color:var(--status-rejected); font-weight:700; font-size:0.88rem; margin-bottom:0.35rem;">
              ✕ No seats are currently available on this route.
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">
              You cannot apply for a full route. You can notify the transport desk to request capacity adjustment.
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="notifyAuthorityForRoute('${route.routeId}', '${route.routeName}')">
              🔔 Notify Transport Authority
            </button>
          </div>
        ` : `
          <div style="font-size:0.82rem; color:var(--status-approved); margin-top:0.5rem;">
            ✓ Seats are available. Proceed to review and finalize your application.
          </div>
        `}
      </div>
    `;
  }
}

/**
 * Step 5: Prepares Review summary
 */
function prepareReviewStep() {
  const boardingSelect = document.getElementById('appBoardingSelect');
  if (boardingSelect) {
    applicationFormData.boardingPoint = boardingSelect.value;
  }

  const reviewContainer = document.getElementById('reviewSummaryContainer');
  if (!reviewContainer) return;

  const user = getLoggedInUser();
  const feeItem = (typeof getOfficialFeeForBoardingPoint === 'function' ? getOfficialFeeForBoardingPoint(applicationFormData.boardingPoint) : null) || { amount: (typeof getFeeForRoute === 'function' ? getFeeForRoute(applicationFormData.routeId) : 29300), boardingPoint: applicationFormData.boardingPoint };
  const formattedFee = `₹${feeItem.amount.toLocaleString('en-IN')}`;

  reviewContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-md);">
        <h4 style="color:var(--primary-navy); margin-bottom:0.5rem; font-size:0.95rem;">👤 Applicant Information</h4>
        <div class="form-row">
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Name:</span><br><strong>${applicationFormData.applicantName}</strong></div>
          <div><span style="color:var(--text-muted); font-size:0.75rem;">ID:</span><br><strong>${applicationFormData.applicantId}</strong></div>
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Category:</span><br><strong>${applicationFormData.applicantType}</strong></div>
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Department:</span><br><strong>${applicationFormData.department}</strong></div>
        </div>
      </div>

      <div style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-md);">
        <h4 style="color:var(--primary-navy); margin-bottom:0.5rem; font-size:0.95rem;">🚌 Route & Boarding Details</h4>
        <div class="form-row">
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Route:</span><br><strong>${applicationFormData.routeNumber} - ${applicationFormData.routeName}</strong></div>
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Assigned Bus:</span><br><strong>${applicationFormData.busNumber}</strong></div>
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Boarding Point:</span><br><strong style="color:var(--accent-blue);">${applicationFormData.boardingPoint}</strong></div>
          <div><span style="color:var(--text-muted); font-size:0.75rem;">Available Seats:</span><br><strong style="color:var(--status-approved);">${applicationFormData.availableSeats} Remaining</strong></div>
        </div>
      </div>

      <div style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-md);">
        <h4 style="color:var(--primary-navy); margin-bottom:0.5rem; font-size:0.95rem;">💳 Transport Fee Status (Academic Year 2026–27)</h4>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <span>${user.role === 'STUDENT' ? 'Official Route Transport Fee (AY 2026–27)' : 'Employee Transport Benefit'}</span>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
              ${user.role === 'STUDENT' ? `Official VFSTR S.No Fee for ${applicationFormData.boardingPoint}: ${formattedFee}` : '100% Subsidized University Staff Transit Benefit'}
            </div>
          </div>
          <span class="badge badge-paid">${user.role === 'STUDENT' ? `PAID & VERIFIED (${formattedFee})` : 'EXEMPTED (STAFF BENEFIT)'}</span>
        </div>
        ${user.role === 'STUDENT' ? `
          <div style="margin-top:0.6rem; font-size:0.75rem; color:var(--text-secondary); border-top:1px dashed var(--border-color); padding-top:0.4rem;">
            🎓 <strong>Scholarship Concession:</strong> Full fee must be paid initially; reimbursement is processed via NEFT based on maintaining minimum 7.00 SGPA in preceding semester.
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Validates step before moving forward
 * @param {number} step 
 * @returns {boolean}
 */
function validateWizardStep(step) {
  if (step === 2) {
    const routeSelect = document.getElementById('appRouteSelect');
    if (!routeSelect || !routeSelect.value) {
      showToast('Please select a bus route.', 'warning');
      return false;
    }
  }

  if (step === 3) {
    const boardingSelect = document.getElementById('appBoardingSelect');
    if (!boardingSelect || !boardingSelect.value) {
      showToast('Please select a boarding point.', 'warning');
      return false;
    }
    applicationFormData.boardingPoint = boardingSelect.value;
  }

  if (step === 4) {
    if (applicationFormData.availableSeats <= 0) {
      showToast('No seats are currently available on this route. Please choose another route.', 'error');
      return false;
    }
  }

  return true;
}

/**
 * Next step handler
 */
function nextWizardStep() {
  if (!validateWizardStep(currentStep)) return;

  if (currentStep < totalSteps) {
    currentStep++;
    if (currentStep === 5) {
      prepareReviewStep();
    }
    updateWizardStepUI();
  }
}

/**
 * Previous step handler
 */
function prevWizardStep() {
  if (currentStep > 1) {
    currentStep--;
    updateWizardStepUI();
  }
}

/**
 * Updates wizard navigation and pane visibility
 */
function updateWizardStepUI() {
  // Update step indicators
  document.querySelectorAll('.wizard-step-item').forEach(item => {
    const stepNum = parseInt(item.dataset.step, 10);
    item.classList.toggle('active', stepNum === currentStep);
    item.classList.toggle('completed', stepNum < currentStep);
  });

  // Update panes
  document.querySelectorAll('.wizard-pane').forEach(pane => {
    const paneNum = parseInt(pane.dataset.step, 10);
    pane.classList.toggle('active', paneNum === currentStep);
  });

  // Update Buttons
  const prevBtn = document.getElementById('wizardPrevBtn');
  const nextBtn = document.getElementById('wizardNextBtn');
  const submitBtn = document.getElementById('wizardSubmitBtn');

  if (prevBtn) prevBtn.style.display = currentStep === 1 || currentStep === 6 ? 'none' : 'inline-flex';
  if (nextBtn) nextBtn.style.display = currentStep >= 5 ? 'none' : 'inline-flex';
  if (submitBtn) submitBtn.style.display = currentStep === 5 ? 'inline-flex' : 'none';
}

/**
 * Step 6: Submits the application, persists in localStorage, creates notifications
 */
function submitBusPassApplication() {
  const user = getLoggedInUser();
  if (!user) return;

  // Final check for duplicates
  const existingApp = checkActiveApplication(user.id);
  if (existingApp) {
    showToast('You already have an active bus-pass application.', 'error');
    return;
  }

  const submitBtn = document.getElementById('wizardSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting application...';
  }

  setTimeout(() => {
    const randomAppId = `APP2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];

    const feeItem = (typeof getOfficialFeeForBoardingPoint === 'function' ? getOfficialFeeForBoardingPoint(applicationFormData.boardingPoint) : null) || { amount: (typeof getFeeForRoute === 'function' ? getFeeForRoute(applicationFormData.routeId) : 29300) };

    const newApplication = {
      applicationId: randomAppId,
      applicantId: user.id,
      applicantName: user.name,
      applicantType: user.role,
      department: user.department,
      year: user.year || (user.role === 'EMPLOYEE' ? 'Staff' : 'N/A'),
      phone: user.phone,
      email: user.email,
      routeId: applicationFormData.routeId,
      routeNumber: applicationFormData.routeNumber,
      routeName: applicationFormData.routeName,
      busNumber: applicationFormData.busNumber,
      boardingPoint: applicationFormData.boardingPoint,
      paymentStatus: user.role === 'STUDENT' ? 'PAID' : 'EXEMPTED (STAFF)',
      applicableFee: user.role === 'STUDENT' ? feeItem.amount : 0,
      academicYear: '2026–27',
      applicationDate: formattedDate,
      status: 'PENDING',
      approvalDate: null,
      passId: null
    };

    // 1. Persist application
    updateData(STORAGE_KEYS.APPLICATIONS, apps => {
      return [...(apps || []), newApplication];
    });

    // 2. Dispatch applicant notification
    const applicantNotif = {
      id: `NOTIF-APP-${Date.now()}`,
      targetId: user.id,
      title: 'Application Submitted',
      message: `Your bus pass application (${randomAppId}) for ${applicationFormData.routeNumber} was submitted successfully and is awaiting admin approval.`,
      type: 'info',
      timestamp: `${formattedDate} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      read: false
    };

    // 3. Dispatch admin notification
    const adminNotif = {
      id: `NOTIF-ADM-${Date.now()}`,
      targetId: 'ADMIN01',
      title: 'New Pass Application',
      message: `${user.name} (${user.id}) applied for ${applicationFormData.routeNumber} (${applicationFormData.routeName}).`,
      type: 'warning',
      timestamp: `${formattedDate} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      read: false
    };

    updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => [applicantNotif, adminNotif, ...(notifs || [])]);

    currentStep = 6;
    updateWizardStepUI();

    // Populate confirmation pane
    const confPane = document.getElementById('step6Confirmation');
    if (confPane) {
      const dashUrl = user.role === 'EMPLOYEE' ? 'employee-dashboard.html' : 'student-dashboard.html';
      confPane.innerHTML = `
        <div style="text-align:center; padding: 2rem 1rem;">
          <div style="width:64px; height:64px; border-radius:50%; background:var(--status-approved-bg); color:var(--status-approved); display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 1.25rem; border:2px solid var(--status-approved);">
            ✓
          </div>
          <h2 style="color:var(--primary-navy); margin-bottom:0.5rem;">Application Submitted Successfully!</h2>
          <p style="color:var(--text-secondary); max-width:540px; margin:0 auto 1.5rem; font-size:0.95rem;">
            Your bus-pass application has been registered with reference ID <strong>${randomAppId}</strong>. It is now awaiting review by the University Transport Authority.
          </p>

          <div style="display:flex; justify-content:center; gap:1rem; margin-top:2rem;">
            <a href="${dashUrl}" class="btn btn-primary btn-lg">View Dashboard & Track Status</a>
          </div>
        </div>
      `;
    }

    showToast(`Application ${randomAppId} submitted successfully!`, 'success');

  }, 700);
}
