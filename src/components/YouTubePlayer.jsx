import { useState, useEffect, useRef } from 'react';
import { searchYoutubeVideos } from '../services/youtubeService';
import './YouTubePlayer.css';

export function YouTubePlayer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(80);
  const playerRef = useRef(null);

  useEffect(() => {
    // Cargar YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = onPlayerReady;
  }, []);

  const onPlayerReady = () => {
    if (currentVideo) {
      createPlayer();
    }
  };

  const createPlayer = () => {
    if (!currentVideo || !playerRef.current) return;

    playerRef.current.innerHTML = `
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&controls=1&modestbranding=1&rel=0"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const videos = await searchYoutubeVideos(searchQuery);
      setResults(videos);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (video) => {
    setCurrentVideo(video);
    setResults([]);
    setSearchQuery('');
  };

  return (
    <div className="youtube-player-container">
      {/* GIF Background */}
      <div className="gif-background">
        <div className="player-area" ref={playerRef}>
          {!currentVideo && (
            <div className="empty-state">
              <span>🎵</span>
              <p>Busca una canción para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar-container">
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <span className="header-icon">🎵</span>
            <div className="header-title">
              LOFI ROOM
              <span>♥ PLAYER ♥</span>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="sidebar-section">
            <label className="section-label">♪ BUSCAR MÚSICA</label>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ingresa canción o artista..."
                className="search-input"
              />
              <button type="submit" disabled={loading} className="search-btn">
                {loading ? '🔍...' : '🔍'}
              </button>
            </form>
          </div>

          {/* Información actual */}
          {currentVideo && (
            <div className="sidebar-section">
              <label className="section-label">♫ REPRODUCIÉNDOSE</label>
              <div className="now-playing">
                <div className="track-title">{currentVideo.title}</div>
                <div className="track-sub">{currentVideo.channelTitle}</div>
              </div>
            </div>
          )}

          {/* Volumen */}
          <div className="sidebar-section">
            <label className="section-label">🔈 VOLUMEN</label>
            <div className="volume-control">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="volume-slider"
              />
              <span className="volume-percent">{volume}%</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="sidebar-section error-box">
              <p>❌ {error}</p>
            </div>
          )}

          {/* Resultados búsqueda */}
          {results.length > 0 && (
            <div className="sidebar-section results-section">
              <label className="section-label">📋 RESULTADOS ({results.length})</label>
              <div className="results-list">
                {results.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handlePlayVideo(video)}
                    className="result-item"
                  >
                    <div className="result-title">{video.title}</div>
                    <div className="result-channel">{video.channelTitle}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
