const { sendVerificationEmail } = require('./utils/mailer');

// ========================================
// GANTI EMAIL INI DENGAN EMAIL ANDA
// ========================================
const testEmail = '190987oke4@gmail.com'; // <-- GANTI INI
const testToken = 'test-token-' + Date.now();

console.log('🚀 Mengirim test email...');
console.log('📧 Tujuan:', testEmail);
console.log('🔑 Token:', testToken);
console.log('⏳ Mohon tunggu...\n');

sendVerificationEmail(testEmail, testToken)
    .then(() => {
        console.log('✅ Email berhasil dikirim!');
        console.log('📬 Silakan cek inbox email Anda (dan folder spam jika tidak ada)');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Gagal mengirim email!');
        console.error('Error:', error.message);
        console.log('\n💡 Tips:');
        console.log('1. Pastikan .env sudah dikonfigurasi dengan benar');
        console.log('2. Pastikan App Password sudah di-generate dari Google');
        console.log('3. Pastikan tidak ada spasi di App Password');
        console.log('4. Baca file SETUP_EMAIL_VERIFIKASI.md untuk panduan lengkap');
        process.exit(1);
    });
