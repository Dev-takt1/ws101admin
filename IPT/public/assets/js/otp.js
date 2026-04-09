const otpVerify = document.getElementById('otp-verify');
const otpSuccess = document.getElementById('otp-success');
const newPass = document.getElementById('newpass');

const otpVerifyBtn = document.getElementById('otp-btn');
const otpSuccessBtn = document.getElementById('otp-verify-btn');
const newPassBtn = document.getElementById('new-password-btn');
const otpInputs = document.querySelectorAll('.mpin-input');
const resendBtn = document.getElementById('resend-btn');
const timerDisplay = document.getElementById('resend-timer');

let otpVerified = false; // track verification

if (otpVerifyBtn) {
    otpVerifyBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const inputs = document.querySelectorAll('.mpin-input');
        const otp = Array.from(inputs).map(i => i.value).join('');

        const email = sessionStorage.getItem('resetEmail');
        if (!email) {
            alert("No email found. Please start the forgot password process again.");
            window.location.href = "index.html";
            return;
        }

        if (otp.length !== 6) {
            alert("Please enter the 6-digit OTP.");
            return;
        }

        try {
`${window.location.origin}/verify-otp`
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const result = await response.json();

            if (response.ok) {
                // OTP correct → show success
                otpVerified = true;
                otpVerify.style.display = 'none';
                otpSuccess.style.display = 'block';
            } else {
                otpVerified = false;
                alert(result.message); // Wrong OTP
            }

        } catch (err) {
            console.error(err);
            alert("Server error. Try again later.");
        }
    });
}

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;

        // Only allow single digit numbers
        if (!/^\d$/.test(value)) {
            e.target.value = '';
            return;
        }

        // Move focus to next input if exists
        if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        // Move back if backspace and input is empty
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    // Optional: select text when focused for easy overwrite
    input.addEventListener('focus', (e) => e.target.select());
});

const RESEND_INTERVAL = 30; // seconds
let countdown;

// Function to start resend timer
function startResendTimer() {
    let timeLeft = RESEND_INTERVAL;
    resendBtn.disabled = true;
    resendBtn.classList.remove('enabled'); // grey button
    timerDisplay.textContent = `Wait ${timeLeft}s to resend`;

    countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Wait ${timeLeft}s to resend`;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            resendBtn.disabled = false;
            resendBtn.classList.add('enabled');
            timerDisplay.textContent = '';
        }
    }, 1000);
}

resendBtn.addEventListener('click', async () => {
    if (resendBtn.disabled) return;

    const email = sessionStorage.getItem('resetEmail');
    if (!email) return alert("No email found");

    try {
`${window.location.origin}/send-code`
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok) {
            alert("OTP resent successfully!");
            startResendTimer();
        } else {
            alert(result.message || "Failed to resend OTP");
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Try again later.");
    }
});

// Start initial timer when OTP page loads
startResendTimer();

if (otpSuccessBtn) {
    otpSuccessBtn.addEventListener('click', function(e) {
        e.preventDefault();

        if (!otpVerified) {
            alert("You must verify your OTP first!");
            return;
        }

        otpVerify.style.display = "none";
        otpSuccess.style.display = "none";
        newPass.style.display = "block";
    });
}

if (newPassBtn) {
    newPassBtn.addEventListener('click', function(e) {
        e.preventDefault();

        if (!otpVerified) {
            alert("You must verify your OTP first!");
            return;
        }

        alert("Password updated! Redirecting...");
        sessionStorage.removeItem("resetEmail"); // clean up
        window.location.href = 'index.html';
    });
}