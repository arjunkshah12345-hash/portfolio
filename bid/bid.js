const els = {
  claimAmount: document.getElementById('claim-amount'),
  btnClaim: document.getElementById('btn-claim'),
  btnTakeover: document.getElementById('btn-takeover'),
  entries: document.getElementById('entries'),
  status: document.getElementById('status'),
  footnote: document.getElementById('footnote'),
  modal: document.getElementById('modal'),
  form: document.getElementById('form'),
  themeToggle: document.getElementById('theme-toggle'),
  fields: {
    url: document.getElementById('f-url'),
    title: document.getElementById('f-title'),
    desc: document.getElementById('f-desc'),
    email: document.getElementById('f-email'),
    bid: document.getElementById('f-bid'),
    rank: document.getElementById('f-rank'),
    takeover: document.getElementById('f-takeover'),
    floor: document.getElementById('floor-note')
  }
};

let latest = null;
let pollTimer = null;

bootstrapTheme();
wireUi();
poll();

function bootstrapTheme() {
  els.themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const dark = html.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  });
}

function wireUi() {
  els.btnClaim.addEventListener('click', () => openModal({ takeover: false }));
  els.btnTakeover.addEventListener('click', () => openModal({ takeover: true }));
  els.form.addEventListener('submit', onPay);
}

async function poll() {
  try {
    const data = await fetch('/api/bid/leaderboard', { cache: 'no-store' }).then(r => r.json());
    latest = data;
    render(data);
  } catch (e) {
    els.status.textContent = 'failed to load';
  } finally {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(poll, 4000);
  }
}

function render(data) {
  els.claimAmount.textContent = usd(data.claimRank1Cents);
  els.btnClaim.dataset.amount = data.claimRank1Cents;
  els.btnTakeover.dataset.amount = data.takeoverPriceCents;

  const isLive = data.storage && data.storage !== 'memory';
  els.status.textContent = isLive ? 'live' : 'demo mode';

  els.entries.innerHTML = '';
  for (const e of data.entries) {
    const li = document.createElement('li');
    li.className = 'entry';
    li.innerHTML = `
      <div class="rank">#${e.rank}</div>
      <div class="title">
        <a href="/api/bid/click/${e.id}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.title || e.url)}</a>
        <div class="desc">${escapeHtml(e.description || '')}</div>
      </div>
      <div class="amount">
        <div>${usd(e.bidCents)}</div>
        <div class="actions">
          <button class="btn" data-action="outbid" data-claim="${e.claimCents}" data-rank="${e.rank}">outbid →</button>
        </div>
      </div>
    `;
    li.querySelector('[data-action="outbid"]').addEventListener('click', () => openModal({
      takeover: false,
      claimCents: e.claimCents,
      rank: e.rank
    }));
    els.entries.appendChild(li);
  }
  els.footnote.textContent = `${data.entries.length} on the board`;
}

function openModal({ takeover, claimCents, rank } = {}) {
  const floor = takeover ? latest.takeoverPriceCents : Math.max(latest.minEnterCents, claimCents || latest.minEnterCents);
  els.fields.bid.value = Math.ceil(floor / 100);
  els.fields.rank.value = rank || '';
  els.fields.takeover.value = takeover ? '1' : '0';
  els.fields.floor.textContent = `minimum ${usd(floor)}`;
  els.modal.showModal();
}

async function onPay(ev) {
  ev.preventDefault();
  const f = els.fields;
  const body = {
    url: f.url.value.trim(),
    title: f.title.value.trim(),
    description: f.desc.value.trim(),
    email: f.email.value.trim(),
    bidCents: Math.round(Number(f.bid.value) * 100),
    targetRank: f.rank.value ? Number(f.rank.value) : null,
    takeover: f.takeover.value === '1'
  };
  const resp = await fetch('/api/bid/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json());
  if (resp && resp.url) {
    window.location.href = resp.url;
  }
}

function usd(cents) {
  return `$${(cents / 100).toFixed(2).replace(/\\.00$/, '')}`;
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (s) => map[s]);
}
