const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.querySelector('.play-pause-btn');
const albumArt = document.querySelector('.album-art');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const sakuraContainer = document.querySelector('.sakura-container');

// Create Sakura Petals
const numberOfPetals = 20;
for (let i = 0; i < numberOfPetals; i++) {
    const petal = document.createElement('div');
    petal.classList.add('petal');
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5-10 seconds
    petal.style.animationDelay = `${Math.random() * 5}s`;
    petal.style.transform = `rotate(${Math.random() * 360}deg)`;
    sakuraContainer.appendChild(petal);
}


playPauseBtn.addEventListener('click', () => {
    const isPlaying = albumArt.classList.contains('playing');

    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

function playSong() {
    albumArt.classList.add('playing');
    playPauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-pause"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    audioPlayer.play();
}

function pauseSong() {
    albumArt.classList.remove('playing');
    playPauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    audioPlayer.pause();
}

audioPlayer.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
});

progressBar.addEventListener('click', (e) => {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;

    audioPlayer.currentTime = (clickX / width) * duration;
});
