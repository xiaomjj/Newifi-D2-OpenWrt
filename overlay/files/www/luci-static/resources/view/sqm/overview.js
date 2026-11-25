'use strict';
'require view';
'require fs';
'require ui';

/* SQM 独立页面：服务 → SQM 限速
   为什么单独一页：SQM 的数值是「设备侧实测 / 手填」的，跟节点管理没有关系；
   挤在 sing-box 面板里既难找又把那页撑长。这里只做四件事：
   看状态、启停、一键校准、手动设置上下行。 */

var CTL = '/usr/libexec/singbox-ctl';

var CSS = [
  '.sq{--c-bg:#fff;--c-soft:#f7f8fa;--c-line:#e6e8ec;--c-txt:#111827;--c-dim:#6b7280;',
  '--c-acc:#2563eb;--c-acc2:#1d4ed8;--c-acc-soft:rgba(37,99,235,.09);--c-ok:#15803d;--c-ok-soft:rgba(21,128,61,.10);',
  '--c-bad:#b91c1c;--c-bad-soft:rgba(185,28,28,.08);--c-warn:#b45309;--r:14px;--sh:0 1px 2px rgba(16,24,40,.04);',
  'color:var(--c-txt);font-size:14px;max-width:1040px;margin:0 auto;line-height:1.5}',

  '@media(prefers-color-scheme:dark){.sq{color-scheme:dark;--c-bg:#161a20;--c-soft:#1c2128;--c-line:#2b313a;',
  '--c-txt:#e8eaed;--c-dim:#98a1ad;--c-acc:#6ea8fe;--c-acc2:#8ab4f8;--c-acc-soft:rgba(110,168,254,.13);',
  '--c-ok:#4ade80;--c-ok-soft:rgba(74,222,128,.12);--c-bad:#f87171;--c-bad-soft:rgba(248,113,113,.10);',
  '--sh:none}}',

  '.sq *{box-sizing:border-box}',

  /* ---------- hero ---------- */
  '.sq-hero{background:var(--c-bg);border:1px solid var(--c-line);border-radius:var(--r);',
  'padding:18px 20px 16px;margin-bottom:14px;position:relative;overflow:hidden;box-shadow:var(--sh)}',
  '.sq-hero:before{content:"";position:absolute;inset:0 0 auto 0;height:3px;',
  'background:linear-gradient(90deg,#2563eb,#22d3ee,#a855f7)}',
  '.sq-title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
  '.sq-title h2{margin:0;font-size:21px;font-weight:700;letter-spacing:-.015em}',
  '.sq-title .lead{color:var(--c-dim);font-size:12.5px;margin-left:2px}',

  '.sq-badge{font-size:12px;font-weight:650;border-radius:999px;padding:2px 10px;border:1px solid;',
  'display:inline-flex;align-items:center;gap:6px;white-space:nowrap}',
  '.sq-badge:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}',
  '.sq-badge.on{color:var(--c-ok);border-color:rgba(21,128,61,.35);background:var(--c-ok-soft)}',
  '.sq-badge.off{color:var(--c-dim);border-color:var(--c-line);background:var(--c-soft)}',
  '.sq-badge.on:before{box-shadow:0 0 0 3px var(--c-ok-soft)}',

  '.sq-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}',
  '.sq-stat{border:1px solid var(--c-line);border-radius:12px;padding:12px 14px;background:var(--c-soft)}',
  '.sq-stat .k{font-size:11.5px;color:var(--c-dim);letter-spacing:.02em;text-transform:uppercase;font-weight:600}',
  '.sq-stat .v{display:flex;align-items:baseline;gap:6px;margin-top:4px}',
  '.sq-stat .n{font-size:29px;font-weight:750;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1.1}',
  '.sq-stat .u{font-size:12px;color:var(--c-dim);font-weight:600}',
  '.sq-stat .s{font-size:11.5px;color:var(--c-dim);margin-top:3px}',
  '.sq-stat.off .n{color:var(--c-dim);font-weight:650}',

  '.sq-meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px;padding-top:12px;',
  'border-top:1px solid var(--c-line);font-size:12px;color:var(--c-dim)}',
  '.sq-meta b{color:var(--c-txt);font-weight:650}',
  '.sq-meta .dot{opacity:.45}',

  /* ---------- cards ---------- */
  '.sq-card{background:var(--c-bg);border:1px solid var(--c-line);border-radius:var(--r);',
  'padding:16px 18px;margin-bottom:14px;box-shadow:var(--sh)}',
  '.sq-card h3{margin:0 0 10px;font-size:14.5px;font-weight:650;display:flex;align-items:center;gap:8px}',
  '.sq-card h3:before{content:"";width:3px;height:13px;border-radius:2px;background:var(--c-acc)}',
  '.sq-hint{color:var(--c-dim);font-size:12.5px;line-height:1.72}',
  '.sq-hint b{color:var(--c-txt);font-weight:650}',
  '.sq-hint+.sq-hint{margin-top:8px}',

  /* ---------- buttons ---------- */
  '.sq-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
  '.sq-bar .gap{flex:1 1 0;min-width:0}',
  '.sq-btn{appearance:none;border:1px solid var(--c-line);background:var(--c-bg);color:var(--c-txt);',
  'border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;',
  'transition:background .15s ease,border-color .15s ease,color .15s ease,transform .08s ease}',
  '.sq-btn:active{transform:translateY(1px)}',
  '.sq-btn:hover{border-color:rgba(37,99,235,.45);color:var(--c-acc);background:var(--c-acc-soft)}',
  '.sq-btn.primary{background:var(--c-acc);border-color:var(--c-acc);color:#fff}',
  '.sq-btn.primary:hover{background:var(--c-acc2);border-color:var(--c-acc2);color:#fff}',
  '.sq-btn.danger{color:var(--c-bad);border-color:rgba(185,28,28,.28)}',
  '.sq-btn.danger:hover{background:var(--c-bad-soft);border-color:rgba(185,28,28,.45);color:var(--c-bad)}',
  '.sq-btn.ghost{border-color:transparent;color:var(--c-dim);font-weight:550}',
  '.sq-btn.ghost:hover{border-color:var(--c-line);color:var(--c-txt);background:var(--c-soft)}',

  /* ---------- inputs ---------- */
  '.sq-field{display:flex;align-items:center;gap:8px}',
  '.sq-field span{font-size:12.5px;color:var(--c-dim);white-space:nowrap}',
  '.sq-in{appearance:none;border:1px solid var(--c-line);background:var(--c-bg);color:var(--c-txt);',
  'border-radius:10px;padding:8px 11px;font-size:13.5px;width:104px;font-variant-numeric:tabular-nums;',
  'font-weight:600;transition:border-color .15s ease,box-shadow .15s ease}',
  '.sq-in:focus{outline:none;border-color:var(--c-acc);box-shadow:0 0 0 3px var(--c-acc-soft)}',
  /* 高级参数只读行：与上面的输入区用虚线分开，视觉上明确「这不是给你改的」 */
  '.sq-ro{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:11px;',
  'border-top:1px dashed var(--c-line);color:var(--c-dim);font-size:11.5px;line-height:1.6}',
  '.sq-ro b{color:var(--c-txt);font-weight:650}',
  /* 注意优先级：.sq-ro b 是 (0,1,1)，单写 .sq-warn 只有 (0,1,0) 会被压回去 */
  '.sq-ro b.sq-warn,.sq-warn{color:var(--c-warn);font-weight:650}',
  '.sq-btn.mini{margin-left:auto;padding:4px 10px;font-size:11.5px;font-weight:600;border-radius:8px}',

  /* ---------- tips ---------- */
  '.sq-tips{margin:0;padding-left:18px;color:var(--c-dim);font-size:12.5px;line-height:1.85}',
  '.sq-tips li+li{margin-top:2px}',
  '.sq-tips b{color:var(--c-txt);font-weight:650}',

  '@media(max-width:520px){',
  '.sq-stats{grid-template-columns:1fr}',
  '.sq-stat .n{font-size:25px}',
  '.sq-hero{padding:16px}',
  '.sq-card{padding:14px}}'
].join('\n');

