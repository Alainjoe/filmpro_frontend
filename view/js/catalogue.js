let currentUser = null;
let allGenres = [];

// ===================================
// SCROLL NAVBAR
// ===================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// ===================================
// INIT
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadGenres();
    showSkeleton();
});

// ===================================
// SKELETON LOADING
// ===================================
function showSkeleton(count = 6) {
    const container = document.getElementById('films-container');
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-thumb">
                    <div class="skeleton-shimmer"></div>
                </div>
                <div class="skeleton-line wide">
                    <div class="skeleton-shimmer"></div>
                </div>
                <div class="skeleton-line mid">
                    <div class="skeleton-shimmer"></div>
                </div>
                <div class="skeleton-line small">
                    <div class="skeleton-shimmer"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ===================================
// AUTHENTIFICATION
// ===================================
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profil`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/';
            return;
        }

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                currentUser = result.data;
                displayUserInfo(currentUser);
                loadFilms();
            }
        }
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        window.location.href = '/';
    }
}

// ===================================
// GENRES
// ===================================
async function loadGenres() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/films/metadata/genres`, {
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                allGenres = result.data;
                populateGenreDropdown();
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des genres:', error);
    }
}

function populateGenreDropdown() {
    const genreSelect = document.getElementById('search-genre');
    genreSelect.innerHTML = '<option value="">Tous les genres</option>';

    ['Action', 'Aventure', 'Drame', 'Comédie', 'Science-Fiction', 'Horreur', 'Romance', 'Documentaire'].forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });

    if (allGenres && allGenres.length > 0) {
        allGenres.forEach(genre => {
            if (genre && !genreSelect.querySelector(`option[value="${genre}"]`)) {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreSelect.appendChild(option);
            }
        });
    }
}

// ===================================
// INFOS UTILISATEUR
// ===================================
function displayUserInfo(user) {
    const userDetails = document.getElementById('user-details');
    if (!user) return;

    const membershipDate = user.date_inscription
        ? new Date(user.date_inscription).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : 'N/A';

    userDetails.innerHTML = `
        <p><strong>${escapeHTML(user.name || user.email)}</strong></p>
        <small>${escapeHTML(user.email)} • Membre depuis ${escapeHTML(membershipDate)}</small>
        <div style="margin-top: 0.8rem; font-size: 0.9rem; color: #9bb2c7;">
            <span style="color: #00b4ff;">●</span>
            ${Number(user.films_loues) || 0} film(s) loué(s)
        </div>
    `;
}

// ===================================
// CHARGEMENT DES FILMS
// ===================================
async function loadFilms(filters = {}) {
    showSkeleton();

    try {
        let url = `${API_BASE_URL}/api/films`;
        const params = new URLSearchParams();

        if (filters.title) params.append('title', filters.title);
        if (filters.name)  params.append('name', filters.name);
        if (filters.genre) params.append('genre', filters.genre);

        if (params.toString()) {
            url = `${API_BASE_URL}/api/films/search?${params.toString()}`;
        }

        const response = await fetch(url, { credentials: 'include' });

        if (response.status === 401) {
            window.location.href = '/';
            return;
        }

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayFilms(result.data);
                updateSearchResultsInfo(result.data.length, filters);
            } else {
                showError(result.message || 'Aucun film trouvé');
            }
        } else {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError(error.message || 'Erreur lors du chargement des films');
    }
}

// ===================================
// INFO RÉSULTATS RECHERCHE
// ===================================
function updateSearchResultsInfo(count, filters) {
    const infoElement = document.getElementById('search-results-info');
    const hasFilters = Object.keys(filters).length > 0;

    if (hasFilters) {
        let filterText = [];
        if (filters.title) filterText.push(`titre : &quot;${escapeHTML(filters.title)}&quot;`);
        if (filters.name)  filterText.push(`nom : &quot;${escapeHTML(filters.name)}&quot;`);
        if (filters.genre) filterText.push(`genre : &quot;${escapeHTML(filters.genre)}&quot;`);

        infoElement.innerHTML = `
            <div class="search-results-info">
                <strong>${count}</strong> résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}
                ${filterText.length > 0 ? `<small>${filterText.join(' | ')}</small>` : ''}
            </div>
        `;
    } else {
        infoElement.innerHTML = '';
    }
}

