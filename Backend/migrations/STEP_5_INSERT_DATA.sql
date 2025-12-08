-- ============================================
-- STEP 5: INSERT DATA
-- ============================================
-- Copy script ini ke phpMyAdmin dan jalankan

-- Insert courier services
INSERT INTO courier_services (code, name) VALUES
('GOSEND', 'GoSend'),
('JNT', 'J&T'),
('SICEPAT', 'SiCepat Logistic'),
('PAXEL', 'Paxel'),
('JNE', 'JNE'),
('ANTERAJA', 'Anteraja'),
('POS', 'POS Indonesia');

-- Insert courier service types - GoSend
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'GOSEND'), 'SAMEDAY', 'GoSend Sameday'),
((SELECT id FROM courier_services WHERE code = 'GOSEND'), 'INSTANT', 'GoSend Instant');

-- J&T
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'JNT'), 'HBO', 'J&T HBO'),
((SELECT id FROM courier_services WHERE code = 'JNT'), 'NEXTDAY', 'J&T Nextday'),
((SELECT id FROM courier_services WHERE code = 'JNT'), 'SAMEDAY', 'J&T Sameday'),
((SELECT id FROM courier_services WHERE code = 'JNT'), 'REGULAR', 'J&T Regular');

-- SiCepat
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'SICEPAT'), 'BEST', 'SiCepat BEST'),
((SELECT id FROM courier_services WHERE code = 'SICEPAT'), 'GOKIL', 'SiCepat GOKIL'),
((SELECT id FROM courier_services WHERE code = 'SICEPAT'), 'SIUNTUNG', 'SiCepat SIUNTUNG');

-- Paxel
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'PAXEL'), 'SAMEDAY', 'Paxel Sameday'),
((SELECT id FROM courier_services WHERE code = 'PAXEL'), 'BIG', 'Paxel Big'),
((SELECT id FROM courier_services WHERE code = 'PAXEL'), 'INSTANT', 'Paxel Instant');

-- JNE
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'JNE'), 'TRUCKING', 'JNE Trucking'),
((SELECT id FROM courier_services WHERE code = 'JNE'), 'YES', 'JNE Yes'),
((SELECT id FROM courier_services WHERE code = 'JNE'), 'REGULAR', 'JNE Regular'),
((SELECT id FROM courier_services WHERE code = 'JNE'), 'OKE', 'JNE OKE');

-- Anteraja
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'ANTERAJA'), 'REGULAR', 'Anteraja Regular'),
((SELECT id FROM courier_services WHERE code = 'ANTERAJA'), 'NEXTDAY', 'Anteraja Next day'),
((SELECT id FROM courier_services WHERE code = 'ANTERAJA'), 'SAMEDAY', 'Anteraja Same Day');

-- POS Indonesia
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'POS'), 'KARGO', 'Pos Kargo'),
((SELECT id FROM courier_services WHERE code = 'POS'), 'SAMEDAY', 'Pos Sameday'),
((SELECT id FROM courier_services WHERE code = 'POS'), 'REGULAR', 'Pos Regular'),
((SELECT id FROM courier_services WHERE code = 'POS'), 'EXPRESS', 'Pos Express');

-- Verifikasi data
SELECT COUNT(*) as total_couriers FROM courier_services;
-- Harus 7

SELECT COUNT(*) as total_types FROM courier_service_types;
-- Harus 28

SELECT cs.name, COUNT(cst.id) as service_count
FROM courier_services cs
LEFT JOIN courier_service_types cst ON cs.id = cst.courier_service_id
GROUP BY cs.id, cs.name;
-- Harus show semua courier dengan jumlah service nya
