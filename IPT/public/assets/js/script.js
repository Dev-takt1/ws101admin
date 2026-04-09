// =============================================================
//  De Las Armas — script.js
// =============================================================

const API_URL = window.location.origin;

// ── Small helpers ─────────────────────────────────────────────
function isEmailFormat(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()); }

function setFieldMsg(id, type, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'field-msg' + (type ? ' ' + type : '');
    el.textContent = text || '';
    el.style.display = type ? 'block' : 'none';
}

// =============================================================
//  LOGIN FORM
// =============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(loginForm).entries());
        try {
            const res    = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('currentUserId', result.user.id);
                window.location.href = 'home.html';
            } else {
                alert(result.message || 'Login failed');
            }
        } catch { alert('Server is offline.'); }
    });
}

// =============================================================
//  VIEW SWITCHING  (Login ↔ Forgot)
// =============================================================
const loginWrapper  = document.getElementById('login');
const forgotWrapper = document.getElementById('forgotpassword');
const forgotButton  = document.getElementById('forgotButton');

if (forgotButton) {
    forgotButton.addEventListener('click', () => {
        if (loginWrapper)  loginWrapper.style.display  = 'none';
        if (forgotWrapper) forgotWrapper.style.display = 'block';
    });
}

// "Back to login" links that may exist in your CSS layout
document.addEventListener('click', (e) => {
    if (e.target.closest('#backToLogin')) {
        if (loginWrapper)  loginWrapper.style.display  = 'block';
        if (forgotWrapper) forgotWrapper.style.display = 'none';
    }
});

// =============================================================
//  FORGOT PASSWORD — STEP 1  (send OTP)
// =============================================================
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('fpEmailInput');
        const email      = emailInput ? emailInput.value.trim() : '';
        const msgEl      = document.getElementById('fpEmailMsg');

        // Clear old errors
        if (msgEl) { msgEl.textContent = ''; msgEl.style.display = 'none'; }

        if (!isEmailFormat(email)) {
            if (msgEl) { msgEl.textContent = '⚠ Enter a valid email address'; msgEl.style.display = 'block'; }
            emailInput && emailInput.focus();
            return;
        }

        const btn = document.getElementById('forgot-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

        try {
            const res  = await fetch(`${API_URL}/send-code`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email })
            });
            const data = await res.json();

            if (res.ok) {
                openFpOtpStep(email);
            } else {
                if (msgEl) { msgEl.textContent = '✗ ' + (data.message || 'Could not send code.'); msgEl.style.display = 'block'; }
            }
        } catch {
            if (msgEl) { msgEl.textContent = '✗ Could not connect to server.'; msgEl.style.display = 'block'; }
        }

        if (btn) { btn.disabled = false; btn.textContent = 'Send Code'; }
    });
}

// =============================================================
//  FORGOT PASSWORD — STEP 2  (OTP overlay)
// =============================================================
let fpTimerInterval = null;
let fpVerifiedEmail = '';   // set after OTP passes — used for password reset

function openFpOtpStep(email) {
    fpVerifiedEmail = '';

    // Show email in popup
    const display = document.getElementById('fpEmailDisplay');
    if (display) display.textContent = email;

    // Clear OTP inputs
    clearFpOtpInputs();

    // Show OTP step, hide new-pw step
    const otpStep  = document.getElementById('fpStepOtp');
    const newPwStep = document.getElementById('fpStepNewPw');
    if (otpStep)  otpStep.style.display  = 'block';
    if (newPwStep) newPwStep.style.display = 'none';

    // Show overlay
    document.getElementById('fpOverlay').classList.add('active');

    startFpTimer(60);

    // Focus first digit
    const first = document.querySelector('.fp-otp-digit');
    if (first) setTimeout(() => first.focus(), 100);
}

function clearFpOtpInputs() {
    document.querySelectorAll('.fp-otp-digit').forEach(d => {
        d.value = ''; d.classList.remove('filled', 'error');
    });
    const msg = document.getElementById('fpMsg');
    if (msg) { msg.textContent = ''; msg.className = ''; }
    const btn = document.getElementById('fpVerifyBtn');
    if (btn) btn.disabled = true;
}

function getFpOtpValue() {
    return Array.from(document.querySelectorAll('.fp-otp-digit')).map(d => d.value).join('');
}

