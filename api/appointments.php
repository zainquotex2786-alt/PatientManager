<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once '../db.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch($action) {
    case 'book':
        handleBook($db);
        break;
    case 'list':
        handleList($db);
        break;
    case 'update':
        handleUpdate($db);
        break;
    case 'doctors':
        handleDoctors($db);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function handleBook($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = $input['patient_id'] ?? '';
    $doctor_id = $input['doctor_id'] ?? '';
    $appointment_date = $input['appointment_date'] ?? '';
    $appointment_time = $input['appointment_time'] ?? '';
    $notes = $input['notes'] ?? '';
    
    if (empty($patient_id) || empty($doctor_id) || empty($appointment_date) || empty($appointment_time)) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient, doctor, date, and time are required']);
        return;
    }
    
    try {
        // Check for conflicts
        $conflict_query = "SELECT id FROM appointments 
                          WHERE doctor_id = :doctor_id 
                          AND appointment_date = :appointment_date 
                          AND appointment_time = :appointment_time 
                          AND status != 'cancelled'";
        
        $stmt = $db->prepare($conflict_query);
        $stmt->bindParam(':doctor_id', $doctor_id);
        $stmt->bindParam(':appointment_date', $appointment_date);
        $stmt->bindParam(':appointment_time', $appointment_time);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Time slot already booked']);
            return;
        }
        
        $query = "INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, notes) 
                  VALUES (:patient_id, :doctor_id, :appointment_date, :appointment_time, :notes)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':patient_id', $patient_id);
        $stmt->bindParam(':doctor_id', $doctor_id);
        $stmt->bindParam(':appointment_date', $appointment_date);
        $stmt->bindParam(':appointment_time', $appointment_time);
        $stmt->bindParam(':notes', $notes);
        
        if ($stmt->execute()) {
            $appointment_id = $db->lastInsertId();
            echo json_encode([
                'success' => true,
                'appointment_id' => $appointment_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to book appointment']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Booking failed']);
    }
}

function handleList($db) {
    try {
        $user_role = $_SESSION['role'];
        $user_id = $_SESSION['user_id'];
        
        if ($user_role === 'admin') {
            // Admin sees all appointments
            $query = "SELECT a.*, p.name as patient_name, p.patient_code, d.name as doctor_name, d.specialty
                      FROM appointments a
                      JOIN patients p ON a.patient_id = p.id
                      JOIN doctors d ON a.doctor_id = d.id
                      ORDER BY a.appointment_date DESC, a.appointment_time DESC";
            $stmt = $db->prepare($query);
        } else {
            // Patients see only their appointments
            $query = "SELECT a.*, p.name as patient_name, p.patient_code, d.name as doctor_name, d.specialty
                      FROM appointments a
                      JOIN patients p ON a.patient_id = p.id
                      JOIN doctors d ON a.doctor_id = d.id
                      WHERE p.id IN (SELECT id FROM patients WHERE email = :user_email)
                      ORDER BY a.appointment_date DESC, a.appointment_time DESC";
            $stmt = $db->prepare($query);
            // Note: This assumes patient email matches user email/username
            $stmt->bindParam(':user_email', $_SESSION['username']);
        }
        
        $stmt->execute();
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'appointments' => $appointments]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch appointments']);
    }
}

function handleUpdate($db) {
    // Only admin can update appointments
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $appointment_id = $input['appointment_id'] ?? '';
    $status = $input['status'] ?? '';
    
    if (empty($appointment_id) || empty($status)) {
        http_response_code(400);
        echo json_encode(['error' => 'Appointment ID and status are required']);
        return;
    }
    
    $valid_statuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (!in_array($status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        return;
    }
    
    try {
        $query = "UPDATE appointments SET status = :status WHERE id = :appointment_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':appointment_id', $appointment_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update appointment']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
    }
}

function handleDoctors($db) {
    try {
        $query = "SELECT id, name, specialty, available FROM doctors WHERE available = TRUE ORDER BY name";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'doctors' => $doctors]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch doctors']);
    }
}
?>