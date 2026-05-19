-- 1) unaccent extension — Türkçe karakter normalize (ş→s, ı→i, ü→u, ...)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) turkish_unaccent text search config — turkish + unaccent filter
DROP TEXT SEARCH CONFIGURATION IF EXISTS turkish_unaccent;
CREATE TEXT SEARCH CONFIGURATION turkish_unaccent ( COPY = turkish );
ALTER TEXT SEARCH CONFIGURATION turkish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, turkish_stem;

-- 3) Generated tsvector column — name (ağırlık A) + description (ağırlık B)
ALTER TABLE "products"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('turkish_unaccent', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('turkish_unaccent', coalesce("description", '')), 'B')
  ) STORED;

-- 4) GIN index — full-text search'ün hızlı çalışması için
CREATE INDEX "products_searchVector_idx" ON "products" USING GIN ("searchVector");