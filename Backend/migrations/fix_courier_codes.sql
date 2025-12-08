-- Migration: Fix courier codes to lowercase and add missing services
-- Date: 2024-12-04
-- Description: RajaOngkir API returns lowercase courier codes, so we need to match

-- Update courier codes to lowercase
UPDATE courier_services SET code = LOWER(code);

-- Add missing courier service types that RajaOngkir returns
-- For JNE - add missing REG service
INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'REG', 'JNE REG', 'JNE Regular'
FROM courier_services WHERE code = 'jne';

-- For JNT (j&t) - add EZ and JSD services
INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'EZ', 'J&T EZ', 'J&T Regular'
FROM courier_services WHERE code = 'jnt';

INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'JSD', 'J&T JSD', 'J&T Same Day'
FROM courier_services WHERE code = 'jnt';

-- For SiCepat - add REG service
INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'REG', 'SiCepat REG', 'SiCepat Regular'
FROM courier_services WHERE code = 'sicepat';

-- For Anteraja - add SD (Same Day) and REG services
INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'SD', 'AnterAja SD', 'AnterAja Same Day'
FROM courier_services WHERE code = 'anteraja';

INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'REG', 'AnterAja REG', 'AnterAja Regular'
FROM courier_services WHERE code = 'anteraja';

-- For POS - add EXPRESS service
INSERT IGNORE INTO courier_service_types (courier_service_id, code, name, description)
SELECT id, 'EXPRESS', 'Pos Express', 'Pos Express'
FROM courier_services WHERE code = 'pos';

-- Verify updates
SELECT 'Updated courier codes:' as status;
SELECT code, name FROM courier_services;

SELECT 'Service types:' as status;
SELECT cs.code as courier, cst.code as service_code, cst.name as service_name 
FROM courier_service_types cst
JOIN courier_services cs ON cs.id = cst.courier_service_id
ORDER BY cs.code, cst.code;
