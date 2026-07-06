import { useState, useRef, useEffect } from "react";
import { filmsApi, mapDbFilm, mapDbReview, img, hasSupabase, t } from "../ui/core";

// films/film_reviews/film_watch are a new-ish schema addition — load
// functions fail silently (no setDbError banner) until the migration has
// actually been run against the live project.
export function useMovies({ tab, session, flash, dbErr }) {
  const [films, setFilms] = useState([]);
  const [filmWatch, setFilmWatch] = useState({});
  const [filmCursor, setFilmCursor] = useState(null);
  const [filmMore, setFilmMore] = useState(true);
  const [filmLoadingMore, setFilmLoadingMore] = useState(false);
  const filmSentinelRef = useRef(null);

  const loadFilms = async () => { if (!hasSupabase) return; try { const rows = await filmsApi.page(null, {}, 12); const mapped = rows.map(mapDbFilm); setFilms(mapped); setFilmCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null); setFilmMore(mapped.length >= 12); } catch (e) { console.error("films:", e); } };
  const loadMoreFilms = async () => {
    if (filmLoadingMore || !filmMore || !filmCursor || !hasSupabase) return;
    setFilmLoadingMore(true);
    try {
      const rows = await filmsApi.page(filmCursor, {}, 12);
      if (!rows.length) { setFilmMore(false); return; }
      const mapped = rows.map(mapDbFilm);
      setFilms(prev => { const seen = new Set(prev.map(f => f.id)); return [...prev, ...mapped.filter(f => !seen.has(f.id))]; });
      setFilmCursor(mapped[mapped.length - 1].createdAt);
      setFilmMore(rows.length >= 12);
    } catch (e) { flash && flash(t("toast.filmsLoadMoreFailed")); } finally { setFilmLoadingMore(false); }
  };
  useEffect(() => {
    const el = filmSentinelRef.current;
    if (!el || tab !== "movies" || !filmMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0] && e[0].isIntersecting) loadMoreFilms(); }, { rootMargin: "700px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, filmMore, filmCursor, filmLoadingMore]);

  const loadFilmWatch = async () => { if (!hasSupabase || !session) return; try { const rows = await filmsApi.myWatch(); const map = {}; rows.forEach(r => { map[r.film_id] = r.status; }); setFilmWatch(map); } catch (e) {} };
  const onSetFilmWatch = (filmId, status) => { setFilmWatch(w => ({ ...w, [filmId]: status })); filmsApi.setWatch(filmId, status).catch(dbErr("სტატუსი")); };
  const onClearFilmWatch = (filmId) => { setFilmWatch(w => { const n = { ...w }; delete n[filmId]; return n; }); filmsApi.clearWatch(filmId).catch(dbErr("სტატუსი")); };

  const onNewFilm = (d) => { flash(t("toast.filmAdded")); filmsApi.create({ title: d.title, year: d.year, genre: d.genre, description: d.desc, poster_url: d.poster || null, video_url: d.video || null }).then(loadFilms).catch(dbErr("ფილმი")); };
  const onEditFilm = (id, patch) => { setFilms(fs => fs.map(f => f.id === id ? { ...f, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.year !== undefined ? { year: patch.year } : {}), ...(patch.genre != null ? { genre: patch.genre } : {}), ...(patch.description != null ? { desc: patch.description } : {}), ...(patch.poster_url !== undefined ? { poster: patch.poster_url || img("film" + id, 480, 720) } : {}), ...(patch.video_url !== undefined ? { video: patch.video_url } : {}) } : f)); filmsApi.update(id, patch).then(loadFilms).then(() => flash(t("toast.filmUpdated"))).catch(dbErr("რედაქტირება")); };
  const onDeleteFilm = (id) => { setFilms(fs => fs.filter(f => f.id !== id)); filmsApi.remove(id).then(loadFilms).then(() => flash(t("toast.filmDeleted"))).catch(dbErr("წაშლა")); };
  const getFilmReviews = (filmId) => filmsApi.reviews(filmId).then(rows => rows.map(mapDbReview));
  const addFilmReviewApi = (filmId, rating, text) => filmsApi.addReview(filmId, rating, text);

  const [pendingFilm, setPendingFilm] = useState(null);
  // opening a film from search may reference one not yet on the loaded page —
  // splice it in so the detail view (matched by id) can actually find it
  const ensureFilmLoaded = (film) => setFilms(fs => fs.some(f => f.id === film.id) ? fs : [film, ...fs]);

  return {
    films, filmWatch, filmCursor, filmMore, filmLoadingMore, filmSentinelRef,
    loadFilms, loadMoreFilms, loadFilmWatch, onSetFilmWatch, onClearFilmWatch,
    onNewFilm, onEditFilm, onDeleteFilm, getFilmReviews, addFilmReviewApi,
    pendingFilm, setPendingFilm, ensureFilmLoaded,
  };
}
