-- =====================================================================
-- MCA Igrejas — segurança em nível de linha (RLS), papéis e triggers
-- Funciona no Supabase (role `authenticated` e schema `auth` existem) e em
-- um Postgres puro de testes (cria a role se faltar; pula o trigger de auth).
-- =====================================================================

-- Roles do Supabase, caso não existam (Postgres local)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;
--> statement-breakpoint

CREATE SCHEMA IF NOT EXISTS app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO authenticated;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO authenticated, anon;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
--> statement-breakpoint

-- ---------- funções auxiliares ----------
-- Usuário atual a partir dos claims do JWT (Supabase e withUser() setam request.jwt.claims)
CREATE OR REPLACE FUNCTION app.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    ), '')::uuid
$$;
--> statement-breakpoint

-- Igrejas em que o usuário tem algum papel ativo
CREATE OR REPLACE FUNCTION app.my_church_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT church_id FROM role_assignments
  WHERE user_id = app.uid() AND (expires_at IS NULL OR expires_at > now())
$$;
--> statement-breakpoint

-- O usuário tem algum dos papéis na igreja (em qualquer escopo)
CREATE OR REPLACE FUNCTION app.has_role(p_church uuid, p_roles role[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM role_assignments
    WHERE church_id = p_church AND user_id = app.uid()
      AND role = ANY (p_roles)
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;
--> statement-breakpoint

-- Grupos de papéis por operação (fonte da verdade também em @mca/core)
CREATE OR REPLACE FUNCTION app.can_read_people(p_church uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.has_role(p_church, ARRAY['admin_igreja','pastor','secretaria','tesouraria','lider_ministerio','lider_celula','professor']::role[])
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.can_write_people(p_church uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.has_role(p_church, ARRAY['admin_igreja','pastor','secretaria']::role[])
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.can_read_sensitive(p_church uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.has_role(p_church, ARRAY['admin_igreja','pastor']::role[])
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.is_admin(p_church uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.has_role(p_church, ARRAY['admin_igreja']::role[])
$$;
--> statement-breakpoint

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;
--> statement-breakpoint

-- ---------- updated_at automático ----------
CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER churches_updated_at BEFORE UPDATE ON churches FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER campuses_updated_at BEFORE UPDATE ON campuses FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
--> statement-breakpoint

-- ---------- perfil criado automaticamente ao registrar no Supabase Auth ----------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    CREATE OR REPLACE FUNCTION app.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name)
      VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
      RETURN NEW;
    END $fn$;
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION app.handle_new_user();
  END IF;
END $$;
--> statement-breakpoint

-- ---------- RLS ----------
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE membership_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- churches: vê as suas; só admin altera. Criação passa pelo onboarding (conexão administrativa).
CREATE POLICY churches_select ON churches FOR SELECT TO authenticated
  USING (id IN (SELECT app.my_church_ids()));
--> statement-breakpoint
CREATE POLICY churches_update ON churches FOR UPDATE TO authenticated
  USING (app.is_admin(id)) WITH CHECK (app.is_admin(id));
--> statement-breakpoint

-- campuses
CREATE POLICY campuses_select ON campuses FOR SELECT TO authenticated
  USING (church_id IN (SELECT app.my_church_ids()));
--> statement-breakpoint
CREATE POLICY campuses_write ON campuses FOR ALL TO authenticated
  USING (app.has_role(church_id, ARRAY['admin_igreja','pastor','secretaria']::role[]))
  WITH CHECK (app.has_role(church_id, ARRAY['admin_igreja','pastor','secretaria']::role[]));
--> statement-breakpoint

-- profiles: o próprio, e colegas da mesma igreja (para listar a equipe)
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (
    id = app.uid()
    OR EXISTS (
      SELECT 1 FROM role_assignments ra
      WHERE ra.user_id = profiles.id AND ra.church_id IN (SELECT app.my_church_ids())
    )
  );
--> statement-breakpoint
CREATE POLICY profiles_insert_own ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = app.uid());
--> statement-breakpoint
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated
  USING (id = app.uid()) WITH CHECK (id = app.uid());
--> statement-breakpoint

-- role_assignments: vê os da própria igreja; só admin gerencia
CREATE POLICY role_assignments_select ON role_assignments FOR SELECT TO authenticated
  USING (user_id = app.uid() OR church_id IN (SELECT app.my_church_ids()));
--> statement-breakpoint
CREATE POLICY role_assignments_admin ON role_assignments FOR ALL TO authenticated
  USING (app.is_admin(church_id)) WITH CHECK (app.is_admin(church_id));
--> statement-breakpoint

-- households
CREATE POLICY households_select ON households FOR SELECT TO authenticated
  USING (app.can_read_people(church_id));
--> statement-breakpoint
CREATE POLICY households_write ON households FOR ALL TO authenticated
  USING (app.can_write_people(church_id)) WITH CHECK (app.can_write_people(church_id));
--> statement-breakpoint

-- people: equipe lê; o membro lê o próprio registro; secretaria/pastor/admin escrevem.
CREATE POLICY people_select ON people FOR SELECT TO authenticated
  USING (app.can_read_people(church_id) OR user_id = app.uid());
--> statement-breakpoint
CREATE POLICY people_insert ON people FOR INSERT TO authenticated
  WITH CHECK (app.can_write_people(church_id));
--> statement-breakpoint
CREATE POLICY people_update ON people FOR UPDATE TO authenticated
  USING (app.can_write_people(church_id)) WITH CHECK (app.can_write_people(church_id));
--> statement-breakpoint
-- Sem DELETE físico: arquivamento é UPDATE de deleted_at.

-- membership_events: restritos só para admin/pastor
CREATE POLICY membership_events_select ON membership_events FOR SELECT TO authenticated
  USING (
    (NOT is_restricted AND app.can_read_people(church_id))
    OR (is_restricted AND app.can_read_sensitive(church_id))
  );
--> statement-breakpoint
CREATE POLICY membership_events_insert ON membership_events FOR INSERT TO authenticated
  WITH CHECK (
    (NOT is_restricted AND app.can_write_people(church_id))
    OR (is_restricted AND app.can_read_sensitive(church_id))
  );
--> statement-breakpoint
-- Eventos não se editam nem se apagam: corrige-se registrando outro evento.

-- audit_logs: só inserção para quem é da igreja; leitura para admin/pastor
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (church_id IN (SELECT app.my_church_ids()) AND user_id = app.uid());
--> statement-breakpoint
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated
  USING (app.can_read_sensitive(church_id));
