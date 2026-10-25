/**
 * ZENTRA - "Your Campus Bus Pass, Simplified."
 * Core Application Engine & Data Layer (Vanilla JavaScript ES6+)
 * 
 * Features:
 * - LocalStorage state persistence with helper functions (loadData, saveData, updateData, deleteData)
 * - Initial demo dataset initialization (5 students, 3 employees, 1 admin, 5 bus routes)
 * - Session handling (loggedInUser)
 * - Dynamic Header & Footer injection
 * - Dynamic UI utilities (Toast alerts, Loading states, Canvas QR code generator)
 */

// Storage Keys
const STORAGE_KEYS = {
  USERS_STUDENTS: 'zentra_students',
  USERS_EMPLOYEES: 'zentra_employees',
  ADMIN: 'zentra_admin',
  ROUTES: 'zentra_routes',
  APPLICATIONS: 'zentra_applications',
  PAYMENTS: 'zentra_payments',
  NOTIFICATIONS: 'zentra_notifications',
  BUS_PASSES: 'zentra_passes',
  CURRENT_USER: 'zentra_logged_in_user',
  INITIALIZED: 'zentra_data_initialized',
  FEE_SCHEDULE: 'zentra_fee_schedule_2026_27'
};

// ==========================================================================
// OFFICIAL BUS FEE SCHEDULE - ACADEMIC YEAR 2026–27
// Reference: VFSTR Registrar Office Proceedings F. No. RO/RA/21-26/A256, dt. 27.05.2026
// ==========================================================================
const OFFICIAL_FEE_SCHEDULE_2026_27 = [
  { sNo: 1, boardingPoint: 'Guntur', region: 'Guntur Urban', amount: 29300, currency: '₹', corridor: 'Guntur Bus Station - Lodge Center - Autonagar', routeId: 'R01' },
  { sNo: 2, boardingPoint: 'Vijayawada', region: 'Vijayawada Metro', amount: 56400, currency: '₹', corridor: 'PNBS - Benz Circle - Kanuru - Penamaluru', routeId: 'R02' },
  { sNo: 3, boardingPoint: 'Mangalagiri', region: 'Capital Corridor', amount: 41400, currency: '₹', corridor: 'Mangalagiri Bypass - Old Bus Stand', routeId: 'R04' },
  { sNo: 4, boardingPoint: 'Kaza', region: 'Capital Corridor', amount: 39100, currency: '₹', corridor: 'Kaza Toll Plaza - NH-16', routeId: 'R04' },
  { sNo: 5, boardingPoint: 'Tadepalli', region: 'Vijayawada Approach', amount: 46000, currency: '₹', corridor: 'Tadepalli - NH-16 Flyover', routeId: 'R02' },
  { sNo: 6, boardingPoint: 'Pedavadlapudi', region: 'Rural Corridor', amount: 36800, currency: '₹', corridor: 'Pedavadlapudi Railway Gate / Center', routeId: 'R04' },
  { sNo: 7, boardingPoint: 'Revendrapadu', region: 'Tenali-Duggirala Belt', amount: 33400, currency: '₹', corridor: 'Revendrapadu Junction', routeId: 'R03' },
  { sNo: 8, boardingPoint: 'Thummapudi', region: 'Tenali-Duggirala Belt', amount: 31600, currency: '₹', corridor: 'Thummapudi Main Road', routeId: 'R03' },
  { sNo: 9, boardingPoint: 'Duggirala Main Road', region: 'Tenali-Duggirala Belt', amount: 29900, currency: '₹', corridor: 'Duggirala Main Center / Canal Road', routeId: 'R03' },
  { sNo: 10, boardingPoint: 'Pedakonduru', region: 'Amaravati River Belt', amount: 47700, currency: '₹', corridor: 'Pedakonduru Krishna River Bund', routeId: 'R05' },
  { sNo: 11, boardingPoint: 'Vallabhapuram', region: 'Kolipara-Tenali Belt', amount: 45400, currency: '₹', corridor: 'Vallabhapuram Center', routeId: 'R03' },
  { sNo: 12, boardingPoint: 'Munnangi', region: 'Kolipara-Tenali Belt', amount: 45400, currency: '₹', corridor: 'Munnangi Main Road', routeId: 'R03' },
  { sNo: 13, boardingPoint: 'Kolipara', region: 'Kolipara Mandal', amount: 41400, currency: '₹', corridor: 'Kolipara Bus Stand', routeId: 'R03' },
  { sNo: 14, boardingPoint: 'Athota', region: 'Kolipara Link', amount: 29900, currency: '₹', corridor: 'Athota Center', routeId: 'R03' },
  { sNo: 15, boardingPoint: 'Tenali', region: 'Tenali Urban', amount: 22400, currency: '₹', corridor: 'Tenali Railway Station - Morrispet - Chenchupet', routeId: 'R03' },
  { sNo: 16, boardingPoint: 'Chilakaluripeta', region: 'South Highway (NH-16)', amount: 53500, currency: '₹', corridor: 'Chilakaluripeta Clock Tower / Bypass', routeId: 'R01' },
  { sNo: 17, boardingPoint: 'Boyapalem', region: 'South Highway (NH-16)', amount: 41400, currency: '₹', corridor: 'Boyapalem Junction', routeId: 'R01' },
  { sNo: 18, boardingPoint: 'Choudavaram', region: 'South Highway (NH-16)', amount: 36800, currency: '₹', corridor: 'Choudavaram Junction', routeId: 'R01' },
  { sNo: 19, boardingPoint: 'Pothur', region: 'South Highway (NH-16)', amount: 36800, currency: '₹', corridor: 'Pothur Flyover Center', routeId: 'R01' },
  { sNo: 20, boardingPoint: 'Bapatla', region: 'Coastal Corridor', amount: 44900, currency: '₹', corridor: 'Bapatla Old Bus Stand / Clock Tower', routeId: 'R03' },
  { sNo: 21, boardingPoint: 'Appikatla', region: 'Coastal Corridor', amount: 38000, currency: '₹', corridor: 'Appikatla Junction', routeId: 'R03' },
  { sNo: 22, boardingPoint: 'Chundurpal', region: 'Tenali-Bapatla Link', amount: 35100, currency: '₹', corridor: 'Chundurpal Center (Tsunduru)', routeId: 'R03' },
  { sNo: 23, boardingPoint: 'Ponnur', region: 'Ponnur Corridor', amount: 30500, currency: '₹', corridor: 'Ponnur RTC Bus Station / Main Road', routeId: 'R01' },
  { sNo: 24, boardingPoint: 'Battiprolu', region: 'Repalle-Tenali Belt', amount: 48900, currency: '₹', corridor: 'Battiprolu Railway Station / Center', routeId: 'R03' },
  { sNo: 25, boardingPoint: 'Cherukupalli', region: 'Coastal Rural Belt', amount: 44900, currency: '₹', corridor: 'Cherukupalli Main Junction', routeId: 'R03' },
  { sNo: 26, boardingPoint: 'Gudavalli', region: 'Repalle Highway', amount: 47200, currency: '₹', corridor: 'Gudavalli Center', routeId: 'R03' },
  { sNo: 27, boardingPoint: 'Repalle', region: 'Coastal Terminal', amount: 53500, currency: '₹', corridor: 'Repalle RTC Bus Stand', routeId: 'R03' },
  { sNo: 28, boardingPoint: 'Chandole', region: 'Coastal Belt', amount: 36800, currency: '₹', corridor: 'Chandole Main Road', routeId: 'R03' }
];