function setFpMsg(text, isOk) {
    const el = document.getElementById('fpMsg');
    if (!el) return;
    el.textContent = text;
    el.className = isOk ? 'ok' : '';
}

function startFpTimer(seconds) {
    clearInterval(fpTimerInterval);
    const resendBtn = document.getElementById('fpResendBtn');
    const timerEl   = document.getElementById('fpTimerDisplay');
    let remaining = seconds;

    if (resendBtn) resendBtn.disabled = true;
    if (timerEl)   timerEl.textContent = `(${remaining}s)`;

    fpTimerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(fpTimerInterval);
            if (resendBtn) resendBtn.disabled = false;
            if (timerEl)   timerEl.textContent = '';
        } else {
            if (timerEl) timerEl.textContent = `(${remaining}s)`;
        }
    }, 1000);
}

// Wire up OTP digit inputs
document.addEventListener('DOMContentLoaded', () => {
    const digits = document.querySelectorAll('.fp-otp-digit');
    digits.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val ? val[0] : '';
            e.target.classList.toggle('filled', !!e.target.value);
            e.target.classList.remove('error');
            if (val && idx < digits.length - 1) digits[idx + 1].focus();
            const verifyBtn = document.getElementById('fpVerifyBtn');
            if (verifyBtn) verifyBtn.disabled = getFpOtpValue().length < 6;
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                digits[idx - 1].focus();
                digits[idx - 1].value = '';
                digits[idx - 1].classList.remove('filled');
                const verifyBtn = document.getElementById('fpVerifyBtn');
                if (verifyBtn) verifyBtn.disabled = true;
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
            if (pasted.length === 6) {
                digits.forEach((d, i) => { d.value = pasted[i] || ''; d.classList.toggle('filled', !!d.value); });
                digits[5].focus();
                const verifyBtn = document.getElementById('fpVerifyBtn');
                if (verifyBtn) verifyBtn.disabled = false;
            }
        });
    });

    // ── Verify OTP button ─────────────────────────────────────
    const verifyBtn = document.getElementById('fpVerifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const code  = getFpOtpValue();
            const email = document.getElementById('fpEmailDisplay')?.textContent || '';

            if (code.length < 6) { setFpMsg('Please enter the full 6-digit code.', false); return; }

            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying…';

            try {
                const res  = await fetch(`${API_URL}/verify-otp`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email, otp: code })
                });
                const data = await res.json();

                if (res.ok) {
                    // OTP correct → move to new-password step
                    fpVerifiedEmail = email;
                    clearInterval(fpTimerInterval);

                    document.getElementById('fpStepOtp').style.display   = 'none';
                    document.getElementById('fpStepNewPw').style.display = 'block';

                    // Clear new-pw fields
                    const npw = document.getElementById('fpNewPw');
                    const cpw = document.getElementById('fpConfirmPw');
                    const m2  = document.getElementById('fpMsg2');
                    if (npw) { npw.value = ''; npw.classList.remove('err'); }
                    if (cpw) { cpw.value = ''; cpw.classList.remove('err'); }
                    if (m2)  { m2.textContent = ''; m2.style.color = '#e74c3c'; }

                    if (npw) setTimeout(() => npw.focus(), 100);

                } else {
                    setFpMsg(data.message || 'Incorrect code. Please try again.', false);
                    document.querySelectorAll('.fp-otp-digit').forEach(d => d.classList.add('error'));
                    const inputsEl = document.getElementById('fpOtpInputs');
                    if (inputsEl) { inputsEl.classList.add('shake'); setTimeout(() => inputsEl.classList.remove('shake'), 500); }
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Verify Code';
                }
            } catch {
                setFpMsg('Could not connect to server.', false);
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify Code';
            }
        });
    }

    // ── Resend OTP button ─────────────────────────────────────
    const resendBtn = document.getElementById('fpResendBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            const email = document.getElementById('fpEmailDisplay')?.textContent || '';
            resendBtn.disabled = true;
            setFpMsg('Sending new code…', true);

            try {
                const res  = await fetch(`${API_URL}/send-code`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email })
                });
                const data = await res.json();

                if (res.ok) {
                    clearFpOtpInputs();
                    setFpMsg('New code sent! Check your inbox.', true);
                    startFpTimer(60);
                    document.querySelector('.fp-otp-digit')?.focus();
                } else {
                    setFpMsg(data.message || 'Failed to send.', false);
                    resendBtn.disabled = false;
                }
            } catch {
                setFpMsg('Could not connect to server.', false);
                resendBtn.disabled = false;
            }
        });
    }

    // ── Save New Password button ──────────────────────────────
    const savePwBtn = document.getElementById('fpSavePwBtn');
    if (savePwBtn) {
        savePwBtn.addEventListener('click', async () => {
            const newPw    = document.getElementById('fpNewPw')?.value    || '';
            const confirmPw = document.getElementById('fpConfirmPw')?.value || '';
            const msg2     = document.getElementById('fpMsg2');

            const showErr = (text) => {
                if (msg2) { msg2.textContent = text; msg2.style.color = '#e74c3c'; }
            };

            if (newPw.length < 8) {
                showErr('⚠ Password must be at least 8 characters.');
                document.getElementById('fpNewPw')?.classList.add('err');
                document.getElementById('fpNewPw')?.focus();
                return;
            }
            if (newPw !== confirmPw) {
                showErr('⚠ Passwords do not match.');
                document.getElementById('fpConfirmPw')?.classList.add('err');
                document.getElementById('fpConfirmPw')?.focus();
                return;
            }

            savePwBtn.disabled = true;
            savePwBtn.textContent = 'Saving…';
            if (msg2) msg2.textContent = '';

            try {
                const res  = await fetch(`${API_URL}/reset-password`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email: fpVerifiedEmail, newPassword: newPw })
                });
                const data = await res.json();

                if (res.ok) {
                    if (msg2) { msg2.textContent = '✔ Password changed! Redirecting to login…'; msg2.style.color = '#27ae60'; }

                    setTimeout(() => {
                        // Close overlay, show login
                        document.getElementById('fpOverlay').classList.remove('active');
                        if (forgotWrapper) forgotWrapper.style.display = 'none';
                        if (loginWrapper)  loginWrapper.style.display  = 'block';

                        // Pre-fill email in login form for convenience
                        const loginEmailInput = loginForm?.querySelector('input[name="email"]');
                        if (loginEmailInput) loginEmailInput.value = fpVerifiedEmail;

                        fpVerifiedEmail = '';
                    }, 1500);

                } else {
                    showErr('✗ ' + (data.message || 'Failed to update password.'));
                    savePwBtn.disabled = false;
                    savePwBtn.textContent = 'Save New Password';
                }
            } catch {
                showErr('✗ Could not connect to server.');
                savePwBtn.disabled = false;
                savePwBtn.textContent = 'Save New Password';
            }
        });

        // Remove .err class on typing
        document.getElementById('fpNewPw')?.addEventListener('input', () => {
            document.getElementById('fpNewPw').classList.remove('err');
            const msg2 = document.getElementById('fpMsg2');
            if (msg2) msg2.textContent = '';
        });
        document.getElementById('fpConfirmPw')?.addEventListener('input', () => {
            document.getElementById('fpConfirmPw').classList.remove('err');
            const msg2 = document.getElementById('fpMsg2');
            if (msg2) msg2.textContent = '';
        });
    }
});

