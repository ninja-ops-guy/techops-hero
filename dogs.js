window.TO_DOGS = (function(){ try { return window.__GK_DOGS || undefined; } catch(e) { return undefined; } })();
(function(){
  try {
    if (document.getElementById("good-boys-mobile-launch-guard")) return;
    var s=document.createElement("script");
    s.id="good-boys-mobile-launch-guard";
    s.src="good_boys_mobile_launch_guard.js";
    (document.head||document.documentElement).appendChild(s);
  } catch(e) { window.__goodBoysMobileGuardLoaderError=String(e&&e.stack||e); }
})();
