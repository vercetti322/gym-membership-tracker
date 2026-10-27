-- Migration number: 0003
-- Add optional member profile details and photo storage.

ALTER TABLE member_details
ADD COLUMN profession TEXT
CHECK (profession IS NULL OR length(profession) <= 100);

ALTER TABLE member_details
ADD COLUMN address TEXT
CHECK (address IS NULL OR length(address) <= 600);

ALTER TABLE member_details
ADD COLUMN photo_data BLOB;

-- Enforce name and phone length limits on future inserts.
CREATE TRIGGER trg_member_details_insert_length
BEFORE INSERT ON member_details
WHEN length(NEW.name) > 100 OR length(NEW.phone) > 20
BEGIN
  SELECT RAISE(ABORT, 'Name must be <= 100 characters and phone <= 20 characters');
END;

-- Enforce name and phone length limits on future updates.
CREATE TRIGGER trg_member_details_update_length
BEFORE UPDATE OF name, phone ON member_details
WHEN length(NEW.name) > 100 OR length(NEW.phone) > 20
BEGIN
  SELECT RAISE(ABORT, 'Name must be <= 100 characters and phone <= 20 characters');
END;