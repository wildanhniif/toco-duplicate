// controllers/wilayahController.js
const axios = require("axios");
const db = require("../config/database");

const API_KEY = process.env.BINDERBYTE_API_KEY;
const BASE_URL = "https://api.binderbyte.com/wilayah";

const callBinderByteAPI = async (endpoint, res) => {
  try {
    const url = `${BASE_URL}${endpoint}&api_key=${API_KEY}`;

    const response = await axios.get(url);

    if (response.data.code !== "200") {
      return res
        .status(400)
        .json({ status: "fail", message: response.data.message });
    }

    res.json(response.data);
  } catch (error) {
    console.error("BinderByte API error:", error.message);
    // Cek jika errornya adalah 404 dari Axios
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        status: "fail",
        message:
          "Data wilayah tidak ditemukan. Pastikan ID yang digunakan valid.",
      });
    }
    res
      .status(500)
      .json({ status: "error", message: "Gagal mengambil data wilayah" });
  }
};

// --- Fungsi lainnya (getProvinces, getCities, dll) tetap sama ---

// Mengambil daftar provinsi langsung dari Binderbyte (sederhana)
// Endpoint internal: GET /api/wilayah/provinces
exports.getProvinces = (req, res) => {
  callBinderByteAPI("/provinsi?", res);
};

exports.getCities = (req, res) => {
  const { id_provinsi } = req.query;
  if (!id_provinsi) {
    return res
      .status(400)
      .json({ status: "fail", message: "id_provinsi diperlukan" });
  }
  callBinderByteAPI(`/kabupaten?id_provinsi=${id_provinsi}`, res);
};

exports.getDistricts = (req, res) => {
  // Kecamatan
  const { id_kabupaten } = req.query;
  if (!id_kabupaten) {
    return res
      .status(400)
      .json({ status: "fail", message: "id_kabupaten diperlukan" });
  }
  callBinderByteAPI(`/kecamatan?id_kabupaten=${id_kabupaten}`, res);
};

exports.getSubDistricts = (req, res) => {
  // Kelurahan/Desa
  const { id_kecamatan } = req.query;
  if (!id_kecamatan) {
    return res
      .status(400)
      .json({ status: "fail", message: "id_kecamatan diperlukan" });
  }
  callBinderByteAPI(`/kelurahan?id_kecamatan=${id_kecamatan}`, res);
};

// Cache in-memory untuk seluruh data wilayah (provinsi, kabupaten, kecamatan, kelurahan)
let wilayahCache = null;

const ensureWilayahCache = async () => {
  if (wilayahCache) return wilayahCache;

  const endpoints = [
    { key: "provinces", path: "/provinsi?" },
    { key: "kabupaten", path: "/kabupaten?" },
    { key: "kecamatan", path: "/kecamatan?" },
    { key: "kelurahan", path: "/kelurahan?" },
  ];

  const result = {};

  for (const item of endpoints) {
    const url = `${BASE_URL}${item.path}&api_key=${API_KEY}`;
    const response = await axios.get(url);
    const body = response.data || {};

    const ok = body.result === true || body.code === "200";
    const value = Array.isArray(body.value)
      ? body.value
      : Array.isArray(body.data)
      ? body.data
      : [];

    if (!ok || !Array.isArray(value)) {
      throw new Error(body.message || "Gagal mengambil data wilayah");
    }

    result[item.key] = value;
  }

  wilayahCache = result;
  return wilayahCache;
};

// GET /api/wilayah/search?q=kiaracondong&limit=30
exports.searchWilayah = async (req, res) => {
  try {
    const { q, limit = 30 } = req.query;
    const keyword = (q || "").toString().trim().toLowerCase();

    if (!keyword) {
      return res.status(400).json({
        status: "fail",
        message: "Parameter q wajib diisi",
      });
    }

    const { provinces, kabupaten, kecamatan, kelurahan } =
      await ensureWilayahCache();

    const provMap = new Map(provinces.map((p) => [p.id, p]));
    const kabMap = new Map(kabupaten.map((k) => [k.id, k]));
    const kecMap = new Map(kecamatan.map((k) => [k.id, k]));

    const max = Number(limit) || 30;
    const results = [];

    for (const kel of kelurahan) {
      const kelName = (kel.name || "").toString();
      const kec = kecMap.get(kel.id_kecamatan);
      const kab = kec ? kabMap.get(kec.id_kabupaten) : null;
      const prov = kab ? provMap.get(kab.id_provinsi) : null;

      const textCombined = [
        kelName,
        (kec && kec.name) || "",
        (kab && kab.name) || "",
        (prov && prov.name) || "",
      ]
        .join(" ")
        .toLowerCase();

      if (!textCombined.includes(keyword)) continue;

      results.push({
        id_kelurahan: kel.id,
        kelurahan: kelName,
        id_kecamatan: kec ? kec.id : null,
        kecamatan: kec ? kec.name : null,
        id_kabupaten: kab ? kab.id : null,
        kabupaten: kab ? kab.name : null,
        id_provinsi: prov ? prov.id : null,
        provinsi: prov ? prov.name : null,
      });

      if (results.length >= max) break;
    }

    return res.json({
      status: "success",
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("BinderByte search error:", error.message);
    return res
      .status(500)
      .json({ status: "error", message: "Gagal mencari data wilayah" });
  }
};
