CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  refresh_token TEXT DEFAULT '',
  reputation INT DEFAULT 0,
  reports_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT DEFAULT '',
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'poorly_lit', 'harassment', 'theft', 'assault',
    'suspicious_activity', 'unsafe_infrastructure', 'other'
  )),
  severity INT NOT NULL CHECK (severity BETWEEN 1 AND 5),
  description TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  net_score INT GENERATED ALWAYS AS (upvotes - downvotes) STORED,
  is_verified BOOLEAN DEFAULT FALSE,
  hour_of_day INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE report_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(4) CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

CREATE TABLE danger_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centroid GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters FLOAT NOT NULL,
  report_count INT NOT NULL,
  gravity_score FLOAT NOT NULL,
  dominant_category VARCHAR(50),
  last_computed TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE route_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  origin GEOGRAPHY(POINT, 4326) NOT NULL,
  destination GEOGRAPHY(POINT, 4326) NOT NULL,
  route_geojson JSONB NOT NULL,
  safety_score FLOAT NOT NULL,
  distance_meters FLOAT NOT NULL,
  algorithm_used VARCHAR(50) DEFAULT 'bidirectional_astar',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_location ON reports USING GIST(location);
CREATE INDEX idx_clusters_centroid ON danger_clusters USING GIST(centroid);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
CREATE INDEX idx_reports_expires ON reports(expires_at);