// =============================================================
//  SIGNUP — OTP MODULE  (used by signup.html via this same file)
// =============================================================
let signupOtpTimer = null;

function startOtpTimer(seconds) {
    clearInterval(signupOtpTimer);
    const resendBtn = document.getElementById('otpResendBtn');
    const timerEl   = document.getElementById('otpTimerDisplay');
    let remaining = seconds;

    if (resendBtn) resendBtn.disabled = true;
    if (timerEl)   timerEl.textContent = `(${remaining}s)`;

    signupOtpTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(signupOtpTimer);
            if (resendBtn) resendBtn.disabled = false;
            if (timerEl)   timerEl.textContent = '';
        } else {
            if (timerEl) timerEl.textContent = `(${remaining}s)`;
        }
    }, 1000);
}

function getOtpValue() {
    return Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');
}

function clearOtpInputs() {
    document.querySelectorAll('.otp-digit').forEach(i => { i.value = ''; i.classList.remove('filled','error'); });
    const msg = document.getElementById('otpMsg');
    if (msg) { msg.textContent = ''; msg.className = ''; }
    const btn = document.getElementById('otpVerifyBtn');
    if (btn) btn.disabled = true;
}

function setOtpMsg(text, isOk) {
    const el = document.getElementById('otpMsg');
    if (!el) return;
    el.textContent = text;
    el.className = isOk ? 'ok' : '';
}

