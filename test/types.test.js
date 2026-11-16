// 각 유형의 "모범 답안"을 넣으면 그 유형이 1위로 나오는지 확인합니다.
// 실행: node test/types.test.js
var data = require('../js/data.js');
var S = require('../js/scoring.js');
var fail = 0;

data.TYPE_KEYS.forEach(function (k) {
  // 그 유형을 가진 보기 중 다른 유형과 가장 덜 겹치는 보기를 고른다
  var answers = data.QUESTIONS.map(function (q) {
    var best = null, bestLen = 99;
    q[2].forEach(function (o, i) { if (o[2].indexOf(k) >= 0 && o[2].length < bestLen) { best = i; bestLen = o[2].length; } });
    return best;
  });
  var r = S.score(data, answers);
  var pct = function (x) { return Math.round(r.ratio[x] * 100) + '%'; };
  var line = k + ' -> ' + r.top + ' (' + r.ranked.map(function (x) { return x + ' ' + pct(x); }).join(', ') + ')';
  if (r.top !== k) { fail++; console.log('FAIL ' + line); } else console.log('ok   ' + line);
  var round = S.decode(data, S.encode(answers));
  if (JSON.stringify(round) !== JSON.stringify(answers)) { fail++; console.log('FAIL encode/decode ' + k); }
});

// 데이터 형식 점검
data.QUESTIONS.forEach(function (q, i) {
  if (q[2].length > 10) { fail++; console.log('FAIL 보기가 10개를 넘음: ' + (i + 1)); }
  if (!data.TOPICS.some(function (t) { return t.id === q[1]; })) { fail++; console.log('FAIL 주제 없음: ' + (i + 1)); }
  q[2].forEach(function (o) { o[2].split('').forEach(function (c) { if (!data.TYPES[c]) { fail++; console.log('FAIL 유형 코드 ' + c + ' 문항 ' + (i + 1)); } }); });
});
data.TOPICS.forEach(function (t) {
  if (!data.QUESTIONS.some(function (q) { return q[1] === t.id; })) { fail++; console.log('FAIL 문항 없는 주제: ' + t.name); }
});
console.log('문항 ' + data.QUESTIONS.length + '개, 주제 ' + data.TOPICS.length + '개');
if (fail) { console.log(fail + '개 실패'); process.exit(1); } else console.log('모두 통과');
