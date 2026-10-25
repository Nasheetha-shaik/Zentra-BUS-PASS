/**
 * ZENTRA - Transport Fee Payment Simulation Engine
 * Academic Year 2026–27 Official Transport Proceedings
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Student Fee Status verification for Academic Year 2026–27
 * - Dynamic route & boarding point fee lookup from official 28-category schedule
 * - Multi-step simulated gateway with loading animation & bank clearance simulation
 * - Official Bank Details integration (PNB Station Road Guntur, A/C: 0195000109168835)
 * - Dynamic transaction ID generation (SPTX2026XXXXX)
 * - Persistent storage in localStorage (zentra_payments & student feeStatus update)
 * - Printable / Downloadable Official Payment Receipt modal with Indian currency formatting (₹)
 * - Critical validation: Blocks bus pass applications if fee is UNPAID
 */

const CURRENT_ACADEMIC_YEAR = '2026–27';
const DEFAULT_BASELINE_FEE = 29300; // S.No 1 Guntur Urban Official AY 2026–27 Fee

/**
 * Checks whether a given student has paid their transport fee for AY 2026–27
 * @param {string} studentId 
 * @returns {boolean}
 */
function isStudentFeePaid(studentId) {
  if (!studentId) return false;
  const students = loadData(STORAGE_KEYS.USERS_STUDENTS, []);
  const student = students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
  return student ? student.feeStatus === 'PAID' : false;
}

/**
 * Retrieves the student's payment record if paid
 * @param {string} studentId 
 * @returns {object|null}
 */
function getStudentPaymentRecord(studentId) {
  if (!studentId) return null;
  const payments = loadData(STORAGE_KEYS.PAYMENTS, []);
  return payments.find(p => p.studentId.toUpperCase() === studentId.toUpperCase() && p.status === 'PAID') || null;
}

/**
 * Renders the Payment Status & Action Card on Student Dashboard
 * @param {string} containerId 
 */
