import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, updateDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase configuration
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

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = 'dzvojulwb'; // <-- updated cloud name
const CLOUDINARY_UNSIGNED_PRESET = 'charlix';

// Cloudinary upload helper (from old code)
async function uploadProfilePic(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UNSIGNED_PRESET);
    // Debug log for Cloudinary config and URL
    console.log('Cloudinary Debug:', {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_UNSIGNED_PRESET,
        uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`
    });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error('Profile picture upload failed.');
    }
}

// Helper functions
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}
function hideError(element) {
    element.textContent = '';
    element.classList.add('hidden');
}
function toggleForms(showRegister) {
    document.getElementById('loginForm').classList.toggle('hidden', showRegister);
    document.getElementById('registerForm').classList.toggle('hidden', !showRegister);
}

// Custom popup modal logic
function showCustomPopup(message, options = {}) {
    const popup = document.getElementById('customPopup');
    const msgSpan = document.getElementById('customPopupMsg');
    const okBtn = document.getElementById('customPopupOkBtn');
    if (!popup || !msgSpan || !okBtn) return;
    msgSpan.textContent = message;
    popup.classList.add('active');
    // Remove any previous listeners
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    // If options.confirm, show two buttons
    if (options.confirm) {
        // Create Cancel and Yes buttons
        newOkBtn.style.display = 'none';
        let cancelBtn = document.getElementById('customPopupCancelBtn');
        let yesBtn = document.getElementById('customPopupYesBtn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.id = 'customPopupCancelBtn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.marginRight = '1rem';
            cancelBtn.className = 'cancel-btn';
            newOkBtn.parentNode.appendChild(cancelBtn);
        }
        if (!yesBtn) {
            yesBtn = document.createElement('button');
            yesBtn.id = 'customPopupYesBtn';
            yesBtn.textContent = options.confirmText || 'Yes';
            yesBtn.className = 'delete-btn';
            newOkBtn.parentNode.appendChild(yesBtn);
        }
        cancelBtn.onclick = () => {
            popup.classList.remove('active');
            cancelBtn.remove();
            yesBtn.remove();
            newOkBtn.style.display = '';
        };
        yesBtn.onclick = () => {
            popup.classList.remove('active');
            cancelBtn.remove();
            yesBtn.remove();
            newOkBtn.style.display = '';
            if (typeof options.onConfirm === 'function') options.onConfirm();
        };
    } else {
        newOkBtn.style.display = '';
        // Remove confirm/cancel if present
        const cancelBtn = document.getElementById('customPopupCancelBtn');
        const yesBtn = document.getElementById('customPopupYesBtn');
        if (cancelBtn) cancelBtn.remove();
        if (yesBtn) yesBtn.remove();
        newOkBtn.addEventListener('click', () => {
            popup.classList.remove('active');
        });
        // Auto-close after 2.5s
        setTimeout(() => {
            popup.classList.remove('active');
        }, 2500);
    }
}

// --- LOGIN & REGISTRATION PAGE LOGIC ---
if (document.getElementById('loginForm') && document.getElementById('registerForm')) {
    // Toggle between forms
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => toggleForms(true));
    if (showLoginBtn) showLoginBtn.addEventListener('click', () => toggleForms(false));

    // Profile picture preview
    const profilePicInput = document.getElementById('profilePic');
    const profilePicPreview = document.getElementById('profilePicPreview');
    if (profilePicInput && profilePicPreview) {
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    profilePicPreview.src = ev.target.result;
                    profilePicPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                profilePicPreview.src = '';
                profilePicPreview.style.display = 'none';
            }
        });
    }

    // Auto-calculate age from birthdate in registration
    const birthdateInput = document.getElementById('birthdate');
    const ageInput = document.getElementById('age');
    if (birthdateInput && ageInput) {
        birthdateInput.addEventListener('change', () => {
            const val = birthdateInput.value;
            if (!val) {
                ageInput.value = '';
                return;
            }
            const today = new Date();
            const birth = new Date(val);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            ageInput.value = age > 0 ? age : '';
        });
    }

    // Registration logic
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const age = document.getElementById('age').value.trim();
            const birthdate = document.getElementById('birthdate').value;
            // const schoolId = document.getElementById('schoolId').value.trim(); // removed
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;
            const repeatPassword = document.getElementById('repeatPassword').value;
            const errorDiv = document.getElementById('registerError');
            hideError(errorDiv);

            // Validation
            const nameRegex = /^[A-Za-z\s'-]+$/;
            if (!firstName || !lastName || !age || !birthdate || !email || !password || !repeatPassword) {
                showError(errorDiv, 'All fields are required.');
                return;
            }
            if (!nameRegex.test(firstName)) {
                showError(errorDiv, 'First name can only contain letters, spaces, hyphens, and apostrophes.');
                return;
            }
            if (!nameRegex.test(lastName)) {
                showError(errorDiv, 'Last name can only contain letters, spaces, hyphens, and apostrophes.');
                return;
            }
            if (!email.includes('@')) {
                showError(errorDiv, 'Email must be a valid email address.');
                return;
            }
            if (password.length < 6) {
                showError(errorDiv, 'Password must be at least 6 characters.');
                return;
            }
            if (password !== repeatPassword) {
                showError(errorDiv, 'Passwords do not match.');
                return;
            }
            // Prevent duplicate email
            try {
                const q = query(collection(db, 'users'), where('email', '==', email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    showError(errorDiv, 'Email is already registered.');
                    return;
                }
            } catch (err) {
                showError(errorDiv, 'Error checking email.');
                return;
            }

            // Handle profile picture upload
            let profilePicUrl = '';
            if (profilePicInput && profilePicInput.files && profilePicInput.files[0]) {
                try {
                    profilePicUrl = await uploadProfilePic(profilePicInput.files[0]);
                } catch (err) {
                    showError(errorDiv, err.message);
                    return;
                }
            }

            // Register with Firebase Auth
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Store extra info in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    firstName,
                    lastName,
                    age: Number(age),
                    birthdate,
                    email,
                    profilePicUrl,
                    createdAt: new Date().toISOString()
                });
                alert('Registration successful! You can now log in.');
                toggleForms(false);
                registerForm.reset();
                if (profilePicPreview) {
                    profilePicPreview.src = '';
                    profilePicPreview.style.display = 'none';
                }
            } catch (error) {
                showError(errorDiv, error.message);
            }
        });
    }

    // Login logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            hideError(errorDiv);
            // Validate email
            if (!email || !email.includes('@')) {
                showError(errorDiv, 'Please enter a valid email address.');
                return;
            }
            // Try to sign in
            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'dashboard.html';
            } catch (error) {
                // showError(errorDiv, 'Invalid credentials or user does not exist.');
                showCustomPopup('Invalid email or password.');
            }
        });
    }
}

// --- DASHBOARD PAGE LOGIC ---
if (document.getElementById('greeting') && document.getElementById('schoolId') && document.getElementById('userEmail')) {
    const greeting = document.getElementById('greeting');
    const schoolIdSpan = document.getElementById('schoolId');
    const userEmailSpan = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const profilePicContainer = document.getElementById('profilePicContainer');
    const showUpdateProfileBtn = document.getElementById('showUpdateProfileBtn');
    const updateProfileModal = document.getElementById('updateProfileModal');
    const closeUpdateProfileModal = document.getElementById('closeUpdateProfileModal');
    const updateProfileForm = document.getElementById('updateProfileForm');
    const updateFirstName = document.getElementById('updateFirstName');
    const updateLastName = document.getElementById('updateLastName');
    const updateProfilePic = document.getElementById('updateProfilePic');
    const updateProfilePicPreview = document.getElementById('updateProfilePicPreview');
    const updateProfileError = document.getElementById('updateProfileError');
    const cancelUpdateProfileBtn = document.getElementById('cancelUpdateProfileBtn');
    const deleteProfilePicBtn = document.getElementById('deleteProfilePicBtn');

    let currentProfilePicUrl = '';
    let currentUserId = '';
    let originalFirstName = '';
    let originalLastName = '';

    // Helper to enable/disable delete button (moved inside block)
    function updateDeleteProfilePicBtnState() {
        if (deleteProfilePicBtn) {
            deleteProfilePicBtn.disabled = !currentProfilePicUrl;
            deleteProfilePicBtn.style.opacity = currentProfilePicUrl ? '1' : '0.5';
            deleteProfilePicBtn.style.cursor = currentProfilePicUrl ? 'pointer' : 'not-allowed';
        }
    }

    // Render profile picture or placeholder
    function renderProfilePic(url) {
        profilePicContainer.innerHTML = '';
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Profile Picture';
            img.className = 'profile-pic';
            profilePicContainer.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'profile-placeholder';
            placeholder.innerHTML = '<span style="font-size:2.5rem;">👤</span>';
            profilePicContainer.appendChild(placeholder);
        }
    }

    // Load user info
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        currentUserId = user.uid;
        // Fetch user info from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                greeting.textContent = `Welcome, ${data.firstName} ${data.lastName}!`;
                schoolIdSpan.textContent = data.schoolId || '-';
                userEmailSpan.textContent = data.email || user.email;
                currentProfilePicUrl = data.profilePicUrl || '';
                renderProfilePic(currentProfilePicUrl);
            } else {
                greeting.textContent = `Welcome!`;
                schoolIdSpan.textContent = '-';
                userEmailSpan.textContent = user.email;
                currentProfilePicUrl = '';
                renderProfilePic('');
            }
        } catch (err) {
            greeting.textContent = 'Welcome! (Error loading profile)';
            schoolIdSpan.textContent = '-';
            userEmailSpan.textContent = user.email;
            currentProfilePicUrl = '';
            renderProfilePic('');
        }
    });

    // Show update profile modal
    if (showUpdateProfileBtn && updateProfileModal) {
        showUpdateProfileBtn.addEventListener('click', async () => {
            // Pre-fill form with current user info
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUserId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    updateFirstName.value = data.firstName || '';
                    updateLastName.value = data.lastName || '';
                    updateProfilePicPreview.src = data.profilePicUrl || '';
                    updateProfilePicPreview.style.display = data.profilePicUrl ? 'block' : 'none';
                    currentProfilePicUrl = data.profilePicUrl || '';
                    originalFirstName = data.firstName || '';
                    originalLastName = data.lastName || '';
                }
            } catch {}
            updateDeleteProfilePicBtnState();
            updateProfileModal.style.display = 'flex';
        });
    }
    // Close modal
    if (closeUpdateProfileModal && updateProfileModal) {
        closeUpdateProfileModal.addEventListener('click', () => {
            updateProfileModal.style.display = 'none';
            updateProfileForm.reset();
            updateProfilePicPreview.src = '';
            updateProfilePicPreview.style.display = 'none';
            hideError(updateProfileError);
        });
    }
    // Profile picture preview in update modal
    if (updateProfilePic && updateProfilePicPreview) {
        updateProfilePic.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    updateProfilePicPreview.src = ev.target.result;
                    updateProfilePicPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                updateProfilePicPreview.src = '';
                updateProfilePicPreview.style.display = 'none';
            }
        });
    }
    // Update profile logic
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(updateProfileError);
            const newFirstName = updateFirstName.value.trim();
            const newLastName = updateLastName.value.trim();
            let newProfilePicUrl = currentProfilePicUrl;
            let firstNameChanged = false;
            let lastNameChanged = false;
            let picChanged = false;
            // If a new image is selected, upload to Cloudinary
            if (updateProfilePic && updateProfilePic.files && updateProfilePic.files[0]) {
                try {
                    newProfilePicUrl = await uploadProfilePic(updateProfilePic.files[0]);
                    picChanged = true;
                } catch (err) {
                    showError(updateProfileError, err.message);
                    return;
                }
            }
            // Check if first name changed
            if (newFirstName !== originalFirstName) {
                firstNameChanged = true;
            }
            // Check if last name changed
            if (newLastName !== originalLastName) {
                lastNameChanged = true;
            }
            // Check if profile picture changed (if no new upload, compare to current)
            if (!picChanged && newProfilePicUrl !== currentProfilePicUrl) {
                picChanged = true;
            }
            // If no changes
            if (!firstNameChanged && !lastNameChanged && !picChanged) {
                showCustomPopup('No changes');
                return;
            }
            // Update user info in Firestore
            try {
                await updateDoc(doc(db, 'users', currentUserId), {
                    firstName: newFirstName,
                    lastName: newLastName,
                    profilePicUrl: newProfilePicUrl
                });
                // Build the message
                let msg = '';
                if (firstNameChanged && lastNameChanged && picChanged) {
                    msg = 'Name and profile picture changed successfully!';
                } else if (firstNameChanged && lastNameChanged) {
                    msg = 'Name changed successfully!';
                } else if (firstNameChanged) {
                    msg = 'First name changed successfully!';
                } else if (lastNameChanged) {
                    msg = 'Last name changed successfully!';
                } else if (picChanged) {
                    msg = 'Profile picture changed successfully!';
                }
                showCustomPopup(msg);
                updateProfileModal.style.display = 'none';
                currentProfilePicUrl = newProfilePicUrl; // Update current profile pic
                renderProfilePic(currentProfilePicUrl);
                updateDeleteProfilePicBtnState(); // Update button state after successful update
            } catch (error) {
                showError(updateProfileError, error.message);
            }
        });
    }

    if (cancelUpdateProfileBtn && updateProfileModal && updateProfileForm && updateProfilePicPreview && updateProfileError) {
        cancelUpdateProfileBtn.addEventListener('click', () => {
            updateProfileModal.style.display = 'none';
            updateProfileForm.reset();
            updateProfilePicPreview.src = '';
            updateProfilePicPreview.style.display = 'none';
            hideError(updateProfileError);
        });
    }

    if (deleteProfilePicBtn && updateProfileModal && updateProfileForm && updateProfilePicPreview && updateProfileError) {
        deleteProfilePicBtn.addEventListener('click', async () => {
            hideError(updateProfileError);
            if (!currentProfilePicUrl) return;
            showCustomPopup('Are you sure you want to delete your profile picture?', {
                confirm: true,
                confirmText: 'Yes, delete',
                onConfirm: async () => {
                    try {
                        await updateDoc(doc(db, 'users', currentUserId), {
                            profilePicUrl: ''
                        });
                        currentProfilePicUrl = '';
                        renderProfilePic('');
                        updateDeleteProfilePicBtnState();
                        updateProfileModal.style.display = 'none';
                        updateProfileForm.reset();
                        updateProfilePicPreview.src = '';
                        updateProfilePicPreview.style.display = 'none';
                    } catch (err) {
                        showCustomPopup('Failed to delete profile picture.');
                    }
                }
            });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            // Close update profile modal if open
            if (typeof updateProfileModal !== 'undefined' && updateProfileModal) {
                updateProfileModal.style.display = 'none';
            }
            // Close custom popup if open
            const popup = document.getElementById('customPopup');
            if (popup) popup.classList.remove('active');
            console.log('Logout button clicked');
            await signOut(auth);
            window.location.href = 'index.html';
        });
    }
}