const apiKey = '45dbb14c7bb84b8bb943f1b1bbd3a093';
const baseUrl = 'https://api.rawg.io/api/games';
const categories = [
    { id: 4, name: 'Action' },
    { id: 51, name: 'Indie' },
    { id: 3, name: 'Adventure' },
    { id: 5, name: 'RPG' },
    { id: 10, name: 'Strategy' },
    { id: 2, name: 'Shooter' },
    { id: 7, name: 'Puzzle' },
    { id: 11, name: 'Arcade' },
    { id: 14, name: 'Simulation' },
    { id: 40, name: 'Casual' },
    { id: 1, name: 'Racing' },
    { id: 15, name: 'Sports' },
    { id: 6, name: 'Fighting' },
    { id: 59, name: 'Massively Multiplayer' }
];

function buildQuery(params) {
    return Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
}

async function fetchTrendingGames() {
    const params = { key: apiKey, ordering: '-added', page_size: 18 };
    const url = `${baseUrl}?${buildQuery(params)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch trending games');
    const data = await response.json();
    return data.results || [];
}

async function searchGamesByName(gameName) {
    const params = { key: apiKey, search: gameName, page_size: 20 };
    const url = `${baseUrl}?${buildQuery(params)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search games');
    const data = await response.json();
    return data.results || [];
}

async function fetchGamesByCategory(genreId) {
    const params = { key: apiKey, genres: genreId, ordering: '-added', page_size: 39 };
    const url = `${baseUrl}?${buildQuery(params)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch games for category');
    const data = await response.json();
    return data.results || [];
}

function getStarRatingHTML(rating) {
    let r = typeof rating === "number" ? Math.max(0, Math.min(5, rating)) : 0;
    let fullStars = Math.floor(r);
    let halfStar = (r - fullStars) >= 0.5 ? 1 : 0;
    let emptyStars = 5 - fullStars - halfStar;
    let html = '<span class="star-rating" aria-label="Rating: ' + (r ? r.toFixed(1) : 'N/A') + ' out of 5">';
    for (let i = 0; i < fullStars; i++) html += '<span style="color:#FFD700;">★</span>';
    if (halfStar) html += '<span style="color:#FFD700;">☆</span>';
    for (let i = 0; i < emptyStars; i++) html += '<span class="star-empty" style="color:#555;">★</span>';
    html += '</span>';
    return html;
}

function getGenresHTML(game) {
    if (!game.genres || !Array.isArray(game.genres) || game.genres.length === 0) return '';
    return `<div class="game-genres">` +
        game.genres.map(g => `<span class="game-genre-badge">${g.name}</span>`).join('') +
        `</div>`;
}

function setImgFallback(img, fallbackUrl) {
    img.onerror = function() {
        if (img.src !== fallbackUrl) {
            img.src = fallbackUrl;
        }
    };
}

function renderGameCarousel(games, container) {
    container.innerHTML = '';
    if (!games.length) {
        container.innerHTML = '<div style="color:#888;font-size:1.1rem;padding:2rem;">No games found.</div>';
        return;
    }
    const fallbackUrl = 'https://via.placeholder.com/420x180?text=No+Image';
    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.tabIndex = 0;
        card.innerHTML = `
            <div class="game-card-inner">
                <div class="game-card-front">
                    <div class="game-card-img-gradient-wrapper">
                        <img src="${game.background_image ? game.background_image : fallbackUrl}" alt="${game.name}" data-game-name="${encodeURIComponent(game.name)}">
                        <div class="game-card-img-overlay">
                            <div class="game-card-title" style="margin-bottom:0.4vw;">${game.name}</div>
                            <div class="game-card-info">
                                <b>Rating:</b> <span>${getStarRatingHTML(game.rating)}</span>
                            </div>
                            ${getGenresHTML(game)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    container.querySelectorAll('.game-card-img-gradient-wrapper img').forEach(img => {
        setImgFallback(img, fallbackUrl);
        img.addEventListener('click', function() {
            const gameName = this.getAttribute('data-game-name');
            if (gameName) window.location.href = `gamepage.html?name=${gameName}`;
        });
        img.style.cursor = "pointer";
    });
}

let trendingGames = [];
let trendingCurrent = 0;
let trendingInterval = null;

function renderTrendingSlider(games) {
    const slider = document.getElementById('trending-slider');
    const dots = document.getElementById('trending-slider-dots');
    slider.innerHTML = '';
    dots.innerHTML = '';
    if (!games.length) {
        slider.innerHTML = '<div style="color:#888;font-size:1.1rem;padding:2rem;">No trending games found.</div>';
        return;
    }
    const fallbackUrl = 'https://via.placeholder.com/900x320?text=No+Image';
    games.forEach((game, idx) => {
        const slide = document.createElement('div');
        slide.className = 'trending-slide';
        slide.innerHTML = `
            <img src="${game.background_image ? game.background_image : fallbackUrl}" alt="${game.name}" data-game-name="${encodeURIComponent(game.name)}" style="width:100%;height:100%;aspect-ratio:16/9;object-fit:cover;display:block;"/>
            <div class="trending-slide-title">
                ${game.name}
                ${getGenresHTML(game)}
            </div>
        `;
        slider.appendChild(slide);
        const dot = document.createElement('div');
        dot.className = 'trending-slider-dot' + (idx === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
            trendingGoTo(idx);
            trendingRestartInterval();
        });
        dots.appendChild(dot);
    });
    slider.querySelectorAll('img[data-game-name]').forEach(img => {
        setImgFallback(img, fallbackUrl);
        img.addEventListener('click', function() {
            const gameName = this.getAttribute('data-game-name');
            if (gameName) window.location.href = `gamepage.html?name=${gameName}`;
        });
        img.style.cursor = "pointer";
    });
    trendingCurrent = 0;
    trendingUpdateSlider();
    trendingRestartInterval();
}

function trendingUpdateSlider() {
    const slider = document.getElementById('trending-slider');
    slider.style.transform = `translateX(-${trendingCurrent * 100}%)`;
    const dots = document.querySelectorAll('.trending-slider-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === trendingCurrent);
    });
}

