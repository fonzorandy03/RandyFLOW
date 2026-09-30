ALTER TABLE topics ADD COLUMN studyable BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE study_materials ADD COLUMN studyable_pages INTEGER NOT NULL DEFAULT 0;
UPDATE study_materials SET studyable_pages = page_count;

ALTER TABLE topics DROP CONSTRAINT chk_topics_page_type;
ALTER TABLE topics ADD CONSTRAINT chk_topics_page_type
    CHECK (page_type IN ('content', 'cover', 'index', 'separator', 'reference', 'empty'));
