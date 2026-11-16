/* DCTI 채점. 브라우저와 Node(테스트) 양쪽에서 씁니다.
 * answers: 문항마다 보기 번호(데이터의 원래 순서, 0부터) 또는 null(잘 모르겠다/안 함)
 */
(function (root) {
  function score(data, answers) {
    var keys = data.TYPE_KEYS;
    var got = {}, max = {};
    keys.forEach(function (k) { got[k] = 0; max[k] = 0; });
    var topicPts = {};
    data.TOPICS.forEach(function (t) { topicPts[t.id] = { pts: {}, answers: [] }; keys.forEach(function (k) { topicPts[t.id].pts[k] = 0; }); });

    data.QUESTIONS.forEach(function (q, i) {
      var a = answers[i];
      if (a === null || a === undefined || !q[2][a]) return;
      // 답한 문항만 최대 점수에 넣는다: 그 문항에서 점수를 받을 수 있는 유형마다 1점
      keys.forEach(function (k) {
        if (q[2].some(function (o) { return o[2].indexOf(k) >= 0; })) max[k] += 1;
      });
      var opt = q[2][a];
      var tp = topicPts[q[1]];
      tp.answers.push(opt[1]);
      opt[2].split('').forEach(function (k) { got[k] += 1; tp.pts[k] += 1; });
    });

    var ratio = {};
    keys.forEach(function (k) { ratio[k] = max[k] ? got[k] / max[k] : 0; });
    var ranked = keys.slice().sort(function (a, b) { return ratio[b] - ratio[a] || keys.indexOf(a) - keys.indexOf(b); });
    var top = ranked[0];
    var second = ranked[1];
    var close = ratio[top] - ratio[second] < 0.05;

    var topics = data.TOPICS.map(function (t) {
      var tp = topicPts[t.id];
      var best = 0;
      keys.forEach(function (k) { if (tp.pts[k] > best) best = tp.pts[k]; });
      var near = best ? keys.filter(function (k) { return tp.pts[k] === best; }) : [];
      return { id: t.id, name: t.name, answers: tp.answers, near: near, matchesTop: near.indexOf(top) >= 0 };
    });

    var answered = answers.filter(function (a) { return a !== null && a !== undefined; }).length;
    return { top: top, second: close ? second : null, ratio: ratio, ranked: ranked, topics: topics, answered: answered };
  }

  // 공유 링크용: 문항마다 한 글자 (0-9 보기, '-' 잘 모르겠다)
  function encode(answers) {
    return answers.map(function (a) { return a === null || a === undefined ? '-' : String(a); }).join('');
  }
  function decode(data, s) {
    if (!s || s.length !== data.QUESTIONS.length) return null;
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '-') { out.push(null); continue; }
      var n = parseInt(c, 10);
      if (isNaN(n) || !data.QUESTIONS[i][2][n]) return null;
      out.push(n);
    }
    return out;
  }

  var api = { score: score, encode: encode, decode: decode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DCTI_SCORING = api;
})(this);
