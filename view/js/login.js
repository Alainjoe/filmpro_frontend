const form     = document.getElementById('loginForm');
const errorDiv = document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.textContent = '';

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    errorDiv.textContent = 'Veuillez remplir tous les champs.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const raw = await response.text();
    let result;

    try { result = JSON.parse(raw); }
    catch { result = { success: false, message: raw }; }

    console.log("LOGIN status:", response.status);
    console.log("LOGIN raw:", raw);

    if (!response.ok || !result.success) {
      errorDiv.textContent = result.message || `Erreur (${response.status})`;
      return;
    }

    window.location.href = "../html/catalogue.html";
  } catch (err) {
    console.error("LOGIN fetch error:", err);
    errorDiv.textContent = "Impossible de contacter le serveur (vérifie API_BASE_URL/CORS).";
  }
});