import { useState, useCallback } from 'react';
import { searchYoutubeVideos, getVideoDetails } from '../services/youtubeService';

/**
 * Hook personalizado para buscar y reproducir videos de YouTube
 */
export const useYoutubeSearch = () => {
  const [results, setResults] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query.trim()) {
      setResults([]);
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const videos = await searchYoutubeVideos(query);
      setResults(videos);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const playVideo = useCallback(async (videoId) => {
    setLoading(true);
    setError(null);

    try {
      const details = await getVideoDetails(videoId);
      setCurrentVideo(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCurrent = useCallback(() => {
    setCurrentVideo(null);
  }, []);

  return {
    results,
    currentVideo,
    loading,
    error,
    search,
    playVideo,
    clearCurrent
  };
};
