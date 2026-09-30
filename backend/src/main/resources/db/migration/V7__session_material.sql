ALTER TABLE study_sessions ADD COLUMN material_id VARCHAR(160);
ALTER TABLE study_sessions ADD CONSTRAINT fk_session_material
    FOREIGN KEY (material_id) REFERENCES study_materials(id) ON DELETE CASCADE;
CREATE INDEX idx_session_material ON study_sessions(material_id);
