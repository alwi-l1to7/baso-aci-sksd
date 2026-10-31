// ===== PENGATURAN TOKO =====
const WA = '6285155343916';      // nomor WA lu (awalan 62, tanpa +)
const AREA = 'Rancamanyar, Baleendah, Pameungpeuk, Dayeuhkolot';    // area anter lu
const ONGKIR = 2000;                // isi kalo mau ada ongkir
const STATUS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQh6vN40Rp2vD30iRTHnbShj9QD1xDrz3tJeEJQCkfMwcNty5AOAFOu2zZdxJiK_BpZmum3yIPpt1Cd/pub?gid=1669534477&single=true&output=csv';

const MENU = [
  { id: 'original', tipe: 'paket', nama: 'Original', harga: 10000, tag: 'Pemula',
    isi: ['Baso aci ×6', 'Baso tahu', 'Kekian', 'Cikur', 'Bawang goreng', 'Level pedes bebas'] },
  { id: 'kabita', tipe: 'paket', nama: 'Kabita', harga: 16000, tag: 'Best Seller', hot: true,
    isi: ['Semua isi Original', 'Cirawang', 'Ceker', 'Telur puyuh'] },
  { id: 'gamon', tipe: 'paket', nama: 'Gamon', harga: 22000, tag: 'Paling Lengkap',
    isi: ['Baso aci isi custom (ayam / sinti / gajih / keju)', 'Cirawang', 'Ceker', 'Cuanki lidah', 'Odeng', 'Baso tahu, kekian, cikur, bawang goreng'] },
  { id: 'seblak', tipe: 'paket', nama: 'SKSD Seblak Edition', harga: 21000, tag: 'Limited',
    isi: ['Semua isi Original', 'Makaroni', 'Dumpling keju / ayam', 'Ceker mercon', 'Kwetiau'] },
  { id: 't-ceker', tipe: 'topping', nama: 'Ceker pedas', harga: 3000 },
  { id: 't-puyuh', tipe: 'topping', nama: 'Telur puyuh 2 butir', harga: 2000 },
  { id: 't-cirawang', tipe: 'topping', nama: 'Cirawang', harga: 3000 },
];
// ========================

const rp = n => 'Rp' + n.toLocaleString('id-ID');

// ===== JAM OPERASIONAL DAPUR: 08:00 - 16:00 WIB =====
function getJadwalOperasional(dateObj) {
  const now = dateObj || new Date();
  const hourWIB = (now.getUTCHours() + 7) % 24;
  const isBuka = (hourWIB >= 8 && hourWIB < 16);
  return {
    isBuka,
    hourWIB,
    statusText: isBuka ? 'Dapur Buka (08:00 - 16:00 WIB)' : 'Dapur Tutup — Antar Besok Pagi',
    jadwalBadge: isBuka ? 'Langsung Diproses & Diantar Hari Ini' : 'Diproses & Diantar Besok Pagi (Mulai 08:00 WIB)',
    keterangan: isBuka
      ? 'Pesanan masuk pada jam operasional (08:00 - 16:00 WIB). Dapur segera memproses dan mengantar pesanan Anda hari ini.'
      : 'Pesanan masuk di luar jam operasional (lewat jam 16:00 WIB). Dapur akan memproses dan mengantar pesanan Anda besok pagi mulai jam 08:00 WIB.'
  };
}

