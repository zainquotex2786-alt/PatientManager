<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
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
    case 'enroll':
        handleEnroll($db);
        break;
    case 'list':
        handleList($db);
        break;
    case 'search':
        handleSearch($db);
        break;
    case 'get':
        handleGet($db);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function handleEnroll($db) {
    // Only admin can enroll patients
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    $dob = $input['dob'] ?? '';
    $gender = $input['gender'] ?? '';
    $contact = $input['contact'] ?? '';
    $email = $input['email'] ?? '';
    $address = $input['address'] ?? '';
    $medical_history = $input['medical_history'] ?? '';
    
    if (empty($name) || empty($dob) || empty($gender)) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, DOB, and gender are required']);
        return;
    }
    
    try {
        // Generate unique patient code
        $stmt = $db->query("SELECT COUNT(*) as count FROM patients");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        $patient_code = 'P' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        
        $query = "INSERT INTO patients (patient_code, name, dob, gender, contact, email, address, medical_history) 
                  VALUES (:patient_code, :name, :dob, :gender, :contact, :email, :address, :medical_history)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':patient_code', $patient_code);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':dob', $dob);
        $stmt->bindParam(':gender', $gender);
        $stmt->bindParam(':contact', $contact);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':address', $address);
        $stmt->bindParam(':medical_history', $medical_history);
        
        if ($stmt->execute()) {
            $patient_id = $db->lastInsertId();
            echo json_encode([
                'success' => true,
                'patient_id' => $patient_id,
                'patient_code' => $patient_code
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to enroll patient']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Enrollment failed']);
    }
}

function handleList($db) {
    // Only admin can list all patients
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        return;
    }
    
    try {
        $query = "SELECT id, patient_code, name, dob, gender, contact, email, created_at FROM patients ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'patients' => $patients]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch patients']);
    }
}

function handleSearch($db) {
    // Only admin can search all patients
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        return;
    }
    
    $search_term = $_GET['q'] ?? '';
    
    if (empty($search_term)) {
        http_response_code(400);
        echo json_encode(['error' => 'Search term required']);
        return;
    }
    
    try {
        $query = "SELECT id, patient_code, name, dob, gender, contact, email, created_at 
                  FROM patients 
                  WHERE name ILIKE :search OR patient_code ILIKE :search OR email ILIKE :search 
                  ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        $search_param = '%' . $search_term . '%';
        $stmt->bindParam(':search', $search_param);
        $stmt->execute();
        
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'patients' => $patients]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Search failed']);
    }
}

function handleGet($db) {
    // Only admin can get full patient details
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        return;
    }
    
    $patient_id = $_GET['id'] ?? '';
    
    if (empty($patient_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID required']);
        return;
    }
    
    try {
        $query = "SELECT * FROM patients WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $patient_id);
        $stmt->execute();
        
        $patient = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($patient) {
            echo json_encode(['success' => true, 'patient' => $patient]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Patient not found']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch patient']);
    }
}
?>