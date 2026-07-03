import { useState, useRef, useEffect } from "react";
import { marketApi, mapDbListing, mapDbReview, hydrateAuthors, hasSupabase } from "../ui/core";

export function useMarket({ tab, flash, dbErr, setDbError }) {
  const [listings, setListings] = useState([]);
  const [listCursor, setListCursor] = useState(null);
  const [listMore, setListMore] = useState(true);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const listSentinelRef = useRef(null);

  const loadListings = async () => { if (!hasSupabase) return; try { let rows; let paged = true; try { rows = await marketApi.listingsPage(null, 10); } catch (em) { paged = false; rows = await hydrateAuthors(await marketApi.listingsPlain(), "seller_id", "seller"); } const mapped = rows.map(mapDbListing); setListings(mapped); setListCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null); setListMore(paged && mapped.length >= 10); } catch (e) { console.error("listings:", e); setDbError("listings: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadMoreListings = async () => {
    if (listLoadingMore || !listMore || !listCursor || !hasSupabase) return;
    setListLoadingMore(true);
    try {
      const rows = await marketApi.listingsPage(listCursor, 10);
      if (!rows.length) { setListMore(false); return; }
      const mapped = rows.map(mapDbListing);
      setListings(prev => { const seen = new Set(prev.map(l => l.id)); return [...prev, ...mapped.filter(l => !seen.has(l.id))]; });
      setListCursor(mapped[mapped.length - 1].createdAt);
      setListMore(rows.length >= 10);
    } catch (e) {} finally { setListLoadingMore(false); }
  };
  useEffect(() => {
    const el = listSentinelRef.current;
    if (!el || tab !== "market" || !listMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0] && e[0].isIntersecting) loadMoreListings(); }, { rootMargin: "700px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, listMore, listCursor, listLoadingMore]);

  const onListingSave = (id) => setListings(ls => ls.map(l => l.id === id ? { ...l, savedByMe: !l.savedByMe } : l));
  const onNewListing = (d) => { flash("განცხადება დაიდო 🛍️"); marketApi.create({ title: d.title, price: d.price, description: d.desc, category: d.cat, image_url: d.image, video_url: d.video || null, location: "თბილისი" }).then(loadListings).catch(dbErr("განცხადება")); };
  const onEditListing = (id, patch) => { setListings(ls => ls.map(l => l.id === id ? { ...l, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.price != null ? { price: patch.price } : {}), ...(patch.description != null ? { desc: patch.description } : {}) } : l)); marketApi.update(id, patch).then(loadListings).then(() => flash("განცხადება განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteListing = (id) => { setListings(ls => ls.filter(l => l.id !== id)); marketApi.remove(id).then(loadListings).then(() => flash("განცხადება წაიშალა")).catch(dbErr("წაშლა")); };
  const onOrder = (item, d) => { marketApi.order(item.id, { delivery: d.delivery, payment: d.payment, address: d.address, total: d.total }).catch(dbErr("შეკვეთა")); };
  const getReviews = (sellerId) => marketApi.reviews(sellerId).then(rows => rows.map(mapDbReview));
  const addReviewApi = (sellerId, rating, text) => marketApi.addReview(sellerId, rating, text);

  return {
    listings, listCursor, listMore, listLoadingMore, listSentinelRef,
    loadListings, loadMoreListings, onListingSave, onNewListing, onEditListing,
    onDeleteListing, onOrder, getReviews, addReviewApi,
  };
}
