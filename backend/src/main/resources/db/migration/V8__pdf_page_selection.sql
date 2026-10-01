ALTER TABLE study_materials ADD COLUMN page_types_json TEXT;
ALTER TABLE study_materials ADD COLUMN page_overrides_json TEXT NOT NULL DEFAULT '{}';
