/* 《后会友期》友情人格测试 —— 交互层 */
(function () {
  'use strict';

  var DATA = window.__DATA__;
  var AXES = DATA.AXES;
  var GUESTS = DATA.GUESTS;
  var QUESTIONS = DATA.QUESTIONS;

  // 头像已内联为 data URI（js/assets.js），没有时回落到相对路径
  if (window.__IMG__) {
    GUESTS.forEach(function (g) { if (window.__IMG__[g.id]) g.img = window.__IMG__[g.id]; });
  }

  var STORE = 'hhyq-quiz-v1';
  var app = document.getElementById('app');

  var state = {
    index: 0,
    answers: new Array(QUESTIONS.length).fill(null),
    scores: null,
    guest: null,
    locked: false
  };

  /* ---------------- 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function byId(id) {
    for (var i = 0; i < GUESTS.length; i++) if (GUESTS[i].id === id) return GUESTS[i];
    return GUESTS[0];
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ index: state.index, answers: state.answers }));
    } catch (e) { /* ignore */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return false;
      var obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.answers) || obj.answers.length !== QUESTIONS.length) return false;
      state.answers = obj.answers;
      state.index = clamp(obj.index || 0, 0, QUESTIONS.length - 1);
      return true;
    } catch (e) { return false; }
  }
  function resetStore() {
    try { localStorage.removeItem(STORE); } catch (e) {}
  }
  function answeredCount() {
    return state.answers.filter(function (a) { return a !== null; }).length;
  }
  function vibrate(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  /* ---------------- 屏幕切换 ---------------- */
  function showScreen(id) {
    $all('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* ---------------- 首页 ---------------- */
  function buildFanwall() {
    var wall = $('#fanwall');
    if (!wall || wall.childElementCount) return;
    var rots = [-3, 2, -2, 3, -2, 2, -3, 2];
    var tys = [6, -4, 10, 0, 8, -6, 4, 12];
    GUESTS.forEach(function (g, i) {
      var img = document.createElement('img');
      img.className = 'av';
      img.src = g.img;
      img.alt = g.name;
      img.style.setProperty('--rot', rots[i] + 'deg');
      img.style.setProperty('--ty', tys[i] + 'px');
      img.style.zIndex = String(10 - Math.abs(i - 3.5));
      wall.appendChild(img);
    });
  }

  /* 四对旧友 */
  var PAIRS = [
    ['xufei', 'lina', '2006 年同住一间房的两个超女'],
    ['qingzhi', 'baixiaochun', '并肩四年的 PEL 队友'],
    ['zhangmeng', 'matianyu', '一句话之后十年没联系'],
    ['wenjier', 'wangzixuan', '三万元写序费用的一场面谈']
  ];
  function buildPairs() {
    var list = $('#pair-list');
    if (!list || list.childElementCount) return;
    PAIRS.forEach(function (p) {
      var a = byId(p[0]), b = byId(p[1]);
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pair-item';
      btn.innerHTML =
        '<span class="pi-imgs"><img src="' + a.img + '" alt="' + a.name + '">' +
          '<img src="' + b.img + '" alt="' + b.name + '"></span>' +
        '<span class="pi-body">' +
          '<span class="pi-names">' + a.name + '<span>×</span>' + b.name + '</span>' +
          '<span class="pi-line">' + p[2] + '</span>' +
        '</span>' +
        '<svg class="pi-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
          '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btn.addEventListener('click', openSheet);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  /* ---------------- 题目 ---------------- */
  var scaleEl = $('#scale');
  function renderQuestion(dir) {
    var q = QUESTIONS[state.index];
    var axis = AXES[q.axis];

    $('#q-index').textContent = String(state.index + 1);
    $('#q-kicker').textContent = axis.desc;
    $('#q-title').textContent = q.q;
    $('#pole-left').textContent = q.l;
    $('#pole-right').textContent = q.r;
    $('#answered').textContent = answeredCount() + ' / ' + QUESTIONS.length + ' 已作答';
    $('#progress').setAttribute('aria-valuenow', String(answeredCount()));
    $('#progress-fill').style.width = (answeredCount() / QUESTIONS.length * 100) + '%';
    $('#btn-prev').disabled = state.index === 0;

    scaleEl.innerHTML = '';
    for (var n = 1; n <= 5; n++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(n);
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', state.answers[state.index] === n ? 'true' : 'false');
      b.setAttribute('aria-label', n + ' 分：' + (n <= 2 ? q.l : n === 3 ? '中立' : q.r));
      if (state.answers[state.index] === n) b.classList.add('is-picked');
      b.addEventListener('click', function (ev) {
        pick(parseInt(ev.currentTarget.textContent, 10));
      });
      scaleEl.appendChild(b);
    }

    var card = $('#q-card');
    card.classList.remove('leave');
    card.classList.remove('enter');
    void card.offsetWidth;
    card.classList.add('enter');
  }

  function pick(n) {
    if (state.locked) return;
    state.answers[state.index] = n;
    save();
    vibrate(8);

    $all('#scale button').forEach(function (b) {
      var picked = parseInt(b.textContent, 10) === n;
      b.classList.toggle('is-picked', picked);
      b.setAttribute('aria-checked', picked ? 'true' : 'false');
    });
    $('#answered').textContent = answeredCount() + ' / ' + QUESTIONS.length + ' 已作答';
    $('#progress-fill').style.width = (answeredCount() / QUESTIONS.length * 100) + '%';

    state.locked = true;
    setTimeout(function () {
      state.locked = false;
      if (state.index < QUESTIONS.length - 1) {
        var card = $('#q-card');
        card.classList.add('leave');
        setTimeout(function () {
          state.index += 1;
          save();
          renderQuestion(1);
        }, 190);
      } else {
        finish();
      }
    }, 180);
  }

  function goPrev() {
    if (state.index === 0) return;
    var card = $('#q-card');
    card.classList.add('leave');
    setTimeout(function () {
      state.index -= 1;
      save();
      renderQuestion(-1);
    }, 150);
  }

  /* ---------------- 计算 ---------------- */
  function computeScores() {
    var sums = [0, 0, 0, 0], counts = [0, 0, 0, 0];
    QUESTIONS.forEach(function (q, i) {
      var a = state.answers[i];
      if (a === null) return;
      sums[q.axis] += (a - 1) * 25;
      counts[q.axis] += 1;
    });
    return sums.map(function (s, i) { return counts[i] ? Math.round(s / counts[i]) : 50; });
  }

  var WEIGHTS = [1, 1.1, 1, 1];
  function distance(guest, scores) {
    var sum = 0, wsum = 0;
    for (var i = 0; i < 4; i++) {
      sum += Math.abs(guest.scores[i] - scores[i]) * WEIGHTS[i];
      wsum += WEIGHTS[i];
    }
    return sum / wsum;
  }
  function matchOf(guest, scores) {
    var d = distance(guest, scores);
    return clamp(Math.round(102 - d * 0.95), 55, 99);
  }
  function bestGuest(scores) {
    var best = GUESTS[0], bestD = Infinity;
    GUESTS.forEach(function (g) {
      var d = distance(g, scores);
      if (d < bestD) { bestD = d; best = g; }
    });
    return best;
  }
  function rivalGuest(scores, mine) {
    var worst = null, worstD = -1;
    GUESTS.forEach(function (g) {
      if (g.id === mine.id) return;
      var d = distance(g, scores);
      if (d > worstD) { worstD = d; worst = g; }
    });
    return worst;
  }

  /* 极端轴 → 动态关键词 */
  function dynamicTag(scores) {
    var idx = 0, far = -1;
    scores.forEach(function (s, i) {
      var d = Math.abs(s - 50);
      if (d > far) { far = d; idx = i; }
    });
    var high = scores[idx] >= 50;
    var table = [
      [['把话藏好', '有话直说'], ['让时间过去', '要个说法'], ['各自安好', '想被记得'], ['先看感受', '先看事实']]
    ];
    return table[0][idx][high ? 1 : 0];
  }

  function gapReason(scores, rival) {
    var gaps = scores.map(function (s, i) { return { i: i, d: Math.abs(s - rival.scores[i]) }; });
    gaps.sort(function (a, b) { return b.d - a.d; });
    var lines = {
      express: ['你把话摊开说，TA把话咽回去。', '你习惯自己消化，TA偏要问到底。'],
      repair: ['你总要一个说法，TA更愿意让时间过去。', '你愿意转身走，TA会追着把话问清。'],
      closeness: ['你需要常常联系，TA觉得各自安好也是在乎。', '你希望留出距离，TA想一直贴着你。'],
      judge: ['你在意这件事对不对，TA更在意你说话的语气。', '你讲事实，TA讲感受。']
    };
    var out = [];
    for (var k = 0; k < 2 && k < gaps.length; k++) {
      var g = gaps[k].i;
      var mineHigh = scores[g] >= 50;
      var list = lines[AXES[g].key];
      out.push(mineHigh ? list[0] : list[1]);
    }
    return out.join('');
  }

  /* ---------------- 结果渲染 ---------------- */
  function axisRows(scores) {
    return AXES.map(function (ax, i) {
      var v = scores[i];
      return '' +
        '<div class="axis">' +
          '<div class="axis-top"><span>' + ax.left + '</span>' +
            '<span class="axis-name">' + ax.desc + '</span>' +
            '<span>' + ax.right + '</span></div>' +
          '<div class="axis-bar"><i data-w="' + v + '"></i></div>' +
          '<div class="axis-foot"><span>' + (100 - v) + '%</span>' +
            '<span class="hi">' + v + '%</span></div>' +
        '</div>';
    }).join('');
  }

  function renderResult(guest, scores, opts) {
    opts = opts || {};
    var preview = !!opts.preview || !scores;
    var mine = preview ? guest.scores : scores;
    var match = preview ? 0 : (opts.match || matchOf(guest, scores));
    var rival = preview ? null : rivalGuest(scores, guest);
    var tags = preview ? guest.keywords : guest.keywords.concat([dynamicTag(scores)]);
    var pair = byId(guest.pair);

    var html = '' +
      '<div class="result-hero">' +
        '<img class="rh-img" src="' + guest.img + '" alt="' + guest.name + '">' +
        '<div class="rh-fade"></div>' +
        '<div class="rh-top">' +
          '<span class="rh-badge">' + (preview ? '人格画像' : '你的人格是') + '</span>' +
          (preview ? '' :
          '<div class="ring" data-match="' + match + '">' +
            '<svg viewBox="0 0 74 74" aria-hidden="true">' +
              '<circle class="ring-bg" cx="37" cy="37" r="32"></circle>' +
              '<circle class="ring-fg" cx="37" cy="37" r="32"></circle>' +
            '</svg>' +
            '<b>' + match + '%</b><small>匹配</small>' +
          '</div>') +
        '</div>' +
        '<div class="rh-bottom">' +
          '<h2 class="rh-name">' + guest.name + '</h2>' +
          '<p class="rh-type">' + guest.type + ' · ' + guest.tagline + '</p>' +
          '<p class="rh-role">' + guest.role + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="block">' +
        '<h3 class="block-title">' + (preview ? 'TA 的四个坐标' : '你的四个坐标') + '</h3>' +
        '<div class="axes">' + axisRows(mine) + '</div>' +
        '<div class="chips">' + tags.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</div>' +
      '</div>' +

      '<div class="quote-card">' + guest.quote +
        '<small>—— 节目里，TA 最出圈的一句</small></div>' +

      '<div class="block">' +
        '<h3 class="block-title">' + (preview ? '这种人格在友情里的样子' : '你在友情里的样子') + '</h3>' +
        '<div class="story">' + guest.story.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' +
      '</div>' +

      '<div class="mini-cards">' +
        '<div class="mini-card mini-card--warn"><h4>容易卡住的地方</h4><p>' + guest.stuck + '</p></div>' +
        '<div class="mini-card mini-card--good"><h4>' + (preview ? '破局的方向' : '给你的处方') + '</h4><p>' + guest.rx + '</p></div>' +
      '</div>' +

      '<div class="pair-card">' +
        '<div class="pair-imgs">' +
          '<img src="' + guest.img + '" alt="' + guest.name + '">' +
          '<img src="' + pair.img + '" alt="' + pair.name + '">' +
        '</div>' +
        '<div class="pair-text">' +
          '<p>节目里，TA 和 <b>' + pair.name + '</b> 是一组旧友。</p>' +
          '<p class="pair-note">' + guest.pairNote + '</p>' +
        '</div>' +
      '</div>' +

      (preview ? '' :
      '<div class="rival-card">' +
        '<div class="rival-head"><img src="' + rival.img + '" alt="' + rival.name + '">' +
          '<span>最容易和你走散的人</span></div>' +
        '<p><b>' + rival.name + '</b>（' + rival.type + '）。' + gapReason(scores, rival) + '</p>' +
      '</div>') +

      (preview ?
      '<div class="actions">' +
        '<button class="btn btn--primary" id="btn-start-now" type="button">开始测试，看你是哪一个</button>' +
        '<div class="row">' +
          '<button class="btn btn--outline" id="btn-all" type="button">换一个人格</button>' +
        '</div>' +
      '</div>' :
      '<div class="actions">' +
        '<button class="btn btn--primary" id="btn-poster" type="button">保存我的结果海报</button>' +
        '<div class="row">' +
          '<button class="btn btn--outline" id="btn-retest" type="button">重新测一次</button>' +
          '<button class="btn btn--outline" id="btn-all" type="button">全部 8 种人格</button>' +
        '</div>' +
      '</div>') +

      '<p class="footnote">结果仅供娱乐与自我了解，不构成任何心理诊断。<br>' +
        '嘉宾画像基于节目公开片段整理，与嘉宾本人无关。</p>';

    var wrap = $('#result-wrap');
    wrap.innerHTML = html;
    showScreen('screen-result');

    // 动画：环 + 条形
    requestAnimationFrame(function () {
      var ring = $('.ring');
      if (ring) {
        var m = parseInt(ring.getAttribute('data-match'), 10);
        var fg = $('.ring-fg', ring);
        var C = 201;
        fg.style.strokeDashoffset = String(C * (1 - m / 100));
      }
      $all('.axis-bar i').forEach(function (el, i) {
        setTimeout(function () { el.style.width = el.getAttribute('data-w') + '%'; }, 120 + i * 110);
      });
    });

    if (opts.burst) burstConfetti(guest.accent);

    if (preview) {
      $('#btn-start-now').addEventListener('click', function () {
        showScreen('screen-intro');
      });
      $('#btn-all').addEventListener('click', openSheet);
      return;
    }

    $('#btn-poster').addEventListener('click', function () { openPoster(guest, scores, match); });
    $('#btn-retest').addEventListener('click', restart);
    $('#btn-all').addEventListener('click', openSheet);
  }

  /* ---------------- 完成 ---------------- */
  function finish() {
    state.scores = computeScores();
    state.guest = bestGuest(state.scores);
    renderResult(state.guest, state.scores, { burst: true, match: matchOf(state.guest, state.scores) });
  }

  function restart() {
    resetStore();
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.scores = null;
    state.guest = null;
    closeAllSheets();
    showScreen('screen-intro');
  }

  /* ---------------- 全部人格 ---------------- */
  function buildGrid() {
    var grid = $('#guest-grid');
    grid.innerHTML = '';
    GUESTS.forEach(function (g) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'guest-card';
      card.innerHTML = '<img src="' + g.img + '" alt="' + g.name + '">' +
        '<div class="gc-body">' +
          '<div class="gc-name"><i style="background:' + g.accent + '"></i>' + g.name + '</div>' +
          '<div class="gc-type">' + g.type + '<br>' + g.brief + '</div>' +
        '</div>';
      card.addEventListener('click', function () {
        closeAllSheets();
        renderResult(g, null, { preview: true });
      });
      grid.appendChild(card);
    });
  }

  function openSheet() {
    buildGrid();
    var el = $('#sheet');
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeAllSheets() {
    $all('.sheet').forEach(function (s) {
      s.classList.remove('is-open');
      s.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  /* ---------------- 海报 ---------------- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, w, h) {
    var ir = img.width / img.height;
    var br = w / h;
    var sw, sh, sx, sy;
    if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / br; sx = 0; sy = (img.height - sh) * 0.10; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function openPoster(guest, scores, match) {
    var canvas = $('#poster-canvas');
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var img = new Image();

    function paint() {
      // 背景
      var bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#FBF6EC');
      bg.addColorStop(1, '#F4E9D6');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 顶部小字
      ctx.fillStyle = '#A0906F';
      ctx.font = '600 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('《后会友期》友情人格测试', 48, 74);

      // 图片
      var ix = 48, iy = 100, iw = W - 96, ih = 520;
      ctx.save();
      roundRect(ctx, ix, iy, iw, ih, 34);
      ctx.clip();
      if (img.complete && img.naturalWidth) {
        drawCover(ctx, img, ix, iy, iw, ih);
      } else {
        ctx.fillStyle = '#E4D9C6';
        ctx.fillRect(ix, iy, iw, ih);
      }
      var grad = ctx.createLinearGradient(0, iy + ih * 0.45, 0, iy + ih);
      grad.addColorStop(0, 'rgba(24,16,8,0)');
      grad.addColorStop(1, 'rgba(24,16,8,.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(ix, iy, iw, ih);
      ctx.restore();

      // 名字
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.font = '600 24px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('你的人格是', ix + 36, iy + ih - 116);
      ctx.fillStyle = '#fff';
      ctx.font = '800 66px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(guest.name, ix + 34, iy + ih - 46);

      // 匹配度
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      roundRect(ctx, ix + iw - 176, iy + 26, 146, 52, 26);
      ctx.fill();
      ctx.fillStyle = '#8A5A2B';
      ctx.font = '700 26px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('匹配 ' + match + '%', ix + iw - 150, iy + 61);

      // 类型
      ctx.fillStyle = '#2A241C';
      ctx.font = '800 40px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(guest.type, 48, 700);
      ctx.fillStyle = '#8B7E6B';
      ctx.font = '500 26px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(guest.tagline, 48, 742);

      // 四轴
      var labels = AXES.map(function (a) { return a.left + ' / ' + a.right; });
      for (var i = 0; i < 4; i++) {
        var y = 802 + i * 68;
        ctx.fillStyle = '#9A8C78';
        ctx.font = '500 22px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillText(labels[i], 48, y);
        ctx.fillStyle = '#D2603F';
        ctx.font = '700 24px "PingFang SC","Microsoft YaHei",sans-serif';
        var pct = String(scores[i]) + '%';
        ctx.fillText(pct, W - 48 - ctx.measureText(pct).width, y);

        ctx.fillStyle = '#E8DFCE';
        roundRect(ctx, 48, y + 14, W - 96, 14, 7);
        ctx.fill();
        var g2 = ctx.createLinearGradient(48, 0, W - 96, 0);
        g2.addColorStop(0, '#EFC76F');
        g2.addColorStop(1, '#D2802C');
        ctx.fillStyle = g2;
        roundRect(ctx, 48, y + 14, Math.max(14, (W - 96) * scores[i] / 100), 14, 7);
        ctx.fill();
      }

      // 分隔线
      ctx.strokeStyle = '#E6DACA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 1080);
      ctx.lineTo(W - 48, 1080);
      ctx.stroke();

      ctx.fillStyle = '#A0906F';
      ctx.font = '500 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('凭第一反应作答 · 结果仅供娱乐', 48, 1122);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#C0AF93';
      ctx.fillText('友情人格测试', W - 48, 1122);
      ctx.textAlign = 'left';
    }

    paint();
    img.onload = paint;
    img.src = guest.img;

    var el = $('#poster');
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    $('#btn-download').onclick = function () {
      try {
        var url = canvas.toDataURL('image/jpeg', 0.92);
        var a = document.createElement('a');
        a.href = url;
        a.download = '后会友期-' + guest.name + '-友情人格.jpg';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) { alert('生成图片失败，可以长按图片保存。'); }
    };

    $('#btn-copy').onclick = function () {
      var text = '我在《后会友期》友情人格测试里是「' + guest.name + '·' + guest.type + '」，匹配度 ' + match + '%。' + guest.tagline + '。你呢？';
      var done = function () {
        var b = $('#btn-copy');
        var old = b.textContent;
        b.textContent = '已复制';
        setTimeout(function () { b.textContent = old; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    };
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    ta.remove();
  }

  /* ---------------- 彩纸 ---------------- */
  var confettiCanvas = null;
  function burstConfetti(color) {
    if (!confettiCanvas) {
      confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'confetti';
      document.body.appendChild(confettiCanvas);
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    confettiCanvas.width = w * dpr;
    confettiCanvas.height = h * dpr;
    confettiCanvas.style.width = w + 'px';
    confettiCanvas.style.height = h + 'px';
    var ctx = confettiCanvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var colors = [color || '#E4A83F', '#D9614A', '#F0C976', '#7E8E6C', '#C9A227'];
    var parts = [];
    for (var i = 0; i < 30; i++) {
      parts.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: h * 0.28 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 9 - 3,
        s: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        c: colors[(Math.random() * colors.length) | 0],
        life: 0
      });
    }
    var start = performance.now();
    function frame(now) {
      var t = now - start;
      ctx.clearRect(0, 0, w, h);
      var alive = 0;
      parts.forEach(function (p) {
        p.vy += 0.26;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.rot += p.vr;
        var alpha = clamp(1 - t / 1700, 0, 1) * 0.9;
        if (alpha <= 0) return;
        alive++;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (alive > 0 && t < 1900) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- 事件绑定 ---------------- */
  $('#btn-start').addEventListener('click', function () {
    load();
    var filled = state.answers.filter(function (a) { return a !== null; }).length;
    if (filled === QUESTIONS.length) {
      // 做过一遍就直接开新的一轮
      state.answers = new Array(QUESTIONS.length).fill(null);
      state.index = 0;
      save();
    }
    showScreen('screen-quiz');
    renderQuestion(1);
  });

  $('#btn-back').addEventListener('click', goPrev);
  $('#btn-prev').addEventListener('click', goPrev);
  $('#btn-exit').addEventListener('click', function () {
    showScreen('screen-intro');
  });
  $('#btn-peek').addEventListener('click', openSheet);

  $all('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeAllSheets);
  });

  document.addEventListener('keydown', function (e) {
    var quizActive = $('#screen-quiz').classList.contains('is-active');
    if (!quizActive) return;
    if (e.key >= '1' && e.key <= '5') pick(parseInt(e.key, 10));
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); goPrev(); }
  });

  /* ---------------- 启动 ---------------- */
  buildFanwall();
  buildPairs();

  var params = new URLSearchParams(location.search);
  var sp = params.get('s');
  if (sp) {
    var arr = sp.split(',').map(Number);
    if (arr.length === 4 && arr.every(function (n) { return isFinite(n); })) {
      state.scores = arr.map(function (n) { return clamp(Math.round(n), 0, 100); });
    }
  }
  if (params.get('g')) {
    var g = byId(params.get('g'));
    if (state.scores) renderResult(g, state.scores, { match: matchOf(g, state.scores) });
    else renderResult(g, null, { preview: true });
  } else if (params.get('screen') === 'quiz') {
    load();
    showScreen('screen-quiz');
    renderQuestion(1);
  } else {
    load();
  }
})();
