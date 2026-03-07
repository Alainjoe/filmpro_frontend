let rentalsCache = [];

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

document.addEventListener('DOMContentLoaded', function() {
    loadMesFilms();
});

async function loadMesFilms() {
    const container = document.getElementById('rentals-content');
    container.innerHTML = '<div class="loading">Chargement de vos locations...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/profil/mesfilms`, {
            credentials: 'include'
        });

        if (response.status === 401) { window.location.href = '/'; return; }

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
            rentalsCache = Array.isArray(result.data) ? result.data : [];
            displayMesFilms(rentalsCache);
        } else {
            throw new Error(result.message || 'Erreur lors du chargement de vos films');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors du chargement de vos films : ' + error.message);
    }
}

function displayMesFilms(rentals) {
    const container = document.getElementById('rentals-content');

    if (!rentals || rentals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Vous n'avez aucune location en cours</h3>
                <p>Votre bibliothèque est vide pour l'instant. Pourquoi ne pas découvrir un nouveau film ?</p>
                <a href="../html/catalogue.html" class="btn-explore">Explorer les films</a>
            </div>
        `;
        return;
    }

    rentals = [...rentals].sort((a, b) => {
        const aReturned = a.return_date !== null;
        const bReturned = b.return_date !== null;
        return Number(aReturned) - Number(bReturned);
    });

    let html = '<div class="rentals-grid">';

    rentals.forEach(rental => {
        const isReturned   = rental.return_date !== null;
        const rentalDate   = rental.rental_date ? new Date(rental.rental_date) : null;
        const returnDate   = rental.return_date ? new Date(rental.return_date) : null;
        const now          = new Date();
        const durationDays = rentalDate
            ? Math.max(1, Math.floor(((isReturned ? returnDate : now) - rentalDate) / (1000 * 60 * 60 * 24)))
            : null;

        const filmTitle = rental.film_title || rental.title || rental.filmName || rental.name || 'Titre non disponible';
        const filmId    = rental.film_id || rental.filmId || rental.id_film || rental.idFilm || rental.id || null;

        html += `
            <div class="rental-card ${isReturned ? 'returned' : ''}">
                <div class="rental-header">
                    <h3 class="film-title">${escapeHTML(filmTitle)}</h3>
                    <span class="rental-status ${isReturned ? 'status-returned' : 'status-active'}">
                        ${isReturned ? 'RETOURNÉ' : 'EN COURS'}
                    </span>
                </div>

                <div class="rental-dates">
                    <div class="date-info">
                        <div class="date-label">Date de location</div>
                        <div class="date-value">${rentalDate ? rentalDate.toLocaleDateString('fr-FR') : '—'}</div>
                        <div class="date-extra">${rentalDate ? rentalDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>

                    ${isReturned ? `
                        <div class="date-info">
                            <div class="date-label">Date de retour</div>
                            <div class="date-value">${returnDate ? returnDate.toLocaleDateString('fr-FR') : '—'}</div>
                            <div class="date-extra">${returnDate ? returnDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                        </div>
                    ` : `
                        <div class="date-info">
                            <div class="date-label">Durée</div>
                            <div class="date-value">${durationDays !== null ? durationDays + ' jour' + (durationDays > 1 ? 's' : '') : '—'}</div>
                            <div class="date-extra">Film actuellement en votre possession.</div>
                        </div>
                    `}
                </div>

                <div class="rental-footer">
                    <div class="rental-meta">
                        <span>${isReturned ? 'Location terminée' : 'Location en cours'}</span>
                    </div>
                    ${!isReturned ? `
                        <div class="rental-actions">
                            ${filmId
                                ? `<button class="btn btn-return" onclick="retournerFilm(${Number(filmId)})">Retourner</button>`
                                : `<button class="btn btn-disabled" disabled>ID film indisponible</button>`
                            }
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

async function retournerFilm(filmId) {
    if (!filmId) { alert('Erreur : ID du film non disponible.'); return; }
    if (!confirm('Êtes-vous sûr de vouloir retourner ce film ?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/location/retour`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ filmId })
        });

        if (response.status === 401) { window.location.href = '/'; return; }

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
            alert('Film retourné avec succès !');
            loadMesFilms();
        } else {
            alert(result.message || 'Erreur lors du retour du film.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du retour du film.');
    }
}

function showError(message) {
    document.getElementById('rentals-content').innerHTML = `<div class="error">${message}</div>`;
}

document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { credentials: 'include' }); }
    catch (error) { console.error('Erreur déconnexion:', error); }
    finally { window.location.href = '/'; }
});
