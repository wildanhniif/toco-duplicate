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

// Mock shipping rates fallback when RajaOngkir API fails
function getMockShippingRates(courier, weight = 1000) {
  const weightKg = Math.ceil(Number(weight) / 1000) || 1;

  const mockRates = {
    jne: [
      {
        name: "JNE",
        code: "jne",
        service: "REG",
        description: "JNE Regular",
        cost: 15000 * weightKg,
        etd: "2-3 hari",
      },
      {
        name: "JNE",
        code: "jne",
        service: "YES",
        description: "JNE Yes",
        cost: 25000 * weightKg,
        etd: "1 hari",
      },
      {
        name: "JNE",
        code: "jne",
        service: "OKE",
        description: "JNE Oke",
        cost: 12000 * weightKg,
        etd: "3-4 hari",
      },
    ],
    jnt: [
      {
        name: "J&T Express",
        code: "jnt",
        service: "EZ",
        description: "J&T Regular",
        cost: 12000 * weightKg,
        etd: "2-3 hari",
      },
      {
        name: "J&T Express",
        code: "jnt",
        service: "JSD",
        description: "J&T Same Day",
        cost: 30000 * weightKg,
        etd: "1 hari",
      },
    ],
    sicepat: [
      {
        name: "SiCepat",
        code: "sicepat",
        service: "REG",
        description: "SiCepat Regular",
        cost: 13000 * weightKg,
        etd: "2-3 hari",
      },
      {
        name: "SiCepat",
        code: "sicepat",
        service: "BEST",
        description: "SiCepat Best",
        cost: 18000 * weightKg,
        etd: "1-2 hari",
      },
    ],
    anteraja: [
      {
        name: "AnterAja",
        code: "anteraja",
        service: "REG",
        description: "AnterAja Regular",
        cost: 14000 * weightKg,
        etd: "2-3 hari",
      },
      {
        name: "AnterAja",
        code: "anteraja",
        service: "SD",
        description: "AnterAja Same Day",
        cost: 28000 * weightKg,
        etd: "1 hari",
      },
    ],
    pos: [
      {
        name: "POS Indonesia",
        code: "pos",
        service: "REG",
        description: "Pos Regular",
        cost: 10000 * weightKg,
        etd: "3-5 hari",
      },
      {
        name: "POS Indonesia",
        code: "pos",
        service: "EXPRESS",
        description: "Pos Express",
        cost: 20000 * weightKg,
        etd: "1-2 hari",
      },
    ],
  };

  return mockRates[courier] || [];
}

