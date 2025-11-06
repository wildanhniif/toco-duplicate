const axios = require("axios");
const db = require("../config/database");

// Cache TTL sederhana (in-memory)
const cache = new Map(); // key -> { data, expiresAt }
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 menit

function buildCacheKey(params) {
  return JSON.stringify(params);
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Util komerce
function getApiConfig() {
  const apiKey = process.env.RAJAONGKIR_COST_API_KEY;
  const baseUrl =
    process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";
  if (!apiKey) throw new Error("RAJAONGKIR_API_KEY belum diset di environment");
  return { apiKey, baseUrl };
}

async function fetchGet(url, params, apiKey) {
  const headers = { key: apiKey };
  return axios.get(url, { headers, params });
}

async function fetchForm(url, body, apiKey) {
  const headers = {
    key: apiKey,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const form = new URLSearchParams();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  return axios.post(url, form, { headers });
}

async function loadAllowedServiceCodes(storeId) {
  // returns Map<courier_code, Set<service_code>>
  const map = new Map();
  if (!storeId) return map;
  const sql = `
    SELECT c.code AS courier_code, cs.code AS service_code
    FROM store_selected_services s
    JOIN courier_services cs ON cs.service_id = s.service_id
    JOIN couriers c ON c.courier_id = cs.courier_id
    WHERE s.store_id = ?
  `;
  const [rows] = await db.query(sql, [storeId]);
  rows.forEach((r) => {
    if (!map.has(r.courier_code)) map.set(r.courier_code, new Set());
    map.get(r.courier_code).add(r.service_code);
  });
  return map;
}

function filterResultsByStore(results, allowedMap) {
  if (!allowedMap || allowedMap.size === 0) return results;
  return results.filter((item) => {
    const set =
      allowedMap.get(item.code) || allowedMap.get(item.code?.toLowerCase());
    if (!set) return false;
    return (
      set.has(item.service) ||
      set.has(String(item.service).toUpperCase()) ||
      set.has(String(item.service).toLowerCase())
    );
  });
}

// GET /api/shipping/destination/province
exports.getProvinces = async (req, res) => {
  try {
    const { apiKey, baseUrl } = getApiConfig();
    const url = `${baseUrl}/destination/province`;
    const cacheKey = buildCacheKey({ url });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
    const { data } = await fetchGet(url, null, apiKey);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error(e);
    const msg = e.message || "Server Error";
    res.status(500).json({ message: msg });
  }
};

// GET /api/shipping/destination/city/:province_id
exports.getCitiesByProvince = async (req, res) => {
  try {
    const { province_id } = req.params;
    const { apiKey, baseUrl } = getApiConfig();
    const url = `${baseUrl}/destination/city/${province_id}`;
    const cacheKey = buildCacheKey({ url });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
    const { data } = await fetchGet(url, null, apiKey);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/shipping/destination/district/:city_id
exports.getDistrictsByCity = async (req, res) => {
  try {
    const { city_id } = req.params;
    const { apiKey, baseUrl } = getApiConfig();
    const url = `${baseUrl}/destination/district/${city_id}`;
    const cacheKey = buildCacheKey({ url });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
    const { data } = await fetchGet(url, null, apiKey);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/shipping/destination/sub-district/:district_id
exports.getSubDistrictsByDistrict = async (req, res) => {
  try {
    const { district_id } = req.params;
    const { apiKey, baseUrl } = getApiConfig();
    const url = `${baseUrl}/destination/sub-district/${district_id}`;
    const cacheKey = buildCacheKey({ url });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
    const { data } = await fetchGet(url, null, apiKey);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/shipping/destination/domestic-destination?search=...&limit=...&offset=...
exports.searchDomesticDestination = async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    if (!search) return res.status(400).json({ message: "search wajib diisi" });
    const { apiKey, baseUrl } = getApiConfig();
    const url = `${baseUrl}/destination/domestic-destination`;
    const cacheKey = buildCacheKey({ url, search, limit, offset });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
    const { data } = await fetchGet(url, { search, limit, offset }, apiKey);
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/shipping/calculate/domestic
// body: { origin, destination, weight, courier, price, store_id? }
exports.calculateDomesticCost = async (req, res) => {
  try {
    const { origin, destination, weight, courier, price, store_id } = req.body;
    if (!origin || !destination || !weight || !courier) {
      return res
        .status(400)
        .json({ message: "origin, destination, weight, courier wajib diisi" });
    }
    const { apiKey, baseUrl } = getApiConfig();
    const allowedMap = store_id
      ? await loadAllowedServiceCodes(store_id)
      : new Map();

    const cacheKey = buildCacheKey({
      origin,
      destination,
      weight: Number(weight),
      courier,
      price: price || null,
      baseUrl,
      store_id: store_id || null,
    });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ source: "cache", data: cached });

    const url = `${baseUrl}/calculate/domestic-cost`;
    const { data } = await fetchForm(
      url,
      { origin, destination, weight, courier, price },
      apiKey
    );
    let list = Array.isArray(data?.data)
      ? data.data.map((x) => ({
          name: x.name,
          code: x.code,
          service: x.service,
          description: x.description,
          cost: x.cost,
          etd: x.etd,
        }))
      : [];

    if (allowedMap && allowedMap.size) {
      list = filterResultsByStore(list, allowedMap);
    }

    setCache(cacheKey, list);
    res.json({ source: "live", data: list });
  } catch (e) {
    console.error(e);
    const status = e?.response?.status || 500;
    const message =
      e?.response?.data?.meta?.message || e.message || "Server Error";
    res.status(status).json({ message });
  }
};

// POST /api/shipping/calculate/international
exports.calculateInternationalCost = async (req, res) => {
  try {
    const { origin, destination, weight, courier, price } = req.body;
    if (!origin || !destination || !weight || !courier) {
      return res
        .status(400)
        .json({ message: "origin, destination, weight, courier wajib diisi" });
    }
    const { apiKey, baseUrl } = getApiConfig();
    const cacheKey = buildCacheKey({
      origin,
      destination,
      weight: Number(weight),
      courier,
      price: price || null,
      baseUrl,
      intl: true,
    });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ source: "cache", data: cached });
    const url = `${baseUrl}/calculate/international-cost`;
    const { data } = await fetchForm(
      url,
      { origin, destination, weight, courier, price },
      apiKey
    );
    const list = Array.isArray(data?.data)
      ? data.data.map((x) => ({
          name: x.name,
          code: x.code,
          service: x.service,
          description: x.description,
          currency: x.currency,
          cost: x.cost,
          etd: x.etd,
          currency_updated_at: x.currency_updated_at,
          currency_value: x.currency_value,
        }))
      : [];
    setCache(cacheKey, list);
    res.json({ source: "live", data: list });
  } catch (e) {
    console.error(e);
    const status = e?.response?.status || 500;
    const message =
      e?.response?.data?.meta?.message || e.message || "Server Error";
    res.status(status).json({ message });
  }
};

// POST /api/shipping/track/waybill
// body or query: { awb, courier, last_phone_number? }
exports.trackWaybill = async (req, res) => {
  try {
    const awb = req.body.awb || req.query.awb;
    const courier = req.body.courier || req.query.courier;
    const last_phone_number =
      req.body.last_phone_number || req.query.last_phone_number;
    if (!awb || !courier) {
      return res.status(400).json({ message: "awb dan courier wajib diisi" });
    }
    const { apiKey, baseUrl } = getApiConfig();
    const url = `${baseUrl}/track/waybill`;
    const params = { awb, courier };
    if (last_phone_number) params.last_phone_number = last_phone_number;
    const cacheKey = buildCacheKey({ url, ...params });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
    const headers = { key: apiKey };
    const { data } = await axios.post(url, null, { headers, params });
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) {
    console.error(e);
    const status = e?.response?.status || 500;
    const message =
      e?.response?.data?.meta?.message || e.message || "Server Error";
    res.status(status).json({ message });
  }
};

// Backward-compatible endpoint: kept for older clients (maps to domestic-cost)
exports.getRajaOngkIrRates = async (req, res) => {
  return exports.calculateDomesticCost({ body: req.query }, res);
};

exports.getRajaOngkirRates = async (req, res) => {
  return exports.calculateDomesticCost({ body: req.query }, res);
};
