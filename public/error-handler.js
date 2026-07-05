// ნებისმიერი შეცდომა ეკრანზე ლამაზად გამოაჩინოს (თეთრი/დებაგ ეკრანის ნაცვლად)
function mzEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
window.__mzeraErr = function (msg) {
  var r = document.getElementById("root");
  if (!r) return;
  r.innerHTML =
    '<div style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;background:#F3F5F9;box-sizing:border-box">' +
      '<div style="max-width:380px;width:100%;background:#fff;border-radius:20px;padding:28px 24px;box-shadow:0 16px 40px -12px rgba(17,19,26,.18);text-align:center">' +
        '<div style="font-size:40px;line-height:1;margin-bottom:12px">😕</div>' +
        '<div style="font-size:17px;font-weight:700;color:#13161F;margin-bottom:6px">რაღაც არასწორად მოხდა</div>' +
        '<div style="font-size:13.5px;color:#6b7280;line-height:1.5;margin-bottom:20px">გვერდი ვერ ჩაიტვირთა გამართულად. სცადეთ განახლება.</div>' +
        '<button onclick="location.reload()" style="width:100%;padding:12px;border:none;border-radius:14px;background:#6750F2;color:#fff;font-size:14.5px;font-weight:700;cursor:pointer;margin-bottom:10px">გვერდის განახლება</button>' +
        '<details style="text-align:left;margin-top:6px">' +
          '<summary style="cursor:pointer;font-size:12px;color:#9aa1ae;user-select:none">ტექნიკური დეტალები</summary>' +
          '<div style="margin-top:8px;padding:10px;background:#F4F6FA;border-radius:10px;font-size:11px;line-height:1.6;color:#c01818;white-space:pre-wrap;word-break:break-word;max-height:220px;overflow:auto">' + mzEsc(msg) + "</div>" +
        "</details>" +
      "</div>" +
    "</div>";
};
window.addEventListener("error", function (e) {
  window.__mzeraErr((e.error && e.error.stack) || e.message || (e.filename + ":" + e.lineno));
});
window.addEventListener("unhandledrejection", function (e) {
  window.__mzeraErr("Promise rejection: " + ((e.reason && e.reason.stack) || e.reason));
});
