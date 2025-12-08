# 🎟️ Voucher/Promosi System - Complete Guide

## 📋 Overview

Sistem voucher promosi lengkap untuk seller dashboard dengan fitur create, read, update, delete, duplicate, filter, sort, dan search.

---

## ✅ Backend Complete (DONE)

### 1. Database Schema Created

**File:** `Backend/migrations/create_vouchers_table.sql`

**Tables:**

- `vouchers` - Main voucher table
- `voucher_products` - Product associations (for specific products)
- `voucher_usage` - Usage tracking log

**Run in phpMyAdmin:**

```sql
USE toco_clone;
-- Copy-paste content from create_vouchers_table.sql
```

### 2. API Endpoints

**Base URL:** `http://localhost:5000/api/vouchers`

#### Get All Vouchers (with filters)

```http
GET /api/vouchers?status=active&search=diskon&sort=newest&page=1&limit=20
```

**Query Parameters:**

- `status`: all, upcoming, active, ended
- `search`: search by title
- `period`: today, yesterday, last7days, last30days, thismonth, custom
- `start_date` & `end_date`: for custom period
- `sort`: newest, oldest, quota_desc, quota_asc, a_z, z_a
- `type`: discount, free_shipping
- `target`: public, private
- `page` & `limit`: pagination

#### Get Voucher Stats

```http
GET /api/vouchers/stats
```

#### Get Single Voucher

```http
GET /api/vouchers/:id
```

#### Create Voucher

```http
POST /api/vouchers
```

**Body:**

```json
{
  "voucher_type": "discount",
  "target_type": "public",
  "voucher_code": "DISC20",
  "title": "Diskon 20%",
  "description": "Diskon 20% untuk semua produk",
  "start_date": "2024-01-01T00:00:00",
  "end_date": "2024-01-31T23:59:59",
  "quota": 100,
  "limit_per_user": 1,
  "apply_to": "all_products",
  "product_ids": [],
  "discount_type": "percentage",
  "discount_value": 20,
  "max_discount": 50000,
  "min_transaction": 100000
}
```

#### Update Voucher

```http
PUT /api/vouchers/:id
```

#### Duplicate Voucher

```http
POST /api/vouchers/:id/duplicate
```

#### End Voucher

```http
PUT /api/vouchers/:id/end
```

#### Delete Voucher

```http
DELETE /api/vouchers/:id
```

---

## 🎨 Frontend Structure (TO BE CREATED)

### Pages & Components

```
Frontend/src/
├── views/seller/vouchers/
│   ├── index.tsx                 # Main voucher list page
│   ├── add.tsx                   # Add voucher page
│   ├── edit/[id].tsx            # Edit voucher page
│   └── components/
│       ├── VoucherCard.tsx      # Voucher list item
│       ├── VoucherFilters.tsx   # Filter sidebar
│       ├── VoucherStats.tsx     # Stats cards
│       └── VoucherForm/
│           ├── index.tsx         # Main form component
│           ├── InformasiVoucher.tsx
│           ├── InformasiProgram.tsx
│           ├── DetailPromo.tsx
│           └── ProductSelector.tsx
└── components/ui/
    ├── date-range-picker.tsx    # Date range selector
    ├── multi-select.tsx         # Multi-select dropdown
    └── badge.tsx                # Status badges
```

---

## 📊 Page Structure

### 1. Voucher List Page (`/seller/vouchers`)

**Header:**

- Title: "Voucher Promosi"
- Button: "Tambah Voucher" (primary button)

**Tabs Navigation:**

- Semua Voucher
- Mendatang
- Berlangsung
- Berakhir

**Filters & Actions:**

- Search bar: "Cari promo"
- Period filter dropdown:
  - Per hari
  - Per minggu
  - Per bulan
  - Custom tanggal (with date range picker)
    - Hari ini
    - Kemarin
    - 7 hari terakhir
    - 30 hari terakhir
    - Bulan ini
    - Reset / Simpan buttons
