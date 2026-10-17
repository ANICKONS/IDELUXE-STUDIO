/**
 * Snow caps on the IDX mark: one lying along the top of the «D» with a couple of drips, a small one
 * on the dot of the «i». Shapes on the mark's 32 grid (components/icons.tsx → IDX_MARK): render it
 * inside the logo's <svg>, after the mark. A darker copy just below each cap gives it thickness on
 * the gold.
 */
const CAPS = [
  // «D»: from its left edge along the top and down the curve
  "M10.25 6.1C10 4.3 10.9 2.75 12.6 2.7C13.6 2.05 15.3 2.1 16.2 2.6C17.8 1.95 20.4 2.45 22 3.35C23.7 4 25.4 5.2 25.9 6.7C26.1 7.35 25.5 7.75 24.9 7.35C24 6.65 22.8 5.95 21.5 5.75C20.6 5.6 20.25 7.35 19.4 7.3C18.65 7.25 18.85 5.4 17.6 5.2C16.3 5 15 4.95 13.8 5.1C13.2 5.2 13.25 6.25 12.6 6.25C12 6.25 12 5.35 11.5 5.4C11 5.45 10.85 6.4 10.25 6.1Z",
  // Dot of the «i»
  "M3.05 6.35C2.8 4.5 4.05 3.2 5.7 3.2C7.35 3.15 8.75 4.35 8.5 6.15C8.2 6.6 7.75 6.3 7.45 5.95C7.1 5.55 6.6 5.85 6.1 5.65C5.55 5.45 5.25 6.4 4.65 6.3C4.05 6.2 3.7 5.85 3.05 6.35Z",
];

export function LogoSnow() {
  const id = "idx-snow";
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset=".6" stopColor="#f1f4f9" />
          <stop offset="1" stopColor="#cfdbea" />
        </linearGradient>
      </defs>
      {CAPS.map((d) => (
        <g key={d}>
          <path d={d} transform="translate(0 .45)" fill="#2a1d0c" fillOpacity=".45" />
          <path d={d} fill={`url(#${id})`} />
        </g>
      ))}
    </g>
  );
}
