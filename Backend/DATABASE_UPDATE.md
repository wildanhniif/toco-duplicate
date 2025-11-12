# Database Update Instructions

## 🔄 Update Database Schema

Tabel `payments` dan `payment_notifications` belum ada di database Anda. Lakukan import ulang:

```bash
# Drop dan recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS toco_clone;"

# Import schema yang sudah lengkap
mysql -u root -p < toco_clone_optimized.sql
```

## ✅ Setelah Import

Jalankan test lagi:
```bash
npm run test-db
```

Harusnya semua tabel ✅ termasuk:
- ✅ payments
- ✅ payment_notifications

## 📊 Schema yang Sudah Lengkap

Total tabel: 27 tabel
- Core: users, stores, categories
- Products: products, product_images, variants, skus
- Cart: carts, cart_items, cart_vouchers, cart_shipping
- Orders: orders, order_items, order_status_logs, order_shipping
- Payments: payments, payment_notifications
- Vouchers: vouchers, voucher_products, voucher_usages
- Settings: store_settings, courier_settings, templates
- Location: addresses, wilayah
- Shipping: courier services, calculations

## 🚀 Backend Ready

Setelah database di-update, backend 100% production-ready!
