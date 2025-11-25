const baseSongs = [
  { title: "Die With A Smile", singer: "Lady Gaga x Bruno Mars", file: "DieWithASmile" },
  { title: "Birds Of A Feather", singer: "Billie Eilish", file: "BirdsOfAFeather" },
  { title: "Nếu Lúc Đó", singer: "tlinh", file: "NeuLucDo" },
  { title: "Anh Đã Ổn Hơn", singer: "MCK", file: "AnhDaOnHon" },
  { title: "Mặt Trời Của Em", singer: "Phương Ly x Justatee", file: "MatTroiCuaEm",},
  { title: "Sóng Gió", singer: "Jack x K-ICM", file: "SongGio" },
  { title: "Hãy Trao Cho Anh", singer: "Sơn Tùng M-TP", file: "HayTraoChoAnh" },
  { title: "Túy Âm", singer: "Masew x Xesi", file: "TuyAm" },
];
const allSongs = baseSongs.map((s, i) => ({
  id: i + 1,
  title: s.title,
  singer: s.singer,
  src: `music/${s.file}.mp3`,
  cover: `images/${s.file}.jpg`,
}));

let playlist = JSON.parse(localStorage.getItem("mf_playlist") || "[]");

playlist = playlist.map((item) => {
  const full = allSongs.find((s) => s.id === item.id);
  return full || item;
});

let currentIndex = -1,
  isPlaying = false,
  isShuffle = false,
  repeatMode = "off", 
  volume = 0.8,
  isMuted = false;

const $ = (s) => document.querySelector(s);
const audio = $("#audio"),
  songList = $("#song-list"),
  searchInput = $("#searchInput");

const currentTitle = $("#current-title"),
  currentSinger = $("#current-singer");
const albumArt = $("#album-art"),
  vinyl = $("#vinyl"),
  progress = $("#progress");

const currentTimeEl = $("#current-time"),
  durationEl = $("#duration");

const volumeBtn = $("#volume-btn i"),
  volumeRange = $("#volume-range"),
  volumeFill = $(".volume-fill");

const shuffleBtn = $("#shuffle-btn"),
  repeatBtn = $("#repeat-btn"),
  playlistCount = $("#playlist-count");

let currentSongs = [...allSongs],
  currentTab = "all";


audio.volume = volume;
volumeRange.value = volume * 100;
volumeFill.style.width = volumeRange.value + "%";

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${(Math.floor(s % 60) + "").padStart(2, "0")}`;

const savePlaylist = () =>
  localStorage.setItem("mf_playlist", JSON.stringify(playlist));
const updateCount = () => (playlistCount.textContent = playlist.length);

const updateVolumeIcon = () => {
  volumeBtn.className =
    isMuted || volume === 0
      ? "fas fa-volume-mute"
      : volume < 0.5
      ? "fas fa-volume-down"
      : "fas fa-volume-up";
};

const render = () => {
  const q = searchInput.value.toLowerCase().trim();
  let list = currentTab === "all" ? allSongs : playlist;
  if (currentTab === "all" && q) {
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.singer.toLowerCase().includes(q)
    );
  }
  currentSongs = list;

  songList.innerHTML =
    list.length === 0
      ? `<div class="empty-state"><i class="fas fa-music"></i><p>${
          currentTab === "all" ? "Không tìm thấy" : "Playlist trống"
        }</p></div>`
      : list
          .map(
            (s, i) => `
      <div class="song-card ${i === currentIndex ? "active" : ""}" data-id="${
              s.id
            }">
        <div class="song-thumb">
          <img src="${
            s.cover
          }" onerror="this.src='https://via.placeholder.com/70/333/fff?text=♪'" alt="${
              s.title
            }">
          <div class="play-overlay"><i class="fas fa-play"></i></div>
        </div>
        <div class="song-info">
          <h3 class="song-title">${s.title}</h3>
          <p class="song-artist">${s.singer}</p>
        </div>
        <button class="like-btn ${
          playlist.some((p) => p.id === s.id) ? "liked" : ""
        }">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    `
          )
          .join("");

  updateCount();
};

