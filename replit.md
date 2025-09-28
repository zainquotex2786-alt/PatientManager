# Overview

This is a Patient Management System (PMS) for Pakenham Hospital, featuring a comprehensive web-based interface for both administrative staff and patients. The system provides core healthcare management functionality including patient enrollment, appointment booking and management, patient tracking and monitoring, and search capabilities. The application uses a modern, responsive design with a dual-interface approach - a public patient portal for patient interactions and an administrative dashboard for hospital staff operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application follows a multi-page architecture with dedicated HTML pages for different functional areas:
- **Patient Portal** (`patient-portal.html`) - Public-facing interface with hero sections, service information, and patient login
- **Admin Dashboard** (`index.html`) - Administrative overview with statistics cards and quick action navigation
- **Appointment System** - Separate interfaces for patient booking (`appointments.html`) and admin management (`appointments-admin.html`)
- **Enrollment Wizard** (`enrollment.html`) - Multi-step patient registration process
- **Tracking Interface** (`tracking.html`) - Patient status monitoring and location tracking
- **Search Functionality** (`search.html`) - Patient search and filtering capabilities
- **Authentication** (`login.html`) - Role-based login system with animated UI

## Design System
The CSS architecture uses a token-based design system with CSS custom properties for consistent styling:
- Centralized color palette with semantic color tokens
- Responsive grid system with container-based layouts
- Component-based styling with reusable classes
- Font Awesome icons for consistent iconography
- Inter font family for modern typography

## JavaScript Architecture
The frontend uses vanilla JavaScript with a modular approach:
- **Data Management**: Centralized data store with localStorage persistence (designed for migration to PHP backend)
- **API Layer**: Structured for backend integration with `/api` endpoints
- **Utility Functions**: Common operations for data formatting, validation, and UI interactions
- **Event Handling**: Form submissions, navigation, and user interactions
- **Authentication**: Session management and role-based access control

## Backend Integration Strategy
The system is architected for PHP backend integration:
- API endpoints designed for RESTful communication
- JSON data exchange format
- Session-based authentication replacing localStorage
- Database integration points for persistent data storage

## Data Flow Patterns
The application follows a hub-and-spoke navigation pattern:
- Central dashboard for administrative users
- Direct patient portal access for public users
- Multi-step wizard flows for complex operations (enrollment, appointments)
- Real-time data updates through API calls

## Authentication & Authorization
Role-based access control with two primary user types:
- **Admin Users**: Full system access with administrative privileges
- **Patient Users**: Limited access to personal data and booking functions
- Session management for secure authentication
- Role-specific navigation and feature availability

# External Dependencies

## Frontend Libraries
- **Font Awesome 6.0.0** - Icon library for consistent UI iconography
- **Google Fonts (Inter)** - Typography with multiple font weights (300-700)
- **CDN Delivery** - External resources served via CDNs for performance

## Backend Dependencies (Planned)
- **PHP** - Server-side scripting for API endpoints and business logic
- **MySQL** - Relational database for persistent data storage
- **Session Management** - PHP sessions for user authentication

## Database Schema (Designed)
- **users** - Authentication and user role management
- **patients** - Patient records with unique identifiers
- **doctors** - Healthcare provider information and specialties
- **appointments** - Scheduling and appointment management
- **tracking** - Patient status and location monitoring

## Third-Party Integrations
The system is designed to be self-contained with minimal external dependencies, focusing on core hospital management functionality without requiring external healthcare APIs or payment processing systems.