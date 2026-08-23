-- FaqItem.answer becomes rich text (sanitized HTML per locale).
--
-- Existing rows hold plain text, which would render as a single unstyled run
-- once the field is piped through dangerouslySetInnerHTML. Wrap each locale in
-- a paragraph so nothing changes visually, escaping the three characters that
-- would otherwise be reinterpreted as markup. Rows that already start with a
-- tag are left alone, which makes this migration safe to run twice.
UPDATE "FaqItem"
SET answer = (
  SELECT jsonb_object_agg(
    key,
    CASE
      WHEN value #>> '{}' ~ '^\s*<' THEN value
      ELSE to_jsonb(
        '<p>' ||
        replace(
          replace(
            replace(
              replace(value #>> '{}', '&', '&amp;'),
            '<', '&lt;'),
          '>', '&gt;'),
        E'\n', '<br>') ||
        '</p>'
      )
    END
  )
  FROM jsonb_each("FaqItem".answer)
)
WHERE answer IS NOT NULL
  AND jsonb_typeof(answer) = 'object'
  AND answer <> '{}'::jsonb;
