# Setup RajaOngkir (Starter / Free for Developer)

## Environment Variables

Tambah ke `.env` backend:

```
RAJAONGKIR_API_KEY=YOUR_STARTER_API_KEY
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com/starter
```

## Endpoint

- GET `/api/shipping/rates`
- Auth: Bearer token

### Query Params

- `origin` (number): city_id asal
- `destination` (number): city_id tujuan
- `weight` (number): berat (gram)
- `courier` (string): `jne`, `tiki`, `pos`, `sicepat`, `jnt`, `anteraja`, dll (tergantung plan)

### Contoh Request

```
GET http://localhost:5000/api/shipping/rates?origin=501&destination=114&weight=1700&courier=jne
Authorization: Bearer <TOKEN>
```

### Contoh Response

```json
{
  "source": "live",
  "results": [
    {
      "courier": "jne",
      "name": "Jalur Nugraha Ekakurir (JNE)",
      "costs": [
        {
          "service": "REG",
          "description": "Layanan Reguler",
          "cost": 20000,
          "etd": "2-3"
        },
        {
          "service": "YES",
          "description": "Yakin Esok Sampai",
          "cost": 40000,
          "etd": "1-1"
        }
      ]
    }
  ]
}
```

## Catatan

- Hasil di-cache 5 menit untuk menurunkan latency & limit API.
- Untuk integrasi ke checkout: hit endpoint ini saat user memilih kurir/layanan, lalu simpan pilihan ke `cart_shipping_selections` seperti sebelumnya.
- Origin city_id dapat berasal dari pengaturan toko (store address). Jika belum ada di schema, terima input origin dari UI dahulu.
