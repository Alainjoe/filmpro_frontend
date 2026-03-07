let userStats = { totalRentals: 0, activeRentals: 0, returnedRentals: 0 };

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

async function loadProfile() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <div class="card">
            <div class="loading">Chargement de votre profil...</div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/profil`, {
            credentials: 'include'
        });

        if (response.status === 401) { window.location.href = '/'; return; }
        if (!response.ok) throw new Error('Erreur lors du chargement du profil');

        const result = await response.json();
        if (!result.success || !result.data) throw new Error(result.message || 'Profil introuvable');

        displayProfile(result.data);
        loadRentalStats();
    } catch (e) {
        showError(e.message || 'Erreur lors du chargement du profil');
    }
}

function displayProfile(user) {
    const profileContent = document.getElementById('profile-content');

    const membershipDate = user.date_inscription
        ? new Date(user.date_inscription).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    const initial = escapeHTML(user.name ? user.name.trim().charAt(0).toUpperCase() : 'U');

    profileContent.innerHTML = `
        <div class="profile-layout">
            <section class="card">
                <h3><span class="dot"></span> Profil utilisateur</h3>
                <div class="profile-header">
                    <div class="avatar-wrapper">
                        <div class="avatar-ring"></div>
                        <div class="profile-avatar">${initial}</div>
                    </div>
                    <div class="profile-info">
                        <h2>${escapeHTML(user.name || user.email)}</h2>
                        <p>${escapeHTML(user.email)}</p>
                        <div class="profile-meta">Membre depuis <strong>${escapeHTML(membershipDate)}</strong></div>
                        <div class="profile-badges">
                            <span class="badge badge-premium">FilmPro Premium</span>
                            <span class="badge badge-member">Compte actif</span>
                        </div>
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-card-inner">
                        <div class="info-label">Nom complet</div>
                        <div class="info-value">${escapeHTML(user.name || 'Non renseigné')}</div>
                    </div>
                    <div class="info-card-inner">
                        <div class="info-label">Adresse email</div>
                        <div class="info-value">${escapeHTML(user.email)}</div>
                    </div>
                    <div class="info-card-inner">
                        <div class="info-label">Date d'inscription</div>
                        <div class="info-value">${escapeHTML(membershipDate)}</div>
                    </div>
                </div>
                <div class="stats-grid" id="stats-section">
                    <div class="loading">Chargement de vos statistiques...</div>
                </div>
            </section>

            <section class="card">
                <h3><span class="dot"></span> Modifier le profil</h3>
                <div id="profile-alert" class="alert"></div>
                <form id="profile-form">
                    <div class="form-group">
                        <label for="profileName">Nom complet</label>
                        <input type="text" id="profileName" value="${escapeHTML(user.name || '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="profileEmail">Adresse email</label>
                        <input type="email" id="profileEmail" value="${escapeHTML(user.email || '')}" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Mettre à jour le profil</button>
                </form>
            </section>

            <section class="card">
                <h3><span class="dot"></span> Sécurité du compte</h3>
                <div id="password-alert" class="alert"></div>
                <form id="password-form">
                    <div class="form-group">
                        <label for="currentPassword">Ancien mot de passe</label>
                        <input type="password" id="currentPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nouveau mot de passe</label>
                        <input type="password" id="newPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmer le mot de passe</label>
                        <input type="password" id="confirmPassword" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary">Modifier le mot de passe</button>
                </form>
            </section>

            <section class="card">
                <h3><span class="dot" style="background:#ff6b6b; box-shadow:0 0 16px rgba(255,107,107,0.9);"></span> Supprimer le compte</h3>
                <div id="delete-alert" class="alert"></div>
                <p class="danger-text">
                    Attention : la suppression de votre compte est <strong>définitive</strong>.
                    Toutes vos informations et votre historique de location seront supprimés.
                </p>
                <button type="button" class="btn btn-danger" id="delete-account-btn">Supprimer mon compte</button>
            </section>
        </div>
    `;

    setupProfileForm();
    setupPasswordForm();
    setupDeleteAccount();
}

async function loadRentalStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profil/mesfilms`, { credentials: 'include' });
        if (response.status === 401) { window.location.href = '/'; return; }
        if (!response.ok) throw new Error('Erreur lors du chargement des locations');

        const result = await response.json();
        if (!result.success || !Array.isArray(result.data)) throw new Error(result.message || 'Impossible de récupérer vos locations');

        updateRentalStats(result.data);
    } catch (e) {
        console.error(e);
        const statsSection = document.getElementById('stats-section');
        if (statsSection) statsSection.innerHTML = `<div class="loading" style="color:#ffb3b3;">${e.message}</div>`;
    }
}

