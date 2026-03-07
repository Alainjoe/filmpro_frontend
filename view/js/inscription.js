document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nameField     = document.getElementById('name').value.trim();
    const emailField    = document.getElementById('email').value.trim();
    const passwordField = document.getElementById('password').value.trim();

    if (!nameField || !emailField || !passwordField) {
        showAlert('Veuillez remplir tous les champs.', 'error');
        return;
    }

    if (passwordField.length < 6) {
        showAlert('Le mot de passe doit contenir au moins 6 caractères.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: nameField,
                email: emailField,
                password: passwordField
            })
        });

        const result = await response.json();

        if (!result.success) {
            showAlert(result.message || "Erreur d'inscription.", 'error');
            return;
        }

        showAlert('Compte créé avec succès ! Redirection...', 'success');
        setTimeout(() => window.location.href = '/', 1500);

    } catch (err) {
        showAlert('Erreur serveur. Réessayez.', 'error');
    }
});

function showAlert(message, type) {
    const box = document.getElementById('alert');
    box.textContent = message;
    box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 5000);
}
