<?php
// Database connection file for Patient Management System
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;

    public function __construct() {
        // Use environment variables from PostgreSQL database
        $database_url = parse_url($_ENV['DATABASE_URL'] ?? '');
        
        $this->host = $database_url['host'] ?? 'localhost';
        $this->port = $database_url['port'] ?? 5432;
        $this->db_name = $database_url['path'] ? ltrim($database_url['path'], '/') : 'postgres';
        $this->username = $database_url['user'] ?? 'postgres';
        $this->password = $database_url['pass'] ?? '';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            // PostgreSQL uses UTF8 by default
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw $exception;
        }
        return $this->conn;
    }
}
?>