const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('cart') || '{}'); } catch { return {}; } },
  set(c) { try { localStorage.setItem('cart', JSON.stringify(c)); } catch {} },
  count() { return Object.values(this.get()).reduce((a, b) => a + b, 0); },
  clear() { try { localStorage.removeItem('cart'); } catch {} },
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-area').forEach(e => e.textContent = AREA);
  document.querySelectorAll('.js-wa').forEach(a => {
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent('Halo Baso Aci SKSD, mau tanya seputar pemesanan dong!')}`;
    a.target = '_blank'; a.rel = 'noopener';
  });

  // Tampilkan badge status jam operasional secara dinamis
  const jadwal = getJadwalOperasional();
  document.querySelectorAll('.badge-live').forEach(b => {
    if (jadwal.isBuka) {
      b.className = 'badge-live';
      b.innerHTML = '<span class="dot-live"></span> Dapur Buka (08:00 - 16:00) · Antar Hari Ini';
    } else {
      b.className = 'badge-live badge-live--closed';
      b.innerHTML = '<span class="dot-closed"></span> Dapur Tutup · Antar Besok Pagi (08:00 WIB)';
    }
  });

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

// ===== RIWAYAT PESANAN (disimpan permanen di browser pelanggan) =====
const Orders = {
  all() { try { return JSON.parse(localStorage.getItem('orders') || '[]'); } catch { return []; } },
  save(l) { try { localStorage.setItem('orders', JSON.stringify(l)); } catch {} },
  add(o) { const l = this.all().filter(x => x.id !== o.id); l.unshift(o); this.save(l); },
  find(id) { return id ? this.all().find(x => x.id === id) : undefined; },
  getLast() { try { return localStorage.getItem('lastOrder') || ''; } catch { return ''; } },
  setLast(id) { try { id ? localStorage.setItem('lastOrder', id) : localStorage.removeItem('lastOrder'); } catch {} },
  clear() { try { localStorage.removeItem('orders'); localStorage.removeItem('lastOrder'); } catch {} },
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtTgl = iso => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  return tgl + ' pukul ' + jam + ' WIB';
};

const daftarItem = o => o.items.map(i => `• ${i.qty}x ${i.nama}`).join('\n');
const waUrl = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

// Format Pesan WhatsApp: Ramah, Sopan, dan Hanya Rincian Pokok
function pesanKonfirmasiLunas(o) {
  const itemLines = o.items.map(i => `• ${i.qty}x ${i.nama}`).join('\n');
  return `Halo Baso Aci SKSD, saya mau konfirmasi pesanan yang sudah dibayar via QRIS yaa!\n\n` +
    `• Nama Pemesan: ${o.nama}\n` +
    `• Tanggal Pesan: ${fmtTgl(o.waktu)}\n` +
    `• Alamat Kirim: ${o.alamat}\n` +
    (o.catatan ? `• Catatan: ${o.catatan}\n` : '') +
    `\nPesanan:\n${itemLines}\n` +
    `Total Bayar: ${rp(o.total)}\n\n` +
    `Bukti bayar QRIS sudah saya lampirkan di chat ini yaa. Mohon segera diproses, terima kasih banyak!`;
}

function pesanKonfirmasi(o) {
  return pesanKonfirmasiLunas(o);
}

function pesanBukti(o) {
  const itemLines = o.items.map(i => `• ${i.qty}x ${i.nama}`).join('\n');
  return `Halo Baso Aci SKSD, mau konfirmasi ulang pesanan saya yaa:\n\n` +
    `• Nama Pemesan: ${o.nama}\n` +
    `• No. Pesanan: ${o.id}\n` +
    `• Tanggal Pesan: ${fmtTgl(o.waktu)}\n` +
    `• Alamat Kirim: ${o.alamat}\n\n` +
    `Pesanan:\n${itemLines}\n` +
    `Total: ${rp(o.total)}\n\n` +
    `Mohon infonya ya min, terima kasih banyak!`;
}

function strukList(o) {
  const r = o.items.map(i => `<li><span>${i.qty}× ${esc(i.nama)}</span><b>${rp(i.qty * i.harga)}</b></li>`);
  if (o.ongkir) r.push(`<li><span>Ongkos kirim</span><b>${rp(o.ongkir)}</b></li>`);
  r.push(`<li><span>Kode unik</span><b>${rp(o.kode)}</b></li>`);
  r.push(`<li class="sum__total"><span>Total dibayar</span><b>${rp(o.total)}</b></li>`);
  return r.join('');
}

const metaHtml = o => `<div class="meta">
  <div><b>Nama</b> ${esc(o.nama)}</div>
  ${o.telepon ? `<div><b>No. WA</b> ${esc(o.telepon)}</div>` : ''}
  ${o.jadwalAntar ? `<div><b>Jadwal</b> ${esc(o.jadwalAntar)}</div>` : ''}
  <div><b>Alamat</b> ${esc(o.alamat)}</div>
  <div><b>Catatan</b> ${esc(o.catatan || '-')}</div></div>`;

// Tombol "Riwayat" otomatis muncul di navigasi semua halaman
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav nav');
  if (!nav || location.pathname.endsWith('riwayat.html') || nav.querySelector('[href="riwayat.html"]')) return;
  const a = document.createElement('a');
  a.href = 'riwayat.html'; a.className = 'btn btn--sm btn--ghost'; a.textContent = 'Riwayat';
  nav.appendChild(a);
});