const OFFICIAL_TRANSPORT_BANK_DETAILS = {
  academicYear: '2026–27',
  accountHolder: "VFSTR - Central Transport Division (Zentra)",
  bankName: 'Punjab National Bank',
  branch: 'Station Road, Guntur',
  accountNumber: '0195000109168835',
  ifscCode: 'PUNB0019500',
  modeOfRemittance: 'UPI / NetBanking / NEFT / RTGS'
};

const OFFICIAL_FEE_GUIDELINES = {
  academicYear: '2026–27',
  documentReference: 'VFSTR Registrar Office Proceedings F. No. RO/RA/21-26/A256, dated 27.05.2026',
  scholarshipCondition: 'Full bus fee must be paid initially. Students maintaining a minimum of 7.00 SGPA in the preceding semester are eligible for scholarship reimbursement, processed directly via NEFT into their verified bank account.',
  staffPolicy: 'Faculty and Staff members are entitled to a 100% subsidized university transit benefit (exempt from student transport fees).',
  passPolicy: 'Bus pass is non-transferable and valid exclusively for Academic Year 2026–27.'
};

/**
 * Retrieves the complete verified 2026-27 fee schedule
 * @returns {Array}
 */
function getOfficialFeeSchedule() {
  return loadData(STORAGE_KEYS.FEE_SCHEDULE, OFFICIAL_FEE_SCHEDULE_2026_27);
}

/**
 * Finds the official 2026-27 fee for a given boarding point
 * @param {string} boardingPointName 
 * @returns {object|null}
 */
function getOfficialFeeForBoardingPoint(boardingPointName) {
  if (!boardingPointName) return null;
  const schedule = getOfficialFeeSchedule();
  const cleanName = boardingPointName.trim().toLowerCase();
  
  // Exact match
  let found = schedule.find(item => item.boardingPoint.toLowerCase() === cleanName);
  if (found) return found;

  // Partial substring match
  found = schedule.find(item => 
    cleanName.includes(item.boardingPoint.toLowerCase()) || 
    item.boardingPoint.toLowerCase().includes(cleanName)
  );
  return found || null;
}

