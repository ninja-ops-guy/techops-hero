window.TO_DOGS = (function(){ try { return window.__GK_DOGS || undefined; } catch(e) { return undefined; } })();
(function(){
  try {
    var existing=document.getElementById("good-boys-mobile-launch-guard");
    if (existing) existing.remove();
    var s=document.createElement("script");
    s.id="good-boys-mobile-launch-guard";
    s.src="good_boys_mobile_launch_guard.js?v=3";
    (document.head||document.documentElement).appendChild(s);
  } catch(e) { window.__goodBoysMobileGuardLoaderError=String(e&&e.stack||e); }
})();
