-- Thiran Event Management System Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (for fresh setup)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

-- Table: participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
    phone_number VARCHAR(15),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Table: auth_tokens (for OTP)
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    token VARCHAR(10) NOT NULL,
    token_type VARCHAR(20) DEFAULT 'otp' CHECK (token_type IN ('otp', 'magic_link')),
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('registration', 'login')),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: sessions (JWT sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    jwt_token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('individual', 'team')),
    max_team_size INTEGER,
    min_team_size INTEGER,
    registration_deadline TIMESTAMP NOT NULL,
    event_date TIMESTAMP NOT NULL,
    venue VARCHAR(200),
    max_participants INTEGER,
    current_registrations INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    rules TEXT,
    prize_details TEXT,
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    event_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_size_check CHECK (
        (event_type = 'team' AND max_team_size IS NOT NULL AND min_team_size IS NOT NULL) OR
        (event_type = 'individual' AND max_team_size IS NULL AND min_team_size IS NULL)
    )
);

-- Table: teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    team_leader_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, team_name)
);

-- Table: team_members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, participant_id)
);

-- Table: event_registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    registration_status VARCHAR(20) DEFAULT 'registered' CHECK (registration_status IN ('registered', 'cancelled', 'attended')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, participant_id)
);

-- Table: activity_logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_roll_number ON participants(roll_number);
CREATE INDEX idx_participants_is_verified ON participants(is_verified);

CREATE INDEX idx_auth_tokens_participant ON auth_tokens(participant_id);
CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_purpose ON auth_tokens(purpose);

CREATE INDEX idx_sessions_participant ON sessions(participant_id);
CREATE INDEX idx_sessions_token ON sessions(jwt_token);
CREATE INDEX idx_sessions_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_deadline ON events(registration_deadline);
CREATE INDEX idx_events_category ON events(event_category);
CREATE INDEX idx_events_type ON events(event_type);

CREATE INDEX idx_teams_event ON teams(event_id);
CREATE INDEX idx_teams_leader ON teams(team_leader_id);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_participant ON team_members(participant_id);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_participant ON event_registrations(participant_id);
CREATE INDEX idx_registrations_team ON event_registrations(team_id);
CREATE INDEX idx_registrations_status ON event_registrations(registration_status);

CREATE INDEX idx_activity_logs_participant ON activity_logs(participant_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update event registration count
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.registration_status = 'registered' THEN
        UPDATE events SET current_registrations = current_registrations + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.registration_status = 'registered' AND NEW.registration_status = 'cancelled' THEN
        UPDATE events SET current_registrations = current_registrations - 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.registration_status = 'cancelled' AND NEW.registration_status = 'registered' THEN
        UPDATE events SET current_registrations = current_registrations + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' AND OLD.registration_status = 'registered' THEN
        UPDATE events SET current_registrations = current_registrations - 1 WHERE id = OLD.event_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_registration_count
AFTER INSERT OR UPDATE OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION update_event_registration_count();

-- Function to cleanup expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
    DELETE FROM auth_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    UPDATE sessions SET is_active = FALSE WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE;
END;
$$ language 'plpgsql';

COMMENT ON TABLE participants IS 'Stores participant information';
COMMENT ON TABLE auth_tokens IS 'Stores OTP tokens for authentication';
COMMENT ON TABLE sessions IS 'Stores active JWT sessions';
COMMENT ON TABLE events IS 'Stores event information';
COMMENT ON TABLE teams IS 'Stores team information for team events';
COMMENT ON TABLE team_members IS 'Stores team membership';
COMMENT ON TABLE event_registrations IS 'Stores event registrations';
COMMENT ON TABLE activity_logs IS 'Stores activity audit trail';

-- Grant privileges (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO thiran_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO thiran_user;
