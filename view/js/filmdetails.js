const urlParams = new URLSearchParams(window.location.search);
const filmId = urlParams.get("id");

const LOGIN_PAGE = "/";
const CATALOGUE_PAGE = "../html/catalogue.html";

document.addEventListener("DOMContentLoaded", () => {
  if (!filmId) return showError("ID du film non spécifié.");
  checkAuth();
});

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profil`, {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    if (response.ok) {
      loadFilmDetails();
    } else {
      window.location.href = LOGIN_PAGE;
    }
  } catch (error) {
    console.error("Erreur auth:", error);
    window.location.href = LOGIN_PAGE;
  }
}

async function loadFilmDetails() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/films/${filmId}`, {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = LOGIN_PAGE;
      return;
    }
    if (!response.ok) throw new Error("Erreur serveur");

    const data = await response.json();

    if (data.success && data.data) displayFilmDetails(data.data);
    else throw new Error(data.message || "Film non trouvé");
  } catch (error) {
    console.error("Erreur:", error);
    showError(error.message || "Erreur lors du chargement des détails du film");
  }
}

function displayFilmDetails(film) {
  const filmContent = document.getElementById("film-content");
  const availableCopies = film.available_copies || 0;
  const isAvailable = availableCopies > 0;

  let actorsList = '<div class="actor-item">Aucune information sur le casting</div>';
  if (film.acteurs) {
    const allActors = film.acteurs
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const mainActors = allActors
      .slice(0, 10)
      .map((actor) => `<div class="actor-item">${escapeHTML(actor)}</div>`);
    actorsList = mainActors.join("");

    if (allActors.length > 10) {
      actorsList += '<div class="actor-item" style="text-align:center;color:#7f8a9d;">... et autres</div>';
    }
  }

  const primaryGenre = film.genre ? film.genre.split(",")[0].trim() : "Non spécifié";
  const allGenres = film.genre || "Non spécifié";

  function isSafeUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch { return false; }
  }

  const metaItems = [
    { label: "Année", value: escapeHTML(String(film.annee_sortie || "N/A")) },
    { label: "Genre", value: escapeHTML(primaryGenre) },
    { label: "Langue", value: escapeHTML(film.langue_originale || "N/A") },
    { label: "Durée", value: film.duree ? `${Number(film.duree)} min` : "N/A" },
    { label: "Pays", value: escapeHTML(film.pays_productions || "N/A") },
  ];
  const posterContent = film.imgPath && isSafeUrl(film.imgPath)
      ? `<img src="${escapeHTML(film.imgPath)}" alt="${escapeHTML(film.title || "Affiche")}" onerror="this.style.display='none';">`
      : `
        <div class="film-poster-fallback">
          <div class="film-poster-icon">&#127909;</div>
          <div class="film-poster-text">${escapeHTML(primaryGenre)}</div>
        </div>
      `;

  const safeTrailerUrl = film.trailer && isSafeUrl(film.trailer) ? escapeHTML(film.trailer) : null;
  const trailerSection = safeTrailerUrl
    ? `
      <div class="trailer-section">
        <h3>BANDE-ANNONCE</h3>
        <div class="trailer-container">
          <iframe
            src="${safeTrailerUrl}"
            title="Bande-annonce de ${escapeHTML(film.title || "")}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    `
    : `
      <div class="trailer-section">
        <h3>BANDE-ANNONCE</h3>
        <div class="no-trailer">Aucune bande-annonce disponible pour ce film.</div>
      </div>
    `;

  const membershipLabel = film.annee_sortie ? `Film ${Number(film.annee_sortie)}` : "Film du catalogue";

  filmContent.innerHTML = `
    <div class="film-details">
      <div class="film-header">
        <div class="film-poster">${posterContent}</div>
        <div class="film-info">
          <h1 class="film-title">${escapeHTML(film.title || "Titre inconnu")}</h1>

          <div class="film-subtitle-line">
            <span class="film-subtitle">${escapeHTML(membershipLabel)}</span>
            <span class="line"></span>
          </div>

          <div class="film-meta">
            ${metaItems
              .map(
                (item) => `
              <div class="meta-item">
                <span class="label">${item.label}</span>
                <span class="value">${item.value}</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="availability ${isAvailable ? "" : "unavailable"}">
            <span class="availability-dot"></span>
            ${
              isAvailable
                ? `${Number(availableCopies)} copie${availableCopies > 1 ? "s" : ""} disponible${availableCopies > 1 ? "s" : ""}`
                : "Aucune copie disponible actuellement"
            }
          </div>

          <div class="film-synopsis">
            <span class="synopsis-label">Synopsis</span>
            <div>${escapeHTML(film.synopsis || "Aucun synopsis disponible pour ce film.")}</div>
          </div>
        </div>
      </div>

      <div class="film-content">
        <div class="info-grid">
          <section class="info-section">
            <h3><span class="dot"></span> Informations</h3>

            <div class="info-item">
              <span class="info-label">Réalisateur(s)</span>
              <span class="info-value">${escapeHTML(film.realisateurs || "Non spécifié")}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Genres</span>
              <span class="info-value">${escapeHTML(allGenres)}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Date de sortie</span>
              <span class="info-value">${escapeHTML(film.date_sortie || "Non spécifiée")}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Note</span>
              <span class="info-value">${film.note ? escapeHTML(String(film.note)) + "/10" : "N/A"}</span>
            </div>
          </section>

          <section class="info-section">
            <h3><span class="dot"></span> Distribution</h3>
            <div class="actors-list">${actorsList}</div>
          </section>
        </div>

        ${trailerSection}

        <div class="actions">
          ${
            isAvailable
              ? `<button class="btn btn-primary" onclick="louerFilm(${Number(film.id)})">Louer ce film</button>`
              : `<button class="btn btn-disabled" disabled>Indisponible</button>`
          }
          <a href="${CATALOGUE_PAGE}" class="btn btn-secondary">Retour au catalogue</a>
        </div>
      </div>
    </div>
  `;
}

async function louerFilm(filmId) {
  if (!confirm("Confirmez-vous la location de ce film ?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/location/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ filmId }),
    });

    if (response.status === 401) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      alert("Film loué avec succès !");
      loadFilmDetails();
    } else {
      alert(data.message || "Erreur lors de la location.");
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur lors de la location du film.");
  }
}

function showError(message) {
  document.getElementById("film-content").innerHTML = `
    <div class="error">
      ${message}
      <div class="error-actions">
        <a href="${CATALOGUE_PAGE}" class="btn btn-secondary">Retour au catalogue</a>
      </div>
    </div>
  `;
}

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { credentials: "include" });
  } catch (error) {
    console.error("Erreur déconnexion:", error);
  } finally {
    window.location.href = LOGIN_PAGE;
  }
});
