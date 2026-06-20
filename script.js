const player = document.getElementById("player");
const video = document.getElementById("video");

const playBtn = document.getElementById("play");
const backBtn = document.getElementById("back");
const forwardBtn = document.getElementById("forward");

const volumeBtn = document.getElementById("volumeBtn");
const volume = document.getElementById("volume");
const volumeIconHigh = document.getElementById("volumeIconHigh");
const volumeIconMute = document.getElementById("volumeIconMute");

const fullscreen = document.getElementById("fullscreen");
const fullscreenIconOpen = document.getElementById("fullscreenIconOpen");
const fullscreenIconClose = document.getElementById("fullscreenIconClose");

const time = document.getElementById("time");

const progressBar = document.getElementById("progressBar");
const bufferedBar = document.getElementById("bufferedBar");
const playedBar = document.getElementById("playedBar");
const progressTooltip = document.getElementById("progressTooltip");

const bigPlay = document.getElementById("bigPlay");
const centerFlash = document.getElementById("centerFlash");
const centerFlashIcon = document.getElementById("centerFlashIcon");

const spinner = document.getElementById("spinner");

const settingsBtn = document.getElementById("settings");
const settingsMenu = document.getElementById("settingsMenu");
const speedOptions = document.querySelectorAll(".speed-option");

const fileInput = document.getElementById("fileInput");
const openFileBtn = document.getElementById("openFileBtn");
const emptyState = document.getElementById("emptyState");
const topBar = document.getElementById("topBar");
const videoTitle = document.getElementById("videoTitle");

let hideTimer;
let isDragging = false;
let lastVolume = 1;
let currentObjectURL = null;

const PLAY_ICON = `<path d="M8 5v14l11-7z"/>`;
const PAUSE_ICON = `<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>`;

/* ===================== Utilidades ===================== */

function format(sec) {

    if (!isFinite(sec) || sec < 0) sec = 0;

    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/* ===================== Selección / carga de archivo de video ===================== */

function loadVideoFile(file) {

    if (!file || !file.type.startsWith("video/")) return;

    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
    }

    currentObjectURL = URL.createObjectURL(file);

    video.src = currentObjectURL;
    video.load();

    player.classList.add("has-video");

    videoTitle.textContent = file.name.replace(/\.[^/.]+$/, "");

    video.play();
}

fileInput.onchange = (e) => {

    const file = e.target.files[0];
    loadVideoFile(file);

    // Permite volver a seleccionar el mismo archivo más adelante
    fileInput.value = "";
};

openFileBtn.onclick = () => fileInput.click();
emptyState.onclick = () => fileInput.click();

player.addEventListener("dragover", (e) => {
    e.preventDefault();
    player.classList.add("drag-over");
});

player.addEventListener("dragleave", () => {
    player.classList.remove("drag-over");
});

player.addEventListener("drop", (e) => {

    e.preventDefault();
    player.classList.remove("drag-over");

    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    loadVideoFile(file);
});

/* ===================== Play / Pausa ===================== */

function updatePlayIcon() {

    const icon = video.paused ? PLAY_ICON : PAUSE_ICON;

    playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${icon}</svg>`;
    bigPlay.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${icon}</svg>`;

    playBtn.setAttribute("aria-label", video.paused ? "Reproducir" : "Pausar");

    player.classList.toggle("is-playing", !video.paused);
}

function togglePlay() {

    if (!player.classList.contains("has-video")) {
        fileInput.click();
        return;
    }

    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function flashCenterIcon() {

    centerFlashIcon.innerHTML = video.paused ? PLAY_ICON : PAUSE_ICON;

    centerFlash.classList.remove("flash");
    // Reinicia la animación
    void centerFlash.offsetWidth;
    centerFlash.classList.add("flash");
}

playBtn.onclick = () => {
    togglePlay();
};

bigPlay.onclick = () => {
    togglePlay();
};

video.onclick = () => {
    togglePlay();
    flashCenterIcon();
};

video.addEventListener("play", updatePlayIcon);
video.addEventListener("pause", updatePlayIcon);

/* ===================== Retroceder / Avanzar ===================== */

backBtn.onclick = () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
};

forwardBtn.onclick = () => {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
};

/* ===================== Volumen ===================== */

function updateVolumeUI() {

    volume.value = video.muted ? 0 : video.volume;
    volume.style.setProperty("--vol", `${(video.muted ? 0 : video.volume) * 100}%`);

    const isMuted = video.muted || video.volume === 0;

    volumeIconHigh.style.display = isMuted ? "none" : "block";
    volumeIconMute.style.display = isMuted ? "block" : "none";

    volumeBtn.setAttribute("aria-label", isMuted ? "Activar sonido" : "Silenciar");
}

volume.oninput = () => {

    video.volume = volume.value;
    video.muted = Number(volume.value) === 0;

    if (video.volume > 0) lastVolume = video.volume;

    updateVolumeUI();
};

volumeBtn.onclick = () => {

    if (video.muted || video.volume === 0) {

        video.muted = false;
        video.volume = lastVolume || 1;

    } else {

        lastVolume = video.volume;
        video.muted = true;
    }

    updateVolumeUI();
};

