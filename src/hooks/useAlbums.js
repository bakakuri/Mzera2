import { useState } from "react";
import { albumsApi, hasSupabase, t } from "../ui/core";

// Standalone uploaded photos, organized into optional folders — separate
// from posts (see Profile's "Photos" tab, which now only shows post images).
// albums/photos are keyed by the profile currently being viewed, not always ME.
export function useAlbums({ flash, dbErr }) {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);

  const loadAlbums = async (ownerId) => {
    if (!hasSupabase || !ownerId) return;
    try { setAlbums(await albumsApi.list(ownerId)); } catch (e) { dbErr("ალბომები")(e); }
  };
  const loadPhotos = async (ownerId) => {
    if (!hasSupabase || !ownerId) return;
    try { setPhotos(await albumsApi.photos(ownerId)); setLoadedFor(ownerId); } catch (e) { dbErr("ფოტოები")(e); }
  };
  const loadAll = async (ownerId) => { await Promise.all([loadAlbums(ownerId), loadPhotos(ownerId)]); };

  const onCreateAlbum = (name) => albumsApi.create(name).then(a => { setAlbums(as => [a, ...as]); flash(t("toast.albumCreated")); }).catch(dbErr("ალბომის შექმნა"));
  const onRenameAlbum = (id, name) => { setAlbums(as => as.map(a => a.id === id ? { ...a, name } : a)); albumsApi.rename(id, name).catch(dbErr("რედაქტირება")); };
  const onDeleteAlbum = (id) => {
    setAlbums(as => as.filter(a => a.id !== id));
    setPhotos(ps => ps.map(p => p.album_id === id ? { ...p, album_id: null } : p));
    albumsApi.remove(id).then(() => flash(t("toast.albumDeleted"))).catch(dbErr("წაშლა"));
  };
  const onUploadPhoto = (image, albumId) => albumsApi.addPhoto(image, albumId).then(p => { setPhotos(ps => [p, ...ps]); flash(t("toast.photoUploaded")); }).catch(dbErr("ატვირთვა"));
  const onMovePhoto = (photoId, albumId) => {
    setPhotos(ps => ps.map(p => p.id === photoId ? { ...p, album_id: albumId || null } : p));
    albumsApi.movePhoto(photoId, albumId).then(() => flash(t("toast.photoMoved"))).catch(dbErr("გადატანა"));
  };
  const onReorderPhotos = (updates) => {
    setPhotos(ps => {
      const byId = Object.fromEntries(updates.map(u => [u.id, u.position]));
      return ps.map(p => byId[p.id] != null ? { ...p, position: byId[p.id] } : p);
    });
    albumsApi.reorderPhotos(updates).catch(dbErr("დალაგება"));
  };
  const onDeletePhoto = (photoId) => { setPhotos(ps => ps.filter(p => p.id !== photoId)); albumsApi.removePhoto(photoId).then(() => flash(t("toast.photoDeleted"))).catch(dbErr("წაშლა")); };
  const onSetAlbumCover = (albumId, image) => { setAlbums(as => as.map(a => a.id === albumId ? { ...a, cover: image } : a)); albumsApi.setCover(albumId, image).catch(dbErr("ყდის ფოტო")); };

  return {
    albums, photos, loadedFor, loadAll, loadAlbums, loadPhotos,
    onCreateAlbum, onRenameAlbum, onDeleteAlbum,
    onUploadPhoto, onMovePhoto, onReorderPhotos, onDeletePhoto, onSetAlbumCover,
  };
}
