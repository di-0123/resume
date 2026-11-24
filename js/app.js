/* ============================================================
   app.js —— 视图路由、加载动画、交互
   页面结构见 index.html，全部文案见 content.js
   ============================================================ */
(function () {
  'use strict';
  var C = window.SITE_CONTENT;
  var STAGE_W = 865, STAGE_H = 590;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 舞台等比缩放：保证热区与背景图永远对齐 ----------
     --s       内页用的「完整放下」比例（865×590 卡片居中）
     --cover-s 第一屏用的「铺满窗口」比例，舞台放大到盖住整个窗口 → 没有黑边
     --safe-x/y 铺满时画面会被窗口裁掉的部分，用来把贴边的文字往里收   */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.min(w / STAGE_W, h / STAGE_H);
    s = Math.min(s, 2.1) * 0.985;
    var cover = Math.max(w / STAGE_W, h / STAGE_H);
    // 窄高窗口左右会裁得太多（标题的 W、月亮右半边会被切）。
    // 横向裁切超过 14% 时把铺满倍数收一点点，露出的细边由同色水彩底层补上，
    // 既不出现黑边，也保住构图完整。宽屏 (裁切=0) 完全不受影响。
    var cropX = (STAGE_W * cover - w) / (STAGE_W * cover);
    if (cropX > 0.14) cover *= 1 - Math.min(0.10, (cropX - 0.14) * 0.55);
    var root = document.documentElement;
    root.style.setProperty('--s', s.toFixed(4));
    root.style.setProperty('--cover-s', cover.toFixed(4));
    root.style.setProperty('--safe-x', (Math.max(0, (STAGE_W - w / cover) / 2) + 8).toFixed(1) + 'px');
    root.style.setProperty('--safe-y', (Math.max(0, (STAGE_H - h / cover) / 2) + 8).toFixed(1) + 'px');
  }
  fit();
  window.addEventListener('resize', fit);

  /* ---------- 小工具 ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function hotspot(cfg, extra) {
    var b = el('button', 'hotspot ' + (extra || ''));
    b.type = 'button';
    b.style.left = cfg.rect[0] + 'px';
    b.style.top = cfg.rect[1] + 'px';
    b.style.width = cfg.rect[2] + 'px';
    b.style.height = cfg.rect[3] + 'px';
    // 告诉 CSS「这块热区对应背景图的哪个位置」，首页图标悬停放大时要用
    b.style.setProperty('--bx', (-cfg.rect[0]) + 'px');
    b.style.setProperty('--by', (-cfg.rect[1]) + 'px');
    b.setAttribute('aria-label', cfg.label || cfg.tip || '入口');
    if (cfg.tip) b.appendChild(el('span', 'tip', cfg.tip));
    if (cfg.id) b.dataset.go = cfg.id;
    return b;
  }

  /* ---------- 第二页四张手绘纸片卡片 ----------
     图标不烧在背景图里，而是独立 SVG：这样每张卡片能单独放大、换色、改文案，
     也才能跟第一屏的米白银杏纸底统一。线条走深棕，点缀用银杏黄 / 砖红。 */
  var HOME_ICONS = {
    about:
      '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M27 48c0-15 12-26 29-26s29 11 29 26v6c0 17-12 29-29 29S27 71 27 54z" fill="#F8E6CC" stroke="#3E2723" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M26 46c2-18 15-28 30-28 16 0 29 10 30 28-9-7-18-10-30-10-12 0-22 3-30 10z" fill="#3E2723"/>' +
      '<rect x="35" y="47" width="21" height="15" rx="4" fill="none" stroke="#3E2723" stroke-width="3"/>' +
      '<rect x="62" y="47" width="21" height="15" rx="4" fill="none" stroke="#3E2723" stroke-width="3"/>' +
      '<path d="M56 53h6" stroke="#3E2723" stroke-width="3"/>' +
      '<path d="M52 68c4 4 12 4 16 0" fill="none" stroke="#9C3A2E" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M15 26l2.5-7 2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5z" fill="#E6B422" stroke="#3E2723" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    aboutSkills:
      '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M27 48c0-15 12-26 29-26s29 11 29 26v6c0 17-12 29-29 29S27 71 27 54z" fill="#F8E6CC" stroke="#3E2723" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M26 46c2-18 15-28 30-28 16 0 29 10 30 28-9-7-18-10-30-10-12 0-22 3-30 10z" fill="#3E2723"/>' +
      '<rect x="35" y="47" width="21" height="15" rx="4" fill="none" stroke="#3E2723" stroke-width="3"/>' +
      '<rect x="62" y="47" width="21" height="15" rx="4" fill="none" stroke="#3E2723" stroke-width="3"/>' +
      '<path d="M56 53h6" stroke="#3E2723" stroke-width="3"/>' +
      '<path d="M52 68c4 4 12 4 16 0" fill="none" stroke="#9C3A2E" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="101" cy="66" r="16" fill="#E6B422" stroke="#3E2723" stroke-width="2.6"/>' +
      '<rect x="93" y="66" width="16" height="11" rx="2" fill="#FDF3DE" stroke="#3E2723" stroke-width="2"/>' +
      '<path d="M97 66v-2a4 4 0 0 1 8 0v2" fill="none" stroke="#3E2723" stroke-width="2"/>' +
      '</svg>',
    projects:
      '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M16 34h30l6 9h34v33H16z" fill="#F3C77B" stroke="#3E2723" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M16 34V23h25l6 9" fill="none" stroke="#3E2723" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M30 65V54m15 11V47m15 18V51" stroke="#9C3A2E" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M24 70h58" stroke="#3E2723" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M98 22l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="#E6B422" stroke="#3E2723" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    skills:
      '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="18" y="42" width="72" height="34" rx="5" fill="#F8D9C6" stroke="#3E2723" stroke-width="3.2"/>' +
      '<path d="M45 42v-6c0-6 4-10 10-10h8c6 0 10 4 10 10v6" fill="none" stroke="#3E2723" stroke-width="3.2"/>' +
      '<path d="M18 56h72" stroke="#3E2723" stroke-width="3"/>' +
      '<path d="M32 65h18m22 0h10" stroke="#9C3A2E" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M100 22l2.5-7 2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5z" fill="#E6B422" stroke="#3E2723" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    practice:
      '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M40 34L32 14l17 8 7-16 7 16 17-8-8 20" fill="#9C3A2E" stroke="#3E2723" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="56" cy="54" r="23" fill="#E6B422" stroke="#3E2723" stroke-width="3.2"/>' +
      '<path d="M56 42l3.5 7 8 1-6 5.5 1.5 8-7-4-7 4 1.5-8-6-5.5 8-1z" fill="#FDF3DE" stroke="#3E2723" stroke-width="2.5" stroke-linejoin="round"/></svg>'
  };
  function homeCard(cfg) {
    var b = hotspot(cfg, 'home-entry');
    if (cfg.id !== 'resume') b.classList.add('icon-lg');
    // 第二页四个图标不显示悬浮提示小牌子（其它页面仍保留）
    var oldTip = b.querySelector('.tip');
    if (oldTip) oldTip.remove();
    b.setAttribute('aria-label', cfg.label + ' · ' + cfg.tip);
    b.style.setProperty('--paper', cfg.paper || '#FDF3DE');
    b.style.setProperty('--rot', (cfg.rot || 0) + 'deg');
    var card = el('span', 'home-card');
    var icon = el('span', 'home-icon');
    // 水彩物件图标（透明 PNG）优先；没有则回退到内置手绘 SVG
    if (cfg.iconImg) {
      var img = el('img', 'home-icon-img');
      img.src = cfg.iconImg;
      img.alt = '';
      icon.appendChild(img);
    } else {
      icon.innerHTML = HOME_ICONS[cfg.icon] || HOME_ICONS.about;
    }
    card.appendChild(icon);
    card.appendChild(el('span', 'home-label', cfg.label));
    card.appendChild(el('span', 'home-en', cfg.en || ''));
    b.appendChild(card);
    return b;
  }

  /* ============================================================
     1. 加载页
     ============================================================ */
  $('#loading-label').textContent = C.loading.label;
  $('#loading-sub').textContent = C.loading.sub;
  // START! 从第一帧就常驻显示（不等进度跑满），并且是进入下一页的唯一入口。
  // content.js 的 showSkip / skip 是旧版备用配置，现在不再使用，留着方便以后改回。
  $('#skip-btn').textContent = C.loading.enter;
  $('#skip-btn').classList.add('is-ready');

  /* 主题色：content.js 的 loading.palette 一次性注入第一屏，改一处整页变色 */
  (function applyPalette() {
    var v = $('#v-loading');
    var map = {
      ink: '--ink', paper: '--paper', cutPaper: '--cut-paper',
      haloCore: '--halo-core', haloEdge: '--halo-edge',
      barTop: '--bar-top', barBottom: '--bar-bottom', track: '--track', wash: '--wash'
    };
    Object.keys(map).forEach(function (k) {
      if (C.loading.palette && C.loading.palette[k]) v.style.setProperty(map[k], C.loading.palette[k]);
    });
  })();

  /* 左上剪贴字：样式一比一复刻原版剪贴字（文案 MY WORLD!）
     一个字母 = 一张手撕纸片（SVG 不规则四边形 + 白色撕边 + 右下粉红错位影），
     纸片米白 / 淡粉 / 淡桃交替，字母用本地手绘粗体撑满纸片并逐个歪一点。
     两行左右各有一组放射短线，上方一颗四角星。
     抖动量全部由固定三角函数算出，刷新不会乱跳；尺寸与配色见 content.js
     的 loading.titleStyle。                                            */
  (function buildCutTitle() {
    var cfg = C.loading.titleStyle || {};
    var lines = C.loading.title || ['WELCOME TO', 'MY WORLD!'];
    var host = $('#cut-title');
    var NS = 'http://www.w3.org/2000/svg';
    function sv(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      return n;
    }
    var H = cfg.height || 60;
    var widths = cfg.widths || {};
    var tones = cfg.tones || ['#FBF4E4', '#F3AEC5', '#F8D9C6'];
    var ink = cfg.ink || '#241B18';
    var edge = cfg.edge || '#FFFCF2';
    var shadow = cfg.shadow || 'rgba(206,66,124,.55)';
    var font = cfg.font || 'Lilita One';
    var fontSize = cfg.fontSize || 64;
    // 固定抖动：四角各自偏一点，纸片才像手撕的而不是矩形
    function jit(li, i, n) { return Math.sin((li + 1) * 31.7 + i * 12.9 + n * 7.31) * 4.2; }

    lines.forEach(function (line, li) {
      var row = el('div', 'cut-line l' + (li + 1));
      line.split('').forEach(function (ch, i) {
        if (ch === ' ') { row.appendChild(el('span', 'cut-gap')); return; }
        var w = widths[ch] || 40;
        var wrap = el('span', 'cut-letter');
        wrap.style.width = w + 'px';
        wrap.style.height = H + 'px';
        wrap.style.setProperty('--rot', (Math.sin((li + 1) * 17 + i * 7.3) * 4.2).toFixed(2) + 'deg');
        wrap.style.setProperty('--dy', (Math.sin((li + 1) * 9 + i * 5.1) * 2.6).toFixed(2) + 'px');

        var s = sv('svg', { 'class': 'cut-paper', viewBox: '0 0 ' + w + ' ' + H,
                            width: w, height: H, 'aria-hidden': 'true' });
        // 六个点：上下边各多一个中点并轻微抖动，边缘才有手撕的起伏
        var p = [
          [3 + jit(li,i,1), 4 + jit(li,i,2)],
          [w * 0.5 + jit(li,i,3), 2 + jit(li,i,4)],
          [w - 4 + jit(li,i,5), 3 + jit(li,i,6)],
          [w - 2 + jit(li,i,7), H - 4 + jit(li,i,8)],
          [w * 0.5 + jit(li,i,9), H - 2 + jit(li,i,10)],
          [2 + jit(li,i,11), H - 2 + jit(li,i,12)]
        ];
        var d = 'M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + ' Z';
        var tag = li + '-' + i;
        var gid = 'cutg-' + tag, bid = 'cutb-' + tag, rid = 'cutr-' + tag;
        var defs = sv('defs', {});
        // 上半部一层很淡的白色水彩晕，纸片不至于死板
        var lg = sv('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
        lg.appendChild(sv('stop', { offset: '0', 'stop-color': '#FFFFFF', 'stop-opacity': '.45' }));
        lg.appendChild(sv('stop', { offset: '1', 'stop-color': '#FFFFFF', 'stop-opacity': '0' }));
        defs.appendChild(lg);
        // 粉影轻轻糊一下，才不会像一圈生硬的塑料描边
        var blur = sv('filter', { id: bid, x: '-25%', y: '-25%', width: '150%', height: '150%' });
        blur.appendChild(sv('feGaussianBlur', { stdDeviation: '0.9' }));
        defs.appendChild(blur);
        // 字形毛边：极轻的噪声位移，模拟手绘 / 剪贴印刷不平滑的边缘
        var rough = sv('filter', { id: rid, x: '-15%', y: '-15%', width: '130%', height: '130%' });
        rough.appendChild(sv('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.055',
          numOctaves: '2', seed: String(i * 7 + li * 13 + 3), result: 'n' }));
        rough.appendChild(sv('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'n',
          scale: '1.5', xChannelSelector: 'R', yChannelSelector: 'G' }));
        defs.appendChild(rough);
        s.appendChild(defs);
        // 右下错开的粉红影，先画在纸片底下
        s.appendChild(sv('path', { d: d, transform: 'translate(3 3)', fill: shadow,
          'fill-opacity': '.85', filter: 'url(#' + bid + ')' }));
        var tone = tones[(i + li * 2) % tones.length];
        // 纸片本体 + 一圈白色撕边
        s.appendChild(sv('path', { d: d, fill: tone, stroke: edge,
          'stroke-width': 4, 'stroke-linejoin': 'round' }));
        s.appendChild(sv('path', { d: d, fill: 'url(#' + gid + ')' }));
        // 粗黑手绘字：撑满纸片宽，再单独歪一点点；'!' 太窄，不强制拉伸
        var ta = {
          x: (w / 2).toFixed(1), y: (H * 0.79).toFixed(1), 'text-anchor': 'middle',
          // 万一字体仍被某个预览环境拦掉，也退回粗黑体而不是系统默认细体
          'font-family': '"' + font + '", "Arial Black", Impact, sans-serif',
          'font-size': fontSize, fill: ink,
          textLength: (w - 9), lengthAdjust: 'spacingAndGlyphs',
          filter: 'url(#' + rid + ')',
          transform: 'rotate(' + (jit(li, i, 9) * 0.45).toFixed(1) + ' ' +
                     (w / 2).toFixed(1) + ' ' + (H / 2).toFixed(1) + ')'
        };
        if (ch === '!') { delete ta.textLength; delete ta.lengthAdjust; }
        var t = sv('text', ta);
        t.textContent = ch;
        s.appendChild(t);
        wrap.appendChild(s);
        row.appendChild(wrap);
      });
      host.appendChild(row);
    });

    /* 装饰：两行左右各一组放射短线 + 三颗四角星（原版同款）。
       坐标按 456×190 的标题盒写死，和上面两行纸片的位置对齐。
       WORLD 比 MOON 多两个字母、第二行更长，右边留够位置放放射线。 */
    var deco = sv('svg', { 'class': 'cut-deco', viewBox: '0 0 456 190',
                           width: 456, height: 190, 'aria-hidden': 'true' });
    var ray = cfg.ray || '#8A2E50';
    [
      // 第一行左右（右端纸片到 x≈416，放射线必须在它外面才不会被盖住）
      'M16 56 L4 46', 'M14 67 L0 67', 'M16 78 L4 88',
      'M418 46 L429 36', 'M420 64 L429 64', 'M418 82 L429 94',
      // 第二行左右（换成 WORLD 后右端纸片到 x≈408）
      'M52 110 L40 100', 'M50 126 L34 126', 'M52 142 L40 154',
      'M410 108 L424 98', 'M412 126 L428 126', 'M410 144 L424 156'
    ].forEach(function (d) {
      deco.appendChild(sv('path', { d: d, fill: 'none', stroke: ray,
        'stroke-width': 4.2, 'stroke-linecap': 'round' }));
    });
    function star(cx, cy, r) {
      var k = r * 0.22;
      var d = 'M ' + cx + ' ' + (cy - r) +
        ' C ' + cx + ' ' + (cy - k) + ' ' + (cx + k) + ' ' + (cy - k) + ' ' + (cx + r) + ' ' + cy +
        ' C ' + (cx + k) + ' ' + (cy + k) + ' ' + cx + ' ' + (cy + k) + ' ' + cx + ' ' + (cy + r) +
        ' C ' + cx + ' ' + (cy + k) + ' ' + (cx - k) + ' ' + (cy + k) + ' ' + (cx - r) + ' ' + cy +
        ' C ' + (cx - k) + ' ' + (cy - k) + ' ' + cx + ' ' + (cy - k) + ' ' + cx + ' ' + (cy - r) + ' Z';
      return sv('path', { d: d, fill: cfg.star || '#F6C64A',
        stroke: cfg.starInk || '#3E2723', 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
    }
    deco.appendChild(star(205, 12, 13));
    deco.appendChild(star(340, 9, 7));
    deco.appendChild(star(20, 174, 8));
    host.insertBefore(deco, host.firstChild);

    /* 逐字入场动画（SplitText 等价实现）：给每张纸片编一个 reveal 顺序，
       CSS 按 --stagger 变量延迟逐个揭示；装饰（放射线/星星）最后淡入。
       所有参数来自 content.js 的 loading.titleAnimation。 */
    var anim = C.loading.titleAnimation || {};
    if (anim.enabled !== false) {
      var letters = host.querySelectorAll('.cut-letter');
      var n = letters.length;
      var from = anim.staggerFrom || 'start';
      var order = function (idx) {
        switch (from) {
          case 'end':    return n - 1 - idx;
          case 'center': return Math.abs(idx - (n - 1) / 2);
          case 'edges':  return Math.min(idx, n - 1 - idx);
          case 'random': return Math.random() * n;
          default:       return idx;
        }
      };
      var delayMs = typeof anim.delay === 'number' ? anim.delay : 55;
      var durMs = typeof anim.duration === 'number' ? anim.duration : 900;
      host.classList.add('title-anim');
      host.classList.add('effect-' + (anim.effect || 'rise'));
      host.style.setProperty('--cut-dur', durMs + 'ms');
      Array.prototype.forEach.call(letters, function (node, idx) {
        node.style.setProperty('--stagger', (order(idx) * delayMs) + 'ms');
      });
      // 装饰在最后一片字母揭示后才浮现
      deco.style.setProperty('--stagger', (n * delayMs + durMs * 0.45) + 'ms');
    }

    /* hover 抬起：鼠标靠近字母时这张纸片轻轻浮起（对应 SplitText hoverEffect="lift"）。
       只加事件、不挡任何点击；纸片本身是 transform 定位，这里用 translate 叠加，
       不覆盖原来的歪斜角度。 */
    if (anim.hover) {
      var all = host.querySelectorAll('.cut-letter');
      Array.prototype.forEach.call(all, function (node) {
        // pointer 事件为主，mouse 事件兜底（部分外部浏览器/内核不派发 pointerenter）
        node.addEventListener('pointerenter', function () { node.classList.add('is-lift'); });
        node.addEventListener('pointerleave', function () { node.classList.remove('is-lift'); });
        node.addEventListener('mouseenter', function () { node.classList.add('is-lift'); });
        node.addEventListener('mouseleave', function () { node.classList.remove('is-lift'); });
      });
    }
  })();

  /* 人物背后那层极淡暖光的位置与大小 */
  (function placeHalo() {
    var r = C.loading.halo.rect, h = $('#moon-halo');
    h.style.left = r[0] + 'px'; h.style.top = r[1] + 'px';
    h.style.width = r[2] + 'px'; h.style.height = r[3] + 'px';
  })();

  /* 人物位置 / 大小由 content.js 的 loading.character.rect 决定；
     脚下软影跟着人物走，取树干红棕，让她真的落在地面上。 */
  var chr = C.loading.character;
  if (chr) {
    var host = $('.loading-character');
    host.style.left = chr.rect[0] + 'px';
    host.style.top = chr.rect[1] + 'px';
    host.style.width = chr.rect[2] + 'px';
    host.style.height = chr.rect[3] + 'px';
    var sh = $('.foot-shadow');
    sh.style.left = (chr.rect[0] + chr.rect[2] * 0.14) + 'px';
    sh.style.top = (chr.rect[1] + chr.rect[3] * 0.87) + 'px';
    sh.style.width = (chr.rect[2] * 0.72) + 'px';
    sh.style.height = '30px';
    initCharacter(chr);
  }

  /* 落叶进度：每片叶子有自己的出场时刻，进度到哪就落到哪。
     贴片是 tools/make_ginkgo_leaves.py 从用户插画里抠出的手绘银杏扇叶，
     和底图自带的落叶「同一支笔」，所以叠上去不会像贴纸。

     飘落不是直线下坠：每片有自己的左右摆幅、摆动次数、翻面快慢、
     旋转和下落时长；越接近地面摆得越小，触地轻压一下，落定后彻底静止。
     位置由逐帧计算直接写进 inline transform（CSS 不设过渡）。
     返回一个 setProgress(p, instant) 给加载逻辑调用。                */
  var setLeaves = initLeaves(C.loading.leaves);

  function initLeaves(cfg) {
    var layer = $('#leaf-layer');
    var sprites = cfg.sprites, tints = cfg.tints || ['none'];
    // 固定伪随机：叶子位置每次刷新都一样，方便调构图
    function rnd(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    function range(a, s) { return a[0] + rnd(s) * (a[1] - a[0]); }
    var items = [];
    function add(o) { o.seed = items.length + 1; items.push(o); }

    // 地面：撒得稀，只做镜像 + 小角度定格。叶子自带一道淡落影，
    // 角度小才不会在旋转后露成斜条。压在桌面/人物前那一层已去掉。
    for (var i = 0; i < cfg.ground; i++) {
      add({ x: 60 + rnd(i * 1.7) * 720, y: 458 + rnd(i * 2.3) * 88,
            size: 31 + rnd(i * 3.1) * 15, rot: -14 + rnd(i * 4.7) * 28,
            flip: rnd(i * 9.9) > .5 ? -1 : 1, sprite: i % sprites.length,
            tint: i % tints.length, op: .95 });
    }
    // 桌脚下一小撮：后半程才堆起来
    for (var j = 0; j < cfg.pile; j++) {
      add({ x: 455 + rnd(j * 6.1 + 90) * 170, y: 490 + rnd(j * 7.3 + 90) * 34,
            size: 33 + rnd(j * 8.1 + 90) * 12, rot: -20 + rnd(j * 9.1 + 90) * 40,
            flip: rnd(j * 5.5 + 30) > .5 ? -1 : 1, sprite: (j + 1) % sprites.length,
            tint: (j + 2) % tints.length, op: 1 });
    }

    // 先按「原始全部叶子」定好出场时刻，再按落点 x 去掉最左边几片。
    // 这样剩下的叶子连位置、飘落轨迹、出场时机都不会跟着重排。
    var total = items.length;
    items.forEach(function (o, idx) { o.t = 0.02 + (idx / total) * 0.52; });
    if (cfg.trimLeft > 0) {
      var leftmost = items.slice().sort(function (a, b) { return a.x - b.x; })
                          .slice(0, cfg.trimLeft);
      items = items.filter(function (o) { return leftmost.indexOf(o) < 0; });
    }

    var leaves = items.map(function (o) {
      var d = el('div', 'leaf');
      d.style.setProperty('--lw', o.size.toFixed(1) + 'px');
      d.style.setProperty('--flip', o.flip);
      d.style.setProperty('--tint', tints[o.tint]);
      d.innerHTML = '<i class="leaf-in"><img class="leaf-img" src="' +
                    sprites[o.sprite] + '" alt=""></i>';
      layer.appendChild(d);
      return {
        node: d,
        t: o.t,                               // 出生时刻：最晚 49%，赶在 100% 前落定
        bornAt: 0, done: false,
        x: o.x, y: o.y, op: o.op, rot: o.rot,
        fall:  range(cfg.fall, o.seed * 7),                       // 从多高开始飘
        sway:  range(cfg.sway, o.seed * 13) * (rnd(o.seed * 17) > .5 ? 1 : -1),
        cycles: 1.2 + rnd(o.seed * 19) * 0.9,                    // 左右摆几个来回
        turn:  range(cfg.turn, o.seed * 23),                     // 空中翻面快慢
        phase: rnd(o.seed * 29) * Math.PI * 2,
        rot0:  o.rot - 110 - rnd(o.seed * 31) * 130,
        dur:   range(cfg.dur, o.seed * 37)                       // 每片快慢不同
      };
    });

    // u = 这片叶子已经飘了多久（0→1）
    function place(L, u) {
      var e = u * u * (3 - 2 * u);                    // 先慢、中间快、落地前收住
      // 摆动幅度一路收窄，到 u=1 精确归零：落地那一帧不会横向跳一下
      var damp = Math.pow(1 - u, 0.65);
      var wave = Math.sin(u * Math.PI * 2 * L.cycles + L.phase);
      var cx = L.x + wave * L.sway * damp;
      var cy = L.y - L.fall + L.fall * e;
      var cr = L.rot0 + (L.rot - L.rot0) * e + wave * 10 * damp;
      // 空中翻面：叶面忽宽忽窄；越接近落地越展平，不会突然跳一下
      var flip = 0.62 + 0.38 * Math.abs(Math.cos(u * Math.PI * L.turn + L.phase));
      var sx = flip + (1 - flip) * u * u;
      // 触地那一下轻轻压扁再弹回
      var sy = u > 0.9 ? 1 - 0.07 * Math.sin((u - 0.9) / 0.1 * Math.PI) : 1;
      L.node.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) +
        'px) rotate(' + cr.toFixed(1) + 'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
      L.node.style.opacity = (L.op * Math.min(1, u / 0.12)).toFixed(3);
    }
    function settle(L) {
      L.node.style.transform = 'translate(' + L.x.toFixed(1) + 'px,' + L.y.toFixed(1) +
                               'px) rotate(' + L.rot.toFixed(1) + 'deg)';
      L.node.style.opacity = L.op.toFixed(2);
      L.node.classList.add('is-settled');
    }

    function frame(ts) {
      if ($('#v-loading').classList.contains('is-active')) {
        for (var i = 0; i < leaves.length; i++) {
          var L = leaves[i];
          if (!L.bornAt || L.done) continue;
          var u = Math.min(1, (ts - L.bornAt) / L.dur);
          if (u >= 1) { L.done = true; settle(L); }
          else place(L, u);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    var halo = $('#moon-halo');
    function setProgress(p, instant) {
      for (var i = 0; i < leaves.length; i++) {
        var L = leaves[i];
        if (instant) {                            // 跳过：连正在半空的也直接落定
          if (!L.done) {
            L.node.classList.add('is-landed');
            L.done = true; settle(L);
          }
          continue;
        }
        if (L.bornAt || L.done) continue;
        if (p >= L.t) {
          L.node.classList.add('is-landed');     // 已出现（供回归脚本计数）
          L.bornAt = performance.now();
        }
      }
      halo.style.opacity = (0.35 + p * 0.4).toFixed(2);
    }
    return setProgress;
  }

  /* 64 帧透明人物：鼠标绕着她转一圈 → 显示对应那一帧（转头 / 低头）。
     角度映射、圆周最短差、方向滞回、限速、跟手缓冲全部沿用
     video-interactive.html 样片里已验收过的版本；只在第一屏激活时计算。 */
  function initCharacter(cfg) {
    var canvas = $('#loading-sprite'), ctx = canvas.getContext('2d');
    var wrap = $('.loading-character');
    var N = cfg.frames, CELL = cfg.cell, COLS = cfg.cols;
    var atlas = null, enabled = false;
    var pos = 0, target = 0, renderIdx = -1, dirSign = 1, lastTs = 0;
    function onFirstScreen() { return $('#v-loading').classList.contains('is-active'); }

    function sizeCanvas() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      var w = Math.max(1, Math.round(r.width * dpr));
      var h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; renderIdx = -1; }
    }
    function draw(idx) {
      sizeCanvas();
      if (!atlas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(atlas, (idx % COLS) * CELL, Math.floor(idx / COLS) * CELL, CELL, CELL,
                    0, 0, canvas.width, canvas.height);
      renderIdx = idx;
    }
    function circularDelta(from, to, n, dir) {
      var raw = to - from;
      var a = ((raw % n) + n) % n, b = a - n;
      var margin = Math.max(0.5, n / 18), ccw = -b, cw = a;
      if (dir > 0) return (ccw + margin < cw) ? b : a;
      return (cw + margin < ccw) ? a : b;
    }
    function loop(ts) {
      var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      if (enabled && onFirstScreen()) {
        var delta = circularDelta(pos, target, N, dirSign);
        var step = delta * (1 - Math.exp(-dt / cfg.follow));
        var maxStep = cfg.maxSpeed * dt;
        if (step > maxStep) step = maxStep; else if (step < -maxStep) step = -maxStep;
        pos += step;
        if (Math.abs(delta) > Math.max(0.5, N / 18)) dirSign = delta > 0 ? 1 : -1;
        var idx = Math.round(pos);
        idx = ((idx % N) + N) % N;
        if (idx !== renderIdx) draw(idx);
      }
      requestAnimationFrame(loop);
    }
    function goFront() { target = 0; pos = 0; dirSign = 1; if (enabled) draw(0); }
    function onMove(e) {
      if (!enabled || !onFirstScreen()) return;
      var r = wrap.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height * 0.52);
      if (Math.sqrt(dx * dx + dy * dy) < 56) { target = 0; return; }
      var ang = Math.atan2(dx, -dy);            // 0=上 90=右 180=下 270=左
      if (ang < 0) ang += Math.PI * 2;
      target = ang / (Math.PI * 2) * N;
      if (target >= N) target = 0;
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', goFront);
    document.addEventListener('pointerleave', goFront);
    window.addEventListener('resize', function () { renderIdx = -1; });

    var img = new Image();
    img.onload = function () { atlas = img; enabled = true; draw(0); requestAnimationFrame(loop); };
    img.onerror = function () { console.warn('人物图集加载失败：' + cfg.src); };
    img.src = cfg.src;
  }

  var loadingDone = false, skipped = false;

  // 进度跑满后只把按钮换成「进入」，停在本页，不自动切走
  function finishLoading() {
    if (loadingDone) return;
    loadingDone = true;
    $('#skip-btn').textContent = C.loading.enter;
    $('#skip-btn').classList.add('is-ready');
    $('#loading-sub').textContent = C.loading.readySub;
    if (C.loading.autoEnter) setTimeout(enterHome, 240);
  }

  // 只有用户主动点击 / 按键，才进入首页
  function enterHome() {
    if (current !== 'loading') return;
    if (!loadingDone) {
      skipped = true;
      $('#progress-fill').style.width = '100%';
      $('#loading-pct').textContent = '100%';
      $('#moon-tint').style.opacity = '.42';
      setLeaves(1, true);                 // 跳过时叶子直接铺满，不播飘落动画
      loadingDone = true;
    }
    go('home');
  }

  function runLoading() {
    var t0 = performance.now();
    function tick(now) {
      if (skipped) return;
      var p = Math.min(1, (now - t0) / C.loading.duration);
      var pct = Math.round(p * 100);
      $('#progress-fill').style.width = pct + '%';
      $('#loading-pct').textContent = pct + '%';
      $('#moon-tint').style.opacity = (p * 0.42).toFixed(3);
      setLeaves(p);                       // 落叶跟着进度一起铺满
      if (p < 1) requestAnimationFrame(tick);
      else finishLoading();
    }
    requestAnimationFrame(tick);
  }
  // 只有这个按钮能进下一页；点背景、人物、进度条等任何别的地方都不进。
  $('#skip-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    enterHome();
  });

  /* ============================================================
     2. 首页
     ============================================================ */
  if (C.home.greeting && $('#home-greeting')) {
    var gi = C.home.greetingImages;
    if (gi && gi.hi && gi.im && gi.name) {
      // 一比一复刻参考图的手刷涂鸦字：第一排「Hi, I'm」两张字图并排，
      // 第二排名字单独一行放大。拆图脚本 tools/split_greeting.py。
      var line1 = el('div', 'greet-line-1');
      var hiImg = el('img', 'greet-hi-img'); hiImg.src = gi.hi; hiImg.alt = 'Hi,';
      var imImg = el('img', 'greet-im-img'); imImg.src = gi.im; imImg.alt = "I'm";
      line1.appendChild(hiImg);
      line1.appendChild(imImg);
      var nameImg = el('img', 'greet-name-img'); nameImg.src = gi.name; nameImg.alt = 'Zhao Yidi';
      $('#home-greeting').appendChild(line1);
      $('#home-greeting').appendChild(nameImg);
    } else if (gi && gi.hi && gi.name) {
      // 旧的两图版回退（只有 hi + 一整张名字图）
      var hiImg2 = el('img', 'greet-hi-img'); hiImg2.src = gi.hi; hiImg2.alt = 'Hi,';
      var nameImg2 = el('img', 'greet-name-img'); nameImg2.src = gi.name; nameImg2.alt = C.home.greeting;
      $('#home-greeting').appendChild(hiImg2);
      $('#home-greeting').appendChild(nameImg2);
    } else {
      var g = C.home.greeting;
      // 回退：无字图时用文字，"Hi," 一行小字 + 名字大字
      var comma = g.indexOf(',');
      if (comma > -1) {
        $('#home-greeting').appendChild(el('span', 'hi', g.slice(0, comma + 1)));
        $('#home-greeting').appendChild(document.createTextNode(g.slice(comma + 1).trim()));
      } else {
        $('#home-greeting').textContent = g;
      }
    }
  }
  C.home.entries.forEach(function (e) {
    $('#home-hotspots').appendChild(homeCard(e));
  });
  C.home.footer.forEach(function (f) {
    var a = el('a', '', f.text);
    a.href = f.href;
    $('#home-footer').appendChild(a);
  });

  /* 更多页文案 */
  if (C.more) {
    if ($('#more-eyebrow')) $('#more-eyebrow').textContent = C.more.eyebrow || '';
    if ($('#more-title')) $('#more-title').textContent = C.more.title || '';
    if ($('#more-hint')) $('#more-hint').textContent = C.more.hint || '';
  }

  /* ============================================================
     3. 简历页
     ============================================================ */
  $('#resume-eyebrow').textContent = C.resume.eyebrow;
  $('#resume-name').textContent = C.resume.name;
  $('#resume-role').textContent = C.resume.role;
  $('#resume-action').textContent = C.resume.actionText;
  (function bindResumeDownload () {
    var btn = $('#resume-action');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      var b64 = window.__RESUME_PDF_B64__;
      if (!b64) return; // 内嵌数据缺失时，保留 href 默认下载作兜底
      e.preventDefault();
      try {
        var url = 'data:application/pdf;base64,' + b64;
        var tmp = document.createElement('a');
        tmp.href = url;
        tmp.download = '赵怡迪-实习三个月及以上.pdf';
        tmp.style.display = 'none';
        document.body.appendChild(tmp);
        tmp.click();
        document.body.removeChild(tmp);
      } catch (err) {
        console.error('resume download failed', err);
        window.location.href = btn.getAttribute('href');
      }
    });
  })();
  $('.portrait').src = C.resume.photo;
  C.resume.contact.forEach(function (c) {
    $('#resume-contact').appendChild(el('li', '', '<b>' + c.k + '</b>' + c.v));
  });
  C.resume.sections.forEach(function (sec) {
    var box = el('div', 'resume-section');
    box.appendChild(el('h3', '', sec.title));
    if (sec.rows) sec.rows.forEach(function (r) {
      box.appendChild(el('div', 'resume-row',
        '<span>' + r.left + '</span><span>' + r.mid + '</span><span>' + r.right + '</span>'));
    });
    if (sec.notes) {
      var ul = el('ul', 'resume-notes');
      sec.notes.forEach(function (n) { ul.appendChild(el('li', '', n)); });
      box.appendChild(ul);
    }
    $('#resume-sections').appendChild(box);
  });

  /* ============================================================
     4. Demo 页
     ============================================================ */
  $('#demo-eyebrow').textContent = C.demo.eyebrow;
  $('#demo-title').textContent = C.demo.title;
  C.demo.timeline.forEach(function (n) {
    var node = el('div', 'tl-node');
    node.appendChild(el('i', 'tl-dot'));
    node.appendChild(el('span', '', n.label));
    $('#demo-timeline').appendChild(node);
  });

  // 把「• 小标题：正文」渲染成 HTML：小标题加粗
  function detailHTML(detail) {
    return (detail || '').split('\n').map(function (line) {
      var text = line;
      if (line.indexOf('• ') === 0) {
        var colon = line.indexOf('：');
        if (colon > -1) text = '<strong>' + line.slice(2, colon) + '</strong>' + line.slice(colon);
      }
      return '<span class="pc-para">' + text + '</span>';
    }).join('');
  }

  /* ---------- 文件夹模式（React Bits <Folder /> 的手作等价实现） ----------
     点封面翻开 → 纸页扇形展开；鼠标靠近封面纸页探出；点纸页放大看详情；
     拖动纸页可摊到桌面任意位置、拖回文件夹自动归位。全部原生实现。 */
  var folderCfg = C.demo.folder || {};
  var reactCfg = C.demo.reactFolder || {};
  if (reactCfg.enabled && window.ReactBitsFolder && window.ReactDOM) {
    // React Bits <Folder /> 一比一原组件
    renderReactFolder(reactCfg);
    $('#demo-projects').hidden = true;
    $('#demo-folder-wrap').hidden = true;
    $('#demo-timeline').hidden = true;
    $('#demo-footer').hidden = true;
    $('#react-folder-host').hidden = false;
  } else if (folderCfg.enabled) {
    renderFolder(folderCfg);
    $('#demo-projects').hidden = true;
    $('#demo-folder-wrap').hidden = false;
    $('#demo-footer').hidden = true;
    $('#demo-timeline').hidden = true;
  } else {
    // 回到非文件夹的三张翻转卡：恢复原页面元素，隐藏两套文件夹容器
    $('#react-folder-host').hidden = true;
    $('#demo-projects').hidden = false;
    $('#demo-folder-wrap').hidden = true;
    $('#demo-timeline').hidden = false;
    $('#demo-footer').hidden = false;
    renderOldCards();
  }

  function renderReactFolder(cfg) {
    var host = $('#react-folder-host');
    var e = window.React.createElement;
    var props = {};
    ['label', 'mode', 'variant', 'color', 'paperColor', 'tabPosition', 'layout', 'size',
      'openOn', 'defaultOpen', 'draggable', 'zoomOnClick', 'peek', 'intro', 'tilt',
      'bounce', 'speed', 'theme'].forEach(function (k) {
      if (cfg[k] !== undefined) props[k] = cfg[k];
    });
    if (typeof cfg.onItemClick === 'function') props.onItemClick = cfg.onItemClick;
    if (typeof cfg.onItemDrop === 'function') props.onItemDrop = cfg.onItemDrop;

    var tree;
    if (cfg.flipCards && window.ReactBitsFlipCard) {
      // 翻转卡：正面插画，背面项目介绍（简历原文），颜色取 demo.cards 的红/绿/紫
      var kids = C.demo.cards.map(function (c, i) {
        return e(window.ReactBitsFlipCard, {
          key: i,
          front: (cfg.items[i] && cfg.items[i].image) || c.figure,
          back: detailHTML(c.detail),
          accent: c.accent,
          tint: c.tint,
          no: c.no,
          title: c.title,
          stat: c.stat
        });
      });
      props.zoomOnClick = false; // 点击交给翻转卡处理，不触发放大
      tree = e(window.ReactBitsFolder, props, kids);
    } else {
      props.items = (cfg.items || []).map(function (it) {
        return { image: it.image, title: it.title, alt: it.alt };
      });
      tree = e(window.ReactBitsFolder, props);
    }
    window.ReactDOM.createRoot(host).render(tree);
  }

  function renderFolder(fg) {
    var wrap = $('#demo-folder-wrap');
    var papersHost = $('#df-papers');
    var looseLayer = $('#df-loose-layer');
    var front = $('#df-front');
    $('#df-tab').textContent = fg.label || '项目经历';
    $('#df-caption').textContent = fg.caption || '';
    $('#df-hint').textContent = fg.hint || '';
    wrap.style.setProperty('--folder-color', fg.color || '#B98A5E');
    if (!fg.peek) wrap.classList.add('no-peek');
    if (!fg.draggable) wrap.classList.add('no-drag');

    var pages = [];
    C.demo.cards.forEach(function (c, i) {
      var page = el('div', 'df-page');
      page.style.setProperty('--accent', c.accent || '#9C3A2E');
      page.style.setProperty('--tint', c.tint || '#FBEDE7');
      page.style.setProperty('--i', i);
      page.setAttribute('role', 'button');
      page.setAttribute('tabindex', '0');
      page.setAttribute('aria-label', c.title + '，点击查看项目详情');
      var fig = el('div', 'df-page-fig');
      if (c.figure) {
        var img = el('img', 'df-page-img'); img.src = c.figure; img.alt = c.title;
        fig.appendChild(img);
      }
      page.appendChild(fig);
      var cap = el('div', 'df-page-cap');
      cap.appendChild(el('span', 'df-page-no', c.no || ''));
      cap.appendChild(el('b', 'df-page-title', c.title || ''));
      page.appendChild(cap);
      page.appendChild(el('div', 'df-page-sub', c.sub || ''));
      // 详情数据挂在元素上，点开时用
      page._data = c;
      papersHost.appendChild(page);
      pages.push(page);
    });

    var open = false;
    function setOpen(v) {
      open = v;
      wrap.classList.toggle('is-open', open);
      front.setAttribute('aria-label', open ? '合上项目文件夹' : '打开项目文件夹');
    }
    front.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!open); });

    // 点纸页放大详情（拖动不会触发：由 pointer 移动距离判定）
    function showDetail(c) {
      var ov = el('div', 'df-detail');
      var card = el('div', 'df-detail-card');
      card.style.setProperty('--accent', c.accent || '#9C3A2E');
      card.style.setProperty('--tint', c.tint || '#FBEDE7');
      var head = el('div', 'df-detail-head');
      head.appendChild(el('span', 'pc-no', c.no || ''));
      head.appendChild(el('h3', 'df-detail-title', c.title || ''));
      card.appendChild(head);
      var body = el('div', 'df-detail-body');
      if (c.figure) { var im = el('img', 'df-detail-img'); im.src = c.figure; im.alt = c.title; body.appendChild(im); }
      if (c.stat) body.appendChild(el('div', 'df-detail-stat', c.stat));
      var dt = el('div', 'df-detail-text'); dt.innerHTML = detailHTML(c.detail); body.appendChild(dt);
      card.appendChild(body);
      var close = el('button', 'df-detail-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', '关闭详情');
      card.appendChild(close);
      ov.appendChild(card);
      $('#v-demo .paper-frame').appendChild(ov);
      requestAnimationFrame(function () { ov.classList.add('show'); });
      function dismiss() { ov.classList.remove('show'); setTimeout(function () { ov.remove(); }, 260); }
      close.addEventListener('click', function (e) { e.stopPropagation(); dismiss(); });
      ov.addEventListener('click', dismiss);
      card.addEventListener('click', function (e) { e.stopPropagation(); });
      ov._dismiss = dismiss;
      detailOverlay = ov;
    }
    var detailOverlay = null;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && detailOverlay) { detailOverlay._dismiss(); detailOverlay = null; }
    });

    // 拖出 / 拖回：pointer 事件，移动超过阈值才算拖动
    var stage = $('#stage');
    function stageXY(clientX, clientY) {
      var r = stage.getBoundingClientRect();
      var s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
      return { x: (clientX - r.left) / s, y: (clientY - r.top) / s };
    }
    function inFolder(x, y) {
      var r = $('#df-back').getBoundingClientRect();
      var sr = stage.getBoundingClientRect();
      var s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
      var l = (r.left - sr.left) / s, t = (r.top - sr.top) / s;
      return x > l - 30 && x < l + r.width / s + 30 && y > t - 40 && y < t + r.height / s + 40;
    }
    function bindDrag(page) {
      var drag = null;
      page.addEventListener('pointerdown', function (e) {
        if (!fg.draggable || e.button > 0) return;
        drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, page: page };
        page.setPointerCapture(e.pointerId);
      });
      page.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!drag.moved && Math.hypot(dx, dy) < 8) return;
        if (!drag.moved) {
          drag.moved = true;
          page.classList.add('is-dragging');
          var p = stageXY(e.clientX, e.clientY);
          looseLayer.appendChild(page);           // 移到「桌面」层
          page.style.left = p.x + 'px';
          page.style.top = p.y + 'px';
          page.style.setProperty('--dx', 0); page.style.setProperty('--dy', 0);
          wrap.classList.add('has-loose');
        }
        var cur = stageXY(e.clientX, e.clientY);
        page.style.left = (cur.x - 0) + 'px';
        page.style.top = (cur.y - 0) + 'px';
        // 拖回文件夹时高亮
        wrap.classList.toggle('drop-target', inFolder(cur.x, cur.y));
      });
      function end(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var wasMoved = drag.moved;
        drag = null;
        page.classList.remove('is-dragging');
        wrap.classList.remove('drop-target');
        if (!wasMoved) return;                    // 没拖动 → 交给 click 放大
        var p = stageXY(e.clientX, e.clientY);
        if (inFolder(p.x, p.y)) {                 // 归位
          papersHost.appendChild(page);
          page.style.left = ''; page.style.top = '';
          wrap.classList.toggle('has-loose', !!looseLayer.children.length);
        }
      }
      page.addEventListener('pointerup', end);
      page.addEventListener('pointercancel', end);
      // 只有没拖动过才放大（拖动后 pointerup 会吞掉 click）
      page.addEventListener('click', function (e) {
        e.stopPropagation();
        if (page._justDragged) { page._justDragged = false; return; }
        if (page.parentElement === looseLayer || page.parentElement === papersHost) showDetail(page._data);
      });
    }
    pages.forEach(bindDrag);
    if (fg.intro) { wrap.classList.add('intro'); setTimeout(function () { wrap.classList.remove('intro'); }, 1400); }
  }

  function renderOldCards() {
  C.demo.cards.forEach(function (c) {
    var card = el('div', 'proj-card');
    card.style.setProperty('--rot', (c.rot || 0) + 'deg');
    card.style.setProperty('--accent', c.accent || '#9C3A2E');
    card.style.setProperty('--tint', c.tint || '#FBEDE7');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', c.title + '，点击查看项目详情');

    var inner = el('div', 'pc-inner');

    // 正面：配图卡
    var front = el('div', 'pc-face pc-front');
    var head = el('div', 'pc-head');
    head.appendChild(el('span', 'pc-no', c.no || ''));
    head.appendChild(el('h3', 'pc-title', c.title));
    front.appendChild(head);

    var fig = el('div', 'pc-fig');
    if (c.figure) {
      var img = el('img', 'pc-img');
      img.src = c.figure;
      img.alt = c.title;
      fig.appendChild(img);
    } else {
      fig.appendChild(el('span', 'pc-ph-mark', '✎'));
      fig.appendChild(el('span', 'pc-ph-label', C.demo.figureHint || '配图占位'));
      fig.appendChild(el('span', 'pc-ph-size', C.demo.figureSize || ''));
    }
    front.appendChild(fig);
    front.appendChild(el('p', 'pc-sub', c.sub || ''));
    if (c.stat) front.appendChild(el('div', 'pc-stat', c.stat));
    inner.appendChild(front);

    // 背面：简历原文
    var back = el('div', 'pc-face pc-back');
    var bHead = el('div', 'pc-back-head');
    bHead.appendChild(el('span', 'pc-no', c.no || ''));
    back.appendChild(bHead);
    back.appendChild(el('div', 'pc-back-label', '项目详情'));
    var detail = el('p', 'pc-back-detail');
    // 「• 小标题：正文」里的小标题加粗，正文保持原样
    detail.innerHTML = (c.detail || '').split('\n').map(function (line) {
      var text = line;
      if (line.indexOf('• ') === 0) {
        var colon = line.indexOf('：');
        if (colon > -1) {
          text = '<strong>' + line.slice(2, colon) + '</strong>' + line.slice(colon);
        }
      }
      return '<span class="pc-para">' + text + '</span>';
    }).join('');
    back.appendChild(detail);
    back.appendChild(el('div', 'pc-back-tip', '点击翻回 ↩'));
    inner.appendChild(back);

    card.appendChild(inner);

    // 每次点击都朝同一方向继续转 180°：翻过去 180°，翻回来 360°，不原路退回
    var flipAngle = 0;
    card.setAttribute('aria-pressed', 'false');
    function toggleFlip(e) {
      e.stopPropagation();
      flipAngle += 180;
      inner.style.transform = 'rotateY(' + flipAngle + 'deg)';
      var isBack = (flipAngle / 180) % 2 === 1;
      card.classList.toggle('flipped', isBack);
      card.setAttribute('aria-pressed', isBack ? 'true' : 'false');
    }
    // 转满一圈后无动画归零，避免角度无限累加
    inner.addEventListener('transitionend', function (ev) {
      if (ev.propertyName !== 'transform' || flipAngle < 360) return;
      var next = flipAngle % 360;
      if (next === flipAngle) return;
      inner.style.transition = 'none';
      inner.style.transform = 'rotateY(' + next + 'deg)';
      void inner.offsetWidth;
      inner.style.transition = '';
      flipAngle = next;
    });
    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(e); }
    });

    $('#demo-projects').appendChild(card);
  });
  C.demo.tags.forEach(function (t) { $('#demo-footer').appendChild(el('span', '', t)); });
  } // end renderOldCards

  /* ============================================================
     5. 实践经历页（4 张手作纸卡，数据来自个人信息 md 第七节）
     ============================================================ */
  $('#skills-eyebrow').textContent = C.practice.eyebrow;
  $('#skills-title').textContent = C.practice.title;
  C.practice.cards.forEach(function (c) {
    var d = el('div', 'skill-card');
    d.style.background = c.color;
    var lines = c.points || (c.desc ? [c.desc] : []);
    d.innerHTML =
      '<span class="no">' + c.no + '</span>' +
      '<span class="public">' + c.time + '</span>' +
      '<h3>' + c.title + '</h3>' +
      '<p class="slug">' + c.role + '</p>' +
      '<ul class="desc-list">' + lines.map(function (line) {
        return '<li>' + line + '</li>';
      }).join('') + '</ul>';
    $('#skills-grid').appendChild(d);
  });

  /* ============================================================
     5b. 校园经历页（与项目经历同款：时间轴 + 翻转卡 + 底部标签）
     ============================================================ */
  /* 建一张 3:4 手绘翻转卡：正面插画/编号/标题/数据条，背面详情；点击翻面 */
  function buildFlipCard(c) {
    var card = el('div', 'proj-card');
    card.style.setProperty('--rot', (c.rot || 0) + 'deg');
    card.style.setProperty('--accent', c.accent || '#9C3A2E');
    card.style.setProperty('--tint', c.tint || '#FBEDE7');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', c.title + '，点击查看经历详情');

    var inner = el('div', 'pc-inner');

    var front = el('div', 'pc-face pc-front');
    var head = el('div', 'pc-head');
    head.appendChild(el('span', 'pc-no', c.no || ''));
    head.appendChild(el('h3', 'pc-title', c.title));
    front.appendChild(head);
    var fig = el('div', 'pc-fig');
    var img = el('img', 'pc-img');
    img.src = c.figure;
    img.alt = c.title;
    fig.appendChild(img);
    front.appendChild(fig);
    front.appendChild(el('p', 'pc-sub', c.sub || ''));
    if (c.stat) front.appendChild(el('div', 'pc-stat', c.stat));
    inner.appendChild(front);

    var back = el('div', 'pc-face pc-back');
    var bHead = el('div', 'pc-back-head');
    bHead.appendChild(el('span', 'pc-no', c.no || ''));
    back.appendChild(bHead);
    back.appendChild(el('div', 'pc-back-label', '经历详情'));
    var detail = el('p', 'pc-back-detail');
    detail.innerHTML = (c.detail || '').split('\n').map(function (line) {
      var text = line;
      if (line.indexOf('• ') === 0) {
        var colon = line.indexOf('：');
        if (colon > -1) text = '<strong>' + line.slice(2, colon) + '</strong>' + line.slice(colon);
      }
      return '<span class="pc-para">' + text + '</span>';
    }).join('');
    back.appendChild(detail);
    back.appendChild(el('div', 'pc-back-tip', '点击翻回 ↩'));
    inner.appendChild(back);

    card.appendChild(inner);

    var flipAngle = 0;
    card.setAttribute('aria-pressed', 'false');
    function toggleFlip(e) {
      e.stopPropagation();
      flipAngle += 180;
      inner.style.transform = 'rotateY(' + flipAngle + 'deg)';
      var isBack = (flipAngle / 180) % 2 === 1;
      card.classList.toggle('flipped', isBack);
      card.setAttribute('aria-pressed', isBack ? 'true' : 'false');
    }
    inner.addEventListener('transitionend', function (ev) {
      if (ev.propertyName !== 'transform' || flipAngle < 360) return;
      var next = flipAngle % 360;
      if (next === flipAngle) return;
      inner.style.transition = 'none';
      inner.style.transform = 'rotateY(' + next + 'deg)';
      void inner.offsetWidth;
      inner.style.transition = '';
      flipAngle = next;
    });
    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(e); }
    });
    return card;
  }

  var campusEyebrow = $('#campus-eyebrow'), campusTitle = $('#campus-title');
  var campusProjects = $('#campus-projects');
  if (campusProjects && C.campus) {
    if (campusEyebrow) campusEyebrow.textContent = C.campus.eyebrow;
    if (campusTitle) campusTitle.textContent = C.campus.title;
    (C.campus.timeline || []).forEach(function (n) {
      var node = el('div', 'tl-node');
      node.appendChild(el('i', 'tl-dot'));
      node.appendChild(el('span', '', n.label));
      $('#campus-timeline').appendChild(node);
    });
    C.campus.cards.forEach(function (c) { campusProjects.appendChild(buildFlipCard(c)); });
    (C.campus.tags || []).forEach(function (t) { $('#campus-footer').appendChild(el('span', '', t)); });
  }

  /* ============================================================
     6. 建筑作品集页
     ============================================================ */
  var archEyebrow = $('#arch-eyebrow'), archTitle = $('#arch-title');
  if (archEyebrow) archEyebrow.textContent = C.architect.eyebrow;
  if (archTitle) archTitle.textContent = C.architect.title;
  var workIndex = 0;
  function renderWork(i) {
    if (!$('#work-img')) return; // 技能工具内页已清空，没有轮播节点时安全跳过
    workIndex = (i + C.architect.works.length) % C.architect.works.length;
    var w = C.architect.works[workIndex];
    var img = $('#work-img'), frame = $('.gallery-photo');
    frame.classList.add('swap');
    setTimeout(function () {
      img.src = w.src;
      img.alt = w.caption;
      $('#work-caption').textContent = w.caption;
      frame.classList.remove('swap');
    }, 180);
    $$('#work-dots i').forEach(function (d, k) { d.classList.toggle('on', k === workIndex); });
  }
  if ($('#work-dots')) {
    C.architect.works.forEach(function (w, i) {
      var d = el('i');
      d.dataset.i = i;
      $('#work-dots').appendChild(d);
    });
  }
  if ($('#work-prev')) $('#work-prev').addEventListener('click', function () { renderWork(workIndex - 1); });
  if ($('#work-next')) $('#work-next').addEventListener('click', function () { renderWork(workIndex + 1); });
  if ($('#work-dots')) $('#work-dots').addEventListener('click', function (e) {
    if (e.target.dataset.i != null) renderWork(+e.target.dataset.i);
  });
  renderWork(0);

  /* ============================================================
     路由 / 视图切换
     ============================================================ */
  var VIEWS = ['loading', 'home', 'resume', 'demo', 'skills', 'architect', 'more', 'contact'];
  var current = 'loading';
  function viewEl(name) { return $('#v-' + name); }
  /* 第一屏：舞台整体放大到铺满窗口（is-fullbleed）。
     第二页：舞台仍是居中的 865×590，但去掉卡片外框、变透明，
             由最底层的 .ambient 把银杏草地水彩铺满整个窗口（is-homebg）。
     内页：恢复原来的深色画框 + 居中卡片。                              */
  function syncFullBleed(name) {
    var fb = name === 'loading';
    var hb = name === 'home';
    var ct = name === 'contact';       // 联系页：深色舞台，不套米黄纸内页样式
    var mo = name === 'more';          // 更多页：和联系页一样用深色渐变背景，不加黄底
    var dk = ct || mo;                 // 深色背景页共用 view-dark
    var inn = !fb && !hb && !dk;       // 四个内页：两侧露出的底色从深色画框改成米黄纸色
    $('#stage').classList.toggle('is-fullbleed', fb);
    $('#stage').classList.toggle('is-homebg', hb);
    document.body.classList.toggle('fullbleed-autumn', fb);
    document.body.classList.toggle('view-home', hb);
    document.body.classList.toggle('view-inner', inn);
    document.body.classList.toggle('view-contact', ct);
    document.body.classList.toggle('view-more', mo);
    document.body.classList.toggle('view-dark', dk);
    // 标记当前内页，供四个内页各自的外圈底色使用
    ['resume', 'skills', 'demo', 'architect'].forEach(function (v) {
      document.body.classList.toggle('inner-' + v, inn && name === v);
    });
  }
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '').trim();
    return VIEWS.indexOf(h) > -1 ? h : null;
  }
  function go(name, noPush) {
    if (VIEWS.indexOf(name) < 0 || name === current) return;
    var from = viewEl(current), to = viewEl(name);
    from.classList.remove('is-active');
    from.classList.add('is-behind');
    to.classList.remove('is-behind');
    to.classList.add('is-active');
    current = name;
    syncFullBleed(name);
    if (!noPush) {
      var h = name === 'home' ? '#/' : '#/' + name;
      if (location.hash !== h) location.hash = h;
    }
  }
  window.addEventListener('hashchange', function () {
    var v = parseHash();
    if (v && v !== current) go(v, true);
    else if (!v && current !== 'home') go('home', true);
  });

  /* ---------- 全局点击委托 ---------- */
  document.addEventListener('click', function (e) {
    var goBtn = e.target.closest('[data-go]');
    if (goBtn) { go(goBtn.dataset.go); return; }

    if (e.target.closest('[data-close]')) { go('home'); return; }

    var mascot = e.target.closest('[data-mascot]');
    if (mascot) { sparkle(e.clientX, e.clientY); return; }

    var a = e.target.closest('a');
    if (a && a.getAttribute('href') === '#') e.preventDefault();
  });

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current !== 'home' && current !== 'loading') { go('home'); return; }
    if (current === 'skills') {
      if (e.key === 'ArrowLeft') renderWork(workIndex - 1);
      if (e.key === 'ArrowRight') renderWork(workIndex + 1);
    }
    // 加载页不设键盘捷径：只有 START! 按钮这一条路能进下一页
  });

  /* ---------- 点击小人冒星星的小彩蛋 ---------- */
  function sparkle(cx, cy) {
    var stage = $('#stage');
    var r = stage.getBoundingClientRect();
    var s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
    var x = (cx - r.left) / s, y = (cy - r.top) / s;
    for (var i = 0; i < 6; i++) {
      (function (k) {
        var st = el('div', '', '✦');
        st.style.cssText = 'position:absolute;z-index:20;pointer-events:none;color:#ffd83d;' +
          'font-size:' + (14 + Math.random() * 16) + 'px;text-shadow:0 0 6px #fff;' +
          'left:' + x + 'px;top:' + y + 'px;transition:transform .8s cubic-bezier(.2,.8,.3,1),opacity .8s;';
        stage.appendChild(st);
        requestAnimationFrame(function () {
          var ang = (Math.PI * 2 * k) / 6 + Math.random() * .5;
          st.style.transform = 'translate(' + Math.cos(ang) * 80 + 'px,' + (Math.sin(ang) * 80 - 40) + 'px) rotate(180deg) scale(.4)';
          st.style.opacity = '0';
        });
        setTimeout(function () { st.remove(); }, 850);
      })(i);
    }
  }

  /* 联系页 3D 挂绳工牌：React Bits <Lanyard /> 原组件。
     容器在隐藏视图里尺寸为 0，WebGL 会画不出来；所以等它第一次真正可见
     （进入联系页）再挂载，只挂一次。 */
  (function mountContactLanyard () {
    var cfg = (C.contact && C.contact.lanyard) || {};
    var host = $('#contact-lanyard');
    if (!cfg.enabled || !host) return;
    if (!window.ReactBitsLanyard || !window.ReactDOM || !window.React || !window.THREE) return;
    var mounted = false;
    function tryMount () {
      if (mounted) return;
      if (host.clientWidth < 10 || host.clientHeight < 10) return; // 视图还没显示
      mounted = true;
      try {
        var e = window.React.createElement;
        var props = {};
        ['frontImage', 'backImage', 'strapImage', 'imageFit', 'cardColor', 'orientation',
         'finish', 'cornerRadius', 'size', 'anchor', 'strapLength', 'strapColor', 'strapWidth',
         'metal', 'gravity', 'damping', 'elasticity', 'breeze', 'interactive', 'intro'
        ].forEach(function (k) { if (cfg[k] !== undefined) props[k] = cfg[k]; });
        window.ReactDOM.createRoot(host).render(e(window.ReactBitsLanyard, props));
      } catch (err) {
        console.warn('Lanyard mount failed', err);
      }
    }
    // 监听进入联系页：既覆盖点击入口，也覆盖首帧就在联系页的情况
    if (window.ResizeObserver) {
      new ResizeObserver(tryMount).observe(host);
    }
    tryMount();
  })();

  /* 更多页弧形画廊：React Bits 开源组件 CircularGallery（原生 WebGL2，免费源码）。
     隐藏视图容器尺寸为 0 时 WebGL 画不出，等进入更多页、容器有尺寸再挂载。 */
  (function mountCircularGallery () {
    var cfg = (C.more && C.more.carousel) || {};
    var host = $('#more-carousel');
    if (!host || !cfg.items || !cfg.items.length) return;
    if (!window.ReactBitsCircularGallery || !window.ReactDOM || !window.React) return;
    var mounted = false;
    function tryMount () {
      if (mounted) return;
      if (host.clientWidth < 10 || host.clientHeight < 10) return;
      mounted = true;
      try {
        var props = {};
        Object.keys(cfg).forEach(function (k) { props[k] = cfg[k]; });
        // 背景随当前照片主色渐变（Gradient Carousel 效果，免费自实现）
        var grads = window.MORE_GRADIENTS || [];
        function applyGlow(i) {
          var g = grads[((i % grads.length) + grads.length) % grads.length];
          if (!g) return;
          var root = document.documentElement;
          root.style.setProperty('--glow-a', g.center);
          root.style.setProperty('--glow-b', g.mid);
          root.style.setProperty('--glow-c', g.edge);
        }
        if (grads.length) {
          applyGlow(cfg.initialIndex || 0);
          props.onActiveChange = applyGlow;
        }
        window.ReactDOM.createRoot(host).render(
          window.React.createElement(window.ReactBitsCircularGallery, props)
        );
      } catch (err) {
        console.warn('CircularGallery mount failed', err);
      }
    }
    if (window.ResizeObserver) new ResizeObserver(tryMount).observe(host);
    tryMount();
  })();

  /* ---------- 启动 ---------- */
  var initial = parseHash();
  if (initial && initial !== 'loading') {
    var stage = $('#stage');
    stage.classList.add('instant');
    viewEl('loading').classList.remove('is-active');
    go(initial, true);
    setTimeout(function () { stage.classList.remove('instant'); }, 80);
    loadingDone = true; skipped = true;
  } else {
    syncFullBleed('loading');
    runLoading();
  }
})();