function showOtpOverlay(email) {
    const display = document.getElementById('otpEmailDisplay');
    if (display) display.textContent = email;
    clearOtpInputs();
    document.getElementById('otpOverlay')?.classList.add('active');
    startOtpTimer(60);
    setTimeout(() => document.querySelector('.otp-digit')?.focus(), 100);
}

// Signup OTP digit wiring (only runs if signup.html elements exist)
document.addEventListener('DOMContentLoaded', () => {
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g,'');
            e.target.value = val ? val[0] : '';
            e.target.classList.toggle('filled', !!e.target.value);
            e.target.classList.remove('error');
            if (val && idx < digits.length - 1) digits[idx+1].focus();
            const btn = document.getElementById('otpVerifyBtn');
            if (btn) btn.disabled = getOtpValue().length < 6;
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                digits[idx-1].focus(); digits[idx-1].value = ''; digits[idx-1].classList.remove('filled');
                const btn = document.getElementById('otpVerifyBtn');
                if (btn) btn.disabled = true;
            }
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'');
            if (pasted.length === 6) {
                digits.forEach((d,i) => { d.value = pasted[i]||''; d.classList.toggle('filled',!!d.value); });
                digits[5].focus();
                const btn = document.getElementById('otpVerifyBtn');
                if (btn) btn.disabled = false;
            }
        });
    });

    // Signup OTP verify
    const otpVerifyBtn = document.getElementById('otpVerifyBtn');
    if (otpVerifyBtn) {
        otpVerifyBtn.addEventListener('click', async () => {
            const code  = getOtpValue();
            const email = document.getElementById('otpEmailDisplay')?.textContent || '';
            if (code.length < 6) { setOtpMsg('Please enter the full 6-digit code.', false); return; }
            otpVerifyBtn.disabled = true;
            otpVerifyBtn.textContent = 'Verifying…';
            try {
                const res  = await fetch(`${API_URL}/verify-signup-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, otp: code }) });
                const data = await res.json();
                if (res.ok) {
                    setOtpMsg('✔ Email verified! Creating your account…', true);
                    await finalizeSignup(email);
                } else {
                    setOtpMsg(data.message || 'Incorrect code.', false);
                    document.querySelectorAll('.otp-digit').forEach(d => d.classList.add('error'));
                    const inp = document.getElementById('otpInputs');
                    if (inp) { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 500); }
                    otpVerifyBtn.disabled = false;
                    otpVerifyBtn.textContent = 'Verify & Create Account';
                }
            } catch {
                setOtpMsg('Could not connect to server.', false);
                otpVerifyBtn.disabled = false;
                otpVerifyBtn.textContent = 'Verify & Create Account';
            }
        });
    }

    // Signup OTP resend
    const otpResendBtn = document.getElementById('otpResendBtn');
    if (otpResendBtn) {
        otpResendBtn.addEventListener('click', async () => {
            const email = document.getElementById('otpEmailDisplay')?.textContent || '';
            otpResendBtn.disabled = true;
            setOtpMsg('Sending new code…', true);
            try {
                const res  = await fetch(`${API_URL}/send-signup-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
                const data = await res.json();
                if (res.ok) { clearOtpInputs(); setOtpMsg('New code sent!', true); startOtpTimer(60); document.querySelector('.otp-digit')?.focus(); }
                else { setOtpMsg(data.message||'Failed.', false); otpResendBtn.disabled = false; }
            } catch { setOtpMsg('Could not connect.', false); otpResendBtn.disabled = false; }
        });
    }

    // Terms checkbox (signup.html)
    const termsCheckbox = document.getElementById('termsCheckbox');
    const closeTermsBtn = document.getElementById('closeTermsBtn');
    if (termsCheckbox && closeTermsBtn) {
        termsCheckbox.addEventListener('change', () => { closeTermsBtn.disabled = !termsCheckbox.checked; });
        closeTermsBtn.addEventListener('click', () => { document.getElementById('termsOverlay').style.display = 'none'; sendSignupOtp(); });
    }

    // Signup form submit
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateSignupFields()) return;
            const cb = document.getElementById('termsCheckbox');
            if (!cb || !cb.checked) { document.getElementById('termsOverlay').style.display = 'flex'; return; }
            await sendSignupOtp();
        });
    }
});

