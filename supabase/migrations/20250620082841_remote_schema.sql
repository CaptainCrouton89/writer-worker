

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_user_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO user_preferences (user_id, username)
  VALUES (NEW.id, generate_anonymous_username());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_anonymous_username"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_username TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_username := 'anonymous' || CASE WHEN counter = 1 THEN '' ELSE '_' || counter END;
        
        -- Check if username already exists
        IF NOT EXISTS (SELECT 1 FROM user_preferences WHERE username = new_username) THEN
            RETURN new_username;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_anonymous_username"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_branch_embedding"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This would require a custom implementation or webhook to OpenAI
  -- For now, just return the new row unchanged
  -- In production, you'd want to trigger an edge function to generate embeddings
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_branch_embedding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_chapters_hybrid"("query_embedding" "extensions"."vector", "query_text" "text", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 10, "match_offset" integer DEFAULT 0) RETURNS TABLE("chapter_id" "text", "chapter_title" "text", "chapter_content" "text", "chapter_description" "text", "chapter_index" integer, "chapter_author" "text", "chapter_author_username" "text", "chapter_created_at" "text", "chapter_updated_at" "text", "chapter_parent_id" "text", "sequence_id" "text", "sequence_name" "text", "sequence_description" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id::TEXT AS chapter_id,
        COALESCE(c.title, '')::TEXT AS chapter_title,
        c.content::TEXT AS chapter_content,
        COALESCE(c.description, '')::TEXT AS chapter_description,
        csm.chapter_index AS chapter_index,
        c.author::TEXT AS chapter_author,
        COALESCE(up.username, 'Anonymous')::TEXT AS chapter_author_username,
        COALESCE(c.created_at::TEXT, '') AS chapter_created_at,
        COALESCE(c.updated_at::TEXT, '') AS chapter_updated_at,
        COALESCE(c.parent_id::TEXT, '') AS chapter_parent_id,
        s.id::TEXT AS sequence_id,
        COALESCE(s.name, '')::TEXT AS sequence_name,
        COALESCE(s.description, '')::TEXT AS sequence_description,
        CASE 
            WHEN c.embedding IS NOT NULL THEN
                1 - (c.embedding::VECTOR <=> query_embedding)
            ELSE
                CASE 
                    WHEN c.title IS NOT NULL AND query_text != '' THEN
                        GREATEST(
                            CASE WHEN c.title ILIKE '%' || query_text || '%' THEN 0.9 ELSE 0 END,
                            CASE WHEN c.content ILIKE '%' || query_text || '%' THEN 0.8 ELSE 0 END,
                            similarity(COALESCE(c.title, '') || ' ' || c.content, query_text)
                        )
                    ELSE 0.5
                END
        END AS similarity
    FROM chapters c
    JOIN chapter_sequence_map csm ON c.id = csm.chapter_id
    JOIN sequences s ON csm.sequence_id = s.id
    LEFT JOIN user_preferences up ON c.author = up.user_id
    WHERE 
        (c.embedding IS NOT NULL AND (1 - (c.embedding::VECTOR <=> query_embedding)) > match_threshold)
        OR 
        (c.embedding IS NULL AND (
            c.title ILIKE '%' || query_text || '%' OR 
            c.content ILIKE '%' || query_text || '%' OR
            similarity(COALESCE(c.title, '') || ' ' || c.content, query_text) > match_threshold
        ))
    ORDER BY similarity DESC
    LIMIT match_count
    OFFSET match_offset;
END;
$$;


