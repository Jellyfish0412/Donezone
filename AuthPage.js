function openModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('registerModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('registerModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.querySelector('#loginForm input[name="email"]').value;
    const password = document.querySelector('#loginForm input[name="password"]').value;

    try {
        const response = await fetch('login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userName", data.user.name || "User");
            window.location.href = "HomePage.html"; // 登录成功后跳转到主页
        } else {
            alert(data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection.');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const fullNameInput = document.querySelector('#registerForm input[name="full_name"]');
    const emailInput = document.querySelector('#registerForm input[name="email"]');
    const passwordInput = document.querySelector('#registerForm input[name="password"]');
    const confirmPasswordInput = document.querySelector('#registerForm input[name="confirmPassword"]');

    if (!fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        alert('Form inputs not found. Please check the form and try again.');
        return;
    }

    const fullName = fullNameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password.length < 8) {
        alert('Password must be at least 8 characters long!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    const registerButton = document.querySelector('#registerForm button[type="submit"]');
    registerButton.disabled = true;

    try {
        const response = await fetch('register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullName, email, password })
        });

        const data = await response.json();
        if (data.success) {
            alert('Registration successful!');
            closeModal();
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        alert('An unknown error occurred. Please try again.');
    } finally {
        registerButton.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});