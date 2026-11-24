# MyLesenHub

Direktori komuniti instructor dan institut memandu di Johor dan Melaka. Aplikasi ini menggunakan Cloudflare Workers untuk halaman HTML dan API, Neon Postgres untuk direktori dan borang, serta Neon Auth untuk login. Aset dan fon dihoskan bersama Worker.

## Pembangunan tempatan

Gunakan Node.js 24 dan jalankan `npm ci`. Pautkan projek Neon milik anda menggunakan `neon init`, kemudian jalankan `neon deploy` untuk mendapatkan `DATABASE_URL` dan `NEON_AUTH_BASE_URL` dalam `.env.local`. Salin nilai penuh dari tetapan rahsia Neon jika menggunakan kaedah manual. Fail persekitaran dilindungi oleh `.gitignore`.

Untuk projek MyLesenHub yang dipersetujui, arahan pautan ialah `neon init -y --org-id org-floral-night-05793904 --project-id soft-snow-17137240 --branch production --services postgres,auth`. Gunakan semula pautan sedia ada jika folder ini sudah dipautkan.

Jalankan `npm run db:migrate`, kemudian `npm run dev`. Migrasi menambah jadual di schema `mylesenhub`. Untuk ujian binaan Worker, gunakan `npm run build`.

## Pasang pada Cloudflare Workers

1. Dalam **Workers & Pages**, sambungkan repo GitHub ini kepada Worker bernama **mylesenhub**. Pilih branch `main` dan direktori akar repo.
2. Tetapkan arahan build kepada `npm run build` dan arahan deploy kepada `npm run deploy`. Wrangler membungkus ES module dan direktori `public/` mengikut `wrangler.jsonc`.
3. Dalam **Worker Settings → Variables and Secrets**, tetapkan `DATABASE_URL` dan `NEON_AUTH_BASE_URL` untuk runtime. Tandakan connection string sebagai secret. Melalui terminal anda juga boleh menggunakan `npx wrangler secret put DATABASE_URL` dan `npx wrangler secret put NEON_AUTH_BASE_URL`. Masukkan nilai pada prompt peribadi.
4. Dalam konsol **Neon → Better Auth → Domains**, daftarkan origin HTTPS sebenar Worker atau custom domain supaya proses login dan reset kata laluan kembali ke domain yang betul. Semak tetapan verifikasi e-mel dan penghantaran SMTP untuk domain produksi.
5. Daftarkan akaun pemilik menggunakan borang daftar, sahkan identiti pemilik, kemudian jalankan `npm run admin:grant -- EMAIL_PEMILIK` dari komputer yang mempunyai secret database. Skrip hanya mengangkat akaun sedia ada dengan padanan e-mel tepat yang telah disahkan pada Neon Auth. Akses seterusnya boleh diurus melalui dashboard Admin.

## Aliran kandungan

Instructor dan institut boleh menyimpan draf, menghantar maklumat serta melihat status semakan. Admin menyemak, mengesahkan dan menerbitkan versi awam. Permohonan perubahan disimpan berasingan daripada versi yang sedang dipaparkan. Gambar muat naik disimpan pada Neon dan hanya boleh dilihat oleh pemilik dan admin sehingga diterbitkan. Imej profil dan galeri terhad kepada JPG, PNG atau WebP sehingga 2 MB setiap satu.

Laman `/cari-instructor?contoh=1` memaparkan contoh reka bentuk. Direktori biasa, sitemap dan carian awam menggunakan data yang diluluskan. E-mel dan nama penuh borang hanya tersedia mengikut peranan. Pertanyaan laman masuk ke peti mesej admin.

## Semakan

`npm run qa:preview` menyediakan pratonton visual dengan data contoh pada loopback port 4173. Ia hanya digunakan untuk semakan reka bentuk.

`scripts/acceptance.js` menguji login Neon, sesi, profil, muat naik, penerbitan, pertanyaan dan penarikan direktori. Gunakan branch ujian Neon yang namanya mengandungi `acceptance`, tarik konfigurasi ke `.env.acceptance`, jalankan Worker dengan `npx wrangler dev --env-file .env.acceptance --port 8788`, kemudian jalankan `node --env-file=.env.acceptance scripts/acceptance.js`. Ujian mencipta akaun dan rekod sintetik pada branch itu.
