// === Firebase Configuration and Initialization ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSw3t0Picp9CrK0CsB_FXeSC7wHuZQbMw",
  authDomain: "carlix-7fbcb.firebaseapp.com",
  projectId: "carlix-7fbcb",
  storageBucket: "carlix-7fbcb.firebasestorage.app",
  messagingSenderId: "679556059179",
  appId: "1:679556059179:web:1893b4b1063e87dd789a6e",
  measurementId: "G-TMKR8YLFR4"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === Utility Functions for Setting Fields and Parsing Names ===
function setPdsField(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    if (value && value.trim() !== '') {
      element.textContent = value;
      element.classList.remove('empty');
    } else {
      element.textContent = '';
      element.classList.add('empty');
    }
  }
}

function setPdsRadio(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) {
    radio.checked = true;
  }
}

function setPdsCheckbox(name, value) {
  const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (checkbox) {
    checkbox.checked = true;
  }
}

function parseName(fullName) {
  if (!fullName) return { surname: '', firstName: '', middleName: '' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { surname: parts[0], firstName: '', middleName: '' };
  } else if (parts.length === 2) {
    return { surname: parts[0], firstName: parts[1], middleName: '' };
  } else {
    return { 
      surname: parts[0], 
      firstName: parts[1], 
      middleName: parts.slice(2).join(' ') 
    };
  }
}

