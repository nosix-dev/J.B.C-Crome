(function(){
  function haut(){ window.scrollTo(0, 0); }
  haut();
  window.addEventListener('load', haut);
  window.addEventListener('pageshow', haut);
  setTimeout(haut, 350);

  var preloader = document.getElementById('preloader');
  var fill = document.getElementById('preloader-fill');
  var percent = document.getElementById('preloader-percent');
  var status = document.getElementById('preloader-status');
  if(!preloader || !fill || !percent) return;

  var DUREE_MIN = 400, DUREE_MAX = 1500;
  var debut = performance.now();
  var prete = document.readyState === 'complete';
  var masque = false;
  var messages = ['Chargement du site…', 'Préparation de la flotte…', 'Polissage du chrome…', 'Presque prêt…'];
  window.addEventListener('load', function(){ prete = true; });

  function progression(p){
    p = Math.max(0, Math.min(100, p));
    fill.style.width = p + '%';
    percent.textContent = Math.round(p) + '%';
    if(status) status.textContent = messages[Math.min(messages.length - 1, Math.floor(p / 100 * messages.length))];
  }
  function cacher(){
    if(masque) return;
    masque = true;
    progression(100);
    setTimeout(function(){ preloader.classList.add('hidden'); }, 150);
  }
  function boucle(){
    var t = performance.now() - debut;
    var r = Math.min(1, t / DUREE_MIN);
    progression(90 * (1 - Math.pow(1 - r, 2)));
    if((prete && t >= DUREE_MIN) || t >= DUREE_MAX){ cacher(); return; }
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
})();
