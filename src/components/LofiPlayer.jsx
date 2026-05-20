import { useState, useEffect, useRef } from 'react';
import { searchYoutubeVideos } from '../services/youtubeService';
import './LofiPlayer.css';

export function LofiPlayer() {
  const themeOptions = [
    { id: 'classic', name: 'Classic', src: '/src/assets/8px8re2bo3l81.gif' },
    { id: 'rainy', name: 'Lluvia', src: '/src/assets/6279fa60fa25fc1918bbb4830cd8ccce.gif' },
    { id: 'neon', name: 'Neon', src: '/src/assets/6420b5ba0dd45dc35aae9705c8e275dd.gif' },
    { id: 'dream', name: 'Dream', src: '/src/assets/651e42fdcf37fa1c13ffa701560e9ab8.gif' },
    { id: 'vintage', name: 'Vintage', src: '/src/assets/f5ca042a0ac1c4b13ea21750b7ac7744.gif' },
    { id: 'stars', name: 'Stars', src: '/src/assets/3182e579d9e985daa8168ea729da7cba.gif' },
  ];

  const [previewSrc, setPreviewSrc] = useState(themeOptions[0].src);
  const [activeBgTheme, setActiveBgTheme] = useState(themeOptions[0].id);
  const bgObjectFit = 'cover';
  const [currentVideo, setCurrentVideo] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const playerRef = useRef(null);
  const smallPlayerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const requestedVideoIdRef = useRef(null);

  useEffect(() => {
    // Cargar el GIF local (vista previa por defecto)
    setPreviewSrc(themeOptions[0].src);

    // Inyectar YouTube API solo si no está ya cargada
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
    }

    // Generar barras de ecualizador
    const eqHeights = [18,28,14,32,22,16,26,12,30,20,24,8,28,16,22];
    const eq = document.getElementById('eq');
    if (eq) {
      eqHeights.forEach((h) => {
        const bar = document.createElement('div');
        bar.className = 'eq-bar';
        bar.style.cssText = `height:${h}px; --dur:${(0.3 + Math.random()*0.5).toFixed(2)}s; animation-delay:${(Math.random()*0.4).toFixed(2)}s`;
        eq.appendChild(bar);
      });
    }

    // Generar barras de onda
    const wf = document.getElementById('waveform');
    if (wf) {
      for (let i = 0; i < 18; i++) {
        const b = document.createElement('div');
        b.className = 'wave-bar';
        const h = 6 + Math.round(Math.random() * 16);
        b.style.cssText = `height:${h}px; --w-dur:${(0.3+Math.random()*0.6).toFixed(2)}s; animation-delay:${(Math.random()*0.5).toFixed(2)}s`;
        wf.appendChild(b);
      }
    }

    // Actualizar reloj
    updateClock();
    const clockInterval = setInterval(updateClock, 10000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (isApiReady && currentVideo) {
      // Initialize player in the small preview container when a video is selected
      initializePlayer(currentVideo.id, smallPlayerRef.current);
    }
  }, [isApiReady, currentVideo]);

  const updateClock = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = h+':'+m;
  };

  const updateVol = (value) => {
    const parsed = Number(value);
    setVolume(parsed);
    if (playerInstanceRef.current && typeof playerInstanceRef.current.setVolume === 'function') {
      playerInstanceRef.current.setVolume(parsed);
    }
  };

  const initializePlayer = (videoId, container) => {
    const mount = container || playerRef.current;
    if (!window.YT || !window.YT.Player || !mount) {
      requestedVideoIdRef.current = videoId;
      return;
    }

    requestedVideoIdRef.current = videoId;

    if (playerInstanceRef.current) {
      // If already created, load into existing instance
      playerInstanceRef.current.loadVideoById(videoId);
      playerInstanceRef.current.setVolume(volume);
      return;
    }

    playerInstanceRef.current = new window.YT.Player(mount, {
      height: '100%',
      width: '100%',
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          setIsApiReady(true);
          event.target.setVolume(volume);
          event.target.playVideo();
          setIsPlaying(true);
          updatePlayButton(true);
          updateAnimations(true);
        },
        onStateChange: onPlayerStateChange,
      }
    });
  };

  const onPlayerStateChange = (event) => {
    const YT = window.YT;
    if (!YT) return;

    const vinyl = document.querySelector('.vinyl');
    if (event.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      updatePlayButton(true);
      updateAnimations(true);
      if (vinyl) vinyl.style.animationPlayState = 'running';
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      setIsPlaying(false);
      updatePlayButton(false);
      updateAnimations(false);
      if (vinyl) vinyl.style.animationPlayState = 'paused';
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('yt-url');
    const query = urlInput?.value?.trim();
    
    if (!query) return;

    setLoading(true);
    try {
      const videos = await searchYoutubeVideos(query);
      setSearchResults(videos);
      if (videos.length > 0) {
        playVideoId(videos[0]);
      }
    } catch (err) {
      console.error('Error buscando:', err);
    } finally {
      setLoading(false);
    }
  };

  const playVideoId = (video) => {
    setCurrentVideo(video);

    const trackTitle = document.getElementById('track-title');
    if (trackTitle) trackTitle.textContent = video.title;

    const vinyl = document.querySelector('.vinyl');
    if (vinyl) {
      vinyl.style.animationPlayState = 'running';
    }

    setIsPlaying(true);
    updatePlayButton(true);
    updateAnimations(true);
  };

  const updatePlayButton = (isPlaying) => {
    const playIcon = document.getElementById('play-icon');
    const playLabel = document.getElementById('play-label');
    if (playIcon) playIcon.textContent = isPlaying ? '⏸' : '▶';
    if (playLabel) playLabel.textContent = isPlaying ? 'PAUSE' : 'PLAY';
  };

  const updateAnimations = (playing) => {
    document.querySelectorAll('.eq-bar').forEach(b => b.style.animationPlayState = playing ? 'running' : 'paused');
    document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = playing ? 'running' : 'paused');
  };

  const togglePlay = () => {
    if (!playerInstanceRef.current) return;

    if (isPlaying) {
      playerInstanceRef.current.pauseVideo();
    } else {
      playerInstanceRef.current.playVideo();
    }
  };

  const pauseTrack = () => {
    if (playerInstanceRef.current && isPlaying) {
      playerInstanceRef.current.pauseVideo();
    }
  };

  const stopTrack = () => {
    if (playerInstanceRef.current) {
      if (typeof playerInstanceRef.current.stopVideo === 'function') {
        playerInstanceRef.current.stopVideo();
      }
      if (typeof playerInstanceRef.current.clearVideo === 'function') {
        playerInstanceRef.current.clearVideo();
      }
      if (typeof playerInstanceRef.current.destroy === 'function') {
        playerInstanceRef.current.destroy();
      }
      playerInstanceRef.current = null;
    }

    setIsPlaying(false);
    updatePlayButton(false);
    updateAnimations(false);

    const urlInput = document.getElementById('yt-url');
    if (urlInput) urlInput.value = '';

    setCurrentVideo(null);
    setSearchResults([]);

    if (playerRef.current) {
      // clear both possible containers
      try { playerRef.current.innerHTML = ''; } catch (e) {}
      try { if (smallPlayerRef.current) smallPlayerRef.current.innerHTML = ''; } catch (e) {}
    }

    const trackTitle = document.getElementById('track-title');
    if (trackTitle) trackTitle.textContent = 'Chill Vibes 🌙';

    const vinyl = document.querySelector('.vinyl');
    if (vinyl) vinyl.style.animationPlayState = 'paused';
  };

  const changeBackgroundTheme = (theme) => {
    setPreviewSrc(theme.src);
    setActiveBgTheme(theme.id);
  };

  return (
    <>
      {/* BACKGROUND GIF */}
      <div className="bg">
        <img id="bg-gif" src={previewSrc} alt="lofi room background" style={{ objectFit: bgObjectFit }} />
      </div>

      {/* PAGE LAYOUT */}
      <div className="page-layout">
        {/* VIDEO PLAYER EN EL FONDO */}
        <div ref={playerRef} style={{position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none'}}></div>

        <div className="sidebar-wrap">
          <div className="lofi-sidebar">
            <div className="pixel-border"></div>

            {/* HEADER */}
            <div className="header">
              <span className="header-icon">🎵</span>
              <div className="header-title">
                LOFI ROOM
                <span>♥ COZY PLAYER ♥</span>
              </div>
              <div className="clock-chip" id="clock">22:47</div>
            </div>

            {/* URL INPUT */}
            <div className="section">
              <div className="section-label">♪ BUSCAR CANCIÓN</div>
              <form onSubmit={handleSearch} className="url-input-wrap" style={{gap: '4px'}}>
                <input className="url-input" type="text" id="yt-url" placeholder="canción, artista..." />
                <button type="submit" className="url-bow" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px'}}>
                  {loading ? '⏳' : '🔍'}
                </button>
              </form>
            </div>

            {/* CONTROLS */}
            <div className="section">
              <button className="btn-play" id="btn-play" onClick={togglePlay}>
                <span id="play-icon">▶</span> <span id="play-label">PLAY</span>
              </button>
              <div className="btn-row">
                <button className="btn-sm" onClick={pauseTrack}>⏸ PAUSE</button>
                <button className="btn-sm" onClick={stopTrack}>⏹ STOP</button>
              </div>
            </div>

            {/* VOLUME */}
            <div className="section">
              <div className="section-label">♪ VOLUME</div>
              <div className="vol-row">
                <span className="vol-icon">🔈</span>
                <input className="vol-slider" type="range" min="0" max="100" value={volume} id="vol" onInput={(e) => updateVol(e.target.value)} />
                <span className="vol-pct" id="vol-pct">{volume}%</span>
              </div>
            </div>

            {/* GIF AREA */}
            <div className="gif-area">
              <div className="stars-bg"></div>
              <span className="neon-heart">♥</span>
              <div className="music-notes">
                <span className="music-note" style={{'--n-dur':'2.5s'}}>♪</span>
                <span className="music-note" style={{'--n-dur':'3.2s', animationDelay:'0.8s'}}>♫</span>
                <span className="music-note" style={{'--n-dur':'2.8s', animationDelay:'1.5s'}}>♩</span>
              </div>
              {/* Mostrar iframe pequeño cuando hay un video, sino la imagen GIF */}
              {currentVideo ? (
                <div className="video-preview" ref={smallPlayerRef} style={{width: '100%', height: '100%'}} />
              ) : (
                <img className="gif-img" id="gif-preview" src={previewSrc} alt="lofi room" />
              )}
              <div className="floor-lights"></div>
            </div>

            {/* NOW PLAYING */}
            <div className="section">
              <div className="section-label">♫ NOW PLAYING</div>
              <div className="now-playing-card">
                <div className="thumb">
                  <div className="vinyl"><div className="vinyl-center"></div></div>
                </div>
                <div className="track-info">
                  <div className="track-title" id="track-title">Chill Vibes 🌙</div>
                  <div className="track-sub">{currentVideo ? currentVideo.channelTitle : 'lofi hip hop mix'}<br />– beats to relax/study to</div>
                  <div className="live-badge">♥ LIVE</div>
                </div>
              </div>
            </div>

            {/* EQUALIZER */}
            <div className="section">
              <div className="section-label">≋ EQUALIZER</div>
              <div className="eq-bars" id="eq"></div>
            </div>

            {/* BACKGROUND OPTIONS */}
            <div className="section" style={{borderBottom:'none'}}>
              <div className="section-label">♢ BACKGROUND</div>
              <div className="theme-row bg-theme-row">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-btn ${activeBgTheme === theme.id ? 'active' : ''}`}
                    onClick={() => changeBackgroundTheme(theme)}
                    type="button"
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTTOM BAR */}
            <div className="bottom-bar">
              <span className="cat-icon">🐱</span>
              <div className="bottom-text">
                <p>NOW PLAYING ♥</p>
                <p>Escape. Relax. Listen.</p>
                <p>You're in your cozy place 💕</p>
              </div>
              <div className="waveform" id="waveform"></div>
            </div>

            <div className="pixel-border-bottom"></div>
          </div>
        </div>
      </div>
    </>
  );
}
