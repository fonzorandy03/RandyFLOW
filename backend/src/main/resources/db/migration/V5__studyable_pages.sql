ALTER TABLE topics ADD COLUMN studyable BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE study_materials ADD COLUMN studyable_pages INTEGER NOT NULL DEFAULT 0;
UPDATE study_materials SET studyable_pages = page_count;