// Util komerce
function getApiConfig() {
  const apiKey = process.env.RAJAONGKIR_COST_API_KEY;
  const baseUrl =
    process.env.RAJAONGKIR_COST_BASE_URL ||
    "https://rajaongkir.komerce.id/api/v1";
  const deliveryApiKey = process.env.RAJAONGKIR_DELIVERY_API_KEY || apiKey;
  if (!apiKey)
    throw new Error("RAJAONGKIR_COST_API_KEY belum diset di environment");
  return { apiKey, baseUrl, deliveryApiKey };
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
  // returns Map<courier_code, Set<service_code>> berdasarkan konfigurasi
  // store_courier_services + courier_service_types + courier_services
  const map = new Map();
  if (!storeId) return map;

  const sql = `
    SELECT cs.code AS courier_code, cst.code AS service_code
    FROM store_courier_services scs
    JOIN courier_service_types cst ON cst.id = scs.courier_service_type_id
    JOIN courier_services cs ON cs.id = cst.courier_service_id
    WHERE scs.store_id = ?
      AND scs.is_active = 1
      AND cst.is_active = 1
      AND cs.is_active = 1
  `;

  let [rows] = await db.query(sql, [storeId]);

  // If store has no configured services, fallback to all available services
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT cs.code AS courier_code, cst.code AS service_code
      FROM courier_service_types cst
      JOIN courier_services cs ON cs.id = cst.courier_service_id
      WHERE cst.is_active = 1
        AND cs.is_active = 1
    `;
    [rows] = await db.query(fallbackSql);
  }

  rows.forEach((r) => {
    // Normalize courier code to lowercase
    const courierCode = String(r.courier_code || "").toLowerCase();
    if (!map.has(courierCode)) map.set(courierCode, new Set());
    // Add service codes in multiple cases for matching
    const serviceCode = String(r.service_code || "");
    map.get(courierCode).add(serviceCode);
    map.get(courierCode).add(serviceCode.toUpperCase());
    map.get(courierCode).add(serviceCode.toLowerCase());
  });
  return map;
}

function filterResultsByStore(results, allowedMap) {
  if (!allowedMap || allowedMap.size === 0) return results;
  return results.filter((item) => {
    // Try both original and lowercase courier codes
    const courierCode = String(item.code || "").toLowerCase();
    const set =
      allowedMap.get(courierCode) ||
      allowedMap.get(item.code) ||
      allowedMap.get(item.code?.toUpperCase());
    if (!set) return false;
    // Check service code in various cases
    const serviceCode = String(item.service || "");
    return (
      set.has(serviceCode) ||
      set.has(serviceCode.toUpperCase()) ||
      set.has(serviceCode.toLowerCase())
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
    console.error(e?.response?.data || e);
    const status = e?.response?.status || 500;
    const message =
      (e?.response?.data &&
        (e.response.data.meta?.message || e.response.data.message)) ||
      e.message ||
      "Server Error";

    if (status >= 400) {
      return res.json({ source: "error-fallback", data: [] });
    }

    res.status(status).json({ message });
  }
};

// POST /api/shipping/calculate/domestic
// body: { origin?, destination?, weight?, courier, price, store_id }
exports.calculateDomesticCost = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    let { origin, destination, weight, courier, price, store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({ message: "store_id wajib diisi" });
    }
    if (!courier) {
      return res.status(400).json({ message: "courier wajib diisi" });
    }

    const { apiKey, baseUrl } = getApiConfig();

    // Hitung weight dari cart jika tidak ada
    if (!weight || Number(weight) <= 0) {
      if (userId) {
        const [cartRows] = await db.query(
          "SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1",
          [userId]
        );
        if (cartRows.length) {
          const [wRows] = await db.query(
            `SELECT p.weight_gram, ci.quantity FROM cart_items ci
             JOIN products p ON ci.product_id = p.product_id
             WHERE ci.cart_id = ? AND p.store_id = ? AND ci.is_selected = 1`,
            [cartRows[0].cart_id, store_id]
          );
          let totalWeight = 0;
          for (const r of wRows) {
            totalWeight += Number(r.weight_gram || 0) * Number(r.quantity || 0);
          }
          weight = totalWeight > 0 ? totalWeight : 1000;
        }
      }
      if (!weight) weight = 1000;
    }

    // Jika origin/destination belum diisi, cari otomatis dari alamat
    if (!origin || !destination) {
      if (!userId) {
        // Tanpa user, pakai mock
        const courierLower = String(courier).toLowerCase();
        const mockRates = getMockShippingRates(courierLower, weight);
        return res.json({ source: "mock-no-user", data: mockRates });
      }

      const [cartRows] = await db.query(
        "SELECT cart_id, shipping_address_id FROM carts WHERE user_id = ? LIMIT 1",
        [userId]
      );
      if (!cartRows.length) {
        const courierLower = String(courier).toLowerCase();
        const mockRates = getMockShippingRates(courierLower, weight);
        return res.json({ source: "mock-no-cart", data: mockRates });
      }

      const shippingAddressId = cartRows[0].shipping_address_id;
      if (!shippingAddressId) {
        const courierLower = String(courier).toLowerCase();
        const mockRates = getMockShippingRates(courierLower, weight);
        return res.json({ source: "mock-no-address", data: mockRates });
      }

      // Get store and user addresses
      const [storeRows] = await db.query(
        "SELECT province, city, district, subdistrict, postal_code FROM stores WHERE store_id = ? LIMIT 1",
        [store_id]
      );
      const [addrRows] = await db.query(
        "SELECT province, city, district, subdistrict, postal_code FROM user_addresses WHERE address_id = ? LIMIT 1",
        [shippingAddressId]
      );

      if (!storeRows.length || !addrRows.length) {
        const courierLower = String(courier).toLowerCase();
        const mockRates = getMockShippingRates(courierLower, weight);
        return res.json({ source: "mock-missing-addr", data: mockRates });
      }

      const storeLoc = storeRows[0];
      const destLoc = addrRows[0];

      // Search locations in RajaOngkir
      const baseDestinationUrl = `${baseUrl}/destination/domestic-destination`;
      const buildSearch = (loc) =>
        loc.postal_code || loc.city || loc.district || "jakarta";

      try {
        const searchConfig = (search) => ({
          headers: { key: apiKey },
          params: { search, limit: 10, offset: 0 },
        });

        const [originResp, destResp] = await Promise.all([
          axios.get(baseDestinationUrl, searchConfig(buildSearch(storeLoc))),
          axios.get(baseDestinationUrl, searchConfig(buildSearch(destLoc))),
        ]);

        const originList = Array.isArray(originResp.data?.data)
          ? originResp.data.data
          : [];
        const destList = Array.isArray(destResp.data?.data)
          ? destResp.data.data
          : [];

        if (originList.length > 0 && destList.length > 0) {
          origin = originList[0].id;
          destination = destList[0].id;
          console.log(
            `RajaOngkir locations found: origin=${origin}, destination=${destination}`
          );
        } else {
          console.log("RajaOngkir location search returned empty, using mock");
          const courierLower = String(courier).toLowerCase();
          const mockRates = getMockShippingRates(courierLower, weight);
          return res.json({ source: "mock-no-location", data: mockRates });
        }
      } catch (searchErr) {
        console.log("RajaOngkir location search error:", searchErr.message);
        const courierLower = String(courier).toLowerCase();
        const mockRates = getMockShippingRates(courierLower, weight);
        return res.json({ source: "mock-search-error", data: mockRates });
      }
    }

    // Call RajaOngkir cost API
    const courierLower = String(courier).toLowerCase();
    const url = `${baseUrl}/calculate/domestic-cost`;

    console.log("Calling RajaOngkir cost API:", {
      origin,
      destination,
      weight,
      courier: courierLower,
    });

    try {
      const { data } = await fetchForm(
        url,
        { origin, destination, weight, courier: courierLower, price },
        apiKey
      );
      const list = Array.isArray(data?.data)
        ? data.data.map((x) => ({
            name: x.name,
            code: x.code,
            service: x.service,
            description: x.description,
            cost: x.cost,
            etd: x.etd,
          }))
        : [];

      console.log(
        `RajaOngkir returned ${list.length} rates for ${courierLower}`
      );

      if (list.length > 0) {
        return res.json({ source: "rajaongkir", data: list });
      }
    } catch (apiErr) {
      console.log(
        "RajaOngkir cost API error:",
        apiErr?.response?.data?.meta?.message || apiErr.message
      );
    }

    // Fallback to mock if RajaOngkir fails
    const mockRates = getMockShippingRates(courierLower, weight);
    console.log(`Using mock rates: ${mockRates.length} for ${courierLower}`);
    return res.json({ source: "mock-fallback", data: mockRates });
  } catch (e) {
    console.error("calculateDomesticCost error:", e.message);
    // Return mock on any error
    const courierLower = String(req.body?.courier || "jne").toLowerCase();
    const mockRates = getMockShippingRates(courierLower, 1000);
    return res.json({ source: "mock-error", data: mockRates });
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

// =====================================================
// STORE COURIER CONFIGURATION (Kurir Toko)
// =====================================================

// GET /api/sellers/shipping/store-courier - Get store courier config
exports.getStoreCourierConfig = async (req, res) => {
  try {
    const storeId = req.user?.store_id;
    if (!storeId) {
      return res.status(403).json({ message: "Store ID not found" });
    }

    // Get courier config
    const [configRows] = await db.query(
      "SELECT * FROM store_courier_config WHERE store_id = ?",
      [storeId]
    );

    if (configRows.length === 0) {
      return res.json({
        config: null,
        distancePricing: [],
        weightPricing: [],
      });
    }

    const config = configRows[0];

    // Get distance pricing
    const [distanceRows] = await db.query(
      "SELECT * FROM courier_distance_pricing WHERE store_courier_config_id = ? ORDER BY distance_from ASC",
      [config.id]
    );

    // Get weight pricing
    const [weightRows] = await db.query(
      "SELECT * FROM courier_weight_pricing WHERE store_courier_config_id = ? ORDER BY weight_from ASC",
      [config.id]
    );

    res.json({
      config,
      distancePricing: distanceRows,
      weightPricing: weightRows,
    });
  } catch (error) {
    console.error("Error fetching store courier config:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// GET /api/shipping/store/:store_id/services - buyer-facing options per store
exports.getStoreCourierOptionsForBuyer = async (req, res) => {
  try {
    const { store_id } = req.params;
    if (!store_id) {
      return res.status(400).json({ message: "store_id wajib diisi" });
    }

    // First try to get store's configured services
    const sql = `
      SELECT 
        cs.code AS courier_code,
        cs.name AS courier_name,
        cst.code AS service_code,
        cst.name AS service_name,
        cst.description AS service_description
      FROM store_courier_services scs
      JOIN courier_service_types cst ON cst.id = scs.courier_service_type_id
      JOIN courier_services cs ON cs.id = cst.courier_service_id
      WHERE scs.store_id = ?
        AND scs.is_active = 1
        AND cst.is_active = 1
        AND cs.is_active = 1
      ORDER BY cs.name, cst.name
    `;

    let [rows] = await db.query(sql, [store_id]);

    // If store has no configured services, fallback to all available services
    // This allows buyers to still select shipping even if seller hasn't configured
    if (rows.length === 0) {
      const fallbackSql = `
        SELECT 
          cs.code AS courier_code,
          cs.name AS courier_name,
          cst.code AS service_code,
          cst.name AS service_name,
          cst.description AS service_description
        FROM courier_service_types cst
        JOIN courier_services cs ON cs.id = cst.courier_service_id
        WHERE cst.is_active = 1
          AND cs.is_active = 1
        ORDER BY cs.name, cst.name
      `;
      [rows] = await db.query(fallbackSql);
    }

    res.json({ services: rows });
  } catch (error) {
    console.error("Error fetching store courier options (buyer):", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// POST /api/sellers/shipping/store-courier - Create/Update store courier config
exports.saveStoreCourierConfig = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const storeId = req.user?.store_id;
    if (!storeId) {
      await connection.rollback();
      return res.status(403).json({ message: "Store ID not found" });
    }

    const { is_active, max_delivery_distance, distancePricing, weightPricing } =
      req.body;

    // Upsert courier config
    const [existing] = await connection.query(
      "SELECT id FROM store_courier_config WHERE store_id = ?",
      [storeId]
    );

    let configId;
    if (existing.length > 0) {
      configId = existing[0].id;
      await connection.query(
        "UPDATE store_courier_config SET is_active = ?, max_delivery_distance = ?, updated_at = NOW() WHERE id = ?",
        [is_active, max_delivery_distance, configId]
      );
    } else {
      const [result] = await connection.query(
        "INSERT INTO store_courier_config (store_id, is_active, max_delivery_distance) VALUES (?, ?, ?)",
        [storeId, is_active, max_delivery_distance]
      );
      configId = result.insertId;
    }

    // Delete old distance pricing
    await connection.query(
      "DELETE FROM courier_distance_pricing WHERE store_courier_config_id = ?",
      [configId]
    );

    // Insert new distance pricing
    if (distancePricing && distancePricing.length > 0) {
      for (const item of distancePricing) {
        await connection.query(
          "INSERT INTO courier_distance_pricing (store_courier_config_id, distance_from, distance_to, price) VALUES (?, ?, ?, ?)",
          [configId, item.distance_from, item.distance_to, item.price]
        );
      }
    }

    // Delete old weight pricing
    await connection.query(
      "DELETE FROM courier_weight_pricing WHERE store_courier_config_id = ?",
      [configId]
    );

    // Insert new weight pricing
    if (weightPricing && weightPricing.length > 0) {
      for (const item of weightPricing) {
        await connection.query(
          "INSERT INTO courier_weight_pricing (store_courier_config_id, weight_from, additional_price, description) VALUES (?, ?, ?, ?)",
          [
            configId,
            item.weight_from,
            item.additional_price,
            item.description || null,
          ]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Pengaturan kurir toko berhasil disimpan" });
  } catch (error) {
    await connection.rollback();
    console.error("Error saving store courier config:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    connection.release();
  }
};

// =====================================================
// COURIER SERVICES (Jasa Pengiriman)
// =====================================================

// GET /api/sellers/shipping/courier-services - Get all available courier services
exports.getAllCourierServices = async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT 
        cs.id AS service_id,
        cs.code AS service_code,
        cs.name AS service_name,
        cs.logo_url,
        cst.id AS type_id,
        cst.code AS type_code,
        cst.name AS type_name,
        cst.description AS type_description
      FROM courier_services cs
      LEFT JOIN courier_service_types cst ON cst.courier_service_id = cs.id
      WHERE cs.is_active = 1 AND cst.is_active = 1
      ORDER BY cs.id, cst.id
    `);

    // Group by courier service
    const grouped = {};
    services.forEach((row) => {
      if (!grouped[row.service_code]) {
        grouped[row.service_code] = {
          service_id: row.service_id,
          service_code: row.service_code,
          service_name: row.service_name,
          logo_url: row.logo_url,
          types: [],
        };
      }
      grouped[row.service_code].types.push({
        type_id: row.type_id,
        type_code: row.type_code,
        type_name: row.type_name,
        type_description: row.type_description,
      });
    });

    res.json({ services: Object.values(grouped) });
  } catch (error) {
    console.error("Error fetching courier services:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// GET /api/sellers/shipping/store-services - Get store's selected courier services
exports.getStoreSelectedServices = async (req, res) => {
  try {
    const storeId = req.user?.store_id;
    if (!storeId) {
      return res.status(403).json({ message: "Store ID not found" });
    }

    const [rows] = await db.query(
      "SELECT courier_service_type_id FROM store_courier_services WHERE store_id = ? AND is_active = 1",
      [storeId]
    );

    res.json({
      selected_service_type_ids: rows.map((r) => r.courier_service_type_id),
    });
  } catch (error) {
    console.error("Error fetching store selected services:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// POST /api/sellers/shipping/store-services - Update store's selected courier services
exports.updateStoreSelectedServices = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const storeId = req.user?.store_id;
    if (!storeId) {
      await connection.rollback();
      return res.status(403).json({ message: "Store ID not found" });
    }

    const { selected_service_type_ids } = req.body;

    if (!Array.isArray(selected_service_type_ids)) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "selected_service_type_ids harus berupa array" });
    }

    // Delete all existing
    await connection.query(
      "DELETE FROM store_courier_services WHERE store_id = ?",
      [storeId]
    );

    // Insert new selections
    if (selected_service_type_ids.length > 0) {
      for (const typeId of selected_service_type_ids) {
        await connection.query(
          "INSERT INTO store_courier_services (store_id, courier_service_type_id, is_active) VALUES (?, ?, 1)",
          [storeId, typeId]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Layanan pengiriman berhasil diperbarui" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating store selected services:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    connection.release();
  }
};