ALTER FUNCTION "public"."search_chapters_hybrid"("query_embedding" "extensions"."vector", "query_text" "text", "match_threshold" double precision, "match_count" integer, "match_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_sequences_hybrid"("query_embedding" "extensions"."vector", "query_text" "text", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 10, "match_offset" integer DEFAULT 0) RETURNS TABLE("sequence_id" "text", "sequence_created_at" "text", "sequence_created_by" "text", "sequence_description" "text", "sequence_forked_at_chapter_index" integer, "sequence_name" "text", "sequence_parent_sequence_id" "text", "sequence_updated_at" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        s.id::TEXT AS sequence_id,
        COALESCE(s.created_at::TEXT, '') AS sequence_created_at,
        s.created_by::TEXT AS sequence_created_by,
        COALESCE(s.description, '')::TEXT AS sequence_description,
        NULL::INT AS sequence_forked_at_chapter_index,
        COALESCE(s.name, '')::TEXT AS sequence_name,
        NULL::TEXT AS sequence_parent_sequence_id,
        COALESCE(s.updated_at::TEXT, '') AS sequence_updated_at,
        CASE 
            WHEN s.embedding IS NOT NULL THEN
                1 - (s.embedding::VECTOR <=> query_embedding)
            ELSE
                CASE 
                    WHEN s.name IS NOT NULL AND query_text != '' THEN
                        GREATEST(
                            CASE WHEN s.name ILIKE '%' || query_text || '%' THEN 0.9 ELSE 0 END,
                            CASE WHEN s.description ILIKE '%' || query_text || '%' THEN 0.8 ELSE 0 END,
                            similarity(s.name || ' ' || COALESCE(s.description, ''), query_text)
                        )
                    ELSE 0.5
                END
        END AS similarity
    FROM sequences s
    WHERE 
        (s.embedding IS NOT NULL AND (1 - (s.embedding::VECTOR <=> query_embedding)) > match_threshold)
        OR 
        (s.embedding IS NULL AND (
            s.name ILIKE '%' || query_text || '%' OR 
            s.description ILIKE '%' || query_text || '%' OR
            similarity(s.name || ' ' || COALESCE(s.description, ''), query_text) > match_threshold
        ))
    ORDER BY similarity DESC
    LIMIT match_count
    OFFSET match_offset;
END;
$$;


ALTER FUNCTION "public"."search_sequences_hybrid"("query_embedding" "extensions"."vector", "query_text" "text", "match_threshold" double precision, "match_count" integer, "match_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chapter_sequence_map" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "sequence_id" "uuid" NOT NULL,
    "chapter_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."chapter_sequence_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author" "uuid" NOT NULL,
    "title" character varying(255),
    "content" "text" NOT NULL,
    "description" "text",
    "embedding" "extensions"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "parent_id" "uuid",
    "generation_status" "text" DEFAULT 'completed'::"text",
    "generation_progress" integer DEFAULT 100,
    CONSTRAINT "chapters_generation_progress_check" CHECK ((("generation_progress" >= 0) AND ("generation_progress" <= 100))),
    CONSTRAINT "chapters_generation_status_check" CHECK (("generation_status" = ANY (ARRAY['generating'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."chapters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "author" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sequence_id" "uuid",
    "chapter_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "user_preferences" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "current_step" "text",
    "progress" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "generation_jobs_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "generation_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."generation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sequences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255),
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "embedding" "extensions"."vector"(1536)
);


ALTER TABLE "public"."sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme" character varying(10) DEFAULT 'light'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" character varying(50) DEFAULT 'anonymous'::character varying NOT NULL,
    CONSTRAINT "user_preferences_theme_check" CHECK ((("theme")::"text" = ANY ((ARRAY['light'::character varying, 'dark'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."sequences"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_sequence_map"
    ADD CONSTRAINT "chapter_sequence_map_chapter_id_sequence_id_key" UNIQUE ("chapter_id", "sequence_id");



ALTER TABLE ONLY "public"."chapter_sequence_map"
    ADD CONSTRAINT "chapter_sequence_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_sequence_map"
    ADD CONSTRAINT "chapter_sequence_map_sequence_id_chapter_index_key" UNIQUE ("sequence_id", "chapter_index");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "unique_username" UNIQUE ("username");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



CREATE INDEX "chapters_embedding_hnsw_idx" ON "public"."chapters" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "chapters_text_search_idx" ON "public"."chapters" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((((COALESCE("title", ''::character varying))::"text" || ' '::"text") || COALESCE("content", ''::"text")) || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_branches_created_at" ON "public"."sequences" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_branches_created_by" ON "public"."sequences" USING "btree" ("created_by");



CREATE INDEX "idx_branches_description_gin" ON "public"."sequences" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_branches_embedding" ON "public"."sequences" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "idx_branches_embedding_hnsw" ON "public"."sequences" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "idx_branches_name_gin" ON "public"."sequences" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("name")::"text"));



CREATE INDEX "idx_chapter_sequence_map_chapter_id" ON "public"."chapter_sequence_map" USING "btree" ("chapter_id");



CREATE INDEX "idx_chapter_sequence_map_sequence_id" ON "public"."chapter_sequence_map" USING "btree" ("sequence_id");



CREATE INDEX "idx_chapter_sequence_map_sequence_index" ON "public"."chapter_sequence_map" USING "btree" ("sequence_id", "chapter_index");



CREATE INDEX "idx_chapters_author" ON "public"."chapters" USING "btree" ("author");



CREATE INDEX "idx_chapters_generation_status" ON "public"."chapters" USING "btree" ("generation_status");



CREATE INDEX "idx_chapters_parent_id" ON "public"."chapters" USING "btree" ("parent_id");



CREATE INDEX "idx_comments_author" ON "public"."comments" USING "btree" ("author");



CREATE INDEX "idx_comments_chapter_id" ON "public"."comments" USING "btree" ("chapter_id");



CREATE INDEX "idx_comments_parent_id" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "idx_generation_jobs_created_at" ON "public"."generation_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_generation_jobs_sequence_id" ON "public"."generation_jobs" USING "btree" ("sequence_id");



CREATE INDEX "idx_generation_jobs_status" ON "public"."generation_jobs" USING "btree" ("status");



CREATE INDEX "idx_generation_jobs_user_id" ON "public"."generation_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_sequences_description_gin" ON "public"."sequences" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_sequences_embedding" ON "public"."sequences" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "idx_sequences_name_gin" ON "public"."sequences" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("name")::"text"));



CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_username" ON "public"."user_preferences" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "handle_chapter_sequence_map_updated_at" BEFORE UPDATE ON "public"."chapter_sequence_map" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_branches_updated_at" BEFORE UPDATE ON "public"."sequences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chapters_updated_at" BEFORE UPDATE ON "public"."chapters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_generation_jobs_updated_at" BEFORE UPDATE ON "public"."generation_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."sequences"
    ADD CONSTRAINT "branches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_sequence_map"
    ADD CONSTRAINT "chapter_sequence_map_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_sequence_map"
    ADD CONSTRAINT "chapter_sequence_map_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_author_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view branches" ON "public"."sequences" FOR SELECT USING (true);



CREATE POLICY "Anyone can view chapters" ON "public"."chapters" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can insert comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author"));



CREATE POLICY "Authors can delete own branches" ON "public"."sequences" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Authors can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "author"));



CREATE POLICY "Authors can insert branches" ON "public"."sequences" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Authors can update own branches" ON "public"."sequences" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Authors can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author"));



CREATE POLICY "Chapter sequence mappings are viewable by everyone" ON "public"."chapter_sequence_map" FOR SELECT USING (true);



CREATE POLICY "Chapter sequence mappings can be created by authenticated users" ON "public"."chapter_sequence_map" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Chapter sequence mappings can be deleted by authenticated users" ON "public"."chapter_sequence_map" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Chapter sequence mappings can be updated by authenticated users" ON "public"."chapter_sequence_map" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Everyone can view chapters" ON "public"."chapters" FOR SELECT USING (true);



CREATE POLICY "Users can create own generation jobs" ON "public"."generation_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own chapters" ON "public"."chapters" FOR DELETE USING (("auth"."uid"() = "author"));



CREATE POLICY "Users can insert own chapters" ON "public"."chapters" FOR INSERT WITH CHECK (("auth"."uid"() = "author"));



CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own chapters" ON "public"."chapters" FOR UPDATE USING (("auth"."uid"() = "author")) WITH CHECK (("auth"."uid"() = "author"));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own generation jobs" ON "public"."generation_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."chapter_sequence_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generation_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
















































GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";


































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."create_user_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_anonymous_username"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_anonymous_username"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_anonymous_username"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_branch_embedding"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_branch_embedding"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_branch_embedding"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";









GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";






























GRANT ALL ON TABLE "public"."chapter_sequence_map" TO "anon";
GRANT ALL ON TABLE "public"."chapter_sequence_map" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter_sequence_map" TO "service_role";



GRANT ALL ON TABLE "public"."chapters" TO "anon";
GRANT ALL ON TABLE "public"."chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."chapters" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."generation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."sequences" TO "anon";
GRANT ALL ON TABLE "public"."sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."sequences" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
