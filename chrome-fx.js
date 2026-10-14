/* J.B.C Crome — effets chrome (reflets, curseur camion, transitions de page) */

/* ---------- Transition de page (View Transitions inter-pages : Chrome/Edge) ---------- */
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: jbc-out .25s ease both; }
::view-transition-new(root) { animation: jbc-in .4s ease both; }
@keyframes jbc-out { to { opacity: 0; transform: translateY(-8px); } }
@keyframes jbc-in  { from { opacity: 0; transform: translateY(10px); } }

/* ---------- Transition de secours (Firefox / Safari) : opacité seule, pour ne pas casser les éléments fixed ---------- */
@keyframes jbc-fade { from { opacity: 0; } }
body.jbc-enter   { animation: jbc-fade .4s ease both; }
body.jbc-leaving { opacity: 0; transition: opacity .25s ease; }

/* ---------- Reflet chrome au survol ---------- */
.chrome-shine { overflow: hidden; isolation: isolate; }
.chrome-shine::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.14), transparent 55%);
  opacity: 0; transition: opacity .3s ease;
}
.chrome-shine::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 2;
  background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.22) 47%, rgba(255,255,255,.5) 50%, rgba(255,255,255,.22) 53%, transparent 65%);
  transform: translateX(-130%); transition: transform .75s ease;
}
.chrome-shine:hover::before { opacity: 1; }
.chrome-shine:hover::after  { transform: translateX(130%); }

/* Texte chromé animé (classe .chrome-text sur un titre) */
.chrome-text {
  background: linear-gradient(100deg, #8d939c 0%, #f4f6f9 25%, #9aa1ab 45%, #ffffff 60%, #8d939c 100%);
  background-size: 250% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: jbc-chrome 6s linear infinite;
}
@keyframes jbc-chrome { to { background-position: -250% 0; } }

/* ---------- Curseur bleu (souris uniquement) ---------- */
@media (hover: hover) and (pointer: fine) {
  html, body {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M4 2v22l5.5-5.2 4 9.2 4-1.8-4-9h8z' fill='%235da8ff' stroke='%230b0d11' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 4 2, auto;
  }
  a, button, [role="button"], .chrome-shine, summary, label[for],
  #lightbox-close, #lightbox-prev, #lightbox-next, .ec-dot {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M4 2v22l5.5-5.2 4 9.2 4-1.8-4-9h8z' fill='%23a9d0ff' stroke='%230b0d11' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 4 2, pointer !important;
  }
}

/* ---------- Accessibilité ---------- */
@media (prefers-reduced-motion: reduce) {
  .chrome-shine::after, .chrome-text, body.jbc-enter, body.jbc-leaving { animation: none; transition: none; }
  ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
}
