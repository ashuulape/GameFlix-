function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}
const apiKey = '45dbb14c7bb84b8bb943f1b1bbd3a093';
const baseUrl = 'https://api.rawg.io/api/games';

async function fetchScreenshots(gameId) {
    const url = `${baseUrl}/${gameId}/screenshots?key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
}

async function fetchPublishers(gameId) {
    return null;
}

async function fetchGameDetailsByName(gameName) {
    const searchUrl = `${baseUrl}?key=${apiKey}&search=${encodeURIComponent(gameName)}&page_size=1`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) throw new Error('Failed to search for game');
    const searchData = await searchResp.json();
    if (!searchData.results || searchData.results.length === 0) throw new Error('Game not found');
    const gameId = searchData.results[0].id;
    const detailsUrl = `${baseUrl}/${gameId}?key=${apiKey}`;
    const detailsResp = await fetch(detailsUrl);
    if (!detailsResp.ok) throw new Error('Failed to fetch game details');
    const details = await detailsResp.json();

    details.screenshots = await fetchScreenshots(gameId);

    async function fetchAndAttach(endpoint, prop) {
        if (endpoint === 'screenshots' || endpoint === 'publishers') return;
        const url = `${baseUrl}/${gameId}/${endpoint}?key=${apiKey}`;
        const resp = await fetch(url);
        if (resp.ok) details[prop] = await resp.json();
    }
    const endpoints = [
        { endpoint: 'movies', prop: 'movies' },
        { endpoint: 'achievements', prop: 'achievements' },
        { endpoint: 'stores', prop: 'stores_full' },
        { endpoint: 'youtube', prop: 'youtube' },
        { endpoint: 'parent-games', prop: 'parent_games' },
        { endpoint: 'game-series', prop: 'game_series' },
        { endpoint: 'additions', prop: 'additions' },
        { endpoint: 'suggested', prop: 'suggested' },
        { endpoint: 'twitch', prop: 'twitch' }
    ];
    await Promise.all(endpoints.map(e => fetchAndAttach(e.endpoint, e.prop)));
    return details;
}

function renderGameDetails(game) {
    const container = document.getElementById('game-details');
    let genres = (game.genres || []).map(g => g.name).join(', ');
    let platforms = (game.platforms || []).map(p => p.platform.name).join(', ');
    let tags = (game.tags || []).slice(0, 8).map(t => `<span class="tag">${t.name}</span>`).join(' ');
    let released = game.released ? `<b>Released</b>: ${game.released}` : '';
    let esrb = game.esrb_rating ? `<b>ESRB: </b>${game.esrb_rating.name}` : '';
    let stores = (game.stores || []).map(s => {
        const store = s.store || {};
        const storeName = store.name || 'Store';
        const url = s.url || (store.domain ? 'https://' + store.domain : '#');
        return `<a href="${url}" target="_blank" rel="noopener">${storeName}</a>`;
    }).join(' ');
    let background = game.background_image ? `<img src="${game.background_image}" alt="${game.name}" class="game-image">` : '';
    let extraSections = '';
    let screenshots = '';

    let publishers = (game.publishers || []).map(p => p.name).join(', ');
    let publishersSection = '';
    if (publishers) {
        publishersSection = `<div class="game-meta"><b>Publishers:</b> ${publishers}</div>`;
    }

    if (game.screenshots && Array.isArray(game.screenshots.results) && game.screenshots.results.length > 0) {
        screenshots += `<div style="margin-top:2rem;">
            <b style="padding-left:20px;color:red">Screenshots:</b>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.7rem;justify-content:center;align-items:center;">
                ${game.screenshots.results.slice(0,7).map(s => `<img class="screenshots" src="${s.image}" alt="Screenshot">`).join('')}
            </div>
        </div>`;
    }
    if (game.movies && game.movies.results && game.movies.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Trailers:</b>
            <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:0.7rem;padding-left:20px">
                ${game.movies.results.slice(0,2).map(m => `
                    <video controls style="max-width:320px;max-height:180px;border-radius:6px;box-shadow:0 2px 8px #0007;">
                        <source src="${m.data.max}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `).join('')}
            </div>
        </div>`;
    }
    if (game.achievements && game.achievements.results && game.achievements.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Achievements:</b>
            <ul class="achievements" style="margin-top:0.7rem; ">
                ${game.achievements.results.slice(0,5).map(a => `<li>${a.name}${a.description ? ` - <span style="color:#bbb;" >${a.description}</span>` : ''}</li>`).join('')}
            </ul>
        </div>`;
    }
    if (game.youtube && game.youtube.results && game.youtube.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">YouTube Videos:</b>
            <ul style="margin-top:0.7rem;">
                ${game.youtube.results.slice(0,3).map(y => `<li><a href="https://www.youtube.com/watch?v=${y.external_id}" target="_blank" rel="noopener">${y.name}</a></li>`).join('')}
            </ul>
        </div>`;
    }
    if (game.parent_games && game.parent_games.results && game.parent_games.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Parent Games:</b>
            <ul style="margin-top:0.7rem;">
                ${game.parent_games.results.map(pg => `<li>${pg.name}</li>`).join('')}
            </ul>
        </div>`;
    }
    if (game.game_series && game.game_series.results && game.game_series.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Game Series:</b>
            <ul style="margin-top:0.7rem;">
                ${game.game_series.results.map(gs => `<li>${gs.name}</li>`).join('')}
            </ul>
        </div>`;
    }
    if (game.additions && game.additions.results && game.additions.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Additions:</b>
            <ul style="margin-top:0.7rem;padding-left:20px">
                ${game.additions.results.map(a => `<li>${a.name}</li>`).join('')}
            </ul>
        </div>`;
    }
    if (game.suggested && game.suggested.results && game.suggested.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Suggested Games:</b>
            <ul style="margin-top:0.7rem;">
                ${game.suggested.results.map(sg => `<li>${sg.name}</li>`).join('')}
            </ul>
        </div>`;
    }
    if (game.twitch && game.twitch.results && game.twitch.results.length > 0) {
        extraSections += `<div style="margin-top:2rem;">
            <b style="color:red">Twitch Streams:</b>
            <ul style="margin-top:0.7rem;">
                ${game.twitch.results.slice(0,3).map(tw => `<li><a href="${tw.url}" target="_blank" rel="noopener">${tw.title}</a></li>`).join('')}
            </ul>
        </div>`;
    }

    let becomeapirate = `<div class="pirate"><b>Become a Pirate (Download Crack version)</b>
        <div class="pilink">
            <a href="https://steamunlocked.org/?s=${game.name}"><div class="steamunlocked" title="STEAMUNLOCKED"></div></a>
            <a href="https://fitgirl-repacks.site/?s=${game.name}"><div class="fitgirl" title="FITGIRL-REPACK"></div></a>
            <a href="https://steamrip.com/?s=${game.name}"><div class="steamrip" title="STEAMRIP"></div></a>
            <a href="https://dodi-repacks.site/?s=${game.name}"><div class="dodi" title="DODI-REPACK"></div></a>
            <a href="https://repack-games.com/?s=${game.name}"><div class="repack" title="REPACK-GAMES"></div></a>
            <a href="https://gamesleech.com/?s=${game.name}"><div class="sleesh" title="GAMESLEESH"></div></a>
            <a href="https://www.ovagames.com/?s=${game.name}&x=44&y=11"><div class="ova" title="OVAGAMES"></div></a>
        </div>
    </div>`;

    document.getElementById('webtitle').innerHTML = game.name;
    container.innerHTML = `
        <div class="game-header">
            <div class="gameimg">
                ${background}
            </div>
            <div class="game-info">
                <div class="game-title">
                    <div class="red">‎ </div>
                    <a href="https://www.youtube.com/results?search_query=${game.name || ''}+trailer" title="Watch trailer of ${game.name} on YouTube">${game.name || ''}</a>
                </div>
                <div class="game-meta">
                    ${released ? released + ' &nbsp;|&nbsp; ' : ''}
                    ${(function() {
                        let ratingValue = parseFloat(game.rating) || 0;
                        let fullStars = Math.floor(ratingValue);
                        let halfStar = (ratingValue - fullStars) >= 0.5 ? 1 : 0;
                        let emptyStars = 5 - fullStars - halfStar;
                        let starsHtml = '';
                        for (let i = 0; i < fullStars; i++) starsHtml += '<span style="color:#FFD700;font-size:1.2em;">&#9733;</span>';
                        if (halfStar) starsHtml += '<span style="color:#FFD700;font-size:1.2em;">&#189;</span>';
                        for (let i = 0; i < emptyStars; i++) starsHtml += '<span style="color:#555;font-size:1.2em;">&#9733;</span>';
                        return ` <b>Rating:</b> ${starsHtml} <span style="color:#bbb;font-size:1em;">(${game.rating ? game.rating : 'N/A'} / 5)</span>`;
                    })()}
                    ${esrb ? ' &nbsp;|&nbsp; ' + esrb : ''}
                </div>
                <div class="game-meta"><b>Genres:</b> ${genres || 'N/A'}</div>
                <div class="game-meta"><b>Platforms:</b> ${platforms || 'N/A'}</div>
                ${publishersSection}
                <div class="game-tags">${tags}</div>
                <div class="game-links">
                    ${stores ? '<br><b>Stores:</b> ' + stores : ''}
                </div>
            </div>
            ${becomeapirate}<br>
            ${screenshots}<br><br>
        </div>
        <div class="game-footer" style="padding-left:20px">
        <div class="game-description"><b  style="color:red">Description:</b><br>${
            (() => {
                const desc = game.description_raw ? game.description_raw : (game.description || 'No description available.');
                if (desc === 'No description available.') return desc;
                const words = desc.split(/\s+/);
                if (words.length <= 150) return desc;
                return words.slice(0, 150).join(' ') + '...';
            })()
        }</div>
        ${extraSections}
        </div>
    `;
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hide');
        setTimeout(() => {
            if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 500);
    }
}

(async function() {
    const gameName = getQueryParam('name');
    const detailsDiv = document.getElementById('game-details');
    if (!gameName) {
        detailsDiv.innerHTML = '<div class="error">No game specified.</div>';
        hidePreloader();
        return;
    }
    try {
        const game = await fetchGameDetailsByName(gameName);
        renderGameDetails(game);
    } catch (err) {
        detailsDiv.innerHTML = `<div class="error">${err.message}</div>`;
    }
    hidePreloader();
})();