// === Load PDS Data for Dashboard ===
function loadPdsData() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const data = userDoc.exists() ? userDoc.data() : {};
      
      // Personal Information
      setPdsField('pdsSurname', data.surname || '');
      setPdsField('pdsFirstName', data.firstName || '');
      setPdsField('pdsMiddleName', data.middleName || '');
      setPdsField('pdsNameExtension', data.nameExtension || '');
      
      const birthDate = data.dateOfBirth || data.birthdate || data.dob || '';
      setPdsField('pdsBirthDate', birthDate);
      setPdsField('pdsBirthPlace', data.birthPlace || '');
      
      if (data.gender) {
        setPdsRadio('sex', data.gender);
      }
      
      // Fix Civil Status fetch
      if (data.civilStatus) {
        setPdsCheckbox('civilStatus', data.civilStatus);
        if (data.civilStatus === 'Others') {
          setPdsField('pdsCivilStatusOthers', data.civilStatusOthers || '');
        }
      } else if (data.civilStatusOthers) {
        setPdsField('pdsCivilStatusOthers', data.civilStatusOthers);
      }
      
      setPdsField('pdsCitizenship', data.nationality || '');
      setPdsField('pdsHeight', data.height || '');
      setPdsField('pdsWeight', data.weight || '');
      setPdsField('pdsBloodType', data.bloodType || '');
      setPdsField('pdsGsisId', data.gsisId || '');
      setPdsField('pdsPagibigId', data.pagibigId || '');
      setPdsField('pdsPhilhealthNo', data.philhealthNo || '');
      setPdsField('pdsSssNo', data.sssNo || '');
      setPdsField('pdsResidentialAddress', data.address || '');
      setPdsField('pdsResidentialZip', data.residentialZip || '');
      setPdsField('pdsResidentialPhone', data.contactNumber || '');
      setPdsField('pdsPermanentAddress', data.permanentAddress || data.address || '');
      setPdsField('pdsPermanentZip', data.permanentZip || '');
      setPdsField('pdsPermanentPhone', data.permanentPhone || '');
      setPdsField('pdsEmail', data.email || user.email || '');
      setPdsField('pdsCellphone', data.cellphone || '');
      setPdsField('pdsAgencyEmployeeNo', data.agencyEmployeeNo || '');
      setPdsField('pdsTin', data.tin || '');
      
      // Family Background
      // Fix Spouse Name fetch
      let spouseName = data.spouseName || '';
      if (!spouseName && data.spouseSurname && data.spouseFirstName) {
        spouseName = `${data.spouseSurname} ${data.spouseFirstName} ${data.spouseMiddleName || ''}`.trim();
      }
      const spouseParts = parseName(spouseName);
      setPdsField('pdsSpouseSurname', spouseParts.surname);
      setPdsField('pdsSpouseFirstName', spouseParts.firstName);
      setPdsField('pdsSpouseMiddleName', spouseParts.middleName);
      setPdsField('pdsSpouseOccupation', data.spouseOccupation || '');
      setPdsField('pdsSpouseEmployer', data.spouseEmployer || '');
      setPdsField('pdsSpouseBusinessAddress', data.spouseBusinessAddress || '');
      setPdsField('pdsSpousePhone', data.spousePhone || '');
      
      // Children
      if (data.children && Array.isArray(data.children) && data.children.length > 0) {
        const childrenRows = document.getElementById('pdsChildrenRows');
        childrenRows.innerHTML = '';
        data.children.forEach(child => {
          const row = document.createElement('div');
          row.className = 'pds-child-row';
          row.innerHTML = `
            <div class="pds-child-name">${child.name || ''}</div>
            <div class="pds-child-date">${child.birthDate || ''}</div>
          `;
          childrenRows.appendChild(row);
        });
      }
      
      // Parents
      // Fix Father's Name fetch
      let fatherName = data.fatherName || '';
      if (!fatherName && data.fatherSurname && data.fatherFirstName) {
        fatherName = `${data.fatherSurname} ${data.fatherFirstName} ${data.fatherMiddleName || ''}`.trim();
      }
      const fatherParts = parseName(fatherName);
      setPdsField('pdsFatherSurname', fatherParts.surname);
      setPdsField('pdsFatherFirstName', fatherParts.firstName);
      setPdsField('pdsFatherMiddleName', fatherParts.middleName);
      
      // Fix Mother's Name fetch
      let motherName = data.motherName || '';
      if (!motherName && data.motherSurname && data.motherFirstName) {
        motherName = `${data.motherSurname} ${data.motherFirstName} ${data.motherMiddleName || ''}`.trim();
      }
      const motherParts = parseName(motherName);
      setPdsField('pdsMotherSurname', motherParts.surname);
      setPdsField('pdsMotherFirstName', motherParts.firstName);
      setPdsField('pdsMotherMiddleName', motherParts.middleName);
      
      // Educational Background
      setPdsField('pdsElemSchool', (data.education?.elementary?.school) || data.elemSchool || '');
      setPdsField('pdsElemDegree', (data.education?.elementary?.degree) || '');
      setPdsField('pdsElemYear', (data.education?.elementary?.year) || data.elemYear || '');
      setPdsField('pdsElemGrade', (data.education?.elementary?.grade) || '');
      setPdsField('pdsElemFrom', (data.education?.elementary?.from) || '');
      setPdsField('pdsElemTo', (data.education?.elementary?.to) || '');
      setPdsField('pdsElemHonors', (data.education?.elementary?.honors) || data.elemHonors || '');
      
      setPdsField('pdsSecSchool', (data.education?.secondary?.school) || data.secSchool || '');
      setPdsField('pdsSecDegree', (data.education?.secondary?.degree) || '');
      setPdsField('pdsSecYear', (data.education?.secondary?.year) || data.secYear || '');
      setPdsField('pdsSecGrade', (data.education?.secondary?.grade) || '');
      setPdsField('pdsSecFrom', (data.education?.secondary?.from) || '');
      setPdsField('pdsSecTo', (data.education?.secondary?.to) || '');
      setPdsField('pdsSecHonors', (data.education?.secondary?.honors) || data.secHonors || '');
      
      setPdsField('pdsVocSchool', (data.education?.vocational?.school) || '');
      setPdsField('pdsVocDegree', (data.education?.vocational?.degree) || '');
      setPdsField('pdsVocYear', (data.education?.vocational?.year) || '');
      setPdsField('pdsVocGrade', (data.education?.vocational?.grade) || '');
      setPdsField('pdsVocFrom', (data.education?.vocational?.from) || '');
      setPdsField('pdsVocTo', (data.education?.vocational?.to) || '');
      setPdsField('pdsVocHonors', (data.education?.vocational?.honors) || '');
      
      setPdsField('pdsColSchool', (data.education?.tertiary?.school) || data.terSchool || '');
      setPdsField('pdsColDegree', (data.education?.tertiary?.degree) || '');
      setPdsField('pdsColYear', (data.education?.tertiary?.year) || data.terYear || '');
      setPdsField('pdsColGrade', (data.education?.tertiary?.grade) || '');
      setPdsField('pdsColFrom', (data.education?.tertiary?.from) || '');
      setPdsField('pdsColTo', (data.education?.tertiary?.to) || '');
      setPdsField('pdsColHonors', (data.education?.tertiary?.honors) || data.terHonors || '');
      
      // Additional Personal Information
      setPdsField('pdsReligion', data.religion || '');
      
      // Career Objective
      setPdsField('pdsObjective', data.objective || '');
      
      // Skills
      const skillsList = document.getElementById('pdsSkillsList');
      if (skillsList && data.skills && Array.isArray(data.skills)) {
        skillsList.innerHTML = '';
        data.skills.forEach(skill => {
          if (skill && skill.trim() !== '') {
            const item = document.createElement('div');
            item.className = 'pds-list-item';
            item.textContent = skill;
            skillsList.appendChild(item);
          }
        });
      }
      
      // Work Experience
      const workRows = document.getElementById('pdsWorkRows');
      if (workRows && data.workExperience && Array.isArray(data.workExperience)) {
        workRows.innerHTML = '';
        data.workExperience.forEach(exp => {
          if (exp.position || exp.company || exp.dates || exp.highlights) {
            const row = document.createElement('div');
            row.className = 'pds-work-row';
            row.innerHTML = `
              <div class="pds-work-position">${exp.position || ''}</div>
              <div class="pds-work-company">${exp.company || ''}</div>
              <div class="pds-work-dates">${exp.dates || ''}</div>
              <div class="pds-work-highlights">${exp.highlights || ''}</div>
            `;
            workRows.appendChild(row);
          }
        });
      }
      
      // Strengths
      const strengthsList = document.getElementById('pdsStrengthsList');
      if (strengthsList && data.strengths && Array.isArray(data.strengths)) {
        strengthsList.innerHTML = '';
        data.strengths.forEach(strength => {
          if (strength && strength.trim() !== '') {
            const item = document.createElement('div');
            item.className = 'pds-list-item';
            item.textContent = strength;
            strengthsList.appendChild(item);
          }
        });
      }
      
      // Weaknesses
      const weaknessesList = document.getElementById('pdsWeaknessesList');
      if (weaknessesList && data.weaknesses && Array.isArray(data.weaknesses)) {
        weaknessesList.innerHTML = '';
        data.weaknesses.forEach(weakness => {
          if (weakness && weakness.trim() !== '') {
            const item = document.createElement('div');
            item.className = 'pds-list-item';
            item.textContent = weakness;
            weaknessesList.appendChild(item);
          }
        });
      }
      
      // Profile Photo and Info
      const profilePhoto = document.getElementById('pdsProfilePhoto');
      const photoPlaceholder = document.getElementById('pdsPhotoPlaceholder');
      const profileName = document.getElementById('pdsProfileName');
      const profileEmail = document.getElementById('pdsProfileEmail');
      
      if (data.profilePicUrl && profilePhoto && photoPlaceholder) {
        profilePhoto.src = data.profilePicUrl;
        profilePhoto.style.display = 'block';
        photoPlaceholder.style.display = 'none';
      }
      
      // Set profile name and email
      if (profileName) {
        profileName.textContent = data.surname || data.firstName || 'No Name Available';
      }
      if (profileEmail) {
        profileEmail.textContent = data.email || user.email || 'No Email Available';
      }
      
    } catch (err) {
      console.error('Error loading PDS data:', err);
    }
  });
}

