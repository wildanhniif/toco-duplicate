// controllers/wilayahController.js
const axios = require('axios');

// Ambil API Key dari environment variable
const API_KEY = process.env.BINDERBYTE_API_KEY;
const BASE_URL = 'https://api.binderbyte.com/wilayah';

// Fungsi generik untuk memanggil API
const callBinderByteAPI = async (endpoint, res) => {
    try {
        const url = `${BASE_URL}${endpoint}&api_key=${API_KEY}`;
        const response = await axios.get(url);
        
        // Cek jika response dari BinderByte tidak sukses
        if (response.data.code !== "200") {
            return res.status(400).json({ status: 'fail', message: response.data.message });
        }
        
        res.json(response.data); // Kirim data asli dari BinderByte ke frontend
    } catch (error) {
        console.error("BinderByte API error:", error.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data wilayah' });
    }
};

// --- Kumpulan Fungsi untuk setiap tingkatan wilayah ---

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