function trendingGoTo(idx) {
    trendingCurrent = idx;
    trendingUpdateSlider();
}

function trendingNext() {
    if (!trendingGames.length) return;
    trendingCurrent = (trendingCurrent + 1) % trendingGames.length;
    trendingUpdateSlider();
}

function trendingRestartInterval() {
    if (trendingInterval) clearInterval(trendingInterval);
    trendingInterval = setInterval(trendingNext, 3500);
}

function showError(msg) {
    document.getElementById('error').textContent = msg;
}

function clearError() {
    document.getElementById('error').textContent = '';
}

document.getElementById('game-search-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const gameName = document.getElementById('game-name-input').value.trim();
    const resultsSection = document.getElementById('search-results-section');
    const resultsDiv = document.getElementById('search-results');
    clearError();
    resultsSection.style.display = 'none';
    resultsDiv.innerHTML = '';
    if (!gameName) {
        showError('Please enter a game name.');
        document.getElementById('featured-section').style.display = '';
        document.getElementById('categories-container').style.display = '';
        document.getElementById('category-nav-buttons').style.display = '';
        return;
    }
    document.getElementById('featured-section').style.display = 'none';
    document.getElementById('categories-container').style.display = 'none';
    document.getElementById('category-nav-buttons').style.display = '';
    resultsDiv.innerHTML = '<div style="color:#888;padding:2rem;">Searching...</div>';
    resultsSection.style.display = '';
    try {
        const games = await searchGamesByName(gameName);
        renderGameCarousel(games, resultsDiv);
    } catch {
        resultsDiv.innerHTML = '';
        showError('Error fetching data. Please try again later.');
    }
});

document.getElementById('game-name-input').addEventListener('input', function() {
    if (!this.value.trim()) {
        document.getElementById('search-results-section').style.display = 'none';
        document.getElementById('featured-section').style.display = '';
        document.getElementById('categories-container').style.display = '';
        document.getElementById('category-nav-buttons').style.display = '';
    }
});

async function showTrending() {
    const featuredDiv = document.getElementById('featured-carousel');
    featuredDiv.innerHTML = '<div style="color:#888;padding:2rem;">Loading...</div>';
    try {
        const games = await fetchTrendingGames();
        renderGameCarousel(games, featuredDiv);
    } catch {
        featuredDiv.innerHTML = '<div style="color:#e50914;padding:2rem;">Failed to load trending games.</div>';
    }
}

let selectedCategoryId = null;

