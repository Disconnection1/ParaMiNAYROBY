// Configuración de la API de YouTube
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Busca videos en YouTube por nombre/query
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} Array de videos encontrados
 */
export const searchYoutubeVideos = async (query) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('API Key de YouTube no configurada. Añade VITE_YOUTUBE_API_KEY en .env');
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?` +
      `q=${encodeURIComponent(query)}` +
      `&part=snippet` +
      `&type=video` +
      `&maxResults=10` +
      `&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Error en la búsqueda: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));
  } catch (error) {
    console.error('Error buscando en YouTube:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de un video específico
 * @param {string} videoId - ID del video de YouTube
 * @returns {Promise<Object>} Detalles del video
 */
export const getVideoDetails = async (videoId) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('API Key de YouTube no configurada');
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?` +
      `id=${videoId}` +
      `&part=snippet,contentDetails` +
      `&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Error obteniendo detalles: ${response.statusText}`);
    }

    const data = await response.json();
    const video = data.items[0];

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      duration: video.contentDetails.duration,
      channelTitle: video.snippet.channelTitle
    };
  } catch (error) {
    console.error('Error obteniendo detalles del video:', error);
    throw error;
  }
};

/**
 * Construye la URL de incrustación del video
 * @param {string} videoId - ID del video de YouTube
 * @returns {string} URL para el iframe
 */
export const getEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`;
};

/**
 * Construye la URL de reproducción en YouTube
 * @param {string} videoId - ID del video de YouTube
 * @returns {string} URL para abrir en YouTube
 */
export const getYoutubeUrl = (videoId) => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};
