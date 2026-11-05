(() => {
  const $ = (s) => document.querySelector(s);
  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>',
    ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    rupee: '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  };
  const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  document.querySelectorAll('[data-icon]').forEach((e) => (e.innerHTML = icon(e.dataset.icon)));

  const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => (Number.isInteger(n) ? inr0 : inr2).format(n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stk = (id) => String(id).padStart(3, '0');
  const badge = (id) => `<span class="badge"><i>STK</i>${stk(id)}</span>`;

  const state = { items: [], query: '', view: 'overview', loading: true, failed: false, editing: null, deleting: null };

  // ---- REST client ----
  async function api(url, opts = {}) {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error || 'Request failed.'), { fields: body.fields });
    return body;
  }

  // ---- Toasts ----
  function toast(msg, kind = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    t.innerHTML = `${icon(kind === 'error' ? 'alert' : 'ok')}<span>${esc(msg)}</span>`;
    $('#toasts').append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 3800);
  }

  // ---- Render ----
  function filtered() {
    const q = state.query.trim().toLowerCase();
    return q ? state.items.filter((i) => i.name.toLowerCase().includes(q) || stk(i.id).includes(q) || String(i.id) === q) : state.items;
  }

  function render() {
    const n = state.items.length;
    const total = state.items.reduce((s, i) => s + i.price, 0);
    $('#sumCount').textContent = n;
    $('#sumValue').textContent = money(total);
    $('#sumAvg').textContent = money(n ? total / n : 0);
    $('#navCount').textContent = n;

    const over = state.view === 'overview';
    $('#title').textContent = over ? 'Inventory Overview' : 'Items';
    $('#subtitle').textContent = over ? 'A live read of what you hold and what it is worth.' : 'Every item in your stockroom, ready to search and edit.';
    $('#cards').hidden = !over;
    document.querySelectorAll('.nav-link').forEach((b) => b.classList.toggle('is-active', b.dataset.view === state.view));

    const list = filtered();
    $('#resultMeta').textContent = state.loading || state.failed ? '' : state.query ? `${list.length} of ${n} items` : `${n} ${n === 1 ? 'item' : 'items'}`;
    const wrap = $('#tableWrap');

    if (state.loading) {
      wrap.innerHTML = `<table aria-busy="true"><tbody>${'<tr class="skel"><td><div class="bar" style="width:70px"></div></td><td><div class="bar" style="width:55%"></div></td><td><div class="bar" style="width:60px;margin-left:auto"></div></td><td></td></tr>'.repeat(3)}</tbody></table>`;
      return;
    }
    if (state.failed) {
      wrap.innerHTML = empty('alert', 'Could not load items', 'The server did not respond. Check that it is running, then try again.', '<button class="btn btn-primary" data-act="retry">Try again</button>');
      return;
    }
    if (!n) {
      wrap.innerHTML = empty('package', 'Your stockroom is empty', 'Add your first item to start tracking stock and its value.', '<button class="btn btn-primary" data-act="add">Add New Item</button>');
      return;
    }
    if (!list.length) {
      wrap.innerHTML = empty('search', `No items match “${esc(state.query.trim())}”`, 'Try a different name or an ID such as STK-001.', '<button class="btn btn-ghost" data-act="clear">Clear search</button>');
      return;
    }
    wrap.innerHTML = `<table><thead><tr><th>ID</th><th>Item</th><th class="r">Price</th><th class="r">Actions</th></tr></thead><tbody>${list.map((i) => `
      <tr data-id="${i.id}">
        <td class="c-id">${badge(i.id)}</td>
        <td class="c-name"><span class="item-name">${esc(i.name)}</span></td>
        <td class="c-price r"><span class="price">${money(i.price)}</span></td>
        <td class="c-act r"><span class="actions">
          <button class="act" data-act="edit" aria-label="Edit ${esc(i.name)}">${icon('pencil')}Edit</button>
          <button class="act del" data-act="delete" aria-label="Delete ${esc(i.name)}">${icon('trash')}Delete</button>
        </span></td>
      </tr>`).join('')}</tbody></table>`;
  }
  const empty = (ic, h, p, btn) => `<div class="empty"><span class="empty-ic">${icon(ic)}</span><h3>${h}</h3><p>${p}</p>${btn}</div>`;

  // ---- Load (READ) ----
  async function load() {
    state.loading = true; state.failed = false; render();
    try {
      const [items] = await Promise.all([api('/api/items'), new Promise((r) => setTimeout(r, 350))]);
      state.items = items;
    } catch { state.failed = true; toast('Could not reach the server.', 'error'); }
    state.loading = false; render();
  }

  // ---- Drawer (CREATE / UPDATE form) ----
  const drawer = $('#drawer'), form = $('#form');
  function preview() {
    const name = $('#fName').value.trim(), price = parseFloat($('#fPrice').value);
    $('#pvName').textContent = name || 'Item name';
    $('#pvPrice').textContent = money(Number.isFinite(price) && price >= 0 ? price : 0);
  }
  function setErr(field, msg) {
    $(field === 'name' ? '#eName' : '#ePrice').textContent = msg || '';
    $(field === 'name' ? '#fName' : '#fPrice').closest('.field').classList.toggle('bad', !!msg);
  }
  function openDrawer(item) {
    state.editing = item || null;
    form.reset(); setErr('name'); setErr('price');
    $('#drawerTitle').textContent = item ? 'Edit Item' : 'Add New Item';
    $('#saveBtn').textContent = item ? 'Save changes' : 'Add item';
    $('#pvId').innerHTML = `<i>STK</i>${item ? stk(item.id) : 'New'}`;
    if (item) { $('#fName').value = item.name; $('#fPrice').value = item.price; }
    preview();
    drawer.classList.add('on'); $('#drawerScrim').classList.add('on'); drawer.setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#fName').focus(), 200);
  }
  function closeDrawer() {
    drawer.classList.remove('on'); $('#drawerScrim').classList.remove('on'); drawer.setAttribute('aria-hidden', 'true');
  }
  form.addEventListener('input', preview);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#fName').value.trim(), raw = $('#fPrice').value.trim(), price = Number(raw);
    setErr('name', name ? '' : 'Enter an item name.');
    setErr('price', raw === '' || !Number.isFinite(price) ? 'Enter a price as a number.' : price < 0 ? 'Price cannot be negative.' : '');
    if (!name || raw === '' || !Number.isFinite(price) || price < 0) return;

    const btn = $('#saveBtn'), label = btn.textContent, editing = state.editing;
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      if (editing) {
        const saved = await api(`/api/items/${editing.id}`, { method: 'PUT', body: JSON.stringify({ name, price }) });
        state.items = state.items.map((i) => (i.id === saved.id ? saved : i));
        toast(`Saved changes to ${saved.name}.`);
      } else {
        const saved = await api('/api/items', { method: 'POST', body: JSON.stringify({ name, price }) });
        state.items.push(saved);
        toast(`Added ${saved.name} as STK-${stk(saved.id)}.`);
      }
      closeDrawer(); render();
    } catch (err) {
      if (err.fields) { setErr('name', err.fields.name); setErr('price', err.fields.price); }
      toast(err.message, 'error');
      if (/not found/i.test(err.message)) { closeDrawer(); load(); }
    } finally { btn.disabled = false; btn.textContent = label; }
  });

  // ---- Delete confirmation ----
  const modal = $('#modal');
  function askDelete(item) {
    state.deleting = item;
    $('#mTitle').textContent = `Delete ${item.name}?`;
    $('#mText').textContent = `STK-${stk(item.id)} (${money(item.price)}) will be removed from your inventory. This cannot be undone.`;
    modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false'); $('#mCancel').focus();
  }
  const closeModal = () => { modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true'); state.deleting = null; };
  $('#mCancel').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  $('#mConfirm').onclick = async () => {
    const item = state.deleting; if (!item) return;
    const btn = $('#mConfirm'); btn.disabled = true; btn.textContent = 'Deleting…';
    try {
      await api(`/api/items/${item.id}`, { method: 'DELETE' });
      state.items = state.items.filter((i) => i.id !== item.id);
      toast(`Deleted ${item.name}.`);
    } catch (err) {
      toast(err.message, 'error');
      if (/not found/i.test(err.message)) state.items = state.items.filter((i) => i.id !== item.id);
    } finally { btn.disabled = false; btn.textContent = 'Delete item'; closeModal(); render(); }
  };

  // ---- Events ----
  $('#addBtn').onclick = () => openDrawer();
  $('#drawerClose').onclick = $('#cancelBtn').onclick = $('#drawerScrim').onclick = closeDrawer;
  $('#search').addEventListener('input', (e) => { state.query = e.target.value; render(); });
  $('#tableWrap').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const row = b.closest('tr'), item = row && state.items.find((i) => i.id === Number(row.dataset.id));
    ({
      edit: () => openDrawer(item), delete: () => askDelete(item), add: () => openDrawer(),
      retry: load, clear: () => { state.query = ''; $('#search').value = ''; render(); },
    })[b.dataset.act]?.();
  });
  const side = $('#sidebar'), scrim = $('#scrim');
  const setNav = (on) => { side.classList.toggle('on', on); scrim.classList.toggle('on', on); };
  $('#menuBtn').onclick = () => setNav(true); scrim.onclick = () => setNav(false);
  document.querySelectorAll('.nav-link').forEach((b) => (b.onclick = () => { state.view = b.dataset.view; setNav(false); render(); }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('on')) closeModal(); else if (drawer.classList.contains('on')) closeDrawer(); else setNav(false);
  });

  load();
})();
