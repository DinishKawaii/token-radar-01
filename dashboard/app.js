// Token Radar dashboard: renders window.RADAR (written by main.ts into data.js).
// No network, no framework. Sorting, filtering and the detail view all run here;
// the farm plan is generated in the page from the row's own record, so the
// board.json plan and the page's plan always agree by construction.
const D = window.RADAR;
const $ = (s) => document.querySelector(s);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pct = (n) => (n === null || n === undefined ? '—' : (n > 0 ? '+' : '') + n.toFixed(1) + '%');
const ageText = (d) => (d === null || d === undefined ? '—' : d < 365 ? `${d}d` : `${(d / 365).toFixed(1)}y`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

$('#asof').textContent = `Snapshot ${D.as_of} · ${D.rows.length} ranked protocols`;
$('#src').textContent = D.source;

// Summary strip.
const topRow = D.rows[0];
const med = D.rows[Math.floor(D.rows.length / 2)];
$('#stats').innerHTML = [
  [D.watchlist_size, 'watchlist protocols'],
  [D.board_size, 'rows on the board'],
  [D.early_size, 'early rows below the floor'],
  [D.live_size, 'already trading, set aside'],
  [money(topRow.implied_value_usd), `top implied value — ${topRow.name}`],
].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
void med;

// Tabs.
const views = { board: '#view-board', method: '#view-method', live: '#view-live' };
function showView(name) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  for (const [k, sel] of Object.entries(views)) $(sel).hidden = k !== name;
  if (name !== 'board') $('#detail').hidden = true;
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

// Calibration table (method tab).
$('#cal').querySelector('tbody').innerHTML =
  D.calibration.by_category.map((r) => `<tr><td>${esc(r.category)}</td><td class="num">${r.n}</td><td class="num">${r.multiple.toFixed(3)}×</td></tr>`).join('') +
  `<tr><td>Fallback (category with too few live protocols)</td><td class="num">${D.calibration.fallback_n}</td><td class="num">${D.calibration.fallback_multiple.toFixed(3)}×</td></tr>`;

// Live tab.
$('#livetab').querySelector('tbody').innerHTML = D.live.map((p) => `<tr>
  <td>${esc(p.name)}</td><td>${esc(p.category ?? '—')}</td><td class="num">${money(p.tvl_usd)}</td>
  <td class="num">${p.mcap_usd === null ? '—' : money(p.mcap_usd)}</td>
  <td class="num ${p.change_7d > 0 ? 'up' : p.change_7d < 0 ? 'down' : ''}">${pct(p.change_7d)}</td></tr>`).join('');

/* ---- Farm plan, generated in the page from the row's own record ---- */
function capitalFor(tvl) {
  if (tvl >= 5_000_000_000) return 250;
  if (tvl >= 1_000_000_000) return 150;
  if (tvl >= 100_000_000) return 100;
  return 50;
}
function holdFor(age) {
  if (age === null || age === undefined) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}
function mainAction(r, cap, chain) {
  const c = (r.category || '').toLowerCase();
  const n = r.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${cap} of USDC to ${n} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Provide $${cap} of liquidity to ${n}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('yield')) return `Deposit $${cap} of USDC into ${n}'s highest-yield vault on ${chain} and keep the shares.`;
  if (c.includes('bridge')) return `Bridge $${cap} of USDC to ${chain} through ${n} and use the bridged funds in its app.`;
  if (c.includes('restak') || c.includes('staking')) return `Stake $${cap} of the chain's staking asset through ${n} and keep the receipt token.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${cap} of USDC as margin on ${n} and open one small hedged position.`;
  if (c.includes('prediction')) return `Fund $${cap} and place one market position on ${n}.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('capital')) return `Deposit $${cap} into a ${n} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${cap} of the stable asset through ${n} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${cap} of the yield-bearing asset on ${n} (${chain}) and hold it.`;
  if (c.includes('insurance')) return `Buy $${cap} of cover from ${n} on ${chain} and keep the policy active.`;
  if (c.includes('payment')) return `Move $${cap} through ${n} on ${chain} and keep a balance in its app.`;
  if (c.includes('chain')) return `Bridge $${cap} of USDC to ${n}'s chain and use one of its native apps.`;
  return `Deposit $${cap} of USDC into ${n} on ${chain} and keep the position open.`;
}
function secondAction(r, cap, chain) {
  const c = (r.category || '').toLowerCase();
  const n = r.name;
  const small = Math.round(cap / 5);
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Borrow $${small} against the deposit on ${n} and repay it within the same week.`;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Swap $${small} through ${n}'s main pool on ${chain} once a week.`;
  if (c.includes('yield')) return `Move $${small} between two ${n} vaults on ${chain} to show active use.`;
  if (c.includes('bridge')) return `Bridge $${small} back through ${n} once a week, alternating direction.`;
  if (c.includes('restak') || c.includes('staking')) return `Claim the staking rewards on ${n} once a week and restake them.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Close and reopen a small position on ${n} once a week to keep volume steady.`;
  if (c.includes('prediction')) return `Settle one more market position on ${n} each week with a small stake.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('capital')) return `Rebalance $${small} between two ${n} vaults on ${chain} once a month.`;
  if (c.includes('rwa')) return `Redeem a small part of the position on ${n} once a month and re-mint it.`;
  if (c.includes('insurance')) return `Renew or top up the cover on ${n} once a month.`;
  return `Do one more on-chain action on ${n} (${chain}) each week, such as a swap, a vote or a claim.`;
}
function farmSteps(r) {
  const chain = r.chains.length ? r.chains[0] : 'its main chain';
  const cap = capitalFor(r.tvl_usd);
  const hold = holdFor(r.age_days);
  const monthly = /curator|allocator|capital|rwa|insurance/i.test(r.category || '');
  const step3time = monthly ? '10 minutes a month' : '10 minutes a week';
  const steps = [
    ['Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', 'under $3 of gas for the first transaction', '5 minutes'],
    [mainAction(r, cap, chain), `$${cap} of capital and about $${cap >= 150 ? 8 : 4} of gas`, '15 minutes to set up'],
    [secondAction(r, cap, chain), `about $${Math.round(cap / 5)} of capital and $2 of gas`, step3time],
  ];
  if (r.chains.length > 1) {
    steps.push([`Repeat the same position on ${r.chains[1]} so the activity is visible on two chains, not one.`, `$${Math.round(cap / 2)} of capital and about $4 of gas`, '15 minutes']);
  }
  steps.push(
    [`Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`, `the $${cap} stays in the position`, `${hold} days`],
    [`Before you withdraw, open ${r.name}'s own points or rewards page and claim only from the link it publishes.`, 'no fee to check, and never pay to claim', '10 minutes'],
    ['Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', 'nothing but the log', '5 minutes'],
  );
  return steps.map(([t, c, tm]) => `${t} Cost: ${c}. Time: ${tm}.`);
}

