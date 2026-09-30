ALTER TABLE topics
    ADD COLUMN page_type VARCHAR(32) NOT NULL DEFAULT 'content';

ALTER TABLE topics
    ADD CONSTRAINT chk_topics_page_type
    CHECK (page_type IN ('content', 'cover', 'index', 'section-divider', 'blank', 'references', 'exercise'));
