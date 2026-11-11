# Dashboard Bos

Website ini tidak memakai login. Jalankan setelah `apps-script/Code.gs` dideploy ulang sebagai Web App.

## Menjalankan lokal

Buka folder `web-dashboard` di editor lalu jalankan dengan static web server, atau unggah tiga file di folder ini ke Firebase Hosting, Netlify, atau GitHub Pages.

## Keamanan

Dashboard memanggil endpoint Apps Script dengan API key yang sama dengan APK. Karena tidak ada login, jangan menyebarkan alamat website atau API key ke publik. Untuk dashboard yang benar-benar terbuka ke internet, gunakan login pada tahap berikutnya.
