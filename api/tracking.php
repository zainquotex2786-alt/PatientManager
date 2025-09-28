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

// Check authentication and admin access
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch($action) {
    case 'stats':
        handleStats($db);
        break;
    case 'list':
        handleList($db);
        break;
    case 'search':
        handleSearch($db);
        break;
    case 'checkin':
        handleCheckin($db);
        break;
    case 'update':
        handleUpdate($db);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function handleStats($db) {
    try {
        // Get patient counts by status
        $stats_query = "SELECT 
                         COUNT(DISTINCT p.id) as total_patients,
                         COUNT(CASE WHEN t.status = 'in-treatment' THEN 1 END) as in_treatment,
                         COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting,
                         COUNT(CASE WHEN t.status = 'admitted' THEN 1 END) as admitted,
                         COUNT(CASE WHEN t.status = 'checked-in' THEN 1 END) as checked_in
                         FROM patients p
                         LEFT JOIN tracking t ON p.id = t.patient_id";
        
        $stmt = $db->prepare($stats_query);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'stats' => $stats]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch stats']);
    }
}

function handleList($db) {
    try {
        $query = "SELECT p.id, p.patient_code, p.name, p.contact, 
                         t.status, t.location, t.updated_at
                  FROM patients p
                  LEFT JOIN tracking t ON p.id = t.patient_id
                  ORDER BY t.updated_at DESC NULLS LAST";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'patients' => $patients]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch patient tracking']);
    }
}

function handleSearch($db) {
    $search_term = $_GET['q'] ?? '';
    $status_filter = $_GET['status'] ?? '';
    $location_filter = $_GET['location'] ?? '';
    
    try {
        $query = "SELECT p.id, p.patient_code, p.name, p.contact, 
                         t.status, t.location, t.updated_at
                  FROM patients p
                  LEFT JOIN tracking t ON p.id = t.patient_id
                  WHERE 1=1";
        
        $params = [];
        
        if (!empty($search_term)) {
            $query .= " AND (p.name ILIKE :search OR p.patient_code ILIKE :search)";
            $params[':search'] = '%' . $search_term . '%';
        }
        
        if (!empty($status_filter)) {
            $query .= " AND t.status = :status";
            $params[':status'] = $status_filter;
        }
        
        if (!empty($location_filter)) {
            $query .= " AND t.location = :location";
            $params[':location'] = $location_filter;
        }
        
        $query .= " ORDER BY t.updated_at DESC NULLS LAST";
        
        $stmt = $db->prepare($query);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->execute();
        
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'patients' => $patients]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Search failed']);
    }
}

function handleCheckin($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = $input['patient_id'] ?? '';
    $status = $input['status'] ?? 'checked-in';
    $location = $input['location'] ?? 'Reception';
    
    if (empty($patient_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID required']);
        return;
    }
    
    $valid_statuses = ['checked-in', 'waiting', 'in-treatment', 'admitted', 'discharged'];
    if (!in_array($status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        return;
    }
    
    try {
        // Check if tracking record exists
        $check_query = "SELECT id FROM tracking WHERE patient_id = :patient_id";
        $stmt = $db->prepare($check_query);
        $stmt->bindParam(':patient_id', $patient_id);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            // Update existing record
            $query = "UPDATE tracking SET status = :status, location = :location, updated_at = CURRENT_TIMESTAMP 
                      WHERE patient_id = :patient_id";
        } else {
            // Insert new record
            $query = "INSERT INTO tracking (patient_id, status, location) VALUES (:patient_id, :status, :location)";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':patient_id', $patient_id);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':location', $location);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update tracking']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Check-in failed']);
    }
}

function handleUpdate($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = $input['patient_id'] ?? '';
    $status = $input['status'] ?? '';
    $location = $input['location'] ?? '';
    
    if (empty($patient_id) || empty($status)) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID and status are required']);
        return;
    }
    
    $valid_statuses = ['checked-in', 'waiting', 'in-treatment', 'admitted', 'discharged'];
    if (!in_array($status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        return;
    }
    
    try {
        $query = "UPDATE tracking SET status = :status, location = :location, updated_at = CURRENT_TIMESTAMP 
                  WHERE patient_id = :patient_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':patient_id', $patient_id);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':location', $location);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update tracking']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
    }
}
?>