const playSong = (idx) => {
  if (idx < 0 || idx >= currentSongs.length) return;
  currentIndex = idx;
  const s = currentSongs[idx];
  audio.src = s.src;
  audio.play();
  isPlaying = true;
  $("#play-pause-btn i").className = "fas fa-pause";
  vinyl.classList.add("playing");
  currentTitle.textContent = s.title;
  currentSinger.textContent = s.singer;
  albumArt.innerHTML = `<img src="${s.cover}" onerror="this.src='https://via.placeholder.com/56/333/fff?text=♪'">`;
  progress.classList.add("active");
  render();
};

const togglePlay = () => {
  if (audio.paused) {
    audio.play();
    $("#play-pause-btn i").className = "fas fa-pause";
    vinyl.classList.add("playing");
  } else {
    audio.pause();
    $("#play-pause-btn i").className = "fas fa-play";
    vinyl.classList.remove("playing");
  }
};

audio.ontimeupdate = () => {
  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
};
audio.ondurationchange = () =>
  (durationEl.textContent = formatTime(audio.duration || 0));

audio.onended = () => {
  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
  } else if (repeatMode === "all" || isShuffle) {
    $("#next-btn").click();
  } else {
    togglePlay();
  }
};

songList.onclick = (e) => {
  const card = e.target.closest(".song-card");
  if (!card) return;
  const idx = Array.from(songList.children).indexOf(card);

  if (e.target.closest(".like-btn")) {
    const song = currentSongs[idx];
    const i = playlist.findIndex((x) => x.id === song.id);
    if (i === -1) playlist.push(song);
    else playlist.splice(i, 1);
    savePlaylist();
    render();
  } else {
    playSong(idx);
  }
};

$(".like-current-btn").onclick = () => {
  if (currentIndex === -1) return;
  const song = currentSongs[currentIndex];
  const i = playlist.findIndex((x) => x.id === song.id);
  if (i === -1) playlist.push(song);
  else playlist.splice(i, 1);
  savePlaylist();
  render();
};

document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document
      .querySelectorAll(".tab")
      .forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    currentTab = t.dataset.tab;
    currentIndex = -1;
    render();
  };
});

$("#play-pause-btn").onclick = togglePlay;

$("#prev-btn").onclick = () => {
  const newIdx = currentIndex <= 0 ? currentSongs.length - 1 : currentIndex - 1;
  playSong(newIdx);
};

$("#next-btn").onclick = () => {
  if (isShuffle) {
    let newIdx = Math.floor(Math.random() * currentSongs.length);
    while (newIdx === currentIndex && currentSongs.length > 1) {
      newIdx = Math.floor(Math.random() * currentSongs.length);
    }
    playSong(newIdx);
  } else if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
  } else {
    playSong((currentIndex + 1) % currentSongs.length);
  }
};

$("#shuffle-btn").onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  if (isShuffle && repeatMode !== "off") {
    repeatMode = "off";
    repeatBtn.classList.remove("active", "repeat-all");
  }
};

$("#repeat-btn").onclick = () => {
  const modes = ["off", "all", "one"];
  repeatMode = modes[(modes.indexOf(repeatMode) + 1) % 3];

  repeatBtn.classList.toggle("active", repeatMode !== "off");
  repeatBtn.classList.toggle("repeat-all", repeatMode === "all");

  if (repeatMode !== "off" && isShuffle) {
    isShuffle = false;
    shuffleBtn.classList.remove("active");
  }
};

$(".progress-bar").onclick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
};

volumeRange.oninput = () => {
  volume = volumeRange.value / 100;
  audio.volume = volume;
  isMuted = false;
  volumeFill.style.width = volumeRange.value + "%";
  updateVolumeIcon();
};

$("#volume-btn").onclick = () => {
  isMuted = !isMuted;
  audio.volume = isMuted ? 0 : volume;
  volumeRange.value = isMuted ? 0 : volume * 100;
  volumeFill.style.width = volumeRange.value + "%";
  updateVolumeIcon();
};

searchInput.oninput = render;

render();
updateVolumeIcon();
