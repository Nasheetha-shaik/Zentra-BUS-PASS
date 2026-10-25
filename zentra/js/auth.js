/**
 * ZENTRA - Authentication & Signup Engine
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - Multi-role Login (Student, Employee, Admin)
 * - Registration with comprehensive validation:
 *   - Duplicate Registration ID check
 *   - Duplicate Employee ID check
 *   - Duplicate Email check
 *   - Format validation (Email, Phone, Password Match)
 * - Session state handling with localStorage
 * - Quick Demo Credentials autofill helpers for university evaluation
 */

// ==========================================================================
// 1. LOGIN SYSTEM
// ==========================================================================

let activeLoginRole = 'STUDENT'; // default

/**
 * Switch role tab on Login page
 * @param {'STUDENT'|'EMPLOYEE'|'ADMIN'} role 
 */
function setLoginRole(role) {
  activeLoginRole = role;

  // Update tabs UI
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.role === role);
  });

  // Update field labels & placeholders
  const idLabel = document.getElementById('loginIdLabel');
  const idInput = document.getElementById('loginId');
  const demoPills = document.getElementById('demoPillsArea');

  if (role === 'STUDENT') {
    if (idLabel) idLabel.textContent = 'Registration ID';
    if (idInput) {
      idInput.placeholder = 'e.g. 21BCE1001';
      idInput.value = '';
    }
  } else if (role === 'EMPLOYEE') {
    if (idLabel) idLabel.textContent = 'Employee ID';
    if (idInput) {
      idInput.placeholder = 'e.g. EMP201';
      idInput.value = '';
    }
  } else if (role === 'ADMIN') {
    if (idLabel) idLabel.textContent = 'Admin ID';
    if (idInput) {
      idInput.placeholder = 'e.g. ADMIN01';
      idInput.value = '';
    }
  }

  // Clear errors
  clearAuthErrors();
}

/**
 * Fast autofill helper for university project demonstrations
 */
function autofillDemoAccount(role, id, pwd) {
  setLoginRole(role);
  const idInput = document.getElementById('loginId');
  const pwdInput = document.getElementById('loginPassword');
  if (idInput) idInput.value = id;
  if (pwdInput) pwdInput.value = pwd;
}

/**
 * Handle Login Form Submit
 * @param {Event} event 
 */
function handleLoginSubmit(event) {
  event.preventDefault();
  clearAuthErrors();

  const idInput = document.getElementById('loginId');
  const pwdInput = document.getElementById('loginPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const enteredId = idInput ? idInput.value.trim() : '';
  const enteredPassword = pwdInput ? pwdInput.value : '';

  if (!enteredId) {
    showFieldError('loginId', 'Please enter your ID.');
    return;
  }
  if (!enteredPassword) {
    showFieldError('loginPassword', 'Please enter your password.');
    return;
  }

  // Visual loading simulation
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Verifying credentials...';
  }

  setTimeout(() => {
    let matchedUser = null;

    if (activeLoginRole === 'STUDENT') {
      const students = loadData(STORAGE_KEYS.USERS_STUDENTS, []);
      matchedUser = students.find(s => s.id.toUpperCase() === enteredId.toUpperCase() && s.password === enteredPassword);
    } else if (activeLoginRole === 'EMPLOYEE') {
      const employees = loadData(STORAGE_KEYS.USERS_EMPLOYEES, []);
      matchedUser = employees.find(e => e.id.toUpperCase() === enteredId.toUpperCase() && e.password === enteredPassword);
    } else if (activeLoginRole === 'ADMIN') {
      const admin = loadData(STORAGE_KEYS.ADMIN, null);
      if (admin && admin.id.toUpperCase() === enteredId.toUpperCase() && admin.password === enteredPassword) {
        matchedUser = admin;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }

    if (!matchedUser) {
      showFieldError('loginPassword', 'Invalid credentials. Please verify your ID and password.');
      showToast('Login failed: Invalid ID or password.', 'error');
      return;
    }

    // Success: store session
    setLoggedInUser(matchedUser);
    showToast(`Welcome back, ${matchedUser.name}!`, 'success');

    // Route to appropriate dashboard
    setTimeout(() => {
      if (matchedUser.role === 'STUDENT') {
        window.location.href = 'student-dashboard.html';
      } else if (matchedUser.role === 'EMPLOYEE') {
        window.location.href = 'employee-dashboard.html';
      } else if (matchedUser.role === 'ADMIN') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 700);

  }, 450); // slight async animation delay
}

// ==========================================================================
// 2. SIGNUP SYSTEM & VALIDATION
// ==========================================================================

let activeSignupType = 'STUDENT';

/**
 * Switch signup form between Student and Employee
 * @param {'STUDENT'|'EMPLOYEE'} type 
 */
function setSignupType(type) {
  activeSignupType = type;
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.role === type);
  });

  const studentFields = document.getElementById('studentOnlyFields');
  const empFields = document.getElementById('employeeOnlyFields');
  const idLabel = document.getElementById('signupIdLabel');
  const idInput = document.getElementById('signupId');

  if (type === 'STUDENT') {
    if (studentFields) studentFields.style.display = 'block';
    if (empFields) empFields.style.display = 'none';
    if (idLabel) idLabel.textContent = 'Registration ID *';
    if (idInput) idInput.placeholder = 'e.g. 24BCE1999';
  } else {
    if (studentFields) studentFields.style.display = 'none';
    if (empFields) empFields.style.display = 'block';
    if (idLabel) idLabel.textContent = 'Employee ID *';
    if (idInput) idInput.placeholder = 'e.g. EMP299';
  }

  clearAuthErrors();
}