function injectCss() {
  if (document.getElementById('sqm-css')) return;
  document.head.appendChild(E('style', { 'id': 'sqm-css' }, CSS));
}

function ctl(args) {
  return fs.exec(CTL, args || []).then(function (r) {
    return { code: r.code || 0, out: r.stdout || '', err: r.stderr || '' };
  }).catch(function (e) { return { code: -1, out: '', err: String(e) }; });
}

function parseOut(r) { try { return JSON.parse((r && r.out) || '{}') || {}; } catch (e) { return {}; } }

function note(m, k, ms) {
  var d = ms || ((k === 'danger') ? 12000 : 6000);
  return ui.addTimeLimitedNotification(null, E('p', {}, m), d, k || 'info');
}

function btn(label, cls, fn) {
  return E('button', { 'class': 'sq-btn ' + (cls || ''), 'click': ui.createHandlerFn(this, fn) }, label);
}

/* 整形值（kbit）→ 实测/标称 Mbit：整形 = 实测 × 0.88，所以实测 = 整形 / 880 */
function mbit(kbit) { return (Number(kbit || 0) / 1000).toFixed(1); }
function realMbit(kbit) { return Math.round(Number(kbit || 0) / 880) || ''; }

function stat(label, val, sub, unit, dim) {
  return E('div', { 'class': 'sq-stat' + (dim ? ' off' : '') }, [
    E('div', { 'class': 'k' }, label),
    E('div', { 'class': 'v' }, [
      E('span', { 'class': 'n' }, val),
      E('span', { 'class': 'u' }, unit)
    ]),
    E('div', { 'class': 's' }, sub)
  ]);
}

