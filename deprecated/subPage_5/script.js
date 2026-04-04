const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.querySelector('.play-pause-btn');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const albumArtImg = document.getElementById('album-art-img');
const albumArt = document.querySelector('.album-art');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const sakuraContainer = document.querySelector('.sakura-container');
const lyricsContainer = document.querySelector('.lyrics-container');
const lyricsEl = document.querySelector('.lyrics');
const currentTimeEl = document.querySelector('.current-time');
const totalTimeEl = document.querySelector('.total-time');
const songTitleEl = document.querySelector('.song-title');
const artistNameEl = document.querySelector('.artist-name');
const playlistContainer = document.querySelector('.playlist-container');
const playlistHeader = document.querySelector('.playlist-header');
const playlistEl = document.querySelector('.playlist');


let songs = [];
let currentSongIndex = 0;
let lyrics = [];
let currentLineIndex = -1;

// --- Song and Playlist Management ---

async function loadPlaylist() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        songs = await response.json();
        if (songs.length > 0) {
            generatePlaylist();
            loadSong(currentSongIndex);
        } else {
            showError("播放清單是空的。");
        }
    } catch (e) {
        console.error('Error fetching playlist:', e);
        showError("無法載入播放清單。");
    }
}

function generatePlaylist() {
    playlistEl.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.dataset.index = index;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'title';
        titleSpan.textContent = song.title;

        const artistSpan = document.createElement('span');
        artistSpan.className = 'artist';
        artistSpan.textContent = song.artist;

        const infoDiv = document.createElement('div');
        infoDiv.appendChild(titleSpan);
        infoDiv.appendChild(artistSpan);

        li.appendChild(infoDiv);
        playlistEl.appendChild(li);
    });
}

function updatePlaylistHighlight() {
    const listItems = playlistEl.querySelectorAll('li');
    listItems.forEach((item, index) => {
        item.classList.toggle('active-song', index === currentSongIndex);
    });
}

function loadSong(index) {
    const song = songs[index];
    if (!song) return;

    currentSongIndex = index;
    songTitleEl.textContent = song.title || '未知歌曲';
    artistNameEl.textContent = song.artist || '未知演出者';
    albumArtImg.src = song.artworkSrc || 'avatar.svg';
    audioPlayer.src = song.audioSrc || '';
    
    resetPlayerState();
    updatePlaylistHighlight();

    if (song.lyricsSrc) {
        fetchLyrics(song.lyricsSrc);
    } else {
        lyrics = [];
        displayLyrics();
    }
    
    audioPlayer.load();
}

function resetPlayerState() {
    progress.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    currentLineIndex = -1;
    lyricsEl.innerHTML = '';
    lyricsEl.style.transform = 'translateY(0)';
}

function nextSong() {
    let newIndex = currentSongIndex + 1;
    if (newIndex >= songs.length) {
        newIndex = 0;
    }
    loadSong(newIndex);
    playSong();
}

function prevSong() {
    let newIndex = currentSongIndex - 1;
    if (newIndex < 0) {
        newIndex = songs.length - 1;
    }
    loadSong(newIndex);
    playSong();
}

// --- Lyrics ---

async function fetchLyrics(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        lyrics = data;
        displayLyrics();
    } catch (e) {
        console.error('Error fetching or parsing lyrics:', e);
        lyrics = [];
        lyricsEl.textContent = '歌詞載入失敗。';
    }
}

function displayLyrics() {
    lyricsEl.innerHTML = ''; // Clear existing lyrics
    if (lyrics.length === 0) {
        lyricsEl.textContent = '沒有可用的歌詞。';
        return;
    }
    lyrics.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.textContent = line.line;
        lyricsEl.appendChild(lineEl);
    });
}

function updateLyricLineHighlight() {
    const lyricLines = lyricsEl.querySelectorAll('div');
    lyricLines.forEach((line, index) => {
        line.classList.toggle('active', index === currentLineIndex);
    });
}

function scrollLyrics() {
    const lyricLines = lyricsEl.querySelectorAll('div');
    const activeLine = lyricLines[currentLineIndex];
    if (activeLine) {
        const containerHeight = lyricsContainer.clientHeight;
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;
        const scrollAmount = lineTop - (containerHeight / 2) + (lineHeight / 2);
        
        lyricsEl.style.transform = `translateY(-${scrollAmount}px)`;
    }
}