/**
 * Validates signup fields and persists new user
 * @param {Event} event 
 */
function handleSignupSubmit(event) {
  event.preventDefault();
  clearAuthErrors();

  const nameInput = document.getElementById('signupName');
  const idInput = document.getElementById('signupId');
  const emailInput = document.getElementById('signupEmail');
  const phoneInput = document.getElementById('signupPhone');
  const deptInput = document.getElementById('signupDepartment');
  const yearInput = document.getElementById('signupYear');
  const pwdInput = document.getElementById('signupPassword');
  const confirmPwdInput = document.getElementById('signupConfirmPassword');
  const submitBtn = document.getElementById('signupSubmitBtn');

  const name = nameInput ? nameInput.value.trim() : '';
  const id = idInput ? idInput.value.trim().toUpperCase() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const department = deptInput ? deptInput.value.trim() : '';
  const year = yearInput ? yearInput.value.trim() : '';
  const password = pwdInput ? pwdInput.value : '';
  const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';

  let hasError = false;

  // 1. Required fields
  if (!name) {
    showFieldError('signupName', 'Full name is required.');
    hasError = true;
  }
  if (!id) {
    showFieldError('signupId', 'ID is required.');
    hasError = true;
  }
  if (!email) {
    showFieldError('signupEmail', 'Email is required.');
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError('signupEmail', 'Please enter a valid email address (e.g. name@univ.edu).');
    hasError = true;
  }
  if (!phone) {
    showFieldError('signupPhone', 'Contact phone number is required.');
    hasError = true;
  } else if (!/^\d{10}$/.test(phone)) {
    showFieldError('signupPhone', 'Please enter a valid 10-digit phone number.');
    hasError = true;
  }
  if (!department) {
    showFieldError('signupDepartment', 'Department selection is required.');
    hasError = true;
  }
  if (activeSignupType === 'STUDENT' && !year) {
    showFieldError('signupYear', 'Academic year selection is required.');
    hasError = true;
  }

  // 2. Password rules
  if (!password) {
    showFieldError('signupPassword', 'Password is required.');
    hasError = true;
  } else if (password.length < 6) {
    showFieldError('signupPassword', 'Password must be at least 6 characters long.');
    hasError = true;
  }

  if (password !== confirmPassword) {
    showFieldError('signupConfirmPassword', 'Passwords do not match.');
    hasError = true;
  }

  // 3. Uniqueness checks in localStorage
  if (!hasError) {
    if (activeSignupType === 'STUDENT') {
      const students = loadData(STORAGE_KEYS.USERS_STUDENTS, []);
      if (students.some(s => s.id.toUpperCase() === id)) {
        showFieldError('signupId', 'This Registration ID is already registered.');
        hasError = true;
      }
      if (students.some(s => s.email.toLowerCase() === email)) {
        showFieldError('signupEmail', 'This email is already in use by another student account.');
        hasError = true;
      }
    } else {
      const employees = loadData(STORAGE_KEYS.USERS_EMPLOYEES, []);
      if (employees.some(e => e.id.toUpperCase() === id)) {
        showFieldError('signupId', 'This Employee ID is already registered.');
        hasError = true;
      }
      if (employees.some(e => e.email.toLowerCase() === email)) {
        showFieldError('signupEmail', 'This email is already in use by another employee account.');
        hasError = true;
      }
    }
  }

  if (hasError) return;

  // Process registration
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Creating account...';
  }

  setTimeout(() => {
    if (activeSignupType === 'STUDENT') {
      const newStudent = {
        id,
        name,
        email,
        phone,
        department,
        year,
        password,
        role: 'STUDENT',
        feeStatus: 'UNPAID' // New students start unpaid
      };
      const students = loadData(STORAGE_KEYS.USERS_STUDENTS, []);
      students.push(newStudent);
      saveData(STORAGE_KEYS.USERS_STUDENTS, students);

      // Auto login
      setLoggedInUser(newStudent);
      showToast('Registration successful! Welcome to Zentra.', 'success');
      setTimeout(() => {
        window.location.href = 'student-dashboard.html';
      }, 700);
    } else {
      const newEmployee = {
        id,
        name,
        email,
        phone,
        department,
        password,
        role: 'EMPLOYEE'
      };
      const employees = loadData(STORAGE_KEYS.USERS_EMPLOYEES, []);
      employees.push(newEmployee);
      saveData(STORAGE_KEYS.USERS_EMPLOYEES, employees);

      // Auto login
      setLoggedInUser(newEmployee);
      showToast('Registration successful! Welcome to Zentra.', 'success');
      setTimeout(() => {
        window.location.href = 'employee-dashboard.html';
      }, 700);
    }
  }, 400);
}

// ==========================================================================
// 3. VALIDATION UTILITY HELPERS
// ==========================================================================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const errorEl = document.getElementById(`${inputId}Error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  input.style.borderColor = 'var(--status-rejected)';
}

function clearAuthErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
  document.querySelectorAll('.form-control').forEach(el => {
    el.style.borderColor = 'var(--border-color)';
  });
}
