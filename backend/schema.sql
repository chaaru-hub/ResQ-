-- =============================================================================
-- Smart Disaster Resource Allocation & Emergency Response System
-- Supabase PostgreSQL Database Schema
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'relief_coordinator', -- 'admin' or 'relief_coordinator'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DISASTERS TABLE
CREATE TABLE IF NOT EXISTS disasters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Flood', 'Cyclone', 'Earthquake', 'Landslide', 'Tsunami', 'Fire', 'Drought', 'Other'
    location VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'Critical', 'High', 'Medium', 'Low'
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Monitoring', 'Resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AFFECTED AREAS TABLE
CREATE TABLE IF NOT EXISTS affected_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    area_name VARCHAR(255) NOT NULL,
    population INT NOT NULL DEFAULT 0,
    severity VARCHAR(50) NOT NULL, -- 'Critical', 'High', 'Medium', 'Low'
    medical_cases INT NOT NULL DEFAULT 0,
    vulnerable_population INT NOT NULL DEFAULT 0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    food_required INT NOT NULL DEFAULT 0,
    water_required INT NOT NULL DEFAULT 0,
    medicine_required INT NOT NULL DEFAULT 0,
    priority_score FLOAT NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'Critical', -- 'Critical', 'High', 'Medium', 'Low', 'Assigned', 'Relieved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. RESOURCES TABLE
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- e.g., 'Food', 'Drinking Water', 'Medicine', 'First Aid Kits', 'Doctors', 'Ambulance'
    category VARCHAR(100) NOT NULL, -- 'Essential Supplies', 'Emergency Equipment', 'Human Resources', 'Vehicles'
    quantity_available INT NOT NULL DEFAULT 0,
    quantity_allocated INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'units',
    location VARCHAR(255) DEFAULT 'Central Depot',
    minimum_threshold INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. RESOURCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS resource_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES affected_areas(id) ON DELETE CASCADE,
    area_name VARCHAR(255),
    resource_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    urgency VARCHAR(50) NOT NULL, -- 'Critical', 'High', 'Medium', 'Low'
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Fulfilled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES affected_areas(id) ON DELETE CASCADE,
    area_name VARCHAR(255),
    resource_type VARCHAR(100) NOT NULL,
    quantity_allocated INT NOT NULL DEFAULT 0,
    priority_score FLOAT NOT NULL DEFAULT 0.0,
    optimization_run_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Recommended', -- 'Recommended', 'Confirmed', 'Dispatched'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. RESCUE TEAMS TABLE
CREATE TABLE IF NOT EXISTS rescue_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) NOT NULL,
    leader VARCHAR(255) NOT NULL,
    members INT NOT NULL DEFAULT 1,
    specialization VARCHAR(100) NOT NULL, -- 'Medical', 'Search & Rescue', 'Evacuation', 'Hazmat', 'General Relief'
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- 'Available', 'Assigned', 'On Mission', 'Offline'
    assigned_area_id UUID REFERENCES affected_areas(id) ON DELETE SET NULL,
    assigned_area_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Ambulance', 'Supply Truck', 'Rescue Vehicle', 'Boat', 'Helicopter'
    driver VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- 'Available', 'In Transit', 'Assigned', 'Maintenance'
    assigned_area_id UUID REFERENCES affected_areas(id) ON DELETE SET NULL,
    assigned_area_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'Critical', 'Warning', 'Emergency', 'Info'
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Acknowledged', 'Resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. DISASTER REPORTS TABLE (WHATSAPP INGESTION)
CREATE TABLE IF NOT EXISTS disaster_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_phone VARCHAR(50),
    message_id VARCHAR(255),
    original_message TEXT NOT NULL,
    disaster_type VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    location VARCHAR(255) DEFAULT 'Unknown',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    people_affected INT DEFAULT 0,
    severity VARCHAR(50) DEFAULT 'Low', -- 'Critical', 'High', 'Medium', 'Low'
    urgency VARCHAR(50) DEFAULT 'Low', -- 'Critical', 'High', 'Medium', 'Low'
    required_resources JSONB DEFAULT '[]'::jsonb,
    priority_score FLOAT DEFAULT 0.0,
    priority_level VARCHAR(50) DEFAULT 'Low', -- 'Critical', 'High', 'Medium', 'Low'
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'
    source VARCHAR(50) DEFAULT 'WhatsApp',
    assigned_team_id VARCHAR(255),
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE affected_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_reports ENABLE ROW LEVEL SECURITY;

-- Default permissive read policies for authenticated and anon users for demo purposes
CREATE POLICY "Public Read Disasters" ON disasters FOR SELECT USING (true);
CREATE POLICY "Public Read Areas" ON affected_areas FOR SELECT USING (true);
CREATE POLICY "Public Read Resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Public Read Requests" ON resource_requests FOR SELECT USING (true);
CREATE POLICY "Public Read Allocations" ON allocations FOR SELECT USING (true);
CREATE POLICY "Public Read Rescue Teams" ON rescue_teams FOR SELECT USING (true);
CREATE POLICY "Public Read Vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Public Read Alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Read Reports" ON disaster_reports FOR SELECT USING (true);

-- Allow authenticated/admin operations
CREATE POLICY "Admin All Disasters" ON disasters FOR ALL USING (true);
CREATE POLICY "Admin All Areas" ON affected_areas FOR ALL USING (true);
CREATE POLICY "Admin All Resources" ON resources FOR ALL USING (true);
CREATE POLICY "Admin All Requests" ON resource_requests FOR ALL USING (true);
CREATE POLICY "Admin All Allocations" ON allocations FOR ALL USING (true);
CREATE POLICY "Admin All Rescue Teams" ON rescue_teams FOR ALL USING (true);
CREATE POLICY "Admin All Vehicles" ON vehicles FOR ALL USING (true);
CREATE POLICY "Admin All Alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Admin All Users" ON users FOR ALL USING (true);
CREATE POLICY "Admin All Reports" ON disaster_reports FOR ALL USING (true);
