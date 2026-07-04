// ნებისმიერი შეცდომა ეკრანზე გამოაჩინოს (თეთრი ეკრანის ნაცვლად)
window.__mzeraErr = function (msg) {
  var r = document.getElementById("root");
  if (r) r.innerHTML =
    '<div style="padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#c01818;white-space:pre-wrap;font-size:12px;line-height:1.6;word-break:break-word">' +
    '<b style="font-size:14px">⚠ შეცდომა — გადააგზავნე ეს ტექსტი:</b><br><br>' +
    String(msg).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</div>";
};
window.addEventListener("error", function (e) {
  window.__mzeraErr((e.error && e.error.stack) || e.message || (e.filename + ":" + e.lineno));
});
window.addEventListener("unhandledrejection", function (e) {
  window.__mzeraErr("Promise rejection: " + ((e.reason && e.reason.stack) || e.reason));
});