/* ===================== Tiempo / metadatos ===================== */

video.addEventListener("loadedmetadata", () => {

    time.textContent = `00:00 / ${format(video.duration)}`;
    updateVolumeUI();
});

video.addEventListener("timeupdate", () => {

    if (!isDragging) {
        const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
        playedBar.style.width = `${pct}%`;
    }

    time.textContent = `${format(video.currentTime)} / ${format(video.duration)}`;
});

video.addEventListener("progress", () => {

    if (video.buffered.length && video.duration) {

        const end = video.buffered.end(video.buffered.length - 1);
        bufferedBar.style.width = `${(end / video.duration) * 100}%`;
    }
});

/* ===================== Spinner de carga ===================== */

video.addEventListener("waiting", () => spinner.classList.add("show"));
video.addEventListener("playing", () => spinner.classList.remove("show"));
video.addEventListener("canplay", () => spinner.classList.remove("show"));

/* ===================== Barra de progreso (drag + hover) ===================== */

function seekFromEvent(clientX) {

    const rect = progressBar.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.min(1, Math.max(0, pct));

    return pct;
}

function updateTooltip(clientX) {

    const pct = seekFromEvent(clientX);
    const rect = progressBar.getBoundingClientRect();

    const t = pct * (video.duration || 0);

    progressTooltip.textContent = format(t);

    let left = pct * rect.width;
    left = Math.min(rect.width - 4, Math.max(4, left));

    progressTooltip.style.left = `${left}px`;
}

progressBar.addEventListener("pointermove", (e) => {

    updateTooltip(e.clientX);

    if (isDragging) {

        const pct = seekFromEvent(e.clientX);
        playedBar.style.width = `${pct * 100}%`;
        video.currentTime = pct * (video.duration || 0);
    }
});

progressBar.addEventListener("pointerdown", (e) => {

    isDragging = true;
    progressBar.classList.add("dragging");

    const pct = seekFromEvent(e.clientX);
    playedBar.style.width = `${pct * 100}%`;
    video.currentTime = pct * (video.duration || 0);

    progressBar.setPointerCapture(e.pointerId);
});

function endDrag(e) {

    if (!isDragging) return;

    isDragging = false;
    progressBar.classList.remove("dragging");
}

progressBar.addEventListener("pointerup", endDrag);
progressBar.addEventListener("pointercancel", endDrag);

/* ===================== Pantalla completa ===================== */

function updateFullscreenIcon() {

    const isFs = !!document.fullscreenElement;

    fullscreenIconOpen.style.display = isFs ? "none" : "block";
    fullscreenIconClose.style.display = isFs ? "block" : "none";

    fullscreen.setAttribute("aria-label", isFs ? "Salir de pantalla completa" : "Pantalla completa");

    player.classList.toggle("is-fullscreen", isFs);
}

fullscreen.onclick = () => {

    if (!document.fullscreenElement) {
        player.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

document.addEventListener("fullscreenchange", updateFullscreenIcon);

video.ondblclick = () => {
    fullscreen.click();
};

/* ===================== Menú de velocidad ===================== */

settingsBtn.onclick = (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle("open");
};

speedOptions.forEach((btn) => {

    btn.onclick = (e) => {

        e.stopPropagation();

        const speed = parseFloat(btn.dataset.speed);
        video.playbackRate = speed;

        speedOptions.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        settingsMenu.classList.remove("open");
    };
});

document.addEventListener("click", (e) => {

    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
        settingsMenu.classList.remove("open");
    }
});

/* ===================== Atajos de teclado ===================== */

document.addEventListener("keydown", (e) => {

    // Evita interferir si el foco está en un input (ej. el de volumen)
    if (e.target.tagName === "INPUT") return;

    switch (e.code) {

        case "Space":
        case "KeyK":
            e.preventDefault();
            togglePlay();
            flashCenterIcon();
            break;

        case "ArrowLeft":
        case "KeyJ":
            video.currentTime = Math.max(0, video.currentTime - 10);
            break;

        case "ArrowRight":
        case "KeyL":
            video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
            break;

        case "KeyF":
            fullscreen.click();
            break;

        case "KeyM":
            volumeBtn.click();
            break;

        case "ArrowUp":
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.05);
            video.muted = false;
            updateVolumeUI();
            break;

        case "ArrowDown":
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.05);
            updateVolumeUI();
            break;
    }
});

/* ===================== Auto-ocultar controles ===================== */

function showControls() {

    player.classList.remove("hide-controls");

    clearTimeout(hideTimer);

    hideTimer = setTimeout(() => {

        if (!video.paused && !isDragging && !settingsMenu.classList.contains("open")) {
            player.classList.add("hide-controls");
        }

    }, 3000);
}

player.addEventListener("mousemove", showControls);
player.addEventListener("mouseleave", () => {

    if (!video.paused) {
        clearTimeout(hideTimer);
        player.classList.add("hide-controls");
    }
});

/* ===================== Inicialización ===================== */

updatePlayIcon();
updateVolumeUI();
updateFullscreenIcon();
showControls();