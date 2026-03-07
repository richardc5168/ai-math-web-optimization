/* Skip-to-content accessibility link — auto-inject into all pages */
(function(){
  var target = document.querySelector('main, [role="main"], .hero, #app, .container, section');
  if (!target) return;
  if (!target.id) target.id = 'mainContent';

  var css = document.createElement('style');
  css.textContent = '.skip-link{position:absolute;top:-100px;left:8px;background:#238636;color:#fff;padding:8px 16px;border-radius:0 0 8px 8px;font-size:.9rem;font-weight:700;z-index:99999;text-decoration:none;transition:top .2s}.skip-link:focus{top:0}';
  document.head.appendChild(css);

  var a = document.createElement('a');
  a.href = '#' + target.id;
  a.className = 'skip-link';
  a.textContent = '\u8DF3\u5230\u4E3B\u8981\u5167\u5BB9'; /* 跳到主要內容 */
  document.body.insertBefore(a, document.body.firstChild);
})();