- Sort dropdown:
  - Terbaru
  - Terlama
  - Kuota terbanyak
  - Kuota tersedikit
  - A-Z
  - Z-A
- Filter multi-select:
  - Gratis ongkir
  - Potongan harga
  - Diskon
  - Publik
  - Khusus

**Voucher List:**
Each voucher card shows:

- Judul voucher
- Tipe (badge)
- Nominal diskon
- Kuota (used/total)
- Periode promo
- Status (badge)
- Actions (three dots menu):
  - Duplicate voucher
  - Akhiri voucher

---

### 2. Add/Edit Voucher Form

#### Section 1: Informasi Voucher

**Tipe Voucher** (Radio buttons)

- ○ Voucher Diskon
- ○ Gratis Ongkir

**Target Voucher** (Radio buttons)

- ○ Publik
  - Info: "Promo dapat langsung digunakan semua pengguna yang bertransaksi di toco"
- ○ Khusus
  - Info: "Promo hanya dapat digunakan pembeli yang menerima kode khusus dari kupon yang kamu buat."
  - If selected: Show "Kode Voucher" input field

**Judul Promosi** (Text input)

- Label: "Judul Promosi"
- Placeholder: "Nama promosi akan menjadi judul utama yang dilihat oleh pembeli"
- Required

**Deskripsi Promosi** (Textarea)

- Label: "Deskripsi Promosi"
- Placeholder: "Jelaskan detail promosi..."
- Optional

---

#### Section 2: Informasi Program

**Periode Promosi**

- Periode Dimulai: Date + Time picker
- Periode Berakhir: Date + Time picker

**Kuota Promosi** (Number input)

- Label: "Kuota Promosi"
- Placeholder: "Contoh: 100"
- Required

**Limit per Pembeli** (Radio + Conditional input)

- ○ Tanpa Batas
- ○ Limit Voucher
  - If selected: Number input "Limit per pembeli"

**Target Pengguna** (Select/Disabled)

- Default: "Semua Pengguna"
- Note: "Fitur targeting khusus segera hadir"

**Penerapan Voucher** (Radio + Product selector)

- ○ Semua Product
- ○ Product Tertentu
  - If selected: Show product multi-selector
  - Selected products appear as chips below

---

#### Section 3: Detail Promo

**Nominal Diskon** (Radio + Conditional fields)

**If Presentase selected:**

- Input: Masukan presentase (%)
  - Placeholder: "Contoh: 20"
- Maksimum Diskon (Rp)
  - Placeholder: "Contoh: 50000"
- Minimum Transaksi (Rp)
  - Placeholder: "Contoh: 100000"
- **Estimasi Pengeluaran** (Read-only, calculated)
  - Formula: `quota × max_discount`

**If Potongan selected:**

- Input: Masukan nominal (Rp)
  - Placeholder: "Contoh: 10000"
- Minimum Transaksi (Rp)
  - Placeholder: "Contoh: 50000"
- **Estimasi Pengeluaran** (Read-only, calculated)
  - Formula: `quota × nominal`

---

**Form Actions:**

- Button: "Batalkan" (secondary)
- Button: "Simpan" (primary)

---

## 🎨 UI Components Needed

### 1. Date Range Picker

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  presets={[
    { label: "Hari ini", value: "today" },
    { label: "Kemarin", value: "yesterday" },
    { label: "7 hari terakhir", value: "last7days" },
    { label: "30 hari terakhir", value: "last30days" },
    { label: "Bulan ini", value: "thismonth" },
  ]}
/>
```

### 2. Multi-Select Filter

```tsx
<MultiSelect
  options={[
    { label: "Gratis Ongkir", value: "free_shipping" },
    { label: "Potongan Harga", value: "fixed" },
    { label: "Diskon", value: "percentage" },
    { label: "Publik", value: "public" },
    { label: "Khusus", value: "private" },
  ]}
  value={filters}
  onChange={setFilters}
