ALTER TABLE curator_specimens ADD COLUMN audioUrl TEXT;
ALTER TABLE curator_specimens ADD COLUMN audioKey TEXT;
ALTER TABLE curator_specimens ADD COLUMN displayOrder INTEGER NOT NULL DEFAULT 0;
ALTER TABLE curator_specimens ADD COLUMN visible INTEGER NOT NULL DEFAULT 1;
ALTER TABLE curator_specimens ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
