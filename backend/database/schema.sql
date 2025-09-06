-- User Profile Table
-- File: backend/database/schema.sql

CREATE TABLE IF NOT EXISTS user_profile (
    user_id TEXT PRIMARY KEY,              -- UUID as TEXT for SQLite
    name TEXT NOT NULL,                    -- Player's name or in-world alias
    age INTEGER,                           -- Age at time of transport (e.g., 28)
    gender TEXT,                           -- "male", "female", "nonbinary", etc.
    ethnicity TEXT,                        -- Player's ethnicity
    native_languages TEXT,                 -- JSON array: ["English", "Russian"]
    profession TEXT,                       -- Real-world job (impacts survival logic)
    items_carried TEXT,                    -- JSON array: ["wallet", "smartphone", "keys"]
    physical_description TEXT,             -- Freeform description
    personality_traits TEXT,               -- JSON: {"curious": true, "cautious": false}
    region_selected TEXT,                  -- Geographic region chosen
    year_selected INTEGER,                 -- Specific year (e.g., 1204)
    start_civ_id INTEGER,                  -- ID of starting civilization
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);

