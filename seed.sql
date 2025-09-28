-- Seed data for Patient Management System

-- Insert demo users
INSERT INTO users (username, password_hash, role, name) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin User'),
('patient', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient', 'John Patient')
ON CONFLICT (username) DO NOTHING;

-- Insert doctors (from script.js)
INSERT INTO doctors (name, specialty, available) VALUES 
('Dr. Emily Carter', 'Cardiology', TRUE),
('Dr. Michael Chen', 'Orthopedics', TRUE),
('Dr. Sarah Johnson', 'Pediatrics', TRUE),
('Dr. James Wilson', 'Neurology', TRUE),
('Dr. Lisa Taylor', 'Dermatology', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample patients
INSERT INTO patients (patient_code, name, dob, gender, contact, email, medical_history) VALUES 
('P0001', 'Sarah Johnson', '1985-06-15', 'female', '0412345678', 'sarah.j@email.com', 'No known allergies'),
('P0002', 'Mike Davis', '1978-03-22', 'male', '0423456789', 'mike.davis@email.com', 'Hypertension'),
('P0003', 'John Smith', '1990-11-08', 'male', '0434567890', 'john.smith@email.com', 'Emergency admission')
ON CONFLICT (patient_code) DO NOTHING;

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes) VALUES 
(1, 1, '2025-01-15', '09:00:00', 'scheduled', 'Regular checkup'),
(2, 2, '2025-01-15', '10:30:00', 'confirmed', 'Follow-up appointment'),
(3, 1, '2025-01-15', '14:00:00', 'completed', 'Emergency consultation')
ON CONFLICT DO NOTHING;

-- Insert sample tracking data
INSERT INTO tracking (patient_id, status, location) VALUES 
(1, 'checked-in', 'Reception'),
(2, 'in-treatment', 'Cardiology'),
(3, 'discharged', 'ICU')
ON CONFLICT DO NOTHING;