return view.extend({
  /* 只取 SQM 自己的字段（~100ms）。原来复用 sing-box 的 status 要 550ms —— 打开慢一倍。
     顺带把这页和 sing-box 的内部字段解耦：那边改什么都不会影响这里。 */
  load: function () { return ctl(['sqm-status']); },

  render: function (data) {
    injectCss();
    var self = this;
    /* load() 只返回一个对象时 LuCI 不会包成数组（和 sing-box 面板不一样），
       所以两种形状都要兼容：data[0] 存在就用它，否则直接用 data。 */
    var d0 = (data && data[0] !== undefined) ? data[0] : data;
    var st = parseOut(d0 || {});
    var on = (st.sqm_on === '1');
    /* 以 tc 里运行中的 cake 为准（eff），读不到才退回 uci 配置值 —— 
       否则会出现「配置写了 overhead 34、实际 raw 忽略」，页面在骗人。 */
    var effD = Number(st.sqm_eff_down || 0), effU = Number(st.sqm_eff_up || 0);
    var live = (effD > 0 || effU > 0);
    var dKbit = effD > 0 ? effD : Number(st.sqm_down || 0);
    var uKbit = effU > 0 ? effU : Number(st.sqm_up || 0);
    var down = mbit(dKbit), up = mbit(uKbit);
    var rDown = realMbit(dKbit), rUp = realMbit(uKbit);
    var cfgLl = (st.sqm_ll || 'ethernet'), cfgOv = String(st.sqm_ov || 0);
    var roLl = (live && st.sqm_eff_ll) ? st.sqm_eff_ll : cfgLl;
    var roOv = live ? String(st.sqm_eff_ov || 0) : cfgOv;
    var mismatch = live && (roLl !== cfgLl || roOv !== cfgOv);
    var ecnIn = (st.sqm_ecn_in === 'ECN'), ecnOut = (st.sqm_ecn_out === 'ECN');
    var ecnTxt = (ecnIn && ecnOut) ? '开' : (ecnIn ? '下行开 / 上行关' : '关');
    var tunedAt = Number(st.sqm_tuned || 0);
    var tunedTxt = tunedAt > 0 ? new Date(tunedAt * 1000).toLocaleString() : '尚未校准';
    /* 校准值只在「链路能力变了」之后才需要重测；超过 30 天就温和提醒一次 */
    var ageDays = tunedAt > 0 ? Math.floor((Date.now() / 1000 - tunedAt) / 86400) : 0;
    if (ageDays < 0) ageDays = 0;

    var root = E('div', { 'class': 'sq' }, [
      /* ---------- hero：状态 + 两个大数字 ---------- */
      E('div', { 'class': 'sq-hero' }, [
        E('div', { 'class': 'sq-title' }, [
          E('h2', {}, 'SQM 智能限速'),
          E('span', { 'class': 'sq-badge ' + (on ? 'on' : 'off') }, on ? '运行中' : '已停止'),
          E('span', { 'class': 'lead' }, 'cake 整形 · WAN 5G 中继')
        ]),

        E('div', { 'class': 'sq-stats' }, [
          stat('下行整形', on && down !== '0.0' ? down : '—',
            on && rDown ? ('实测 ' + rDown + ' Mbit → ×88%') : '未生效',
            'Mbit/s', !on || down === '0.0'),
          stat('上行整形', on && up !== '0.0' ? up : '—',
            on && rUp ? ('实测 ' + rUp + ' Mbit → ×88%') : '未生效',
            'Mbit/s', !on || up === '0.0')
        ]),

        E('div', { 'class': 'sq-meta' }, [
          E('span', {}, ['接口 ', E('b', {}, st.sqm_if || '未设置'),
            ((st.sqm_if || '').indexOf('sta') >= 0 ? '（STA 中继）' : '')]),
          E('span', { 'class': 'dot' }, '·'),
          E('span', {}, (function () {
            /* 注意：LuCI 的 E() 只吃一层数组，嵌套数组会被 stringify 成
               "[object HTMLElement]" —— 所以这里用 push 拼平，别写成 [[...]] */
            var k = ['上次校准 ', E('b', {}, tunedTxt)];
            if (ageDays >= 30) {
              k.push(' ', E('b', { 'class': 'sq-warn' },
                '（' + ageDays + ' 天前，建议重新校准）'));
            }
            return k;
          })()),
          E('span', { 'class': 'dot' }, '·'),
          /* 这里只说算法名。链路层/开销/ECN 统一放到「手动设置」下面那行只读小字里
             （那行读 tc 的生效值）—— 同一个东西在两个地方用不同数据源，必然自相矛盾。 */
          E('span', { 'title': '整形算法：cake + piece_of_cake.qos（上行与下行同一套）' },
            ['算法 ', E('b', {}, 'cake')])
        ])
      ]),

      /* ---------- 这是什么 ---------- */
      E('div', { 'class': 'sq-card' }, [
        E('h3', {}, '它是干什么的'),
        E('div', { 'class': 'sq-hint' },
          'SQM 用 cake 算法给这条 WAN 做整形：把下行 / 上行都压在「线路能力 × 88%」，' +
          '让数据包在路由器里排队，而不是堆在运营商或无线链路里 —— ' +
          '满载时延迟能从几百毫秒压到几十毫秒（bufferbloat）。'),
        E('div', { 'class': 'sq-hint' },
          '为什么要 ×88%：整形器必须略低于真实线路速率才会产生排队余量，设满等于没设。' +
          '所以下面填的、这里显示的都是「实测 / 标称速率」，乘以 0.88 由设备内部完成。')
      ]),

      /* ---------- 操作 ---------- */
      E('div', { 'class': 'sq-card' }, [
        E('h3', {}, '操作'),
        E('div', { 'class': 'sq-bar' }, [
          on
            ? btn('■ 停止 SQM', 'danger', function () { return act(['sqm-enable', '0'], '已停止 SQM'); })
            : btn('▶ 启动 SQM', 'primary', function () { return act(['sqm-enable', '1'], '已启动 SQM'); }),
          btn('⟳ 校准（实测下行）', '', function () {
            var upV = window.prompt('校准 SQM\n\n下行会当场实测（约 20 秒，期间整形短暂关闭）。\n' +
              '上行请填宽带上行的实测值（Mbit，不是整形值）：',
              rUp ? String(rUp) : '');
            if (upV === null) return;
            upV = String(upV).replace(/[^0-9]/g, '');
            if (!upV || Number(upV) < 1) { note('上行请填 ≥1 的整数（Mbit）', 'danger'); return; }
            return tuneRun(upV);
          }),
          E('span', { 'class': 'gap' }),
          btn('↻ 刷新', 'ghost', function () { return repaint(); })
        ]),
        E('div', { 'class': 'sq-hint', 'style': 'margin-top:10px' },
          '「校准」会用国内镜像实测下行（10 秒 × 2 轮取较小值）；' +
          '上行因为国内没有可用的上传测速点，只能手填。')
      ]),

      /* ---------- 手动设置 ---------- */
      (function () {
        function field(label, val) {
          var inp = E('input', {
            'class': 'sq-in', 'type': 'number', 'min': '1', 'max': '10000', 'step': '1',
            'value': val ? String(val) : '', 'placeholder': 'Mbit'
          });
          return { inp: inp, el: E('div', { 'class': 'sq-field' }, [E('span', {}, label), inp]) };
        }
        var dF = field('下行', rDown), uF = field('上行', rUp);
        return E('div', { 'class': 'sq-card' }, [
          E('h3', {}, '手动设置'),
          E('div', { 'class': 'sq-bar' }, [
            dF.el, uF.el,
            btn('应用', 'primary', function () {
              var d = String(dF.inp.value || '').replace(/[^0-9]/g, '');
              var u = String(uF.inp.value || '').replace(/[^0-9]/g, '');
              if (!d || !u) { note('上下行都要填（整数 Mbit）', 'danger'); return; }
              if (Number(d) < 1 || Number(u) < 1) { note('数值必须 ≥ 1 Mbit', 'danger'); return; }
              return act(['sqm-set', d, u]);
            })
          ]),
          E('div', { 'class': 'sq-hint', 'style': 'margin-top:10px' },
            '填宽带的实测 / 标称速率：300M 宽带就填 300，不需要自己乘 0.88。' +
            '拿不准就先点上面的「校准」。'),
          /* 高级整形参数：只读展示 + 一键恢复默认。不给输入框 —— 改错了只会表现为
             「网速莫名变慢」，用户很难联想到是 overhead，排查成本远高于省一次 SSH。 */
          E('div', { 'class': 'sq-ro' }, (function () {
            var kids = [
              live ? '生效 ' : '配置 ',
              '链路层 ', E('b', {}, roLl),
              ' · 开销 ', E('b', {}, roOv),
              ' · ECN ', E('b', {}, ecnTxt)
            ];
            if (mismatch) {
              kids.push(' · ', E('b', { 'class': 'sq-warn' }, '配置不一致'),
                '（uci: ' + cfgLl + ' / ' + cfgOv + '）');
            }
            return [
              E('span', {
                'title': 'ingress_ecn=' + (st.sqm_ecn_in || '?') +
                  '  egress_ecn=' + (st.sqm_ecn_out || '?') +
                  ' ｜ 这里的数值读自 tc 里运行中的 cake，不是 uci 配置。' +
                  ' ｜ 出现「配置不一致」通常是改完没重启 SQM，或参数组合被忽略' +
                  '（例如链路层 none 走 raw，cake 会直接无视 overhead）。'
              }, kids),
              btn('恢复默认', 'mini', function () {
                return act(['sqm-defaults'], '高级参数已恢复默认：ethernet / 开销 0；带宽未改动');
              })
            ];
          })()),
        ]);
      })(),

      /* ---------- 小贴士 ---------- */
      E('div', { 'class': 'sq-card' }, [
        E('h3', {}, '小贴士'),
        E('ul', { 'class': 'sq-tips' }, [
          E('li', {}, ['觉得', E('b', {}, '网速慢'), '：先看上面的整形值（≈ 实测 × 0.88）；' +
            '明显低于宽带就点「校准」重测。']),
          E('li', {}, ['觉得', E('b', {}, '满载延迟还是高'), '：把下行手工调低 10%（80 → 72），cake 排队会更从容。']),
          E('li', {}, ['换了宽带 / 挪了路由器', '：重新校准一次，链路能力变了。']),
          E('li', {}, '数值不写进固件、只存设备本地；刷机勾「保留设置」就会一起带过去。'),
          E('li', {}, ['彻底不要整形', '：点「停止 SQM」即可，随时可以再启动。'])
        ])
      ])
    ]);

    /* ---- 动作 + 原地刷新（不整页 reload，避免丢滚动位置） ---- */

    function swap(stObj) {
      var nv = self.render([{ out: JSON.stringify(stObj) }]);
      var old = document.querySelector('#maincontent .sq');
      if (old && old.parentNode) old.parentNode.replaceChild(nv, old);
      else window.location.reload();
    }

    function repaint() {
      return ctl(['sqm-status']).then(function (r) { swap(parseOut(r)); });
    }

    function stopNote(pn) { if (pn && pn.parentNode) pn.parentNode.removeChild(pn); }

    /* 校准走后台任务：点击 → 立刻返回 → 每 2 秒问一次状态文件。
       原来是一个 22 秒的同步 RPC，会被 rpcd/uhttpd 挂住（既不 resolve 也不 reject），
       而且中途数值会变好几次（整形值先写、tuned_at 后写），前端抓中间态必踩坑。 */
    function tuneRun(upV) {
      var pn = note('正在校准…（实测约 22 秒，请稍候）', 'info', 45000);
      var polls = 0;
      return ctl(['sqm-tune-start', String(upV)]).then(function (r0) {
        var o0 = (r0.out || '').trim();
        if (o0.indexOf('started') !== 0) {
          stopNote(pn);
          note('启动校准失败：' + (o0 || r0.err || '未知原因').slice(0, 100), 'danger', 12000);
          return;
        }
        var timer = window.setInterval(function () {
          if (++polls > 40) {                     /* 80 秒还没结果就收口 */
            window.clearInterval(timer);
            stopNote(pn);
            note('校准超时，请点「刷新」确认一下', 'danger', 12000);
            return;
          }
          ctl(['sqm-tune-state']).then(function (r) {
            var t = (r.out || '').trim();
            if (!t || t === 'none' || t.indexOf('running') === 0) return;
            window.clearInterval(timer);
            stopNote(pn);
            if (t.indexOf('done') === 0) {
              var a = t.split(/\s+/);
              note('校准完成：实测 ' + a[1] + ' Mbit → 整形 ' + Math.round(a[1] * 0.88) +
                ' Mbit（上行 ' + a[2] + ' → ' + Math.round(a[2] * 0.88) + ' Mbit）', 'info', 12000);
            } else if (t.indexOf('failed') === 0) {
              note('校准失败：' + t.slice(6).trim(), 'danger', 14000);
            } else {
              note('校准状态未知：' + t.slice(0, 80), 'danger', 12000);
            }
            /* 状态文件是「全部提交完」才写的，此刻取状态必然是最终态 */
            return repaint();
          });
        }, 2000);
      });
    }

    function act(args, okMsg) {
      var pn = note('正在应用…', 'info', 30000);
      return ctl(args).then(function (r) {
        stopNote(pn);
        var o = (r.out || '').replace(/\s+$/, '');
        var mm = o.match(/TUNED down=(\d+)Mbit up=(\d+)Mbit/);
        var sm = o.match(/SET down=(\d+)Mbit up=(\d+)Mbit/);
        var bad = /MEASURE_FAILED|只接受|至少|过大|用法/.test(o);
        if (mm) {
          note('校准完成：实测 ' + mm[1] + ' / ' + mm[2] + ' Mbit → 整形 ' +
            Math.round(mm[1] * 0.88) + ' / ' + Math.round(mm[2] * 0.88) + ' Mbit', 'info', 12000);
        } else if (sm) {
          note('已应用：' + sm[1] + ' / ' + sm[2] + ' Mbit → 整形 ' +
            Math.round(sm[1] * 0.88) + ' / ' + Math.round(sm[2] * 0.88) + ' Mbit', 'info', 10000);
        } else if (bad) {
          note('操作失败：' + o.slice(0, 120), 'danger', 14000);
        } else if (/^enabled=/.test(o) || /^DEFAULTS/.test(o)) {
          note(okMsg || '已生效', 'info', 8000);
        } else {
          note('操作失败：' + (o || r.err || '未知原因').slice(0, 120), 'danger', 14000);
        }
        return repaint();
      });
    }

    return root;
  },

  handleSaveApply: null,
  handleSave: null,
  handleReset: null
});