/* ---- Board: filter, sort, detail ---- */
const watchSlugs = new Set(D.watchlist);
const earlySlugs = new Set(D.rows.filter((r) => !watchSlugs.has(r.slug)).map((r) => r.slug));

const cats = [...new Set(D.rows.map((r) => r.category || '—'))].sort();
$('#cat').innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option>${esc(c)}</option>`).join('');

let sortKey = 'rank';
let sortDir = 1;
const tbody = $('#board tbody');
let selected = null;

function filtered() {
  const q = $('#q').value.trim().toLowerCase();
  const cat = $('#cat').value;
  const watchOnly = $('#watch').checked;
  const earlyOnly = $('#early').checked;
  let rows = D.rows.filter((r) => {
    if (q && !(r.name.toLowerCase().includes(q) || r.slug.includes(q))) return false;
    if (cat && (r.category || '—') !== cat) return false;
    if (watchOnly && !watchSlugs.has(r.slug)) return false;
    if (earlyOnly && !earlySlugs.has(r.slug)) return false;
    return true;
  });
  const sortField = { rank: 'rank', tvl: 'tvl_usd', growth: 'change_7d', age: 'age_days' }[$('#sort').value] || 'rank';
  const dir = sortField === 'rank' ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    const av = a[sortField]; const bv = b[sortField];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });
  return rows;
}

function render() {
  const rows = filtered();
  $('#count').textContent = `${rows.length} of ${D.rows.length} rows`;
  tbody.innerHTML = rows.map((r) => `<tr data-slug="${r.slug}" class="${selected === r.slug ? 'sel' : ''}">
    <td class="num">${r.rank}</td>
    <td>${esc(r.name)} ${watchSlugs.has(r.slug) ? '<span class="badge">watchlist</span>' : ''}</td>
    <td>${esc(r.category || '—')}</td><td>${esc(r.chains.slice(0, 2).join(', ') || '—')}${r.chains.length > 2 ? ' +' + (r.chains.length - 2) : ''}</td>
    <td class="num">${money(r.tvl_usd)}</td>
    <td class="num ${r.change_7d > 0 ? 'up' : r.change_7d < 0 ? 'down' : ''}">${pct(r.change_7d)}</td>
    <td class="num">${ageText(r.age_days)}</td>
    <td class="num"><b>${money(r.implied_value_usd)}</b></td>
    <td class="num">${r.multiple.toFixed(3)}×</td></tr>`).join('');
}
tbody.addEventListener('click', (e) => {
  const tr = e.target.closest('tr[data-slug]');
  if (tr) openDetail(tr.dataset.slug);
});
document.querySelectorAll('#board thead th[data-k]').forEach((th) => th.addEventListener('click', () => {
  const k = th.dataset.k;
  if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
  $('#sort').value = k === 'rank' || k === 'tvl_usd' || k === 'change_7d' || k === 'age_days'
    ? (k === 'tvl_usd' ? 'tvl' : k === 'change_7d' ? 'growth' : k === 'age_days' ? 'age' : 'rank') : 'rank';
  render();
}));
['q', 'cat', 'watch', 'early', 'sort'].forEach((id) => document.getElementById(id).addEventListener('input', render));

/* ---- Detail panel ---- */
function openDetail(slug) {
  const r = D.rows.find((x) => x.slug === slug);
  if (!r) return;
  selected = slug;
  showView('board');
  const steps = farmSteps(r);
  const parts = [
    ['TVL', money(r.tvl_usd)],
    ['Category multiple', r.multiple.toFixed(3) + '×'],
    ['Growth ×', r.growth_multiplier.toFixed(3)],
    ['Maturity ×', r.maturity_multiplier.toFixed(3)],
    ['Chains ×', r.chain_multiplier.toFixed(3)],
    ['Implied value', money(r.implied_value_usd)],
  ];
  $('#detail').innerHTML = `<button class="close" type="button" id="dclose">Close ✕</button>
    <h2>${esc(r.name)}</h2>
    <p class="sub">#${r.rank} · ${esc(r.category || 'No category')} · ${esc(r.chains.join(', ') || '—')} ${watchSlugs.has(r.slug) ? '· <span class="badge">watchlist</span>' : ''}</p>
    <div class="kv">
      <div><b>${money(r.implied_value_usd)}</b><span>Implied value</span></div>
      <div><b>${money(r.tvl_usd)}</b><span>TVL</span></div>
      <div><b>${pct(r.change_7d)}</b><span>7-day TVL change</span></div>
      <div><b>${ageText(r.age_days)}</b><span>Age</span></div>
    </div>
    <div class="modelbox"><b>How the value is worked out</b>
      <div><span>TVL × ${r.multiple.toFixed(3)} (category multiple)</span><span>${money(r.tvl_usd * r.multiple)}</span></div>
      <div><span>× ${r.growth_multiplier.toFixed(3)} growth</span><span>${money(r.tvl_usd * r.multiple * r.growth_multiplier)}</span></div>
      <div><span>× ${r.maturity_multiplier.toFixed(3)} maturity</span><span>${money(r.tvl_usd * r.multiple * r.growth_multiplier * r.maturity_multiplier)}</span></div>
      <div><span>× ${r.chain_multiplier.toFixed(3)} chains</span><span><b>${money(r.implied_value_usd)}</b></span></div>
    </div>
    <h3>How to farm ${esc(r.name)}</h3>
    <ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;
  $('#detail').hidden = false;
  $('#dclose').addEventListener('click', () => { $('#detail').hidden = true; selected = null; render(); });
  render();
}

/* ---- Deep links: #/protocol/<slug> opens the detail; #/?cat=X&watch=1 filters ---- */
function applyHash() {
  const h = location.hash || '';
  const m = h.match(/#\/protocol\/([\w-]+)/);
  if (m) { openDetail(m[1]); return; }
  $('#detail').hidden = true;
  selected = null;
  const q = h.match(/#\/\?(.*)/);
  if (q) {
    const p = new URLSearchParams(q[1]);
    if (p.get('cat')) $('#cat').value = p.get('cat');
    if (p.get('q')) $('#q').value = p.get('q');
    if (p.get('watch')) $('#watch').checked = true;
    if (p.get('early')) $('#early').checked = true;
    if (p.get('sort')) $('#sort').value = p.get('sort');
  }
  render();
}
window.addEventListener('hashchange', applyHash);
render();
applyHash();