// --- Player Controls ---

function playSong() {
    if (!songs[currentSongIndex]?.audioSrc) return; // Don't play if no source
    albumArt.classList.add('playing');
    playPauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-pause"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    audioPlayer.play();
}

function pauseSong() {
    albumArt.classList.remove('playing');
    playPauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    audioPlayer.pause();
}

function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function showError(message) {
    songTitleEl.textContent = "錯誤";
    artistNameEl.textContent = message;
}

// --- Event Listeners ---

playPauseBtn.addEventListener('click', () => {
    const isPlaying = albumArt.classList.contains('playing');
    isPlaying ? pauseSong() : playSong();
});

nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

playlistHeader.addEventListener('click', () => {
    playlistContainer.classList.toggle('expanded');
});

playlistEl.addEventListener('click', (e) => {
    const listItem = e.target.closest('li');
    if (listItem) {
        const index = parseInt(listItem.dataset.index, 10);
        if (index !== currentSongIndex) {
            loadSong(index);
            playSong();
        }
        // Collapse the playlist after selection
        playlistContainer.classList.remove('expanded');
    }
});

audioPlayer.addEventListener('ended', nextSong);

audioPlayer.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;

    // Always update time and progress bar
    currentTimeEl.textContent = formatTime(currentTime);
    if (isFinite(duration)) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
    } else {
        progress.style.width = '0%';
    }
    
    // Then, handle lyrics if they exist
    if (!lyrics.length) return;

    // Find current lyric line
    let newLineIndex = lyrics.findIndex(line => currentTime >= line.start && currentTime <= line.end);
    if (newLineIndex === -1) { // Fallback for between lines
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].start > currentTime) {
                newLineIndex = i > 0 ? i - 1 : 0;
                break;
            }
        }
        if (newLineIndex === -1) newLineIndex = lyrics.length - 1;
    }

    if (newLineIndex !== currentLineIndex) {
        currentLineIndex = newLineIndex;
        updateLyricLineHighlight();
        scrollLyrics();
    }
});

progressBar.addEventListener('click', (e) => {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    if (isFinite(duration)) {
        audioPlayer.currentTime = (clickX / width) * duration;
    }
});

// --- Sakura Animation ---
const petals = [];
const numberOfPetals = 30;
let currentWind = 15;
let targetWind = 15;

function createPetals() {
    for (let i = 0; i < numberOfPetals; i++) {
        const petalEl = document.createElement('div');
        petalEl.classList.add('petal');
        sakuraContainer.appendChild(petalEl);

        petals.push({
            el: petalEl,
            x: Math.random() * window.innerWidth,
            y: Math.random() * -window.innerHeight,
            fallSpeed: Math.random() * 1.0 + 1.0,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 2 - 1,
            swayAmplitude: Math.random() * 10 + 10,
            swayFrequency: Math.random() * 0.01 + 0.005,
            swayPhase: Math.random() * Math.PI * 2,
            flutterAmplitude: Math.random() * 5 + 2,
            flutterFrequency: Math.random() * 0.04 + 0.02,
            flutterPhase: Math.random() * Math.PI * 2,
        });
    }
}

let lastTime = 0;
function animatePetals(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    currentWind += (targetWind - currentWind) * 0.01;

    petals.forEach(p => {
        p.y += p.fallSpeed;
        p.x += currentWind * deltaTime;
        
        const sway = p.swayAmplitude * Math.sin(p.swayFrequency * p.y + p.swayPhase);
        const flutter = p.flutterAmplitude * Math.sin(p.flutterFrequency * p.y + p.flutterPhase);
        p.rotation += p.rotationSpeed;

        if (p.y > window.innerHeight + 20) {
            p.y = -20;
            p.x = Math.random() * window.innerWidth;
        }
        if (currentWind > 0 && p.x > window.innerWidth + 20) {
            p.x = -20;
        } else if (currentWind < 0 && p.x < -20) {
            p.x = window.innerWidth + 20;
        }

        p.el.style.transform = `translate(${p.x + sway + flutter}px, ${p.y}px) rotate(${p.rotation}deg)`;
    });

    requestAnimationFrame(animatePetals);
}

function changeWind() {
    targetWind = (Math.random() * 80) - 40;
}

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylist();
    createPetals();
    requestAnimationFrame(animatePetals);
    setInterval(changeWind, 7000);
});