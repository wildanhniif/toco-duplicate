// controllers/wilayahController.js
const axios = require('axios');

const API_KEY = process.env.BINDERBYTE_API_KEY;
const BASE_URL = 'https://api.binderbyte.com/wilayah';

const callBinderByteAPI = async (endpoint, res) => {
    try {
        const url = `${BASE_URL}${endpoint}&api_key=${API_KEY}`;
        
        // --- TAMBAHAN UNTUK DEBUGGING ---
        console.log(`[DEBUG] Memanggil URL BinderByte: ${url}`);
        // --------------------------------

        const response = await axios.get(url);
        
        if (response.data.code !== "200") {
            return res.status(400).json({ status: 'fail', message: response.data.message });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error("BinderByte API error:", error.message);
        // Cek jika errornya adalah 404 dari Axios
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ status: 'fail', message: 'Data wilayah tidak ditemukan. Pastikan ID yang digunakan valid.' });
        }
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data wilayah' });
    }
};

// --- Fungsi lainnya (getProvinces, getCities, dll) tetap sama ---

exports.getProvinces = (req, res) => {
    callBinderByteAPI('/provinsi?', res);
};

exports.getCities = (req, res) => {
    const { id_provinsi } = req.query;
    if (!id_provinsi) {
        return res.status(400).json({ status: 'fail', message: 'id_provinsi diperlukan' });
    }
    callBinderByteAPI(`/kabupaten?id_provinsi=${id_provinsi}`, res);
};

exports.getDistricts = (req, res) => { // Kecamatan
    const { id_kabupaten } = req.query;
    if (!id_kabupaten) {
        return res.status(400).json({ status: 'fail', message: 'id_kabupaten diperlukan' });
    }
    callBinderByteAPI(`/kecamatan?id_kabupaten=${id_kabupaten}`, res);
};

exports.getSubDistricts = (req, res) => { // Kelurahan/Desa
    const { id_kecamatan } = req.query;
    if (!id_kecamatan) {
        return res.status(400).json({ status: 'fail', message: 'id_kecamatan diperlukan' });
    }
    callBinderByteAPI(`/kelurahan?id_kecamatan=${id_kecamatan}`, res);
};