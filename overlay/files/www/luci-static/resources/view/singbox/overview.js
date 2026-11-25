'use strict';
'require view';
'require fs';
'require ui';

var CTL = '/usr/libexec/singbox-ctl';

/* ---------- 样式（一次性注入；明暗自适应；不依赖 color-mix 等新特性） ---------- */
var CSS = [
  '.sb{--c-bg:#ffffff;--c-soft:#f6f7f9;--c-line:#e5e7eb;--c-txt:#111827;--c-dim:#6b7280;',
  '--c-acc:#2563eb;--c-acc2:#1d4ed8;--c-acc-soft:rgba(37,99,235,.10);--c-ok:#15803d;--c-ok-soft:rgba(21,128,61,.10);',
  '--c-warn:#b45309;--c-bad:#b91c1c;--c-bad-soft:rgba(185,28,28,.10);--r:14px;',
  'color:var(--c-txt);font-size:14px;max-width:1080px;margin:0 auto;line-height:1.5}',
  '.dark .sb,.sb.dark{--c-bg:#15181d;--c-soft:#1c2027;--c-line:#2a2f38;--c-txt:#e8eaed;--c-dim:#9aa2ad;',
  '--c-acc:#6ea8fe;--c-acc2:#8ab4f8;--c-acc-soft:rgba(110,168,254,.14);--c-ok:#4ade80;--c-ok-soft:rgba(74,222,128,.12);',
  '--c-warn:#fbbf24;--c-bad:#f87171;--c-bad-soft:rgba(248,113,113,.14)}',
  '@media(prefers-color-scheme:dark){.sb{color-scheme:dark;--c-bg:#15181d;--c-soft:#1c2027;--c-line:#2a2f38;--c-txt:#e8eaed;--c-dim:#9aa2ad;--c-acc:#6ea8fe;--c-acc2:#8ab4f8;--c-acc-soft:rgba(110,168,254,.14);--c-ok:#4ade80;--c-ok-soft:rgba(74,222,128,.12);--c-warn:#fbbf24;--c-bad:#f87171;--c-bad-soft:rgba(248,113,113,.14)}}',
  /* 卡片阴影只在浅色主题有；深色主题加阴影会显脏，改成更暗的浮层 */
  '.sb{--c-sh:0 1px 2px rgba(15,23,42,.05),0 1px 1px rgba(15,23,42,.03);--c-sh-h:0 8px 22px rgba(15,23,42,.10)}',
  '.dark .sb{--c-sh:none;--c-sh-h:0 8px 22px rgba(0,0,0,.45)}',
  '@media(prefers-color-scheme:dark){.sb{--c-sh:none;--c-sh-h:0 8px 22px rgba(0,0,0,.45)}}',
  '.sb *{box-sizing:border-box}',
  '.sb h2,.sb h3,.sb h4{margin:0;font-weight:650;letter-spacing:-.01em}',
  /* hero */
  '.sb-hero{position:relative;overflow:hidden;border:1px solid var(--c-line);border-radius:18px;padding:20px 22px;margin:4px 0 16px;',
  'background:linear-gradient(135deg,var(--c-acc-soft),transparent 55%),var(--c-bg)}',
  '.sb-hero:after{content:"";position:absolute;inset:0 0 auto 0;height:3px;',
  'background:linear-gradient(90deg,var(--c-acc),#22d3ee 60%,#a78bfa)}',
  '.sb-hero .top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
  '.sb-hero h2{font-size:21px}',
  '.sb-hero .sub{color:var(--c-dim);font-size:12.5px;margin-top:6px}',
  '.sb-hero .right{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}',
  /* pills */
  '.sb-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;',
  'border:1px solid var(--c-line);background:var(--c-soft);color:var(--c-dim);white-space:nowrap}',
  '.sb-pill.ok{color:var(--c-ok);background:var(--c-ok-soft);border-color:rgba(21,128,61,.25)}',
  '.sb-pill.bad{color:var(--c-bad);background:var(--c-bad-soft);border-color:rgba(185,28,28,.25)}',
  '.sb-pill.acc{color:var(--c-acc);background:var(--c-acc-soft);border-color:rgba(37,99,235,.25)}',
  '.sb-pill .dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:0 0 auto}',
  '.sb-pill.ok .dot{box-shadow:0 0 0 3px var(--c-ok-soft)}',
  '.sb-pill.bad .dot{box-shadow:0 0 0 3px var(--c-bad-soft)}',
  /* stat cards */
  '.sb-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:14px}',
  '.sb-stat{position:relative;background:var(--c-bg);border:1px solid var(--c-line);border-radius:var(--r);padding:13px 15px;',
  'transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}',
  '.sb-stat:hover{transform:translateY(-2px);border-color:rgba(37,99,235,.35);box-shadow:0 10px 24px -18px rgba(17,24,39,.55)}',
  '.sb-stat .k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--c-dim)}',
  '.sb-stat .v{margin-top:5px;font-size:17px;font-weight:680;font-variant-numeric:tabular-nums;',
  'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.sb-stat .s{margin-top:2px;font-size:11.5px;color:var(--c-dim)}',
  /* cards */
  '.sb-card{background:var(--c-bg);border:1px solid var(--c-line);border-radius:var(--r);padding:16px 18px;margin-bottom:14px}',
  '.sb-card>h3{font-size:14.5px;display:flex;align-items:center;gap:8px;margin-bottom:12px}',
  '.sb-card>h3 .cnt{font-size:12px;font-weight:500;color:var(--c-dim)}',
  '.sb-hint{color:var(--c-dim);font-size:12.5px;margin-bottom:10px}',
  /* buttons */
  '.sb-btn{appearance:none;border:1px solid var(--c-line);background:var(--c-bg);color:var(--c-txt);border-radius:10px;',
  'padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s ease;white-space:nowrap}',
  '.sb-btn:hover{border-color:rgba(37,99,235,.45);color:var(--c-acc);background:var(--c-acc-soft)}',
  '.sb-btn:active{transform:scale(.98)}',
  '.sb-btn.primary{background:var(--c-acc);border-color:var(--c-acc);color:#fff}',
  '.sb-btn.primary:hover{background:var(--c-acc2);border-color:var(--c-acc2);color:#fff}',
  '.sb-btn.danger{color:var(--c-bad);border-color:rgba(185,28,28,.3)}',
  '.sb-btn.danger:hover{background:var(--c-bad-soft);color:var(--c-bad);border-color:rgba(185,28,28,.45)}',
  '.sb-btn.sm{padding:5px 10px;font-size:12px;border-radius:8px}',
  '.sb-btn.on{background:var(--c-acc-soft);border-color:rgba(37,99,235,.45);color:var(--c-acc)}',
  /* inputs */
  '.sb-in,.sb-sel{appearance:none;width:100%;border:1px solid var(--c-line);background:var(--c-bg);color:var(--c-txt);',
  'border-radius:10px;padding:9px 12px;font-size:13px;transition:border-color .15s ease,box-shadow .15s ease}',
  '.sb-sel{appearance:auto;line-height:1.4;padding:8px 8px 8px 10px}',
  '.sb-in:focus,.sb-sel:focus{outline:none;border-color:var(--c-acc);box-shadow:0 0 0 3px var(--c-acc-soft)}',
  '.sb-in::placeholder{color:var(--c-dim);opacity:.75}',
  /* toolbar */
  '.sb-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
  '.sb-bar .sep{width:1px;height:22px;background:var(--c-line);margin:0 4px}',
  '.sb-last{margin-top:10px;padding-top:8px;border-top:1px dashed var(--c-line);color:var(--c-dim);font-size:12.5px;word-break:break-all}',
  '.sb-lat{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;font-size:11.5px;font-weight:650;color:var(--c-dim);',
  'white-space:nowrap;font-variant-numeric:tabular-nums;padding:2px 8px;border-radius:999px;background:rgba(125,135,150,.12)}',
  '.sb-lat:empty{display:none}',
  '.sb-lat::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.6}',
  '.sb-lat.ok{color:var(--c-ok);background:var(--c-ok-soft)}',
  '.sb-lat.mid{color:var(--c-warn);background:rgba(180,83,9,.12)}',
  '.sb-lat.bad{color:var(--c-bad);background:var(--c-bad-soft)}',
  '.sb-subs{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}',
  '.sb-sub{border:1px solid var(--c-line);border-radius:12px;padding:10px 12px;background:var(--c-soft)}',
  '.sb-sub .row{display:flex;align-items:center;gap:10px 12px;flex-wrap:wrap}',
  '.sb-sub .nm{font-weight:600}',
  '.sb-sub .meta{color:var(--c-dim);font-size:12px;word-break:break-all}',
  /* 订阅分组：点名称即可收起/展开，＋ / － 并排在名称前面 */
  '.sb-group-li{list-style:none}',
  /* summary 默认是 display:list-item，会画浏览器自带的小三角；改 flex + 清 marker，
     只保留我们自己并排的 ＋ / －。注意优先级必须压过通用的 .sb details>summary:before（0,1,3），
     否则折叠状态下显示的是那个通用的 ▸。 */
  '.sb details>summary.sb-group{display:flex;align-items:center;gap:7px;margin:12px 0 8px;font-size:12.5px;color:var(--c-dim);font-weight:650;letter-spacing:.02em;user-select:none;list-style:none}',
  '.sb details>summary.sb-group::-webkit-details-marker{display:none}',
  '.sb details>summary.sb-group::marker{content:""}',
  '.sb details>summary.sb-group::before{content:"＋";display:inline-block;flex:0 0 auto;width:1.05em;text-align:center;font-weight:700;font-size:14px;line-height:1;color:var(--c-dim);transition:none;transform:none}',
  '.sb details[open]>summary.sb-group::before{content:"－";transform:none}',
  '.sb details>summary.sb-group:hover{color:var(--c-text)}',
  /* 分组标题右侧补一条渐隐横线，把「标签」和「内容」在视觉上收口 */
  '.sb details>summary.sb-group::after{content:"";flex:1 1 auto;height:1px;margin-left:2px;',
  'background:linear-gradient(90deg,var(--c-line),transparent)}',
  /* 节点卡：外层按订阅分组（纵向），组内节点卡宽屏两列、窄屏单列。
     注意外层不能用两列，否则每个分组只占半格，卡片会被挤到 240px 宽、名字全被截断。 */
  '.sb-nodes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}',
  '.sb-subnodes{list-style:none;margin:0;padding:0;display:grid;gap:9px;grid-template-columns:1fr;align-items:start}',
  '@media(min-width:721px){.sb-subnodes{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '.sb-node{display:flex;flex-direction:column;gap:5px;padding:10px 12px;border:1px solid var(--c-line);border-radius:12px;',
  'background:var(--c-soft);box-shadow:var(--c-sh);transition:border-color .16s ease,background .16s ease,box-shadow .16s ease,transform .16s ease}',
  '.sb-node:hover{background:var(--c-bg);border-color:rgba(37,99,235,.38);box-shadow:var(--c-sh-h);transform:translateY(-1px)}',
  /* 启用节点保持中性（几乎全部节点都启用，全亮绿反而看不出重点）；只有「使用中」才高亮 */
  '.sb-node.use{background:linear-gradient(100deg,var(--c-ok-soft),transparent 70%),var(--c-soft);',
  'border-color:rgba(21,128,61,.45);box-shadow:inset 3px 0 0 var(--c-ok)}',
  '.sb-node:not(.on) .nm{color:var(--c-dim)}',
  '.sb-node:not(.on) .sb-tag{opacity:.55}',
  '.sb-node .hd{display:flex;align-items:center;gap:8px;min-width:0}',
  '.sb-node .ft{display:flex;align-items:center;gap:8px;min-width:0;padding-top:8px;',
  'border-top:1px solid rgba(125,135,150,.16)}',
  '.sb-node .nm{flex:1 1 auto;min-width:0;font-weight:650;font-size:13.5px;letter-spacing:-.005em;',
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.sb-node .meta{flex:1 1 auto;min-width:0;color:var(--c-dim);font-size:11.5px;font-variant-numeric:tabular-nums;',
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.sb-node .acts{display:flex;gap:6px;flex:0 0 auto;margin-left:auto}',
  /* 次要操作平时压暗，指针进入卡片才恢复 */
  '.sb-node .sb-btn.ghost{opacity:.45;transition:opacity .15s ease}',
  '.sb-node:hover .sb-btn.ghost,.sb-node:focus-within .sb-btn.ghost{opacity:1}',
  '@media(hover:none){.sb-node .sb-btn.ghost{opacity:.85}}',
  /* 「用这个」＝手动选节点：用描边强调色而不是实心蓝 —— 67 张卡各一个实心按钮会把版面压垮；
     指向时才填充。 */
  '.sb-node .sb-btn.use{color:var(--c-acc);border-color:rgba(37,99,235,.45);font-weight:600;opacity:1}',
  '.sb-node .sb-btn.use:hover{background:var(--c-acc);border-color:var(--c-acc);color:#fff}',
  '.sb details>summary.sb-group .gname{font-size:13px;font-weight:650;color:var(--c-text);letter-spacing:0}',
  '.sb details>summary.sb-group .gcnt{font-size:11px;font-weight:600;color:var(--c-dim);border-radius:999px;padding:1px 8px;',
  'background:rgba(125,135,150,.13)}',
  /* 协议标签更小更淡：它是辅助信息，不该比节点名更抢眼 */
  '.sb-tag{font-size:9.5px;font-weight:700;letter-spacing:.06em;padding:2px 6px;border-radius:5px;text-transform:uppercase;',
  'border:1px solid;flex:0 0 auto;opacity:.9}',
  '.sb-tag.vless{color:#7c3aed;border-color:rgba(124,58,237,.4);background:rgba(124,58,237,.10)}',
  '.sb-tag.vmess{color:#0284c7;border-color:rgba(2,132,199,.4);background:rgba(2,132,199,.10)}',
  '.sb-tag.trojan{color:#ea580c;border-color:rgba(234,88,12,.4);background:rgba(234,88,12,.10)}',
  '.sb-tag.shadowsocks{color:#059669;border-color:rgba(5,150,105,.4);background:rgba(5,150,105,.10)}',
  '.sb-tag.hysteria2{color:#d946ef;border-color:rgba(217,70,239,.4);background:rgba(217,70,239,.10)}',
  /* form grid */
  '.sb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px 12px}',
  '.sb-grid label{display:block;font-size:11px;color:var(--c-dim);margin-bottom:4px;letter-spacing:.02em}',
  /* details */
  '.sb details>summary{cursor:pointer;list-style:none;font-size:14.5px;font-weight:650;display:flex;align-items:center;gap:8px}',
  '.sb details>summary::-webkit-details-marker{display:none}',
  '.sb details>summary:before{content:"\\25B8";color:var(--c-dim);display:inline-block;transition:transform .16s ease}',
  '.sb details[open]>summary:before{transform:rotate(90deg)}',
  '.sb-empty{padding:26px;text-align:center;color:var(--c-dim);font-size:13px;border:1px dashed var(--c-line);border-radius:12px}',
  '.sb-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}',
  '.sb-chip{font-size:11px;color:var(--c-dim);border:1px solid var(--c-line);border-radius:999px;padding:2px 9px;background:var(--c-soft)}',
  /* 窄屏单列：名称/地址允许换行 */
  '@media(max-width:720px){.sb-hero .right{width:100%;margin-left:0}',
  '.sb-node .nm,.sb-node .meta{white-space:normal}',
  '.sb-node .hd{flex-wrap:wrap}}',
  '@media(min-width:340px) and (max-width:720px){.sb-stats{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}}',
].join('\n');

function injectCss() {
  var old = document.getElementById('sb-style');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  document.head.appendChild(E('style', { 'id': 'sb-style' }, CSS));
}

function ctl(args) {
  return fs.exec(CTL, args || []).then(function (r) {
    return { code: r.code || 0, out: r.stdout || '', err: r.stderr || '' };
  }).catch(function (e) { return { code: -1, out: '', err: String(e) }; });
}

function parseJson(res) { try { return JSON.parse(res.out); } catch (e) { return null; } }

/* ---------- 节点延迟 ---------- */
/* tcp  = 到节点服务器端口的 TCP 握手（纯链路，hysteria2 这种 UDP 协议没有） */
/* real = 通过该节点真的出网请求 204 的往返（临时实例测的，见 singbox-ctl ping） */
/* 按"最近一次测全部延迟"的结果剔除不通节点（用户点按钮才动，不自动） */
function pruneBad() {
  if (!confirm('将把最近一次延迟测试中「不可用」的节点禁用（至少保留一个可用）。继续？')) return;
  var pn = note('正在按测试结果剔除不通节点…', 'info', 60000);
  return ctl(['ping-prune']).then(function (r) {
    if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
    var o = r.out || '';
    var m = /PRUNED=(\d+)/.exec(o);
    if (r.code === 0 && m) {
      var left = (/ENABLED=(\d+)/.exec(o) || [0, '?'])[1];
      note('已禁用 ' + m[1] + ' 个不通节点，剩余启用 ' + left + ' 个', 'info', 10000);
      return ctl(['restart']).then(function () { window.location.reload(); });
    }
    if (/ALL_FAILED/.test(o)) { note('全部节点都不通：未做任何修改（不然就没节点可用了）', 'danger'); return; }
    note('剔除失败：' + (o || r.err || '未知原因').replace(/\s+/g, ' '), 'danger');
  });
}
function fmtLat(o) {
  if (!o || o.error) return '失败';
  if (o.real === null || o.real === undefined) return '不可用';
  return o.real + 'ms';
}
/* 胶囊里只放「实际延迟」一个数，完整明细（TCP / 实际）放 title */
function latTip(o) {
  if (!o || o.error) return '测试失败';
  var a = (o.tcp === null || o.tcp === undefined) ? '—' : (o.tcp + 'ms');
  var b = (o.real === null || o.real === undefined) ? '不可用' : (o.real + 'ms');
  return 'TCP ' + a + ' · 实际 ' + b;
}
function latBad(o) { return !o || o.real === null || o.real === undefined; }
/* 延迟配色分级：≤250ms 绿、≤600ms 琥珀、更慢中性灰、失败红 */
function latTier(o) {
  if (latBad(o)) return 'bad';
  if (o.real <= 250) return 'ok';
  if (o.real <= 600) return 'mid';
  return '';
}
function setLat(name, txt, tier, tip) {
  var el = document.querySelector('.sb-lat[data-node="' + name + '"]');
  if (!el) return;
  el.textContent = txt;
  if (tip) el.title = tip;
  if (tier === undefined) return;
  if (tier === true) tier = 'bad';
  if (tier === false) tier = '';
  el.classList.remove('ok', 'mid', 'bad');
  if (tier) el.classList.add(tier);
}

/* 全量测延迟：后台跑，前端轮询进度。
   用 setTimeout 串行轮询，不能用 setInterval —— 一次 ping-read 可能超过 1.5 秒，
   setInterval 会叠出多个并发请求，每个都读到 done 就各弹一次"完成"（实测叠了 13 条）。 */
function pingAll(mode) {
  var m = (mode === 'full') ? 'full' : 'quick';
  /* 两档：quick（默认）/ full。文案里的时间是实测值，不要写小了 */
  var prog = note(m === 'full'
    ? '正在全量测速（全部节点，约 2~3 分钟）…'
    : '正在快速测速（池内 + 候选 + 轮换补测，约 1 分钟）…', 'info', m === 'full' ? 240000 : 120000);
  var seen = {};
  var finished = false;
  var total = 0;
  var bad = 0;
  var t0 = Date.now();
  var emptyReads = 0;

  function finish() {
    finished = true;
    if (prog && prog.parentNode) prog.parentNode.removeChild(prog);
    note('延迟测试完成：共 ' + total + ' 个节点，' + (bad ? (bad + ' 个不可用') : '全部可用'),
      bad ? 'danger' : 'info', bad ? 15000 : 6000);
    /* 后端在 done 之后 ~1s 才应用新均衡池（render 约 10 秒），这里补一次延迟刷新，
       让「出口 · 池 N/M」显示的是真正生效后的池子，而不是上一轮的数字 */
    window.setTimeout(function () { if (self && self.refresh) self.refresh(); }, 15000);
  }

  function poll() {
    if (finished) return;
    ctl(['ping-read']).then(function (r) {
      if (finished) return;
      var done = false;
      (r.out || '').split('\n').forEach(function (line) {
        line = line.trim();
        if (!line) return;
        var o = null;
        try { o = JSON.parse(line); } catch (e) { return; }
        if (o.done) { done = true; return; }
        if (o.node && !seen[o.node]) {
          seen[o.node] = 1;
          total++;
          if (latBad(o)) bad++;
          setLat(o.node, fmtLat(o), latTier(o), latTip(o));
        }
      });
      if (done) { finish(); return; }
      /* 兜底：后端任务被杀 / rpcd 忙时 ping-read 会一直返回空，原来就会每 1.5 秒
         无限轮询下去（提示条早超时消失，轮询还在跑）。连续 20 次空读或超过 5 分钟收工。 */
      if ((r.out || '').trim()) { emptyReads = 0; } else { emptyReads++; }
      if (emptyReads >= 20 || (Date.now() - t0) > 300000) {
        finished = true;
        if (prog && prog.parentNode) prog.parentNode.removeChild(prog);
        note('延迟测试中断（后端没有返回结果），请再点一次「测延迟」', 'danger');
        return;
      }
      setTimeout(poll, 1500);
    });
  }

  return ctl(['ping-start', m]).then(function (r) {
    /* 后端已有任务在跑（连点两次）会返回 BUSY：此时别再切进轮询，等它自己结束即可 */
    if (/BUSY/.test(r.out || '')) {
      if (prog && prog.parentNode) prog.parentNode.removeChild(prog);
      note('已经有一轮延迟测试在跑，等它结束即可（结果会自动填入列表）', 'info');
      return;
    }
    setTimeout(poll, 1500);
  });
}

/* 通知统一走"限时"版本：LuCI 的 addNotification 是常驻的（没有任何定时器），
   用它就只能手动点关闭 / 刷新页面 —— 这就是之前"提示不消失"的原因。
   现在改成 6 秒自动淡出（危险提示 12 秒），不需要刷新页面。
   需要长期保留的信息都已经写进卡片（上次测试 / 每行延迟），不依赖通知条。 */
function note(m, k, ms) {
  var d = ms || ((k === 'danger') ? 12000 : 6000);
  return ui.addTimeLimitedNotification(null, E('p', {}, m), d, k || 'info');
}
function t(s) { return (s === undefined || s === null || s === '') ? '—' : String(s); }
function esc(s) { return String(s === undefined || s === null ? '' : s); }
function btn(label, cls, fn) {
  return E('button', { 'class': 'sb-btn ' + (cls || ''), 'click': ui.createHandlerFn(this, fn) }, label);
}
function pill(cls, label) {
  return E('span', { 'class': 'sb-pill ' + cls }, [E('span', { 'class': 'dot' }), label]);
}
function stat(k, v, sub) {
  return E('div', { 'class': 'sb-stat' }, [
    E('div', { 'class': 'k' }, k),
    E('div', { 'class': 'v' }, esc(v)),
    sub ? E('div', { 'class': 's' }, sub) : ''
  ]);
}

return view.extend({
  /* 一次调用拿 status + nodes（设备上每次进程启动约 250ms）。
     注意：LuCI 的 view.load() 必须 resolve 成**数组**，render 收到的 data[i] 就是它的第 i 项；
     直接返回单个对象会让 data[0] 变成 undefined，面板就整页空白（踩过一次）。 */
  load: function () { return ctl(['overview']).then(function (r) { return [r]; }); },

  render: function (data) {
    injectCss();
    var self = this;
    var ov = parseJson(data[0]) || {};
    var st = ov.status || {};
    var nodes = ov.nodes || [];
    var on = (st.enabled === '1');
    var run = !!st.running;
    var bal = (st.balance === '1');
    var udp = (st.udp_proxy === '1');
    var MODES = { rule: '规则分流', global: '全局代理', direct: '全部直连' };
    var modeTxt = MODES[st.mode] || t(st.mode);

    /* doRestart=false：stop/restart 本身已经改变进程状态，否则「停止」会被随后的 restart 立刻拉起来 */
    function run_(args, msg, doRestart) {
      /* 应用配置/重启在设备上要几秒（render 8 秒 + 换进程 1~2 秒），
         期间必须给个进度提示，否则用户以为点了没反应。 */
      var pn = note('正在应用配置，请稍候（约 5~12 秒）…', 'info', 60000);
      return ctl(args).then(function (r) {
        if (r.code !== 0) note('失败：' + (r.err || r.out), 'danger');
        else if (msg) note(msg, 'info');
        if (doRestart === false) return null;
        return ctl(['restart']);
      }).then(function () {
        if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
        self.refresh();
      });
    }
    function quick(args, msg) {
      var pn = note('正在应用配置，请稍候（约 5~12 秒）…', 'info', 60000);
      return ctl(args).then(function () { return ctl(['restart']); }).then(function () {
        if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
        if (msg) note(msg, 'info');
        self.refresh();
      });
    }

    /* 手动选节点：关掉负载均衡 + 只启用这一个 → 所有流量从它出去（「出口」卡片会变成手动节点）。
       想回到自动选优，点上面运行控制里的「均衡 开」。 */
    function useNode(n) {
      var lbl = esc(n.remark || n.name);
      var pn = note('正在切到「' + lbl + '」…（约 5~12 秒）', 'info', 60000);
      return ctl(['balance', '0'])
        .then(function () { return ctl(['node-enable', n.name, '1']); })
        .then(function () { return ctl(['restart']); })
        .then(function () {
          if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
          note('已切到「' + lbl + '」（手动模式，已关闭负载均衡）', 'info');
          self.refresh();
        });
    }

    /* 单节点分享链接：后端 sub-add-uri 复用订阅同一个解析器，导入后节点进「分享链接」分组。 */
    function importUri() {
      var v = (uriIn.value || '').replace(/^\s+|\s+$/g, '');
      if (!v) { note('请先粘贴一条节点分享链接', 'danger'); return; }
      var pn = note('正在导入分享链接…（约 5~15 秒）', 'info', 60000);
      function done(msg, kind) {
        if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
        note(msg, kind);
      }
      return ctl(['sub-add-uri', v]).then(function (r) {
        var o = (r.out || '').replace(/^\s+|\s+$/g, '');
        if (o.indexOf('ADDED=') < 0) {
          done('导入失败：' + (o ? o.slice(0, 60) : ('code ' + r.code)), 'danger');
          return;
        }
        return ctl(['restart']).then(function () {
          uriIn.value = '';
          done('已导入到「分享链接」分组并启用', 'info');
          self.refresh();
        });
      });
    }

    /* ---------- hero ---------- */
    var hero = E('div', { 'class': 'sb-hero' }, [
      E('div', { 'class': 'top' }, [
        E('h2', {}, 'sing-box'),
        pill(run ? 'ok' : 'bad', run ? '运行中' : '未运行'),
        E('span', { 'class': 'sb-pill' }, esc(st.version || '内核版本未知')),
        E('div', { 'class': 'right' }, [
          btn(on ? '停用' : '启用', on ? 'danger' : 'primary', function () {
            return ctl(['enable', on ? '0' : '1']).then(function () { return ctl(['restart']); }).then(function () {
              note(on ? '已停用 sing-box' : '已启用 sing-box');
              self.refresh();
            });
          }),
          btn('应用配置', '', function () { return run_(['restart'], '已重启生效', false); })
        ])
      ]),
      E('div', { 'class': 'sub' },
        modeTxt + ' · ' + (st.nodes || 0) + ' 个启用节点' +
        (bal ? ' · 负载均衡（leastPing）' : (st.active ? ' · 当前出口 ' + esc(st.active) : '')))
    ]);

    /* ---------- stats ---------- */
    var stats = E('div', { 'class': 'sb-stats' }, [
      stat('进程', run ? ('PID ' + esc(st.pid)) : 'stopped', run ? 'sing-box · procd' : '未启动'),
      /* 均衡池：render 会把「池大小 / 剔除数」写到设备上，这里直接显示正在跑的那份 */
      stat('出口', bal ? '负载均衡' : t(st.active),
        bal ? ('leastPing · 池 ' + (st.pool || 0) + '/' + (st.nodes || 0) + (Number(st.dead) > 0 ? '，剔 ' + st.dead : ''))
            : '手动节点'),
      stat('透明代理', st.nft === 'yes' ? '已下发' : '未下发', 'TPROXY · 仅 TCP（UDP 不代理）'),
      stat('分流规则', (st.chnroute || 0) + ' / ' + (st.proxy_domains || 0) + ' / ' + (st.direct_domains || 0),
        'CIDR / 代理域名 / 直连域名')
    ]);

    /* ---------- toolbar ---------- */
    /* 「上次测试」固定显示在运行控制卡里：LuCI 的通知条挂在 #maincontent 上，
       面板里任何一次设置变更都会 location.reload()，通知条跟着没；
       而"从哪个 IP 出去"是要反复看的信息，所以再存一份到 localStorage。 */
    var lastTxt = '';
    try { lastTxt = window.localStorage.getItem('sb_last_test') || ''; } catch (e) { lastTxt = ''; }
    var lastEl = E('div', { 'class': 'sb-last' },
      lastTxt || '尚未测试：点上面「测试代理」，会显示 HTTP 状态与出口 IP（结果会留在这里，刷新也不丢）');

    var bar = E('div', { 'class': 'sb-card' }, [
      E('h3', {}, '运行控制'),
      E('div', { 'class': 'sb-bar' }, [
        btn('重启', '', function () { return run_(['restart'], '已重启', false); }),
        btn('停止', 'danger', function () { return run_(['stop'], '已停止', false); }),
        btn('测试代理', '', function () {
          /* 进度通知必须自己撤掉：ui.addNotification 是"常驻"的（带关闭按钮、无定时器），
             不手动删就会一直堆在页面顶部 —— 实测跑两次就攒两条"正在通过 SOCKS 测试出口…"。 */
          var pn = note('正在通过 SOCKS 测试出口…');
          return ctl(['test']).then(function (r) {
            if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
            var r0 = parseJson(r) || {};
            var ok = !!r0.ok;
            var txt = 'HTTP ' + (r0.http_code || '000') + (ok ? ' · 连通' : ' · 不通') +
              (r0.exit_ip ? ' · 出口 ' + r0.exit_ip : '') +
              '（SOCKS 端口 ' + t(r0.socks_port) + '）';
            /* 结果同时写进卡片 + localStorage：通知条挂在 #maincontent 上，
               页面一重载（面板里改任何设置都会 location.reload）就没了，
               而"从哪个 IP 出去"恰恰要留得住。 */
            var line = new Date().toLocaleString() + '  ' + txt;
            try { window.localStorage.setItem('sb_last_test', line); } catch (e) {}
            lastEl.textContent = line;
            note('代理测试：' + txt, ok ? 'info' : 'danger');
          });
        }),
        E('div', { 'class': 'sep' }),
        E('span', { 'class': 'sb-hint', 'style': 'margin:0 2px' }, '模式'),
        E('select', {
          'class': 'sb-sel', 'style': 'width:auto;min-width:105px',
          'change': ui.createHandlerFn(this, function (ev) {
            return quick(['mode', ev.target.value], '已切换为' + (MODES[ev.target.value] || ev.target.value));
          })
        }, ['rule', 'global', 'direct'].map(function (m) {
          return E('option', { 'value': m, 'selected': (st.mode === m) ? '' : null }, MODES[m]);
        })),
        btn(bal ? '均衡 开' : '均衡 关', bal ? 'on' : '', function () {
          /* 从「手动单节点」（卡片上的「用这个」）切回自动时：手动模式把其它节点全禁用了，
             这里先把节点恢复启用，否则均衡池里只剩 1 个节点，看起来像"均衡坏了"。 */
          var needAll = (!bal) && (Number(st.nodes || 0) <= 1);
          var step = needAll ? ctl(['nodes-enable', '1']) : Promise.resolve();
          return step.then(function () {
            return quick(['balance', bal ? '0' : '1'],
              bal ? '已关闭负载均衡' : (needAll ? '已开启负载均衡（节点已全部恢复启用）' : '已开启负载均衡'));
          });
        }),
        btn(udp ? 'UDP 代理 开' : 'UDP 代理 关', udp ? 'on' : '', function () {
          return quick(['udp-proxy', udp ? '0' : '1'],
            udp ? '已关闭 UDP 代理（QUIC 回落 TCP，网页更快）' : '已开启 UDP 代理（QUIC / 游戏 UDP 走节点）');
        }),
      ]),
      /* SQM：现在有独立页面（网络 → SQM 限速），这里只留一行状态 + 跳转入口。
         ⚠️ 别在这里再跑 sqm-tune —— 那是 22 秒的同步 RPC，长请求会被 rpcd/uhttpd
         挂住（既不 resolve 也不 reject），界面就永远停在旧值上。校准交给 SQM 页面
         走「后台任务 + 状态轮询」，才不会有这个问题。 */
      E('div', { 'class': 'sb-bar', 'style': 'margin-top:10px;padding-top:10px;border-top:1px dashed var(--c-line)' }, [
        E('span', { 'class': 'sb-chip' },
          st.sqm_on === '1'
            ? ('SQM 整形 ' + (Number(st.sqm_eff_down || st.sqm_down) / 1000).toFixed(1) + ' / ' +
               (Number(st.sqm_eff_up || st.sqm_up) / 1000).toFixed(1) + ' Mbit' +
               (Number(st.sqm_tuned) > 0 ? ' · 已校准' : ' · 未校准'))
            : 'SQM 未启用'),
        E('a', {
          'class': 'sb-btn sm',
          'href': L.url('admin/network/sqm'),
          'style': 'display:inline-block;text-decoration:none;line-height:1.2'
        }, '去 SQM 页面')
      ]),
      lastEl
    ]);

    /* ---------- nodes ---------- */
    /* ---------- 节点（按订阅分组） ---------- */
    var subs = ov.subs || [];
    var subName = {};
    subs.forEach(function (s) { subName[s.id] = (s.name || s.id); });

    function nodeRow(n) {
      var isOn = (n.enabled === '1');
      var inUse = (st.active === n.name) && !bal;
      /* 显示地址 + 有意义的加密/传输；none / tcp 是默认值，写出来只是噪音 */
      var msec = t(n.security), mnet = t(n.network);
      var meta = esc(t(n.server)) + ':' + esc(t(n.port)) +
        (msec && msec !== 'none' ? ' · ' + esc(msec) : '') +
        (mnet && mnet !== 'tcp' ? ' · ' + esc(mnet) : '');
      /* title 里保留完整信息，鼠标悬停仍能看到原始值 */
      var metaFull = meta + ' · ' + esc(msec || 'none') + ' · ' + esc(mnet || 'tcp');
      return E('li', { 'class': 'sb-node' + (isOn ? ' on' : '') + (inUse ? ' use' : '') }, [
        /* 卡片只有两行：标题行（协议 · 名称 · 延迟）＋ 信息行（地址/加密/传输 · 操作按钮）。
           编辑、删除这类低频操作平时压暗，鼠标移上去才亮 —— 一屏几十张卡不会被按钮塞满。 */
        E('div', { 'class': 'hd' }, [
          E('span', { 'class': 'sb-tag ' + esc(n.type) }, esc(n.type) || '?'),
          E('div', { 'class': 'nm', 'title': esc(n.remark || n.name) }, esc(n.remark || n.name)),
          E('span', { 'class': 'sb-lat', 'data-node': esc(n.name) }, ''),
          inUse ? pill('ok', '使用中') : '',
          !isOn ? pill('', '未启用') : ''
        ]),
        E('div', { 'class': 'ft' }, [
          E('div', { 'class': 'meta', 'title': metaFull }, meta),
          E('div', { 'class': 'acts' }, [
            /* 手动选用这个节点（关均衡 + 只启用它）；当前出口的卡片不显示（标题行已有「使用中」） */
            inUse ? '' : btn('用这个', 'sm use', function () { return useNode(n); }),
            btn('测', 'sm', function () {
              setLat(n.name, '测试中…', '');
              return ctl(['ping', n.name]).then(function (r) {
                var o = null;
                try { o = JSON.parse(r.out); } catch (e) { o = null; }
                setLat(n.name, fmtLat(o), latTier(o), latTip(o));
              });
            }),
            /* 已启用的节点不再显示「启用」按钮（67 个节点全启用时，每张卡一个蓝按钮纯噪音） */
            isOn ? '' : btn('启用', 'sm on', function () {
              return quick(['node-enable', n.name, '1'], '已切换到「' + esc(n.remark || n.name) + '」');
            }),
            btn('编辑', 'sm ghost', function () { self.fillForm(n); }),
            btn('删除', 'sm ghost danger', function () {
              if (!confirm('删除节点「' + (n.remark || n.name) + '」？删除后会重启 sing-box。')) return;
              return ctl(['node-del', n.name]).then(function () { return ctl(['restart']); }).then(function () { self.refresh(); });
            })
          ])
        ])
      ]);
    }

    var items = [];
    if (!nodes.length) {
      items.push(E('div', { 'class': 'sb-empty' }, '还没有节点：用下面的订阅导入，或手动添加一个。'));
    } else {
      var groups = {};
      nodes.forEach(function (n) { var k = n.src || '_'; (groups[k] = groups[k] || []).push(n); });
      var order = subs.map(function (s) { return s.id; });
      var collapsed = {};
      try { collapsed = JSON.parse(window.localStorage.getItem('sb_collapsed') || '{}') || {}; } catch (e) { collapsed = {}; }
      Object.keys(groups).forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
      order.forEach(function (k) {
        var arr = groups[k];
        if (!arr) return;
        /* 每个订阅一组，标题可折叠（点 ＋/－）：节点多的时候列表太长，按订阅收起更方便。
           open 状态记在 localStorage，刷新/重渲染后保持。 */
        /* 默认收起（节点多，全展开太长）；点过的记住：0=展开 1=收起 */
        var det = E('details', { 'open': collapsed[k] === 0 ? '' : null }, [
          E('summary', { 'class': 'sb-group' }, [
            E('span', { 'class': 'gname' }, subName[k] || '未归属订阅'),
            E('span', { 'class': 'gcnt' }, arr.length + ' 个')
          ]),
          E('ul', { 'class': 'sb-subnodes' }, arr.map(function (n) { return nodeRow(n); }))
        ]);
        det.addEventListener('toggle', function () {
          collapsed[k] = det.open ? 0 : 1;
          try { window.localStorage.setItem('sb_collapsed', JSON.stringify(collapsed)); } catch (e) {}
        });
        items.push(E('li', { 'class': 'sb-group-li' }, [det]));
      });
    }

    var nodesCard = E('section', { 'class': 'sb-card' }, [
      /* 注意：LuCI 的 E() 只吃一个 children 参数（E(tag, attrs, children)），
         写成多个参数会被静默丢掉 —— 所以这里必须给数组。 */
      E('h3', {}, [
        '节点',
        E('span', { 'class': 'cnt' }, nodes.length + ' 个 · 启用 ' + (st.nodes || 0)),
        btn('测延迟', 'sm', function () { return pingAll('quick'); }),
        btn('全量测速', 'sm', function () {
          if (!confirm('全量测速会逐个探测全部节点，约 2~3 分钟，期间路由器会忙一点。\n\n平时用「测延迟」就够了（约 1 分钟：快的候选 + 轮换补测）。\n\n确定要全量？')) return;
          return pingAll('full');
        }),
        btn('剔除不通节点', 'sm danger', pruneBad)
      ]),
      E('ul', { 'class': 'sb-nodes' }, items)
    ]);

    /* ---------- 订阅（多订阅：列表只显示名称，编辑才看到链接） ---------- */
    /* 导入要 30~60 秒，而 rpcd 的 RPC 超时是 30 秒 —— 直接在面板里调会报
       "XHR request timed out"（后端其实还在跑）。所以统一走后台任务 + 轮询。 */
    function importAsync(label, args) {
      var prog = note('正在导入「' + label + '」…（约 30~60 秒，页面可以继续用）', 'info', 180000);
      return ctl(args).then(function (r) {
        var o0 = r.out || '';
        function stop(txt, kind) {
          if (prog && prog.parentNode) prog.parentNode.removeChild(prog);
          note(txt, kind);
        }
        if (o0.indexOf('BUSY') >= 0) { stop('已有导入任务在跑，请等它结束', 'danger'); return; }
        if (o0.indexOf('STARTED') < 0) {
          stop('启动导入失败：' + (o0 || r.err || '未知原因').replace(/\s+/g, ' '), 'danger');
          return;
        }
        var tries = 0;
        (function poll() {
          ctl(['sub-import-read']).then(function (rr) {
            var o = rr.out || '';
            /* 只有拿到真正的结果行才算结束：空响应/半截响应（后台还没写出结果）都继续等，
               否则会提前刷新，面板上就会停在导入中途的节点数（实测见过"9 个节点·未导入"）。 */
            var done = /IMPORTED=|DOWNLOAD_FAILED|UNSUPPORTED=|ALL_BLOCKED|NO_NODES_PARSED|CONFIG_INVALID|WRITE_FAILED|BASE64_DECODE_FAILED|UNKNOWN_FORMAT|EMPTY_RESPONSE/.test(o);
            if (!done && tries < 150) { tries++; setTimeout(poll, 2000); return; }
            if (prog && prog.parentNode) prog.parentNode.removeChild(prog);
            afterImport({ code: /IMPORTED=/.test(o) ? 0 : 1, out: o, err: '' }, label);
          });
        })();
      });
    }
    function afterImport(r, label) {
      var o = r.out || '';
      var m = /IMPORTED=(\d+)/.exec(o), s = /UNSUPPORTED=(\d+)/.exec(o), f = /FORMAT=(\w+)/.exec(o);
      if (r.code === 0 && m) {
        var blk = /BLOCKED=(\d+)/.exec(o), via = /VIA=(\w+)/.exec(o);
        note('「' + label + '」导入完成：' + m[1] + ' 个节点 · 格式 ' + (f ? f[1] : '?') +
          (blk && blk[1] !== '0' ? ' · 黑名单过滤 ' + blk[1] + ' 个' : '') +
          (s && s[1] !== '0' ? ' · 跳过 ' + s[1] + ' 个不支持的协议' : '') +
          (via && via[1] === 'proxy' ? ' · 经代理下载' : ''), 'info');
        return ctl(['restart']).then(function () { self.refresh(); });
      }
      note('「' + label + '」导入失败：' + (o || r.err || '未知原因').replace(/\s+/g, ' '), 'danger');
    }

    /* 「分享链接」是 pseudo 订阅（没有 URL，靠 sub-add-uri 往里加节点），只用来给节点分组命名，
       不在订阅列表里显示；它下面一个节点都没有时后端会把这段也删掉。 */
    var realSubs = subs.filter(function (s) { return s.id !== 'share'; });
    var subRows = realSubs.length ? realSubs.map(function (s) {
      var nm = s.name || s.id;
      var last = s.last ? new Date((+s.last) * 1000).toLocaleString() : '未导入';
      var masked = s.url ? (s.url.length > 46 ? (s.url.slice(0, 24) + '…' + s.url.slice(-12)) : s.url) : '（未填写链接）';
      var nameEl = E('input', { 'class': 'sb-in', 'type': 'text', 'value': nm });
      var urlEl = E('input', { 'class': 'sb-in', 'type': 'text', 'style': 'flex:1 1 280px;min-width:200px', 'value': s.url || '' });
      var viaEl = E('input', { 'type': 'checkbox', 'checked': (s.via === '1') ? '' : null });
      var blkEl = E('input', {
        'class': 'sb-in', 'type': 'text', 'style': 'flex:0 1 220px;min-width:140px',
        'value': s.block || '', 'placeholder': '黑名单关键词（模糊匹配，逗号分隔）'
      });
      var editBox = E('div', { 'class': 'sb-bar', 'style': 'display:none;margin-top:8px' }, [
        E('span', { 'class': 'sb-hint', 'style': 'margin:0' }, '名称'),
        nameEl,
        E('span', { 'class': 'sb-hint', 'style': 'margin:0' }, '链接'),
        urlEl,
        E('label', { 'class': 'sb-hint', 'style': 'margin:0;display:flex;align-items:center;gap:4px' },
          [viaEl, '更新时走代理']),
        blkEl,
        btn('保存', 'sm primary', function () {
          var n2 = nameEl.value.replace(/^\s+|\s+$/g, '');
          var u2 = urlEl.value.replace(/^\s+|\s+$/g, '');
          if (!n2) { note('名称不能为空', 'danger'); return; }
          return ctl(['sub-set', s.id, n2, u2, viaEl.checked ? '1' : '0',
            blkEl.value.replace(/^\s+|\s+$/g, '')]).then(function (r) {
            if (r.code !== 0) { note('保存失败：' + (r.err || r.out), 'danger'); return; }
            note('已保存订阅「' + n2 + '」');
            self.refresh();
          });
        })
      ]);
      return E('li', { 'class': 'sb-sub' }, [
        E('div', { 'class': 'row' }, [
          E('div', { 'class': 'grow' }, [
            E('div', { 'class': 'nm', 'title': nm }, nm),
            E('div', { 'class': 'meta', 'title': s.url || '' }, s.count + ' 个节点 · ' + last + ' · ' + masked +
              (s.via === '1' ? ' · 走代理更新' : '') +
              (s.block ? ' · 黑名单 ' + String(s.block).split(/[,，、\s]+/).filter(Boolean).length + ' 项' : ''))
          ]),
          E('div', { 'class': 'acts' }, [
            btn('更新', 'sm', function () {
              return importAsync(nm, ['sub-import-bg', s.url, s.id]);
            }),
            btn('编辑', 'sm', function () {
              editBox.style.display = (editBox.style.display === 'none') ? '' : 'none';
            }),
            btn('删除', 'sm danger', function () {
              if (!confirm('删除订阅「' + nm + '」及其 ' + s.count + ' 个节点？')) return;
              return ctl(['sub-del', s.id]).then(function () { return ctl(['restart']); }).then(function () { self.refresh(); });
            })
          ])
        ]),
        editBox
      ]);
    }) : [E('div', { 'class': 'sb-empty' }, '还没有订阅：在下面填名称和链接导入。')];

    var newName = E('input', { 'class': 'sb-in', 'type': 'text', 'style': 'flex:0 1 170px;min-width:120px', 'placeholder': '订阅名称（如：机场A）' });
    var newUrl = E('input', { 'class': 'sb-in', 'type': 'text', 'style': 'flex:1 1 280px;min-width:200px', 'placeholder': 'https://…/subscribe?token=…' });
    var newVia = E('input', { 'type': 'checkbox' });
    var newBlk = E('input', {
      'class': 'sb-in', 'type': 'text', 'style': 'flex:0 1 220px;min-width:140px',
      'placeholder': '黑名单关键词（模糊匹配，逗号分隔，可留空）'
    });

    var uriIn = E('input', {
      'class': 'sb-in', 'type': 'text', 'style': 'flex:1 1 320px;min-width:220px',
      'placeholder': '粘贴单节点分享链接：vless:// … / vmess:// … / ss:// … / trojan:// … / hy2:// …'
    });

    var subCard = E('section', { 'class': 'sb-card' }, [
      E('h3', {}, '订阅（可多个）'),
      E('div', { 'class': 'sb-hint' },
        '每个订阅单独命名，列表里只显示名称；点「编辑」才展开完整链接。节点列表按订阅分组显示。'),
      E('div', { 'class': 'sb-hint' },
        '黑名单按「节点名包含关键词」模糊过滤（不区分大小写），填几个词就够，命中即不导入；关键词支持中英文逗号、顿号、空格分隔。'),
      E('ul', { 'class': 'sb-subs' }, subRows),
      E('div', { 'class': 'sb-bar', 'style': 'margin-top:12px' }, [
        newName, newUrl,
        E('label', { 'class': 'sb-hint', 'style': 'margin:0;display:flex;align-items:center;gap:4px' },
          [newVia, '走代理下载']),
        newBlk,
        btn('导入新订阅', 'primary', function () {
          var n2 = newName.value.replace(/^\s+|\s+$/g, '');
          var u2 = newUrl.value.replace(/^\s+|\s+$/g, '');
          if (!u2) { note('请先填写订阅链接', 'danger'); return; }
          if (!n2) { note('请给这个订阅起个名字（用来区分不同机场）', 'danger'); return; }
          note('正在下载并解析「' + n2 + '」…');
          return importAsync(n2, ['sub-add-bg', n2, u2, newVia.checked ? '1' : '0',
            newBlk.value.replace(/^\s+|\s+$/g, '')]);
        })
      ]),
      /* ---------- 单节点分享链接：导入后进「分享链接」分组 ---------- */
      E('div', { 'class': 'sb-bar', 'style': 'margin-top:10px;padding-top:10px;border-top:1px dashed var(--c-line)' }, [
        uriIn,
        btn('导入分享链接', '', function () { return importUri(); })
      ]),
      E('div', { 'class': 'sb-chips' }, [
        E('span', { 'class': 'sb-chip' }, 'v2ray · base64 / 明文 URI'),
        E('span', { 'class': 'sb-chip' }, 'Clash · Clash.Meta YAML'),
        E('span', { 'class': 'sb-chip' }, 'sing-box / Xray JSON'),
        E('span', { 'class': 'sb-chip' }, '纯 URI 列表')
      ])
    ]);

    /* ---------- editor ---------- */
    var formCard = E('details', { 'class': 'sb-card', 'open': nodes.length ? null : '' }, [
      E('summary', {}, '添加 / 编辑节点'),
      E('div', { 'class': 'sb-grid', 'style': 'margin-top:12px' }, [
        this.field('name', '标识（英文、唯一）'),
        this.field('remark', '备注 / 显示名'),
        this.select('type', '协议类型', ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2']),
        this.field('server', '服务器地址'),
        this.field('port', '端口'),
        this.field('uuid', 'UUID / 密码'),
        this.field('method', 'SS 加密方式'),
        this.select('security', '传输加密', ['none', 'tls', 'reality']),
        this.field('sni', 'SNI / serverName'),
        this.field('fp', 'uTLS 指纹'),
        this.field('pbk', 'Reality 公钥 (pbk)'),
        this.field('sid', 'Reality 短 ID (sid)'),
        this.select('network', '传输层', ['tcp', 'ws', 'grpc']),
        this.field('path', '路径 / serviceName'),
        this.field('host', 'WS Host'),
        this.field('flow', 'VLESS flow'),
        this.field('ports', '端口跳跃 (hysteria2, 如 20000-30000)'),
        this.select('insecure', '跳过证书校验 (hysteria2)', ['', '1'])
      ]),
      E('div', { 'class': 'sb-bar', 'style': 'margin-top:12px' }, [
        btn('保存并启用', 'primary', function () {
          var f = self.form || {};
          var n = f.name ? f.name.value.replace(/^\s+|\s+$/g, '') : '';
          if (!n) { note('标识不能为空', 'danger'); return; }
          // 端口直接拼进 config.json 的数字位，非数字会让整份配置非法
          var _pv = f.port ? f.port.value.replace(/^\s+|\s+$/g, '') : '';
          if (_pv && !/^[0-9]+$/.test(_pv)) { note('端口必须是纯数字（1-65535）', 'danger'); return; }
          if (_pv && (+_pv < 1 || +_pv > 65535)) { note('端口必须在 1-65535 之间', 'danger'); return; }
          var args = ['node-set', n];
          // insecure 单独处理：它是 0/1 开关，从 1 改回空时必须显式提交 0，
          // 否则"只提交非空值"的规则会让旧值 1 永远留在 uci 里
          ['remark', 'type', 'server', 'port', 'uuid', 'method', 'security', 'sni', 'fp', 'pbk', 'sid', 'network', 'path', 'host', 'flow', 'ports']
            .forEach(function (k) {
              if (f[k] && f[k].value !== '') args.push(k + '=' + f[k].value.replace(/^\s+|\s+$/g, ''));
            });
          args.push('insecure=' + (f.insecure && f.insecure.value === '1' ? '1' : '0'));
          args.push('enabled=1');
          return ctl(args).then(function (r) {
            if (r.code !== 0) { note('保存失败：' + (r.err || r.out), 'danger'); return null; }
            return ctl(['node-enable', n, '1']);
          }).then(function () { return ctl(['restart']); })
            .then(function () { note('已保存并启用'); self.refresh(); });
        }),
        btn('清空表单', '', function () {
          var f = self.form || {};
          Object.keys(f).forEach(function (k) { if (f[k]) f[k].value = ''; });
        })
      ])
    ]);

    /* 本页所有操作即时生效，LuCI 自动加的「保存/重置」页脚没有意义，隐藏掉 */
    requestAnimationFrame(function () {
      var a = document.querySelector('.cbi-page-actions');
      if (a) a.style.display = 'none';
    });

    return E('div', { 'class': 'sb' }, [hero, stats, bar, nodesCard, subCard, formCard]);
  },

  field: function (name, label) {
    if (!this.form) this.form = {};
    var el = E('input', { 'class': 'sb-in', 'type': 'text', 'placeholder': label });
    this.form[name] = el;
    return E('div', {}, [E('label', {}, label), el]);
  },

  select: function (name, label, opts) {
    if (!this.form) this.form = {};
    var el = E('select', { 'class': 'sb-sel' }, opts.map(function (o) {
      return E('option', { 'value': o }, o);
    }));
    this.form[name] = el;
    return E('div', {}, [E('label', {}, label), el]);
  },

  fillForm: function (n) {
    var f = this.form || {};
    ['name', 'remark', 'type', 'server', 'port', 'security', 'network', 'sni', 'fp', 'path', 'host', 'method', 'flow', 'ports', 'insecure', 'pbk', 'sid']
      .forEach(function (k) { if (f[k]) f[k].value = n[k] || ''; });
    var det = document.querySelector('.sb details');
    if (det) det.setAttribute('open', '');
    note('已填入「' + (n.remark || n.name) + '」的可回填字段；密钥类字段出于安全不回填。');
  },

  /* 原地刷新，不再整页 reload。
     原因有两个：
       1) 原来所有动作都是"改完 → location.reload()"，而提示条挂在 #maincontent 上，
          reload 会把刚弹出来的"已重启生效"直接冲掉 —— 用户看到的就是提示一闪就没；
       2) 整页重载还会丢滚动位置、丢通知，观感很差。
     做法：重新 load() 取数据 → render() 造新节点 → 就地替换旧的根节点（.sb）。
     找不到旧根节点（极端情况）才退回重载，绝不留白屏。 */
  refresh: function () {
    var self = this;
    var tries = 0;

    function paint(d) {
      var old = document.querySelector('#maincontent .sb, #maincontent .xl');
      var node = self.render(d);
      if (old && old.parentNode) {
        old.parentNode.replaceChild(node, old);
        return;
      }
      window.location.reload();
    }

    function loadAndPaint() {
      return self.load().then(function (d) {
        var st = null;
        try { st = JSON.parse((d[0] || {}).out || 'null'); } catch (e) { st = null; }
        /* 竞态：点完「应用配置 / 重启」时 procd 才刚开始拉进程，这一刻 status_json
           会返回 running=false —— 直接画出来就是"进程 stopped"，用户以为服务挂了（真实
           踩过）。这里最多重试 8 次（约 7 秒）再下结论；真挂了也会在 7 秒内确认。 */
        if (st && st.enabled === '1' && !st.running && tries < 8) {
          tries++;
          return new Promise(function (res) { setTimeout(res, 900); }).then(loadAndPaint);
        }
        paint(d);
      });
    }

    /* 刷新失败时不再整页重载：那会把刚弹出来的提示、滚动位置一起冲掉，
       用户看到的就是"点了没反应"。保留页面 + 红色提示 + 一个「重试」按钮更稳。 */
    return loadAndPaint().catch(function (e) {
      note([
        E('div', {}, '刷新失败：' + String((e && e.message) || e || '未知原因').slice(0, 80)),
        E('div', { 'class': 'sb-bar', 'style': 'margin-top:8px' }, [
          btn('重试刷新', 'sm primary', function () { return self.refresh(); })
        ])
      ], 'danger', 15000);
    });
  }
});
