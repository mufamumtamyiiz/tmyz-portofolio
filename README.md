# Portofolio Web — [Faris Edrik P / rissss21]

Selamat datang di portofolio web pribadi saya! 🌐  
Dibuat dengan React + Vite, ini adalah showcase dari project, skill, dan karya yang ingin saya bagikan.

##  Struktur Project

- `public/` — file statis (favicon, assets, dsb.)  
- `src/` — code utama React (komponen, utilitas, dsb.)  
- `index.html` — entry point halaman web  
- `package.json` & `package-lock.json` — manajemen dependencies dan script  
- `vite.config.js` — konfigurasi build dan dev server Vite  
- `eslint.config.js` — aturan linting agar kodenya tetap bersih dan konsisten  

##  Fitur Utama

- Dibangun dengan **React + Vite** — ringan, cepat reload, dan performa build optimal  
- **ESLint** telah terkonfigurasi agar coding style tetap rapi  
- Struktur modular dan siap dikembangkan—bisa ditambahkan halaman “About”, “Projects”, dsb.

##  Cara Jalankan

1. Clone repository ini:
```bash
git clone https://github.com/rissss21/portofolio.git
cd portofolio
````

2. Install dependencies:
```bash
npm install
````

3. Jalankan server lokal dengan hot reload:
```bash
npm run dev
````

4. Buat versi production:
```bash
npm run build
````

## &#x20;Quick Preview

Jika sudah di-deploy (contoh: GitHub Pages, Netlify, Vercel), kamu bisa tambahkan link deploy di sini, misalnya:
[🔗 Lihat versi live](https://username.github.io/portofolio/)

## Tentang Saya

Hai, saya Faris Edrik P (username GitHub: `rissss21`).
Saya seorang Developer yang suka bikin aplikasi web ringan dengan tampilan modern dan performa tinggi. Scroll aja di project saya, dan jangan sungkan untuk reach out kalau ada pertanyaan!

* **Email:** [email\_farisedrik21@gmail.com](mailto:email_farisedrik21@gmail.com)
* **LinkedIn:** [linkedin.com/in/farisedp](https://www.linkedin.com/in/farisedp/)
* **Instagram (opsional):** @farisedrikprayoga

---


[1]: https://github.com/rissss21/portofolio "GitHub - rissss21/portofolio"

**Environment Variables**

- **RESEND_API_KEY**: API key untuk layanan Resend agar backend dapat mengirim email notifikasi ketika ada pesan masuk. Jangan pernah memasukkan nilai ini ke repository publik.
- Cara aman: copy [`.env.example`](.env.example) ke `.env` dan isi `RESEND_API_KEY` di file `.env` (pastikan `.env` tercantum di `.gitignore`).

Contoh menjalankan server lokal sementara (PowerShell):
```powershell
$env:RESEND_API_KEY = "your_real_resend_api_key_here"
npm run dev
```

Contoh menguji endpoint approval email (POST JSON):
```bash
curl -X POST http://localhost:3001/api/send-approval-email \
	-H "Content-Type: application/json" \
	-d '{"name":"Nama","email":"email@example.com","message":"Halo!"}'
```

Catatan: Implementasi pengiriman sudah ada di file [server.js](server.js#L1-L200). Jika `RESEND_API_KEY` tidak diset, server akan menampilkan preview di log dan tidak mengirim email.
