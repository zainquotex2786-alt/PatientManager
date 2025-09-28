<?php
// Database setup script
require_once 'db.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Setting up database...\n";
    
    // Read and execute schema
    $schema = file_get_contents('schema.sql');
    $db->exec($schema);
    echo "Schema created successfully.\n";
    
    // Read and execute seed data
    $seed = file_get_contents('seed.sql');
    $db->exec($seed);
    echo "Seed data inserted successfully.\n";
    
    echo "Database setup complete!\n";
    
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>