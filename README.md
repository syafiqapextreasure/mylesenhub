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

Untuk menyediakan akses pemilik yang sudah mendaftar dan sedang menunggu pengesahan e-mel, jalankan `npm run admin:grant -- EMAIL_PEMILIK --after-verification`. Selepas pengesahan melalui Neon Auth, log masuk untuk membuka dashboard Admin. Kelulusan ini terikat kepada ID akaun dan alamat e-mel, dan digunakan sekali sahaja.

Instructor dan institut boleh menyimpan draf, menghantar maklumat serta melihat status semakan. Admin menyemak, mengesahkan dan menerbitkan versi awam. Permohonan perubahan disimpan berasingan daripada versi yang sedang dipaparkan. Gambar muat naik disimpan pada Neon dan hanya boleh dilihat oleh pemilik dan admin sehingga diterbitkan. Imej profil dan galeri terhad kepada JPG, PNG atau WebP sehingga 2 MB setiap satu.

Apabila pemohon baharu memilih **Hantar untuk semakan**, MyLesenHub menyimpan borang dan lampiran pada pelayar semasa pendaftaran akaun. Permohonan dihantar secara automatik selepas sesi log masuk disahkan. Admin boleh memilih **Terbitkan** sebaik sahaja **Sahkan** berjaya.

Laman `/cari-instructor?contoh=1` memaparkan contoh reka bentuk. Direktori biasa, sitemap dan carian awam menggunakan data yang diluluskan. E-mel dan nama penuh borang hanya tersedia mengikut peranan. Pertanyaan laman masuk ke peti mesej admin.

### Institut, lokasi dan résumé

Institut mendaftarkan nama rasmi, alamat dan pin lokasi. Pemohon boleh mencari alamat, mengesan lokasi dengan kebenaran pelayar, melaras pin pada peta, atau menampal koordinat daripada Google Maps. Peta pilihan menggunakan OpenStreetMap dan carian alamat menggunakan Photon. Pautan Google Maps penuh yang mengandungi koordinat boleh ditampal terus. Untuk pautan kongsi pendek, buka pautan itu di Google Maps dan salin koordinat pin.

Selepas admin menerbitkan institut, namanya tersedia dalam pilihan **Institut Memandu** untuk pendaftaran dan kemas kini profil instructor. Profil awam memaparkan alamat institut, pautan Google Maps dan muat turun résumé PDF yang mengandungi butiran profil awam.

### Panduan video

- [Daftar institut, tetapkan pin dan terbitkan selepas semakan admin](docs/panduan-pendaftaran/01-institut-dan-kelulusan.mp4)
- [Cari instructor, semak résumé dan peta, kemudian daftar dan terbitkan profil instructor](docs/panduan-pendaftaran/02-instructor-pdf-peta-penerbitan.mp4)
- [Panduan mengikut langkah dan masa](docs/panduan-pendaftaran/index.html)

## Semakan

Direktori prapelancaran mengandungi tujuh profil simulasi untuk semakan stakeholder. Tiga alamat institut merujuk [pengendali Berjaya](https://berjayabhd.my/hubungi-kami/) dan [senarai JPJ Melaka](https://www.jpj.gov.my/senarai-institut-memandu-melaka/). Untuk menyediakan data yang sama pada branch semakan berasingan, jalankan `node --env-file=.env.acceptance scripts/seed-prelaunch.js NAMA_BRANCH`. Skrip menambah rekod yang belum wujud. Setiap profil simulasi mempunyai label prapelancaran dan dikecualikan daripada sitemap. Sebelum pelancaran awam, admin boleh menarik balik profil simulasi daripada direktori.

Ekstrak ZIP dan buka `index.html` untuk memilih halaman dan saiz skrin.

- [Perbandingan prapelancaran bagi tujuh halaman direktori, pendaftaran dan semakan](docs/MyLesenHub-Perbandingan-Prapelancaran.zip)
- [Semua halaman dan gambar perbandingan sebelah menyebelah](docs/MyLesenHub-Perbandingan-Semua.zip)
- [Dashboard dengan lakaran dan tangkapan pelayar pada resolusi asal](docs/MyLesenHub-Perbandingan-Dashboard.zip)

Promosi dan program ditutup sementara. Pautan terdahulu memaparkan status HTTP 404. Tetapan `promotionsEnabled` dalam `src/features.js` mengawal paparan, borang dan penerbitannya. Rekod lama disimpan.

`npm run qa:preview` menyediakan pratonton visual dengan data contoh pada loopback port 4173. Ia hanya digunakan untuk semakan reka bentuk.

`scripts/acceptance.js` menguji login Neon, sesi, profil, muat naik, penerbitan, pertanyaan dan penarikan direktori. Gunakan branch ujian Neon yang namanya mengandungi `acceptance`, tarik konfigurasi ke `.env.acceptance`, jalankan Worker dengan `npx wrangler dev --env-file .env.acceptance --port 8788`, kemudian jalankan `node --env-file=.env.acceptance scripts/acceptance.js`. Ujian mencipta akaun dan rekod sintetik pada branch itu.