// === DOMContentLoaded: Page Initialization and Event Listeners ===
document.addEventListener('DOMContentLoaded', function() {
  // === Login and Registration Page Logic ===
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');
  
  if (loginForm || registerForm) {
    // Toggle between login and register forms
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      });
    }
    
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
      });
    }
    
    // === Login Form Submission ===
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginError = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        // Reset error message
        loginError.textContent = '';
        loginError.classList.add('hidden');
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
          await signInWithEmailAndPassword(auth, email, password);
          // Redirect to dashboard on successful login
          window.location.href = 'dashboard.html';
        } catch (error) {
          console.error('Login error:', error);
          loginError.textContent = error.message || 'Login failed. Please try again.';
          loginError.classList.remove('hidden');
          
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
        }
      });
    }
    
    // === Registration Form Submission ===
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const birthdate = document.getElementById('birthdate').value;
        const age = document.getElementById('age').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const repeatPassword = document.getElementById('repeatPassword').value;
        const registerError = document.getElementById('registerError');
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        
        // Reset error message
        registerError.textContent = '';
        registerError.classList.add('hidden');
        
        // Validate passwords match
        if (password !== repeatPassword) {
          registerError.textContent = 'Passwords do not match.';
          registerError.classList.remove('hidden');
          return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        try {
          // Create user account
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Save user data to Firestore
          await setDoc(doc(db, 'users', user.uid), {
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`,
            birthdate: birthdate,
            age: age,
            email: email,
            createdAt: new Date()
          });
          
          // Redirect to dashboard on successful registration
          window.location.href = 'dashboard.html';
        } catch (error) {
          console.error('Registration error:', error);
          registerError.textContent = error.message || 'Registration failed. Please try again.';
          registerError.classList.remove('hidden');
          
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Register';
        }
      });
      
      // === Auto-calculate Age on Birthdate Change ===
      const birthdateInput = document.getElementById('birthdate');
      const ageInput = document.getElementById('age');
      
      if (birthdateInput && ageInput) {
        birthdateInput.addEventListener('change', () => {
          if (birthdateInput.value) {
            const today = new Date();
            const birth = new Date(birthdateInput.value);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            ageInput.value = age > 0 ? age : '';
          }
        });
      }
    }
  } else {
    // === Dashboard Page Logic ===
    loadPdsData();
    
    // === Side Panel and Navigation Functionality ===
    const burgerBtn = document.getElementById('burgerBtn');
    const navBar = document.getElementById('navBar');
    const printPdsBtn = document.getElementById('printPdsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Burger menu toggle
    if (burgerBtn && navBar) {
      burgerBtn.addEventListener('click', () => {
        navBar.classList.toggle('mobile-visible');
      });
    }
    
    // Print PDS functionality
    if (printPdsBtn) {
      printPdsBtn.addEventListener('click', () => {
        // Show all dashboard pages before printing
        const page1 = document.getElementById('pdsPage1');
        const page2 = document.getElementById('pdsPage2');
        const nextBtn = document.getElementById('nextPageBtn');
        const prevBtn = document.getElementById('prevPageBtn');
        // Save current state
        const page1Display = page1 ? page1.style.display : '';
        const page2Display = page2 ? page2.style.display : '';
        const nextBtnDisplay = nextBtn ? nextBtn.style.display : '';
        const prevBtnDisplay = prevBtn ? prevBtn.style.display : '';
        // Show all
        if (page1) page1.style.display = 'block';
        if (page2) page2.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        // Print, then restore
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            if (page1) page1.style.display = page1Display;
            if (page2) page2.style.display = page2Display;
            if (nextBtn) nextBtn.style.display = nextBtnDisplay;
            if (prevBtn) prevBtn.style.display = prevBtnDisplay;
          }, 500);
        }, 100);
      });
    }
    
    // === Logout Functionality ===
    if (logoutBtn) {
      let isLoggingOut = false; // Flag to prevent multiple logout attempts
      logoutBtn.addEventListener('click', async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        isLoggingOut = true;
        logoutBtn.textContent = 'Logging out...';
        logoutBtn.disabled = true;
        
        try {
          await auth.signOut();
          // Clear any stored data
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = 'index.html';
        } catch (error) {
          console.error('Logout error:', error);
          // Reset button state if logout fails
          isLoggingOut = false;
          logoutBtn.textContent = '🚪 Logout';
          logoutBtn.disabled = false;
        }
      });
    }
  }
});