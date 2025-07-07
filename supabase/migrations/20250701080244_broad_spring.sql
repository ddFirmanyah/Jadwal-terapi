-- Klinik Hanenda Database Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS klinik_hanenda;
USE klinik_hanenda;

-- Therapists table
CREATE TABLE IF NOT EXISTS therapists (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization ENUM('Terapi Wicara', 'Fisioterapi', 'Terapi Okupasi') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    availability JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    medicalRecordNumber VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    patientType ENUM('regular', 'bpjs') NOT NULL,
    referral_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    therapistId VARCHAR(50) NOT NULL,
    patientId VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    status ENUM('scheduled', 'completed', 'no-show', 'canceled') DEFAULT 'scheduled',
    sessionType ENUM('regular', 'bpjs') NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (therapistId) REFERENCES therapists(id) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES patients(medicalRecordNumber) ON DELETE CASCADE,
    INDEX idx_therapist_date (therapistId, date),
    INDEX idx_patient_date (patientId, date),
    INDEX idx_date_time (date, startTime)
);

-- Insert sample therapists
INSERT INTO therapists (id, name, specialization, phone, availability) VALUES
-- Terapi Wicara
('tw-001', 'Dr. Sarah Amelia', 'Terapi Wicara', '+62812-3456-7890', 
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('tw-002', 'Andi Pratama, S.ST', 'Terapi Wicara', '+62813-4567-8901',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('tw-003', 'Maya Sari, M.Kes', 'Terapi Wicara', '+62814-5678-9012',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('tw-004', 'Rino Handoko, S.ST', 'Terapi Wicara', '+62815-6789-0123',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

-- Fisioterapi
('ft-001', 'Dr. Ahmad Fauzi', 'Fisioterapi', '+62816-7890-1234',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('ft-002', 'Lisa Kartika, S.Ft', 'Fisioterapi', '+62817-8901-2345',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('ft-003', 'Budi Santoso, M.Fis', 'Fisioterapi', '+62818-9012-3456',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('ft-004', 'Sari Dewi, S.Ft', 'Fisioterapi', '+62819-0123-4567',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

-- Terapi Okupasi
('to-001', 'Dr. Indira Sari', 'Terapi Okupasi', '+62820-1234-5678',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('to-002', 'Fadli Rahman, S.TO', 'Terapi Okupasi', '+62821-2345-6789',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('to-003', 'Nina Kusuma, M.TO', 'Terapi Okupasi', '+62822-3456-7890',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}'),

('to-004', 'Eko Prasetyo, S.TO', 'Terapi Okupasi', '+62823-4567-8901',
 '{"monday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "tuesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "wednesday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "thursday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "friday": {"available": true, "startTime": "08:00", "endTime": "17:00"}, "saturday": {"available": false, "startTime": "08:00", "endTime": "17:00"}, "sunday": {"available": false, "startTime": "08:00", "endTime": "17:00"}}');

-- Insert sample patients
INSERT INTO patients (medicalRecordNumber, name, contact, patientType, referral_data) VALUES
('MR-001', 'John Doe Sutrisno', '+62812-1111-1111', 'regular', NULL),
('MR-002', 'Jane Smith Pratiwi', '+62813-2222-2222', 'bpjs', 
 '{"referralNumber": "REF-2024-001", "issuedDate": "2024-01-15", "expiryDate": "2024-04-15", "referringDoctor": "Dr. Andi Susanto"}'),
('MR-003', 'Ahmad Wijaya', '+62814-3333-3333', 'bpjs',
 '{"referralNumber": "REF-2024-002", "issuedDate": "2024-02-01", "expiryDate": "2024-05-01", "referringDoctor": "Dr. Sri Wahyuni"}'),
('MR-004', 'Siti Nurhaliza', '+62815-4444-4444', 'regular', NULL),
('MR-005', 'Budi Setiawan', '+62816-5555-5555', 'bpjs',
 '{"referralNumber": "REF-2024-003", "issuedDate": "2024-01-20", "expiryDate": "2024-04-20", "referringDoctor": "Dr. Maya Sari"}');

-- Insert sample appointments (adjust dates to current date)
INSERT INTO appointments (id, therapistId, patientId, date, startTime, endTime, status, sessionType, notes) VALUES
('apt-001', 'tw-001', 'MR-001', CURDATE(), '09:00:00', '09:45:00', 'scheduled', 'regular', 'Sesi terapi wicara rutin'),
('apt-002', 'ft-001', 'MR-002', CURDATE(), '10:00:00', '10:30:00', 'scheduled', 'bpjs', 'Fisioterapi BPJS'),
('apt-003', 'to-001', 'MR-003', CURDATE(), '11:00:00', '11:30:00', 'completed', 'bpjs', 'Terapi okupasi selesai'),
('apt-004', 'tw-002', 'MR-004', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '08:45:00', 'scheduled', 'regular', 'Sesi besok'),
('apt-005', 'ft-002', 'MR-005', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '14:30:00', 'scheduled', 'bpjs', 'Fisioterapi BPJS besok');