function renderStudentPaymentSection(containerId = 'paymentSection') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = getLoggedInUser();
  if (!user || user.role !== 'STUDENT') {
    container.innerHTML = '';
    return;
  }

  const isPaid = isStudentFeePaid(user.id);
  const paymentRecord = isPaid ? getStudentPaymentRecord(user.id) : null;

  if (isPaid && paymentRecord) {
    container.innerHTML = `
      <div class="card" style="border-top: 4px solid var(--status-approved);">
        <div class="card-header">
          <div class="card-title">
            <span>💳 Transport Fee Status</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge-ay" style="font-size:0.75rem;">AY ${paymentRecord.academicYear || CURRENT_ACADEMIC_YEAR}</span>
            <span class="badge badge-paid">PAID & VERIFIED</span>
          </div>
        </div>
        <div class="card-body">
          <div class="form-row" style="margin-bottom: 1.25rem;">
            <div>
              <span class="form-label" style="font-size:0.75rem; color:var(--text-muted);">Applicant</span>
              <strong>${user.name}</strong> (${user.id})
            </div>
            <div>
              <span class="form-label" style="font-size:0.75rem; color:var(--text-muted);">Academic Year</span>
              <strong style="color:var(--primary-navy);">${paymentRecord.academicYear || CURRENT_ACADEMIC_YEAR}</strong>
            </div>
            <div>
              <span class="form-label" style="font-size:0.75rem; color:var(--text-muted);">Amount Paid</span>
              <strong style="color:var(--status-approved); font-size:1.1rem;">₹${paymentRecord.amount.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span class="form-label" style="font-size:0.75rem; color:var(--text-muted);">Transaction Reference</span>
              <code>${paymentRecord.transactionId}</code>
            </div>
          </div>

          <div style="background:var(--bg-subtle); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:1.25rem; font-size:0.82rem; color:var(--text-secondary); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <strong>Remittance Channel:</strong> Punjab National Bank (Station Road, Guntur) • A/C: <code>0195000109168835</code>
            </div>
            <div style="color:var(--status-approved); font-weight:600;">
              ✓ Clearance Approved
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <span style="font-size:0.84rem; color:var(--status-approved);">
              ✓ Transport fee clearance verified for AY ${paymentRecord.academicYear || CURRENT_ACADEMIC_YEAR}. You are eligible to submit your bus pass application.
            </span>
            <div style="display:flex; gap:0.5rem;">
              <a href="fee-structure.html" class="btn btn-outline btn-sm">
                📋 View AY 2026–27 Schedule
              </a>
              <button class="btn btn-primary btn-sm" onclick="showPaymentReceiptModal('${paymentRecord.transactionId}')">
                📄 View Official Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="card" style="border-top: 4px solid var(--status-rejected);">
        <div class="card-header">
          <div class="card-title">
            <span>💳 Transport Fee Status</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge-ay" style="font-size:0.75rem;">AY ${CURRENT_ACADEMIC_YEAR}</span>
            <span class="badge badge-failed">UNPAID</span>
          </div>
        </div>
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h4 style="color: var(--primary-navy); margin-bottom: 0.35rem;">
                Official Transport Fee Required for Academic Year ${CURRENT_ACADEMIC_YEAR}
              </h4>
              <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 650px;">
                As per VFSTR Registrar Office Proceedings F. No. RO/RA/21-26/A256, all enrolled students must remit the official route fee before bus pass approval. Fees range from <strong>₹22,400</strong> (Tenali) to <strong>₹56,400</strong> (Vijayawada) across 28 official boarding locations.
              </p>
              <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary-navy);">
                  Schedule Slabs: <span style="color: var(--accent-blue);">₹22,400 – ₹56,400</span>
                </div>
                <a href="fee-structure.html" style="font-size: 0.85rem; color: var(--accent-blue); text-decoration: underline;">
                  View all 28 boarding point fees ➔
                </a>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
              <button class="btn btn-primary btn-lg" onclick="openPaymentGatewayModal()">
                💳 Select Stop & Pay Now ➔
              </button>
              <span style="font-size: 0.75rem; color: var(--text-muted);">
                Instant Clearance Simulation
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Opens Simulated Payment Gateway Modal with official 2026-27 Boarding Point Selection
 * @param {string|null} preselectedBoardingPoint 
 */
function openPaymentGatewayModal(preselectedBoardingPoint = null) {
  const user = getLoggedInUser();
  if (!user || user.role !== 'STUDENT') {
    showToast('Only students are required to pay transport fee.', 'warning');
    return;
  }

  let modal = document.getElementById('paymentGatewayModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paymentGatewayModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const feeSchedule = getOfficialFeeSchedule();
  
  // Determine initial selection
  let initialPoint = preselectedBoardingPoint || 'Guntur';
  let initialItem = getOfficialFeeForBoardingPoint(initialPoint) || feeSchedule[0];
  let currentAmount = initialItem.amount;

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 560px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title" style="margin-bottom: 2px;">🏦 University Transport Fee Gateway</h3>
          <div style="font-size: 0.75rem; color: var(--accent-blue); font-weight: 600;">
            Official Remittance Portal • Academic Year 2026–27
          </div>
        </div>
        <button class="modal-close" onclick="closePaymentGatewayModal()">&times;</button>
      </div>
      <div class="modal-body" id="gatewayModalBody">
        
        <!-- Student Info Header -->
        <div style="background: var(--bg-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.15rem; border: 1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; font-size:0.85rem;">
            <span style="color:var(--text-muted);">Student Name:</span>
            <strong>${user.name}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; font-size:0.85rem;">
            <span style="color:var(--text-muted);">Registration ID:</span>
            <strong>${user.id}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
            <span style="color:var(--text-muted);">Academic Session:</span>
            <strong style="color:var(--primary-navy);">${CURRENT_ACADEMIC_YEAR} (Exclusively)</strong>
          </div>
        </div>

        <!-- Boarding Point Selection for Route-Based Fee Lookup -->
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="payBoardingSelect" style="display: flex; justify-content: space-between;">
            <span>Select Your Commute Boarding Point</span>
            <a href="fee-structure.html" target="_blank" style="font-size: 0.75rem; color: var(--accent-blue);">View Fee List ↗</a>
          </label>
          <select class="form-control" id="payBoardingSelect" onchange="handleGatewayBoardingChange(this.value)">
            ${feeSchedule.map(item => `
              <option value="${item.boardingPoint}" ${item.boardingPoint === initialPoint ? 'selected' : ''}>
                ${item.sNo}. ${item.boardingPoint} (₹${item.amount.toLocaleString('en-IN')}) - ${item.region}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Payable Fee Summary Display -->
        <div style="background: rgba(0, 119, 182, 0.06); border: 1px solid rgba(0, 180, 216, 0.3); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.15rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <span style="font-size:0.82rem; color:var(--text-secondary);">Selected Boarding Stop:</span>
            <strong id="gatewayStopLabel" style="color:var(--primary-navy);">${initialItem.boardingPoint}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:0.82rem; color:var(--text-secondary);">Regional Transit Corridor:</span>
            <span id="gatewayRegionLabel" style="font-size:0.82rem; font-weight:600; color:var(--text-secondary);">${initialItem.region}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:1px dashed rgba(0, 180, 216, 0.4); padding-top:0.5rem; margin-top:0.25rem;">
            <span style="font-weight:700; color:var(--primary-navy); font-size:0.95rem;">Total Official Fee Payable:</span>
            <span style="font-size:1.45rem; font-weight:800; color:var(--primary-navy);">
              <span style="color:var(--accent-blue);">₹</span><span id="gatewayPayableAmount">${initialItem.amount.toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="payMethodSelect">Select Remittance Channel</label>
          <select class="form-control" id="payMethodSelect">
            <option value="Campus UPI / QR">Campus UPI / QR Code (Instant Clearance)</option>
            <option value="Punjab National Bank NetBanking">PNB NetBanking (Station Road, Guntur A/C: 0195000109168835)</option>
            <option value="SBI / HDFC / ICICI NetBanking">Other Major Bank NetBanking</option>
            <option value="Debit Card">RuPay / Visa / MasterCard Debit</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>

        <!-- Progress Indicator -->
        <div id="paymentProgressBox" style="display:none; text-align:center; padding:1.25rem 0;">
          <div style="font-size:2rem; margin-bottom:0.5rem; animation: pulse-ring 1s infinite;">⏳</div>
          <div style="font-weight:700; color:var(--primary-navy); margin-bottom:0.35rem;" id="progressStatusText">
            Connecting to Campus Gateway...
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">
            Reconciling remittance with Punjab National Bank (Guntur). Please wait...
          </div>
        </div>
      </div>
      <div class="modal-footer" id="gatewayModalFooter">
        <button class="btn btn-outline" onclick="closePaymentGatewayModal()">Cancel</button>
        <button class="btn btn-success" id="confirmPayBtn" onclick="executeSimulatedPayment()">
          Confirm & Pay ₹<span id="gatewayBtnAmount">${initialItem.amount.toLocaleString('en-IN')}</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

/**
 * Handles dropdown change in payment gateway to recalculate official fee
 */
function handleGatewayBoardingChange(boardingPointName) {
  const item = getOfficialFeeForBoardingPoint(boardingPointName);
  if (!item) return;

  const stopEl = document.getElementById('gatewayStopLabel');
  const regionEl = document.getElementById('gatewayRegionLabel');
  const amountEl = document.getElementById('gatewayPayableAmount');
  const btnAmountEl = document.getElementById('gatewayBtnAmount');

  if (stopEl) stopEl.textContent = item.boardingPoint;
  if (regionEl) regionEl.textContent = item.region;
  if (amountEl) amountEl.textContent = item.amount.toLocaleString('en-IN');
  if (btnAmountEl) btnAmountEl.textContent = item.amount.toLocaleString('en-IN');
}

function closePaymentGatewayModal() {
  const modal = document.getElementById('paymentGatewayModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Simulates asynchronous payment processing, generates transaction ID, and persists data
 */
function executeSimulatedPayment() {
  const user = getLoggedInUser();
  if (!user) return;

  const boardingSelect = document.getElementById('payBoardingSelect');
  const selectedBoardingName = boardingSelect ? boardingSelect.value : 'Guntur';
  const item = getOfficialFeeForBoardingPoint(selectedBoardingName) || { amount: 29300, boardingPoint: 'Guntur' };

  const methodSelect = document.getElementById('payMethodSelect');
  const selectedMethod = methodSelect ? methodSelect.value : 'Campus UPI';

  const confirmBtn = document.getElementById('confirmPayBtn');
  const progressBox = document.getElementById('paymentProgressBox');
  const statusText = document.getElementById('progressStatusText');

  if (confirmBtn) confirmBtn.style.display = 'none';
  if (progressBox) progressBox.style.display = 'block';

  // Step 1: Connecting
  if (statusText) statusText.textContent = 'Connecting to Campus Payment Gateway...';

  setTimeout(() => {
    // Step 2: Authorizing
    if (statusText) statusText.textContent = `Authorizing ₹${item.amount.toLocaleString('en-IN')} via ${selectedMethod}...`;

    setTimeout(() => {
      // Step 3: Generating Transaction ID and persisting
      const randomSalt = Math.floor(10000 + Math.random() * 90000);
      const generatedTxId = `SPTX2026${randomSalt}`;
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const newPayment = {
        paymentId: `PAY-2026-${randomSalt}`,
        studentId: user.id,
        studentName: user.name,
        amount: item.amount,
        academicYear: CURRENT_ACADEMIC_YEAR,
        boardingPoint: item.boardingPoint,
        transactionId: generatedTxId,
        paymentDate: formattedDate,
        paymentMethod: selectedMethod,
        bankAccount: 'Punjab National Bank, Station Road, Guntur (A/C: 0195000109168835)',
        status: 'PAID'
      };

      // 1. Add payment record
      updateData(STORAGE_KEYS.PAYMENTS, payments => {
        return [...(payments || []), newPayment];
      });

      // 2. Update student status in USERS_STUDENTS
      updateData(STORAGE_KEYS.USERS_STUDENTS, students => {
        return (students || []).map(s => {
          if (s.id.toUpperCase() === user.id.toUpperCase()) {
            return { ...s, feeStatus: 'PAID' };
          }
          return s;
        });
      });

      // 3. Update loggedInUser session state
      user.feeStatus = 'PAID';
      setLoggedInUser(user);

      // 4. Create Notification
      const newNotif = {
        id: `NOTIF-PAY-${Date.now()}`,
        targetId: user.id,
        title: 'Fee Payment Successful (AY 2026–27)',
        message: `Your transport fee of ₹${item.amount.toLocaleString('en-IN')} for ${item.boardingPoint} (AY 2026–27) is cleared. Ref: ${generatedTxId}. You can now submit your bus pass application.`,
        type: 'success',
        timestamp: formattedDate,
        read: false
      };
      updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => [newNotif, ...(notifs || [])]);

      closePaymentGatewayModal();
      showToast(`Payment of ₹${item.amount.toLocaleString('en-IN')} Successful! Transaction ID: ${generatedTxId}`, 'success', 5000);

      // Re-render payment section if on student dashboard
      renderStudentPaymentSection('paymentSection');
      if (typeof renderStudentDashboard === 'function') {
        renderStudentDashboard();
      }

      // Display official receipt
      showPaymentReceiptModal(generatedTxId);

    }, 850);
  }, 750);
}

/**
 * Displays Official Printable/Downloadable Receipt Modal
 * @param {string} transactionId 
 */
function showPaymentReceiptModal(transactionId) {
  const payments = loadData(STORAGE_KEYS.PAYMENTS, []);
  const payment = payments.find(p => p.transactionId === transactionId);

  if (!payment) {
    showToast('Payment record not found.', 'error');
    return;
  }

  let modal = document.getElementById('paymentReceiptModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paymentReceiptModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 580px;">
      <div class="modal-header">
        <h3 class="modal-title">📄 Official Transport Fee Receipt</h3>
        <button class="modal-close" onclick="closePaymentReceiptModal()">&times;</button>
      </div>
      <div class="modal-body" id="receiptPrintArea">
        <div style="text-align: center; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.25rem;">
          <h2 style="color: var(--primary-navy); margin-bottom: 0.2rem; font-size: 1.35rem;">ZENTRA UNIVERSITY TRANSPORT</h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">
            Official Transport Fee Clearance • Academic Year ${payment.academicYear || CURRENT_ACADEMIC_YEAR}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            Under Proceedings F. No. RO/RA/21-26/A256
          </div>
        </div>

        <div style="background: var(--status-approved-bg); border: 1px solid rgba(16,185,129,0.3); padding: 0.85rem; border-radius: var(--radius-md); text-align: center; margin-bottom: 1.25rem;">
          <div style="color: var(--status-approved); font-weight: 800; font-size: 1.1rem;">PAYMENT VERIFIED & CLEARED</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Transaction Reference: <strong>${payment.transactionId}</strong>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 1.25rem;">
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.5rem 0; color: var(--text-muted);">Student Name:</td>
            <td style="padding: 0.5rem 0; text-align: right; font-weight: 700;">${payment.studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.5rem 0; color: var(--text-muted);">Registration ID:</td>
            <td style="padding: 0.5rem 0; text-align: right; font-weight: 700;">${payment.studentId}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.5rem 0; color: var(--text-muted);">Academic Year:</td>
            <td style="padding: 0.5rem 0; text-align: right; font-weight: 700; color: var(--accent-blue);">
              ${payment.academicYear || CURRENT_ACADEMIC_YEAR}
            </td>
          </tr>
          ${payment.boardingPoint ? `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem 0; color: var(--text-muted);">Assigned Boarding Point:</td>
              <td style="padding: 0.5rem 0; text-align: right; font-weight: 600;">${payment.boardingPoint}</td>
            </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.5rem 0; color: var(--text-muted);">Payment Date & Time:</td>
            <td style="padding: 0.5rem 0; text-align: right; font-weight: 600;">${payment.paymentDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.5rem 0; color: var(--text-muted);">Payment Channel:</td>
            <td style="padding: 0.5rem 0; text-align: right; font-weight: 600;">${payment.paymentMethod}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.5rem 0; color: var(--text-muted);">Remittance Bank:</td>
            <td style="padding: 0.5rem 0; text-align: right; font-weight: 600; font-size: 0.8rem;">
              Punjab National Bank, Station Road, Guntur (A/C: 0195000109168835)
            </td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; font-weight: 800; font-size: 1rem; color: var(--primary-navy);">Total Fee Cleared:</td>
            <td style="padding: 0.75rem 0; text-align: right; font-weight: 800; font-size: 1.25rem; color: var(--status-approved);">
              ₹${payment.amount.toLocaleString('en-IN')}
            </td>
          </tr>
        </table>

        <div style="background: var(--bg-subtle); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">
          🎓 <strong>Scholarship Note:</strong> Students securing ≥ 7.00 SGPA in the preceding semester are eligible for scholarship reimbursement processed directly via NEFT into their verified bank account.
        </div>

        <div style="font-size: 0.72rem; color: var(--text-muted); text-align: center; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
          This is an official computer-generated electronic receipt valid for college bus-pass issuance for Academic Year 2026–27. No physical signature required.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="btn btn-primary" onclick="closePaymentReceiptModal()">Done</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closePaymentReceiptModal() {
  const modal = document.getElementById('paymentReceiptModal');
  if (modal) modal.classList.remove('active');
}
