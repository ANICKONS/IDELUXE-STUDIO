"use client";

/**
 * Last resort: the root layout itself failed, so there is no shell, no CSS bundle guarantee —
 * plain inline styles in the site's colours.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#060709", color: "#f3f0ea", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ letterSpacing: "0.2em", fontSize: 12, color: "#eddcbd" }}>IDELUXE STUDIO</p>
          <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>Сайт временно недоступен</h1>
          <p style={{ color: "#a8a49c" }}>Попробуй обновить страницу через минуту.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "12px 22px", borderRadius: 999, border: 0, background: "#f0ebe1", color: "#060709", fontWeight: 600, cursor: "pointer" }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