// ===================================
// AFFICHAGE DES FILMS
// ===================================
function displayFilms(films) {
    const container = document.getElementById('films-container');

    if (!films || films.length === 0) {
        container.innerHTML = '<div class="error">Aucun film ne correspond à vos critères.</div>';
        return;
    }

    container.innerHTML = '';

    films.forEach(film => {
        const availableCopies = film.available_copies || 0;
        const isAvailable = availableCopies > 0;
        const availabilityClass = isAvailable ? 'available' : 'unavailable';
        const availabilityText = isAvailable
            ? `${availableCopies} copie${availableCopies > 1 ? 's' : ''} disponible${availableCopies > 1 ? 's' : ''}`
            : 'Indisponible';

        const genreLabel = escapeHTML(film.genre ? film.genre.split(',')[0] : 'Film');
        const posterFallback = `
            <div style="text-align:center;color:#e7f4ff;padding:1rem;">
                <div style="font-size:2.3rem;margin-bottom:0.5rem;">&#127909;</div>
                <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;">
                    ${genreLabel}
                </div>
            </div>
        `;

        const filmCard = document.createElement('div');
        filmCard.className = 'film-card';

        filmCard.innerHTML = `
            <div class="film-image">
                ${film.imgPath
                    ? `<img src="${escapeHTML(film.imgPath)}" alt="${escapeHTML(film.title || 'Affiche')}"
                           onerror="this.style.display='none'; this.parentElement.innerHTML=\`${posterFallback}\`;">`
                    : posterFallback}
                <div class="availability ${availabilityClass}">${escapeHTML(availabilityText)}</div>
                <div class="film-overlay">
                    <h3 style="margin-bottom:0.5rem;color:#fdfefe;">${escapeHTML(film.title || 'Titre inconnu')}</h3>
                    <div class="film-actions">
                        <button class="btn-small btn-details" onclick="event.stopPropagation(); viewFilmDetails(${Number(film.id)});">
                            Détails
                        </button>
                        ${isAvailable
                            ? `<button class="btn-small btn-rent" onclick="event.stopPropagation(); louerFilm(${Number(film.id)});">
                                   Louer
                               </button>`
                            : `<button class="btn-small btn-disabled" disabled>
                                   Indisponible
                               </button>`}
                    </div>
                </div>
            </div>
            <div class="film-content">
                <h3>${escapeHTML(film.title || 'Titre non disponible')}</h3>
                <div class="film-meta">
                    <span>${escapeHTML(String(film.annee_sortie || 'N/A'))}</span>
                    <span>${escapeHTML(film.genre ? film.genre.split(',')[0] : '')}</span>
                </div>
                <p>${escapeHTML(film.realisateurs || 'Réalisateur non spécifié')}</p>
            </div>
        `;

        filmCard.addEventListener('click', () => viewFilmDetails(film.id));
        container.appendChild(filmCard);
    });
}

// ===================================
// RECHERCHE
// ===================================
function searchFilms() {
    const filters = {
        title: document.getElementById('search-title').value.trim(),
        name:  document.getElementById('search-name').value.trim(),
        genre: document.getElementById('search-genre').value
    };

    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    loadFilms(filters);
}

function clearSearch() {
    document.getElementById('search-title').value = '';
    document.getElementById('search-name').value  = '';
    document.getElementById('search-genre').value = '';
    document.getElementById('search-results-info').innerHTML = '';
    loadFilms();
}

// ===================================
// DÉTAILS D'UN FILM
// ===================================
function viewFilmDetails(filmId) {
    window.location.href = `../html/filmdetails.html?id=${filmId}`;
}

// ===================================
// LOCATION
// ===================================
async function louerFilm(filmId) {
    if (!confirm('Confirmez-vous la location de ce film ?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/location/location`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filmId })
        });

        if (response.status === 401) {
            window.location.href = '/';
            return;
        }

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Film loué avec succès !');
            loadFilms();
            if (currentUser) {
                currentUser.films_loues = (currentUser.films_loues || 0) + 1;
                displayUserInfo(currentUser);
            }
        } else {
            alert(result.message || 'Erreur lors de la location');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la location du film');
    }
}

// ===================================
// ERREUR
// ===================================
function showError(message) {
    const container = document.getElementById('films-container');
    container.innerHTML = `<div class="error">${message}</div>`;
}

// ===================================
// DÉCONNEXION
// ===================================
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, { credentials: 'include' });
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    } finally {
        window.location.href = '/';
    }
});
