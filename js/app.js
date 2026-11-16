(function () {
  var D = window.DCTI_DATA, S = window.DCTI_SCORING;
  var app = document.getElementById('app');
  var N = D.QUESTIONS.length;
  var answers = [];
  var order = [];   // 문항마다 보기 표시 순서(섞음)
  var idx = 0;
  var SAVE_KEY = 'dcti-progress-v1';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function topicName(id) { for (var i = 0; i < D.TOPICS.length; i++) if (D.TOPICS[i].id === id) return D.TOPICS[i].name; return ''; }
  function shuffle(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ a: answers, i: idx })); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  function top() { window.scrollTo(0, 0); }

  function intro() {
    var saved = load();
    var resumable = saved && saved.a && saved.a.length === N && saved.i > 0;
    var chips = D.TYPE_KEYS.map(function (k) {
      var t = D.TYPES[k];
      return '<div class="type-chip" style="background:' + t.color + '"><b>' + t.code + '</b>' + esc(t.name) + '</div>';
    }).join('');
    app.innerHTML =
      '<div class="intro">' +
        '<div class="logo">DCTI</div>' +
        '<div class="logo-sub">Doctrinal Conviction Type Indicator</div>' +
        '<h1>성경으로 알아보는<br>나의 교리 유형</h1>' +
        '<p class="lead">창조, 구원, 휴거, 은사, 교회, 생활까지 16개 주제 ' + N + '문항에 답하면, 여섯 유형 가운데 내가 어디에 가까운지 보여 드립니다. 7~10분 걸립니다.</p>' +
        '<div class="verse">"이것들이 과연 그러한지 알아보려고 날마다 성경 기록들을 상고하였으므로"<br><span class="muted small">행 17:11</span></div>' +
        '<div class="btn-row">' +
          (resumable ? '<button class="btn" id="resume">이어서 하기 (' + saved.i + '/' + N + ')</button><button class="btn ghost" id="start">처음부터</button>' : '<button class="btn" id="start">시작하기</button>') +
        '</div>' +
        '<div class="type-grid">' + chips + '</div>' +
        '<p class="muted small">정답은 없습니다. 내 생각에 가장 가까운 보기를 고르고, 모르면 "잘 모르겠다"를 고르세요.</p>' +
      '</div>';
    document.getElementById('start').onclick = function () { start(null); };
    if (resumable) document.getElementById('resume').onclick = function () { start(saved); };
  }

  function start(saved) {
    answers = saved ? saved.a : new Array(N).fill(null);
    idx = saved ? Math.min(saved.i, N - 1) : 0;
    order = D.QUESTIONS.map(function (q) { return shuffle(q[2].length); });
    history.replaceState(null, '', location.pathname);
    question();
  }

  function question() {
    var q = D.QUESTIONS[idx];
    var opts = order[idx].map(function (oi) {
      var sel = answers[idx] === oi ? ' sel' : '';
      return '<button class="opt' + sel + '" data-v="' + oi + '">' + esc(q[2][oi][0]) + '</button>';
    }).join('');
    var unsureSel = answers[idx] === -1 ? ' sel' : '';
    app.innerHTML =
      '<div class="progress"><div class="bar"><i style="width:' + (idx / N * 100) + '%"></i></div><span>' + (idx + 1) + ' / ' + N + '</span></div>' +
      '<div class="card">' +
        '<span class="topic-tag">' + esc(topicName(q[1])) + '</span>' +
        '<h2 class="q-title">' + esc(q[0]) + '</h2>' +
        '<div class="opts">' + opts + '<button class="opt unsure' + unsureSel + '" data-v="-1">잘 모르겠다</button></div>' +
      '</div>' +
      '<div class="nav"><button class="link" id="prev"' + (idx === 0 ? ' disabled' : '') + '>← 이전</button><button class="link" id="home">처음 화면</button></div>';
    Array.prototype.forEach.call(app.querySelectorAll('.opt'), function (b) {
      b.onclick = function () {
        answers[idx] = parseInt(b.getAttribute('data-v'), 10);
        b.classList.add('sel');
        setTimeout(next, 160);
      };
    });
    document.getElementById('prev').onclick = function () { if (idx > 0) { idx--; save(); question(); } };
    document.getElementById('home').onclick = function () { save(); intro(); };
    top();
  }

  function next() {
    if (idx < N - 1) { idx++; save(); question(); }
    else {
      var clean = answers.map(function (a) { return a === -1 ? null : a; });
      clearSave();
      var code = S.encode(clean);
      history.replaceState(null, '', location.pathname + '?a=' + code);
      result(clean);
    }
  }

  function dot(k) { var t = D.TYPES[k]; return '<span class="dot" style="background:' + t.color + '">' + esc(t.name) + '</span>'; }

  function result(ans) {
    var r = S.score(D, ans);
    if (r.answered < 8) {
      app.innerHTML = '<div class="card intro"><h1>답한 문항이 너무 적습니다</h1><p class="lead">"잘 모르겠다"가 아닌 답이 ' + r.answered + '개뿐이라 유형을 정하기 어렵습니다. 조금 더 답해 주세요.</p><div class="btn-row"><button class="btn" id="again">다시 하기</button></div></div>';
      document.getElementById('again').onclick = function () { start(null); };
      return;
    }
    var t = D.TYPES[r.top];
    var also = r.second ? '<p class="also">' + dot(r.second) + ' 성향도 거의 같은 만큼 강하게 나왔습니다.</p>' : '';

    var bars = D.FAMILIES.map(function (f) {
      return '<div class="fam"><div class="fam-name">' + f.name + '</div>' + f.types.map(function (k) {
        var p = Math.round(r.ratio[k] * 100);
        return '<div class="trow' + (k === r.top ? ' me' : '') + '"><span>' + esc(D.TYPES[k].name) + '</span><span class="tb"><i style="width:' + p + '%;background:' + D.TYPES[k].color + '"></i></span><span class="pc">' + p + '%</span></div>';
      }).join('') + '</div>';
    }).join('');

    var rows = r.topics.map(function (tp) {
      var ansTxt = tp.answers.length ? tp.answers.map(esc).join(' · ') : '<span class="muted">답 안 함</span>';
      var near = tp.near.length ? tp.near.map(dot).join('') : '';
      return '<div class="trow2' + (tp.near.length && !tp.matchesTop ? ' diff' : '') + '"><div class="th2"><b>' + esc(tp.name) + '</b><span>' + near + '</span></div><div class="ans">' + ansTxt + '</div></div>';
    }).join('');

    var notes = D.TOPICS.map(function (tp) {
      return '<details class="note"><summary>' + esc(tp.name) + '</summary><p>' + esc(tp.note) + '</p></details>';
    }).join('');

    var others = D.TYPE_KEYS.filter(function (k) { return k !== r.top; }).map(function (k) {
      var o = D.TYPES[k];
      return '<div class="mini" style="border-left-color:' + o.color + '"><b>' + esc(o.name) + '</b> <span class="muted small">' + o.code + ' · ' + esc(o.base) + '</span><p>' + esc(o.summary.split('. ')[0]) + '.</p></div>';
    }).join('');

    app.innerHTML =
      '<div class="card hero" style="background:' + t.color + '">' +
        '<div class="code">' + t.code + '</div>' +
        '<h1>' + esc(t.name) + '</h1>' +
        '<div class="base">' + esc(t.base) + '</div>' +
        '<span class="family">큰 틀 · ' + esc(t.family) + '</span>' +
        '<p class="mean">' + esc(t.meaning) + ' <span style="opacity:.8">(' + esc(t.verse) + ')</span></p>' +
      '</div>' + also +
      '<section class="block card"><h2>어떤 유형인가요</h2><p style="margin:0">' + esc(t.summary) + '</p>' +
        '<ul class="points">' + t.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        '<dl class="kv"><dt>역사 속에서</dt><dd>' + esc(t.history) + '</dd><dt>비슷한 유형과 다른 점</dt><dd>' + esc(t.neighbor) + '</dd></dl></section>' +
      '<section class="block card"><h2>유형별 가까운 정도</h2>' + bars + '<p class="legend">그 유형의 입장을 고른 비율입니다. 여러 유형이 함께 가진 보기는 모두에게 점수가 들어갑니다.</p></section>' +
      '<section class="block card"><h2>주제별로 보면</h2><div class="topics">' + rows + '</div><p class="legend">색이 칠해진 칸은 내 유형과 다른 쪽에 가까웠던 주제입니다.</p></section>' +
      '<section class="block card"><h2>성경으로 더 보기</h2>' + notes + '</section>' +
      '<section class="block"><h2 style="font-size:1.1rem;margin-bottom:12px">다른 유형들</h2><div class="all-types">' + others + '</div></section>' +
      '<div class="btn-row"><button class="btn" id="share">결과 링크 복사</button><button class="btn ghost" id="again">다시 하기</button></div>' +
      '<div class="toast" id="toast"></div>';

    document.getElementById('again').onclick = function () { start(null); };
    document.getElementById('share').onclick = function () {
      var url = location.origin + location.pathname + '?a=' + S.encode(ans);
      var done = function () { var el = document.getElementById('toast'); el.textContent = '링크를 복사했습니다'; el.classList.add('on'); setTimeout(function () { el.classList.remove('on'); }, 1800); };
      if (navigator.share) { navigator.share({ title: 'DCTI · ' + t.name, text: '나의 교리 유형은 ' + t.name + '(' + t.code + ')', url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, function () { prompt('링크를 복사하세요', url); }); }
      else { prompt('링크를 복사하세요', url); }
    };
    top();
  }

  var a = new URLSearchParams(location.search).get('a');
  var decoded = a ? S.decode(D, a) : null;
  if (decoded) result(decoded); else intro();
})();