/**
 * Returns the baseline fee for a given route
 * @param {string} routeId 
 * @returns {number}
 */
function getFeeForRoute(routeId) {
  const routeFees = {
    'R01': 29300, // Guntur
    'R02': 56400, // Vijayawada
    'R03': 22400, // Tenali
    'R04': 41400, // Mangalagiri
    'R05': 39100  // Amaravati / Kaza
  };
  return routeFees[routeId] || 29300;
}

// ==========================================================================
// 1. DATA PERSISTENCE HELPERS (localStorage CRUD)
// ==========================================================================

/**
 * Save data to localStorage with JSON serialization
 * @param {string} key 
 * @param {*} data 
 */
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving data for key "${key}":`, error);
    return false;
  }
}

/**
 * Load data from localStorage with JSON parsing and fallback default
 * @param {string} key 
 * @param {*} defaultValue 
 * @returns {*}
 */
function loadData(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error loading data for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Update an existing data entry in localStorage using a callback function
 * @param {string} key 
 * @param {function} updateFn 
 */
function updateData(key, updateFn) {
  const current = loadData(key, null);
  const updated = updateFn(current);
  saveData(key, updated);
  return updated;
}

/**
 * Delete a specific key from localStorage
 * @param {string} key 
 */
function deleteData(key) {
  localStorage.removeItem(key);
}

// ==========================================================================
// 2. INITIAL DEMO DATA INITIALIZATION
// ==========================================================================

/**
 * Seeds comprehensive initial university demo data if not already present.
 */
function initializeDemoData(forceReset = false) {
  if (!forceReset && localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return; // Data already exists
  }

  // 1. Five Bus Routes (Available, Low Seat, and Full)
  const demoRoutes = [
    {
      routeId: 'R01',
      routeNumber: 'Route 01',
      routeName: 'Guntur → Campus Express',
      busNumber: 'AP-07-TA-101',
      startingPoint: 'Guntur Bus Station',
      stops: ['Guntur Bus Station', 'Market Center', 'Lodge Center', 'Autonagar', 'University Main Gate'],
      departureTime: '07:30 AM',
      arrivalTime: '08:20 AM',
      capacity: 40,
      occupiedSeats: 28,
      availableSeats: 12, // 40 - 28
      status: 'Seats Available',
      applicableFee: 29300,
      feeAcademicYear: '2026–27'
    },
    {
      routeId: 'R02',
      routeNumber: 'Route 02',
      routeName: 'Vijayawada → Campus Metro',
      busNumber: 'AP-07-TA-102',
      startingPoint: 'PNBS Vijayawada',
      stops: ['PNBS Vijayawada', 'Benz Circle', 'Kanuru Cross', 'Penamaluru', 'University South Gate'],
      departureTime: '07:15 AM',
      arrivalTime: '08:25 AM',
      capacity: 40,
      occupiedSeats: 36,
      availableSeats: 4, // Low seats
      status: 'Seats Available (Low)',
      applicableFee: 56400,
      feeAcademicYear: '2026–27'
    },
    {
      routeId: 'R03',
      routeNumber: 'Route 03',
      routeName: 'Tenali → Campus Shuttle',
      busNumber: 'AP-07-TA-103',
      startingPoint: 'Tenali Railway Station',
      stops: ['Tenali Station', 'Morrispet', 'Chenchupet', 'Duggirala Junction', 'University Main Gate'],
      departureTime: '07:20 AM',
      arrivalTime: '08:15 AM',
      capacity: 35,
      occupiedSeats: 35,
      availableSeats: 0, // FULL ROUTE
      status: 'Route Full',
      applicableFee: 22400,
      feeAcademicYear: '2026–27'
    },
    {
      routeId: 'R04',
      routeNumber: 'Route 04',
      routeName: 'Mangalagiri → Campus Transit',
      busNumber: 'AP-07-TA-104',
      startingPoint: 'Mangalagiri Bypass',
      stops: ['Mangalagiri Bypass', 'Old Bus Stand', 'NRI Hospital Circle', 'Kaza Toll', 'University Main Gate'],
      departureTime: '07:45 AM',
      arrivalTime: '08:20 AM',
      capacity: 30,
      occupiedSeats: 14,
      availableSeats: 16,
      status: 'Seats Available',
      applicableFee: 41400,
      feeAcademicYear: '2026–27'
    },
    {
      routeId: 'R05',
      routeNumber: 'Route 05',
      routeName: 'Amaravati → Campus Central',
      busNumber: 'AP-07-TA-105',
      startingPoint: 'Secretariat Amaravati',
      stops: ['Secretariat Amaravati', 'Rayapudi', 'Velagapudi', 'Mandadam', 'University North Gate'],
      departureTime: '07:30 AM',
      arrivalTime: '08:25 AM',
      capacity: 35,
      occupiedSeats: 20,
      availableSeats: 15,
      status: 'Seats Available',
      applicableFee: 39100,
      feeAcademicYear: '2026–27'
    }
  ];

  // 2. Five Student Accounts
  const demoStudents = [
    {
      id: '21BCE1001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@univ.edu',
      phone: '9876543210',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      password: 'password123',
      role: 'STUDENT',
      feeStatus: 'PAID'
    },
    {
      id: '22BCE1045',
      name: 'Sneha Patel',
      email: 'sneha.patel@univ.edu',
      phone: '9876543211',
      department: 'Information Technology',
      year: '2nd Year',
      password: 'password123',
      role: 'STUDENT',
      feeStatus: 'PAID'
    },
    {
      id: '23BME1089',
      name: 'Amit Verma',
      email: 'amit.verma@univ.edu',
      phone: '9876543212',
      department: 'Mechanical Engineering',
      year: '1st Year',
      password: 'password123',
      role: 'STUDENT',
      feeStatus: 'UNPAID'
    },
    {
      id: '21BEC1022',
      name: 'Priya Nair',
      email: 'priya.nair@univ.edu',
      phone: '9876543213',
      department: 'Electronics & Communication',
      year: '4th Year',
      password: 'password123',
      role: 'STUDENT',
      feeStatus: 'PAID'
    },
    {
      id: '22BCS1111',
      name: 'Vikram Singh',
      email: 'vikram.singh@univ.edu',
      phone: '9876543214',
      department: 'Computer Science',
      year: '2nd Year',
      password: 'password123',
      role: 'STUDENT',
      feeStatus: 'PAID'
    }
  ];

  // 3. Three Employee Accounts (Fee not required for employees)
  const demoEmployees = [
    {
      id: 'EMP201',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@univ.edu',
      phone: '9822334455',
      department: 'Computer Science & Engineering',
      password: 'password123',
      role: 'EMPLOYEE'
    },
    {
      id: 'EMP202',
      name: 'Prof. Ananya Roy',
      email: 'ananya.roy@univ.edu',
      phone: '9833445566',
      department: 'Physics & Applied Sciences',
      password: 'password123',
      role: 'EMPLOYEE'
    },
    {
      id: 'EMP203',
      name: 'Suresh Menon',
      email: 'suresh.menon@univ.edu',
      phone: '9844556677',
      department: 'University Administration',
      password: 'password123',
      role: 'EMPLOYEE'
    }
  ];

  // 4. One Admin Account
  const demoAdmin = {
    id: 'ADMIN01',
    name: 'Chief Transport Officer',
    email: 'transport.officer@univ.edu',
    phone: '9900112233',
    department: 'Central Transport Authority',
    password: 'admin',
    role: 'ADMIN'
  };

  // 5. Initial Applications (Demonstrating Approved, Pending, Rejected)
  const demoApplications = [
    {
      applicationId: 'APP2026-001',
      applicantId: '21BCE1001',
      applicantName: 'Rahul Sharma',
      applicantType: 'STUDENT',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      phone: '9876543210',
      email: 'rahul.sharma@univ.edu',
      routeId: 'R01',
      routeNumber: 'Route 01',
      routeName: 'Guntur → Campus Express',
      busNumber: 'AP-07-TA-101',
      boardingPoint: 'Market Center',
      paymentStatus: 'PAID',
      applicationDate: '2026-09-15',
      status: 'APPROVED',
      approvalDate: '2026-09-16',
      passId: 'SP-PASS-2026-001'
    },
    {
      applicationId: 'APP2026-002',
      applicantId: '22BCE1045',
      applicantName: 'Sneha Patel',
      applicantType: 'STUDENT',
      department: 'Information Technology',
      year: '2nd Year',
      phone: '9876543211',
      email: 'sneha.patel@univ.edu',
      routeId: 'R02',
      routeNumber: 'Route 02',
      routeName: 'Vijayawada → Campus Metro',
      busNumber: 'AP-07-TA-102',
      boardingPoint: 'Benz Circle',
      paymentStatus: 'PAID',
      applicationDate: '2026-10-02',
      status: 'PENDING',
      approvalDate: null,
      passId: null
    },
    {
      applicationId: 'APP2026-003',
      applicantId: '21BEC1022',
      applicantName: 'Priya Nair',
      applicantType: 'STUDENT',
      department: 'Electronics & Communication',
      year: '4th Year',
      phone: '9876543213',
      email: 'priya.nair@univ.edu',
      routeId: 'R03',
      routeNumber: 'Route 03',
      routeName: 'Tenali → Campus Shuttle',
      busNumber: 'AP-07-TA-103',
      boardingPoint: 'Chenchupet',
      paymentStatus: 'PAID',
      applicationDate: '2026-09-20',
      status: 'REJECTED',
      rejectionReason: 'Selected boarding point temporarily suspended due to highway remodeling.',
      approvalDate: null,
      passId: null
    },
    {
      applicationId: 'APP2026-004',
      applicantId: 'EMP201',
      applicantName: 'Dr. Rajesh Kumar',
      applicantType: 'EMPLOYEE',
      department: 'Computer Science & Engineering',
      year: 'Faculty',
      phone: '9822334455',
      email: 'rajesh.kumar@univ.edu',
      routeId: 'R01',
      routeNumber: 'Route 01',
      routeName: 'Guntur → Campus Express',
      busNumber: 'AP-07-TA-101',
      boardingPoint: 'Lodge Center',
      paymentStatus: 'EXEMPTED (STAFF)',
      applicationDate: '2026-09-10',
      status: 'APPROVED',
      approvalDate: '2026-09-11',
      passId: 'SP-PASS-2026-002'
    },
    {
      applicationId: 'APP2026-005',
      applicantId: 'EMP202',
      applicantName: 'Prof. Ananya Roy',
      applicantType: 'EMPLOYEE',
      department: 'Physics & Applied Sciences',
      year: 'Faculty',
      phone: '9833445566',
      email: 'ananya.roy@univ.edu',
      routeId: 'R04',
      routeNumber: 'Route 04',
      routeName: 'Mangalagiri → Campus Transit',
      busNumber: 'AP-07-TA-104',
      boardingPoint: 'Old Bus Stand',
      paymentStatus: 'EXEMPTED (STAFF)',
      applicationDate: '2026-10-05',
      status: 'PENDING',
      approvalDate: null,
      passId: null
    }
  ];

  // 6. Transport Fee Payments (Mapped to verified AY 2026–27 route fees)
  const demoPayments = [
    {
      paymentId: 'PAY-2026-001',
      studentId: '21BCE1001',
      studentName: 'Rahul Sharma',
      amount: 29300,
      academicYear: '2026–27',
      boardingPoint: 'Guntur (Market Center)',
      transactionId: 'SPTX202600123',
      paymentDate: '2026-09-14 10:30 AM',
      paymentMethod: 'Campus UPI / NetBanking',
      status: 'PAID'
    },
    {
      paymentId: 'PAY-2026-002',
      studentId: '22BCE1045',
      studentName: 'Sneha Patel',
      amount: 56400,
      academicYear: '2026–27',
      boardingPoint: 'Vijayawada (Benz Circle)',
      transactionId: 'SPTX202600188',
      paymentDate: '2026-10-01 02:15 PM',
      paymentMethod: 'Credit Card',
      status: 'PAID'
    },
    {
      paymentId: 'PAY-2026-003',
      studentId: '21BEC1022',
      studentName: 'Priya Nair',
      amount: 22400,
      academicYear: '2026–27',
      boardingPoint: 'Tenali (Chenchupet)',
      transactionId: 'SPTX202600142',
      paymentDate: '2026-09-19 11:45 AM',
      paymentMethod: 'Debit Card',
      status: 'PAID'
    },
    {
      paymentId: 'PAY-2026-004',
      studentId: '22BCS1111',
      studentName: 'Vikram Singh',
      amount: 29300,
      academicYear: '2026–27',
      boardingPoint: 'Guntur',
      transactionId: 'SPTX202600205',
      paymentDate: '2026-10-06 09:20 AM',
      paymentMethod: 'Campus UPI',
      status: 'PAID'
    }
    // Note: Amit Verma (23BME1089) is intentionally UNPAID for testing payment workflow.
  ];

  // 7. Initial Digital Passes
  const demoPasses = [
    {
      passId: 'SP-PASS-2026-001',
      applicationId: 'APP2026-001',
      applicantId: '21BCE1001',
      applicantName: 'Rahul Sharma',
      applicantType: 'STUDENT',
      department: 'Computer Science & Engineering',
      academicYear: '2026–27',
      routeId: 'R01',
      routeNumber: 'Route 01',
      routeName: 'Guntur → Campus Express',
      busNumber: 'AP-07-TA-101',
      boardingPoint: 'Market Center',
      validFrom: '2026-09-01',
      validUntil: '2027-06-30',
      status: 'ACTIVE',
      generatedDate: '2026-09-16'
    },
    {
      passId: 'SP-PASS-2026-002',
      applicationId: 'APP2026-004',
      applicantId: 'EMP201',
      applicantName: 'Dr. Rajesh Kumar',
      applicantType: 'EMPLOYEE',
      department: 'Computer Science & Engineering',
      academicYear: '2026–27',
      routeId: 'R01',
      routeNumber: 'Route 01',
      routeName: 'Guntur → Campus Express',
      busNumber: 'AP-07-TA-101',
      boardingPoint: 'Lodge Center',
      validFrom: '2026-09-01',
      validUntil: '2027-06-30',
      status: 'ACTIVE',
      generatedDate: '2026-09-11'
    }
  ];

  // 8. Notifications
  const demoNotifications = [
    {
      id: 'NOTIF-01',
      targetId: '21BCE1001',
      title: 'Bus Pass Approved',
      message: 'Your bus pass application APP2026-001 has been approved by the Transport Authority. Your digital pass is now ready to download.',
      type: 'success',
      timestamp: '2026-09-16 11:00 AM',
      read: false
    },
    {
      id: 'NOTIF-02',
      targetId: '22BCE1045',
      title: 'Application Under Review',
      message: 'Your bus pass application APP2026-002 has been received and is waiting for transport authority verification.',
      type: 'info',
      timestamp: '2026-10-02 02:30 PM',
      read: false
    },
    {
      id: 'NOTIF-03',
      targetId: 'ADMIN01',
      title: 'New Application Pending',
      message: 'Sneha Patel (22BCE1045) applied for Route 02 (Vijayawada → Campus). Seat availability is currently low (4 remaining).',
      type: 'warning',
      timestamp: '2026-10-02 02:30 PM',
      read: false
    },
    {
      id: 'NOTIF-04',
      targetId: 'ADMIN01',
      title: 'Route Full Alert',
      message: 'Route 03 (Tenali → Campus Shuttle) has reached maximum seat capacity (35/35).',
      type: 'danger',
      timestamp: '2026-10-04 09:15 AM',
      read: true
    }
  ];

  // Persist demo state
  saveData(STORAGE_KEYS.ROUTES, demoRoutes);
  saveData(STORAGE_KEYS.USERS_STUDENTS, demoStudents);
  saveData(STORAGE_KEYS.USERS_EMPLOYEES, demoEmployees);
  saveData(STORAGE_KEYS.ADMIN, demoAdmin);
  saveData(STORAGE_KEYS.APPLICATIONS, demoApplications);
  saveData(STORAGE_KEYS.PAYMENTS, demoPayments);
  saveData(STORAGE_KEYS.BUS_PASSES, demoPasses);
  saveData(STORAGE_KEYS.NOTIFICATIONS, demoNotifications);
  saveData(STORAGE_KEYS.FEE_SCHEDULE, OFFICIAL_FEE_SCHEDULE_2026_27);
  saveData(STORAGE_KEYS.INITIALIZED, true);

  console.log('✅ Zentra demo database initialized in localStorage.');
}

// Reset data helper for university evaluation
function resetDemoDatabase() {
  localStorage.clear();
  initializeDemoData(true);
  showToast('Demo database reset to initial university sample state.', 'success');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// ==========================================================================
// 3. SESSION & USER AUTHENTICATION HELPERS
// ==========================================================================

/**
 * Returns currently logged-in user or null
 * @returns {object|null}
 */
function getLoggedInUser() {
  return loadData(STORAGE_KEYS.CURRENT_USER, null);
}

/**
 * Sets current session user
 * @param {object} user 
 */
function setLoggedInUser(user) {
  saveData(STORAGE_KEYS.CURRENT_USER, user);
}

/**
 * Clears current session and redirects to login
 */
function logoutUser() {
  deleteData(STORAGE_KEYS.CURRENT_USER);
  showToast('You have been logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 600);
}

/**
 * Route protection guard for pages requiring specific user role
 * @param {string|string[]} allowedRoles 
 */
function protectPage(allowedRoles) {
  const user = getLoggedInUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user) {
    showToast('Please log in to access this page.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
    return false;
  }

  if (!roles.includes(user.role)) {
    showToast(`Access Denied: Only ${roles.join(' or ')} can view this page.`, 'error');
    setTimeout(() => {
      // Redirect to appropriate dashboard
      if (user.role === 'STUDENT') window.location.href = 'student-dashboard.html';
      else if (user.role === 'EMPLOYEE') window.location.href = 'employee-dashboard.html';
      else if (user.role === 'ADMIN') window.location.href = 'admin-dashboard.html';
      else window.location.href = 'index.html';
    }, 1000);
    return false;
  }

  return true;
}

// ==========================================================================
// 4. DYNAMIC NAVIGATION & HEADER INJECTION
// ==========================================================================

/**
 * Renders the top announcement/demo banner
 */
function renderDemoBanner() {
  const existing = document.querySelector('.demo-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.className = 'demo-banner';
  banner.innerHTML = `
    <div style="display:flex; align-items:center;">
      <span class="demo-banner-badge">Demo Mode</span>
      <span>JavaScript-Only University Prototype • Persistent LocalStorage</span>
    </div>
    <div class="demo-banner-actions">
      <span class="demo-banner-link" onclick="resetDemoDatabase()">Reset Sample Data</span>
    </div>
  `;
  document.body.prepend(banner);
}

/**
 * Injects or updates dynamic header navigation according to logged-in user state
 */
function renderNavigation() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const user = getLoggedInUser();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  let navLinksHtml = `
    <li><a href="index.html" class="nav-link ${currentPage === 'index.html' ? 'active' : ''}">Home</a></li>
    <li><a href="fee-structure.html" class="nav-link ${currentPage === 'fee-structure.html' ? 'active' : ''}">Bus Fees (2026–27)</a></li>
    <li><a href="routes.html" class="nav-link ${currentPage === 'routes.html' ? 'active' : ''}">Routes</a></li>
    <li><a href="index.html#how-it-works" class="nav-link">How It Works</a></li>
    <li><a href="index.html#about" class="nav-link">About</a></li>
    <li><a href="index.html#faq" class="nav-link">Help</a></li>
  `;

  let authAreaHtml = '';

  if (user) {
    // Determine dashboard URL
    let dashUrl = 'student-dashboard.html';
    if (user.role === 'EMPLOYEE') dashUrl = 'employee-dashboard.html';
    if (user.role === 'ADMIN') dashUrl = 'admin-dashboard.html';

    // Count unread notifications
    const allNotifs = loadData(STORAGE_KEYS.NOTIFICATIONS, []);
    const unreadCount = allNotifs.filter(n => (n.targetId === user.id || (user.role === 'ADMIN' && n.targetId === 'ADMIN01')) && !n.read).length;

    authAreaHtml = `
      <div class="user-menu">
        <a href="${dashUrl}" class="btn btn-outline btn-sm">
          <span>Dashboard</span>
        </a>
        <button class="notification-btn" id="notifBellBtn" onclick="toggleNotificationsDrawer()" title="View Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          ${unreadCount > 0 ? `<span class="badge-count">${unreadCount}</span>` : ''}
        </button>
        <div class="user-badge" title="${user.name} (${user.id})">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <span style="max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.name.split(' ')[0]}</span>
        </div>
        <button onclick="logoutUser()" class="btn btn-outline btn-sm" title="Log Out" style="color:var(--status-rejected); border-color:#fecaca;">
          Logout
        </button>
      </div>
    `;
  } else {
    authAreaHtml = `
      <div class="nav-auth">
        <a href="login.html" class="btn btn-outline btn-sm">Login</a>
        <a href="signup.html" class="btn btn-outline btn-sm">Sign Up</a>
        <a href="application.html" class="btn btn-primary btn-sm">Apply Now</a>
      </div>
    `;
  }

  header.innerHTML = `
    <div class="container container-wide">
      <div class="header-inner">
        <a href="index.html" class="logo-area">
          <div class="logo-icon">🚌</div>
          <div class="logo-text">
            <div class="logo-brand">ZEN<span>TRA</span></div>
            <div class="logo-sub">CAMPUS TRANSIT PORTAL</div>
          </div>
        </a>

        <button class="mobile-toggle" onclick="toggleMobileNav()" aria-label="Toggle Navigation">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <nav class="main-nav" id="mainNav">
          <ul class="nav-links">
            ${navLinksHtml}
          </ul>
          ${authAreaHtml}
        </nav>
      </div>
    </div>
  `;
}

/**
 * Mobile Navigation Toggle
 */
function toggleMobileNav() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('show');
}

/**
 * Injects Standard Footer
 */
function renderFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-title">ZEN<span>TRA</span></div>
          <p class="footer-brand-desc">
            “Your Campus Bus Pass, Simplified.”<br>
            Smart Bus Pass Management for Students & Employees with real-time seat tracking and instant digital passes.
          </p>
        </div>
        <div>
          <div class="footer-col-title">Navigation</div>
          <ul class="footer-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="fee-structure.html">Bus Fee Details (2026–27)</a></li>
            <li><a href="routes.html">Available Routes</a></li>
            <li><a href="application.html">Apply for Pass</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-col-title">Portals</div>
          <ul class="footer-links">
            <li><a href="login.html">Student Portal</a></li>
            <li><a href="login.html">Employee Portal</a></li>
            <li><a href="login.html">Transport Authority</a></li>
            <li><a href="signup.html">New Registration</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-col-title">Support & Legal</div>
          <ul class="footer-links">
            <li><a href="index.html#faq">Help & FAQs</a></li>
            <li><a href="index.html#contact">Contact Transport Desk</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms & Conditions</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© 2026 Zentra University Transport System. All rights reserved.</div>
        <div>Engineered with Vanilla JavaScript (ES6+) for University Evaluation.</div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 5. UI NOTIFICATIONS & TOAST SYSTEM
// ==========================================================================

let toastContainer = null;

/**
 * Displays a non-intrusive toast alert in top-right corner
 * @param {string} message 
 * @param {string} type 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 3500) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight:bold; font-size:1.1rem;">${iconMap[type] || '•'}</span>
    <span style="flex:1;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Toggles a slide-over notifications drawer
 */
function toggleNotificationsDrawer() {
  const user = getLoggedInUser();
  if (!user) return;

  let drawer = document.getElementById('notifDrawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'notifDrawer';
    drawer.className = 'modal-overlay';
    document.body.appendChild(drawer);
  }

  const allNotifs = loadData(STORAGE_KEYS.NOTIFICATIONS, []);
  const userNotifs = allNotifs.filter(n => n.targetId === user.id || (user.role === 'ADMIN' && n.targetId === 'ADMIN01'));

  drawer.innerHTML = `
    <div class="modal-card" style="max-width: 480px;">
      <div class="modal-header">
        <h3 class="modal-title">🔔 Notifications</h3>
        <button class="modal-close" onclick="closeNotificationsDrawer()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1rem;">
        ${userNotifs.length === 0 ? `
          <div style="text-align:center; padding:2rem; color:var(--text-muted);">
            No notifications available.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${userNotifs.map(n => `
              <div style="background:${n.read ? 'var(--bg-main)' : 'var(--bg-subtle)'}; border-left:4px solid ${n.type === 'success' ? 'var(--status-approved)' : n.type === 'danger' ? 'var(--status-rejected)' : 'var(--accent-blue)'}; padding:0.85rem; border-radius:var(--radius-sm); border-top:1px solid var(--border-color); border-right:1px solid var(--border-color); border-bottom:1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                  <strong style="font-size:0.88rem; color:var(--primary-navy);">${n.title}</strong>
                  <span style="font-size:0.72rem; color:var(--text-muted);">${n.timestamp}</span>
                </div>
                <div style="font-size:0.82rem; color:var(--text-secondary);">${n.message}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
      <div class="modal-footer" style="justify-content:space-between;">
        <button class="btn btn-outline btn-sm" onclick="markAllNotificationsAsRead()">Mark all as read</button>
        <button class="btn btn-primary btn-sm" onclick="closeNotificationsDrawer()">Close</button>
      </div>
    </div>
  `;

  drawer.classList.add('active');
}

function closeNotificationsDrawer() {
  const drawer = document.getElementById('notifDrawer');
  if (drawer) drawer.classList.remove('active');
}

function markAllNotificationsAsRead() {
  const user = getLoggedInUser();
  if (!user) return;

  updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => {
    return (notifs || []).map(n => {
      if (n.targetId === user.id || (user.role === 'ADMIN' && n.targetId === 'ADMIN01')) {
        return { ...n, read: true };
      }
      return n;
    });
  });

  renderNavigation();
  closeNotificationsDrawer();
  showToast('All notifications marked as read.', 'info');
}

// ==========================================================================
// 6. QR CODE GENERATOR (Pure Vanilla JS Canvas Algorithm)
// ==========================================================================

/**
 * Draws an authentic-looking QR code onto an HTML5 Canvas using pure JavaScript
 * Suitable for university prototype evaluation without external libraries.
 * @param {HTMLCanvasElement} canvas 
 * @param {string} payloadText 
 */
function renderPassQRCode(canvas, payloadText) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width || 120;
  canvas.width = size;
  canvas.height = size;

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Generate deterministic pseudo-random matrix based on payload hash
  const gridSize = 21; // Standard QR matrix dimensions
  const cellSize = size / gridSize;

  // Simple string hash function
  let hash = 0;
  for (let i = 0; i < payloadText.length; i++) {
    hash = ((hash << 5) - hash) + payloadText.charCodeAt(i);
    hash |= 0;
  }

  // Helper to draw corner finder patterns
  function drawFinderPattern(startX, startY) {
    ctx.fillStyle = '#0b192c';
    ctx.fillRect(startX * cellSize, startY * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#0b192c';
    ctx.fillRect((startX + 2) * cellSize, (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  // Draw 3 corner finder patterns
  drawFinderPattern(0, 0); // Top-left
  drawFinderPattern(gridSize - 7, 0); // Top-right
  drawFinderPattern(0, gridSize - 7); // Bottom-left

  // Draw timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = '#0b192c';
      ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
      ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
    }
  }

  // Fill data cells using deterministic hash sequence
  ctx.fillStyle = '#0b192c';
  let seed = Math.abs(hash);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder pattern zones
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= gridSize - 8;
      const isBottomLeft = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming) {
        // Linear congruential pseudorandom check
        seed = (seed * 9301 + 49297) % 233280;
        if ((seed / 233280) > 0.48) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }
  }
}

// ==========================================================================
// 7. INITIALIZE ON DOM READY
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeDemoData();
  renderDemoBanner();
  renderNavigation();
  renderFooter();
});