function renderCategoryNavButtons() {
    const nav = document.getElementById('category-nav-buttons');
    nav.style.display = '';
    nav.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-nav-button';
        btn.textContent = cat.name;
        btn.setAttribute('data-category-id', cat.id);
        if (selectedCategoryId === cat.id) btn.classList.add('active');
        btn.addEventListener('click', async function() {
            if (selectedCategoryId === cat.id) return;
            selectedCategoryId = cat.id;
            document.getElementById('featured-section').style.display = 'none';
            document.getElementById('categories-container').style.display = 'none';
            document.getElementById('search-results-section').style.display = 'none';
            document.getElementById('category-nav-buttons').style.display = '';
            const section = document.getElementById('selected-category-section');
            section.style.display = '';
            const title = document.getElementById('selected-category-title');
            title.textContent = cat.name + ' Games';
            const carousel = document.getElementById('selected-category-carousel');
            carousel.innerHTML = '<div style="color:#888;padding:2rem;">Loading...</div>';
            renderCategoryNavButtons();
            try {
                const games = await fetchGamesByCategory(cat.id);
                renderGameCarousel(games, carousel);
            } catch {
                carousel.innerHTML = '<div style="color:#e50914;padding:2rem;">Failed to load games for this category.</div>';
            }
            addBackToAllCategoriesButton();
        });
        nav.appendChild(btn);
    });
}

async function showCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    categoriesContainer.innerHTML = '';
    for (const cat of categories) {
        const section = document.createElement('div');
        section.className = 'category-section';
        const title = document.createElement('div');
        title.className = 'carousel-title';
        title.textContent = cat.name + ' Games';
        section.appendChild(title);
        const carousel = document.createElement('div');
        carousel.className = 'game-carousel';
        carousel.innerHTML = '<div style="color:#888;padding:2rem;">Loading...</div>';
        section.appendChild(carousel);
        categoriesContainer.appendChild(section);
        try {
            const games = await fetchGamesByCategory(cat.id);
            renderGameCarousel(games, carousel);
        } catch {
            carousel.innerHTML = '<div style="color:#e50914;padding:2rem;">Failed to load games for this category.</div>';
        }
    }
}

function addBackToAllCategoriesButton() {
    const section = document.getElementById('selected-category-section');
    let btn = document.getElementById('back-to-all-categories-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'back-to-all-categories-btn';
        btn.textContent = 'Back to All Categories';
        btn.className = 'category-nav-button';
        btn.style.margin = '1.2rem 0 0.5rem 0';
        btn.addEventListener('click', function() {
            selectedCategoryId = null;
            section.style.display = 'none';
            document.getElementById('featured-section').style.display = '';
            document.getElementById('categories-container').style.display = '';
            document.getElementById('category-nav-buttons').style.display = '';
            renderCategoryNavButtons();
        });
        section.insertBefore(btn, section.firstChild);
    }
}

function showSelectedCategorySectionIfNeeded() {
    if (selectedCategoryId) {
        document.getElementById('featured-section').style.display = 'none';
        document.getElementById('categories-container').style.display = 'none';
        document.getElementById('search-results-section').style.display = 'none';
        document.getElementById('selected-category-section').style.display = '';
        document.getElementById('category-nav-buttons').style.display = '';
        addBackToAllCategoriesButton();
    } else {
        document.getElementById('selected-category-section').style.display = 'none';
        document.getElementById('category-nav-buttons').style.display = '';
    }
}

async function showTrendingSlider() {
    const slider = document.getElementById('trending-slider');
    slider.innerHTML = '<div style="color:#888;font-size:1.1rem;padding:2rem;">Loading trending games...</div>';
    try {
        trendingGames = await fetchTrendingGames();
        renderTrendingSlider(trendingGames);
    } catch {
        slider.innerHTML = '<div style="color:#e50914;font-size:1.1rem;padding:2rem;">Failed to load trending games.</div>';
    }
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hide');
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
}

(async function() {
    await Promise.all([
        showTrendingSlider(),
        showTrending(),
        showCategories()
    ]);
    renderCategoryNavButtons();
    showSelectedCategorySectionIfNeeded();
    document.getElementById('category-nav-buttons').style.display = '';
    hidePreloader();
})();

document.addEventListener('DOMContentLoaded', function() {
    renderCategoryNavButtons();
    document.getElementById('category-nav-buttons').style.display = '';
});

document.getElementById('selected-category-section').style.display = 'none';
document.getElementById('category-nav-buttons').style.display = '';

const trendingSliderContainer = document.getElementById('trending-slider-container');
trendingSliderContainer.addEventListener('mouseenter', () => {
    if (trendingInterval) clearInterval(trendingInterval);
});
trendingSliderContainer.addEventListener('mouseleave', () => {
    trendingRestartInterval();
});
trendingSliderContainer.addEventListener('focusin', () => {
    if (trendingInterval) clearInterval(trendingInterval);
});
trendingSliderContainer.addEventListener('focusout', () => {
    trendingRestartInterval();
});

setTimeout(hidePreloader, 7000);