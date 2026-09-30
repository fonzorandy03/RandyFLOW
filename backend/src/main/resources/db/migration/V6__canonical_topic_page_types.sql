ALTER TABLE topics DROP CONSTRAINT chk_topics_page_type;
ALTER TABLE topics ADD CONSTRAINT chk_topics_page_type
    CHECK (page_type IN ('content', 'cover', 'index', 'separator', 'reference', 'empty'));