/>
```

### 3. Product Selector

```tsx
<ProductSelector
  storeId={storeId}
  value={selectedProducts}
  onChange={setSelectedProducts}
  multiple
/>
```

### 4. Status Badge

```tsx
<Badge variant={status}>
  {status === "upcoming" && "Mendatang"}
  {status === "active" && "Berlangsung"}
  {status === "ended" && "Berakhir"}
</Badge>
```

---

## 🔄 State Management

### Voucher List Page State

```typescript
const [vouchers, setVouchers] = useState([]);
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState({
  status: "all",
  search: "",
  period: null,
  dateRange: null,
  sort: "newest",
  type: [],
  target: [],
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
});
```

### Voucher Form State

```typescript
const [formData, setFormData] = useState({
  voucher_type: "discount",
  target_type: "public",
  voucher_code: "",
  title: "",
  description: "",
  start_date: null,
  end_date: null,
  quota: 0,
  limit_per_user: null,
  apply_to: "all_products",
  product_ids: [],
  discount_type: "percentage",
  discount_value: 0,
  max_discount: null,
  min_transaction: 0,
});
const [estimatedCost, setEstimatedCost] = useState(0);
```

---

## 📝 Form Validation Rules

### Required Fields:

- title
- start_date
- end_date
- quota
- discount_value

### Conditional Required:

- `voucher_code`: Required if `target_type === 'private'`
- `max_discount`: Required if `discount_type === 'percentage'`
- `product_ids`: Required if `apply_to === 'specific_products'`

### Validation Rules:

- `end_date > start_date`
- `quota > 0`
- `discount_value > 0`
- `min_transaction >= 0`
- If percentage: `discount_value <= 100`

---

## 🚀 Implementation Steps

### Step 1: Database Setup

```bash
# Run in phpMyAdmin
USE toco_clone;
# Execute: Backend/migrations/create_vouchers_table.sql
```

### Step 2: Test Backend API

```bash
# Start backend
cd Backend
npm run dev

# Test with Postman/Thunder Client
GET http://localhost:5000/api/vouchers
```

### Step 3: Create Frontend Components

1. Create basic voucher list page
2. Add filters and search
3. Create voucher form
4. Add validation
5. Connect to API

### Step 4: Test Complete Flow

1. Create voucher
2. List vouchers with filters
3. Edit voucher
4. Duplicate voucher
5. End voucher
6. Delete voucher

---

## 📦 Required npm Packages (Frontend)

```bash
npm install date-fns react-day-picker
npm install @radix-ui/react-select
npm install @radix-ui/react-tabs
npm install react-hook-form zod @hookform/resolvers
```

---

## 🎯 Features Checklist

### Backend ✅

- [x] Database schema
- [x] CRUD API endpoints
- [x] Filtering & sorting
- [x] Duplicate voucher
- [x] End voucher
- [x] Voucher stats

### Frontend (To Do)

- [ ] Voucher list page
- [ ] Filters & search
- [ ] Period selector
- [ ] Sort dropdown
- [ ] Multi-select filters
- [ ] Add voucher form
- [ ] Edit voucher form
- [ ] Product selector
- [ ] Form validation
- [ ] Estimated cost calculator
- [ ] Voucher card component
- [ ] Actions menu (duplicate/end)
- [ ] Status badges
- [ ] Loading states
- [ ] Error handling

---

## 📸 Sample API Responses

### Get Vouchers

```json
{
  "success": true,
  "data": [
    {
      "voucher_id": 1,
      "title": "Diskon 20% All Products",
      "voucher_type": "discount",
      "target_type": "public",
      "discount_type": "percentage",
      "discount_value": 20.0,
      "quota": 100,
      "quota_used": 25,
      "remaining_quota": 75,
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "status": "active",
      "current_status": "active",
      "product_count": 0,
      "usage_count": 25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

**Status:** Backend Complete ✅ | Frontend In Progress ⏳

**Next:** Creating frontend pages and components...