// ── Signup field validation ───────────────────────────────────
function setFieldMsg(id, type, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'field-msg' + (type ? ' ' + type : '');
    el.textContent = text || '';
    el.style.display = type ? 'block' : 'none';
}

function validateSignupFields() {
    const fName = document.getElementById('su-name')?.value.trim() || '';
    const email = document.getElementById('su-email')?.value.trim() || '';
    const pw    = document.getElementById('su-password')?.value || '';
    let ok = true;
    if (fName.length < 2) { setFieldMsg('nameMsg','error','⚠ Name must be at least 2 characters'); ok = false; } else setFieldMsg('nameMsg','','');
    if (!isEmailFormat(email)) { setFieldMsg('emailMsg','error','⚠ Enter a valid email (e.g. you@gmail.com)'); ok = false; } else setFieldMsg('emailMsg','','');
    if (pw.length < 8) { setFieldMsg('pwMsg','error','⚠ Password must be at least 8 characters'); ok = false; } else setFieldMsg('pwMsg','','');
    if (!ok) { const f = document.getElementById('signupForm'); f && f.classList.add('shake'); setTimeout(() => f && f.classList.remove('shake'), 500); }
    return ok;
}

async function sendSignupOtp() {
    const email = document.getElementById('su-email')?.value.trim() || '';
    const btn   = document.getElementById('signupSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending code…'; }
    try {
        const res  = await fetch(`${API_URL}/send-signup-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
        const data = await res.json();
        if (res.ok) { showOtpOverlay(email); }
        else { setFieldMsg('emailMsg','error','✗ '+(data.message||'Could not send code.')); }
    } catch { setFieldMsg('emailMsg','error','✗ Could not connect to server.'); }
    if (btn) { btn.disabled = false; btn.textContent = 'Sign Up'; }
}

async function finalizeSignup(email) {
    const fName = document.getElementById('su-name')?.value.trim() || '';
    const pw    = document.getElementById('su-password')?.value || '';
    try {
        const res  = await fetch(`${API_URL}/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fName, email, password: pw }) });
        const data = await res.json();
        if (res.ok) {
            setOtpMsg('✔ Account created! Redirecting…', true);
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            setOtpMsg('✗ '+(data.message||'Sign up failed.'), false);
            document.getElementById('otpVerifyBtn').disabled = false;
            document.getElementById('otpVerifyBtn').textContent = 'Verify & Create Account';
        }
    } catch {
        setOtpMsg('✗ Could not connect to server.', false);
        document.getElementById('otpVerifyBtn').disabled = false;
        document.getElementById('otpVerifyBtn').textContent = 'Verify & Create Account';
    }
}

// =============================================================
//  GALLERY (profile pages)
// =============================================================
async function loadGallery() {
    const gc = document.getElementById('galleryContainer');
    if (!gc) return;
    try {
        const r = await fetch(`${API_URL}/api/gallery`);
        const imgs = await r.json();
        gc.innerHTML = imgs.map(i => {
            // Ensure path exists, otherwise use a placeholder
            const src = i.image_path ? `${API_URL}${i.image_path}` : 'images/default-avatar.png';
            return `<img src="${src}" class="gallery-img" data-path="${i.image_path || ''}">`;
        }).join('');
    } catch(e) { console.error('Gallery load failed:', e); }
}
document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('gallery-img')) return;
    const ud = JSON.parse(localStorage.getItem('user'));
    if (!ud) return;
    try {
        const r = await fetch(`${API_URL}/api/user/set-profile-from-gallery`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: ud.id, imagePath: e.target.dataset.path }) });
        if (r.ok) {
            const url = `${API_URL}${e.target.dataset.path}`;
            document.querySelectorAll('.profile-pic, .user-info img').forEach(i => i.src = url);
            ud.profilePic = url; localStorage.setItem('user', JSON.stringify(ud));
            alert('Profile picture updated!');
        }
    } catch(e) { console.error(e); }
});
document.addEventListener('DOMContentLoaded', loadGallery);