function updateRentalStats(rentals) {
    userStats.totalRentals    = rentals.length;
    userStats.activeRentals   = rentals.filter(r => !r.return_date).length;
    userStats.returnedRentals = rentals.filter(r => r.return_date).length;

    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;

    statsSection.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${userStats.totalRentals}</div>
            <div class="stat-label">Total</div>
            <div class="stat-badge">Historique complet</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${userStats.activeRentals}</div>
            <div class="stat-label">En cours</div>
            <div class="stat-badge">Films à rendre</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${userStats.returnedRentals}</div>
            <div class="stat-label">Retournés</div>
            <div class="stat-badge">Merci pour votre retour</div>
        </div>
    `;
}

function setupProfileForm() {
    const form    = document.getElementById('profile-form');
    const alertEl = document.getElementById('profile-alert');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name  = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        if (!name || !email) { showAlert('Tous les champs sont obligatoires', 'error', alertEl); return; }

        try {
            const response = await fetch(`${API_BASE_URL}/api/profil/`, {
                method: 'PUT', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            const result = await response.json().catch(() => ({}));
            if (response.ok && result.success) { showAlert('Profil mis à jour avec succès.', 'success', alertEl); loadProfile(); }
            else showAlert(result.message || 'Erreur lors de la mise à jour du profil', 'error', alertEl);
        } catch (e) { showAlert('Erreur serveur', 'error', alertEl); }
    });
}

function setupPasswordForm() {
    const form    = document.getElementById('password-form');
    const alertEl = document.getElementById('password-alert');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword     = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (newPassword !== confirmPassword) { showAlert('Les mots de passe ne correspondent pas', 'error', alertEl); return; }

        try {
            const response = await fetch(`${API_BASE_URL}/api/profil/password`, {
                method: 'PUT', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const result = await response.json().catch(() => ({}));
            if (response.ok && result.success) { showAlert('Mot de passe modifié avec succès !', 'success', alertEl); form.reset(); }
            else showAlert(result.message || 'Erreur lors de la modification du mot de passe', 'error', alertEl);
        } catch (e) { showAlert('Erreur serveur', 'error', alertEl); }
    });
}

function setupDeleteAccount() {
    const btn     = document.getElementById('delete-account-btn');
    const alertEl = document.getElementById('delete-alert');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/profil/delete`, { method: 'DELETE', credentials: 'include' });
            const result = await response.json().catch(() => ({}));
            if (response.ok && result.success) {
                showAlert('Compte supprimé avec succès. Vous allez être redirigé.', 'success', alertEl);
                setTimeout(() => { window.location.href = '/'; }, 2000);
            } else showAlert(result.message || 'Erreur lors de la suppression du compte', 'error', alertEl);
        } catch (e) { showAlert('Erreur serveur', 'error', alertEl); }
    });
}

function showAlert(message, type, element) {
    if (!element) return;
    element.textContent = message;
    element.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
    element.style.display = 'block';
    setTimeout(() => { element.style.display = 'none'; }, 5000);
}

function showError(message) {
    document.getElementById('profile-content').innerHTML = `
        <div class="card">
            <div class="alert alert-error" style="display:block;">${message}</div>
        </div>
    `;
}

document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { credentials: 'include' }); }
    catch (e) { console.error('Erreur déconnexion:', e); }
    finally { window.location.href = '/'; }
});
