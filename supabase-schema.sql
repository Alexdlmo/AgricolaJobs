-- ============================================================
-- ESQUEMA COMPLETO AGRICOLA JOBS
-- ============================================================
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'company', 'admin')),
  name TEXT NOT NULL,
  phone TEXT,
  cif TEXT,
  contact_person TEXT,
  avatar_url TEXT,
  location TEXT,
  company_name TEXT,
  cv_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
-- Tabla de ofertas
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  salary TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tabla de aplicaciones
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Evitar duplicados: un worker solo puede aplicar una vez por oferta
DELETE FROM applications a USING (
  SELECT id, offer_id, worker_id,
    ROW_NUMBER() OVER (PARTITION BY offer_id, worker_id ORDER BY applied_at DESC) AS rn
  FROM applications
) dup WHERE a.id = dup.id AND dup.rn > 1;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS unique_offer_worker;
ALTER TABLE applications ADD CONSTRAINT unique_offer_worker UNIQUE (offer_id, worker_id);
-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- Políticas RLS iniciales
DROP POLICY IF EXISTS "Allow public read for users" ON users;
CREATE POLICY "Allow public read for users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert for users" ON users;
CREATE POLICY "Allow authenticated insert for users" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow own update for users" ON users;
CREATE POLICY "Allow own update for users" ON users FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "Allow admin delete for users" ON users;
CREATE POLICY "Allow admin delete for users" ON users FOR DELETE USING (public.is_admin());
DROP POLICY IF EXISTS "Allow public read for offers" ON offers;
CREATE POLICY "Allow public read for offers" ON offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow company insert for offers" ON offers;
CREATE POLICY "Allow company insert for offers" ON offers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update for offers" ON offers;
CREATE POLICY "Allow authenticated update for offers" ON offers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow admin delete for offers" ON offers;
CREATE POLICY "Allow admin delete for offers" ON offers FOR DELETE USING (public.is_admin());
DROP POLICY IF EXISTS "Allow public read for applications" ON applications;
CREATE POLICY "Allow public read for applications" ON applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow worker insert for applications" ON applications;
CREATE POLICY "Allow worker insert for applications" ON applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update for applications" ON applications;
CREATE POLICY "Allow authenticated update for applications" ON applications FOR UPDATE USING (true);
-- ============================================================
-- NOTIFICACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read for notifications" ON notifications;
CREATE POLICY "Allow public read for notifications" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert for notifications" ON notifications;
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update for notifications" ON notifications;
CREATE POLICY "Allow authenticated update for notifications" ON notifications FOR UPDATE USING (true);
-- ============================================================
-- PASSWORD RESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only service_role can manage password_resets" ON password_resets;
CREATE POLICY "Only service_role can manage password_resets" ON password_resets
  FOR ALL USING (false) WITH CHECK (false);
-- ============================================================
-- CONVERSACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  company_id UUID REFERENCES users(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
CREATE POLICY "Participants can view conversations" ON conversations FOR SELECT
  USING (company_id = auth.uid() OR worker_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated can create conversations" ON conversations;
CREATE POLICY "Authenticated can create conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
-- ============================================================
-- MENSAJES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages" ON messages FOR SELECT
  USING (conversation_id IN (SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()));
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;
CREATE POLICY "Participants can insert messages" ON messages FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()));
DROP POLICY IF EXISTS "Participants can mark messages as read" ON messages;
CREATE POLICY "Participants can mark messages as read" ON messages FOR UPDATE
  USING (conversation_id IN (SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()));
-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('worker', 'company')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public for reading" ON reviews;
CREATE POLICY "Reviews are public for reading" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
-- ============================================================
-- REPORTES
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES users(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON reports;
CREATE POLICY "Authenticated users can insert reports" ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admin can manage reports" ON reports;
CREATE POLICY "Admin can manage reports" ON reports FOR SELECT
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admin can update reports" ON reports;
CREATE POLICY "Admin can update reports" ON reports FOR UPDATE
  USING (public.is_admin());
-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- TRIGGER: Crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, phone, cif, contact_person)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'cif',
    NEW.raw_user_meta_data->>'contact_person'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================
-- FUNCIÓN HELPER is_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'); $$;
-- ============================================================
-- FUNCIÓN ELIMINAR OFERTA CON DEPENDENCIAS
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_offer_with_deps(p_offer_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE offer_id = p_offer_id);
  DELETE FROM public.conversations WHERE offer_id = p_offer_id;
  DELETE FROM public.applications WHERE offer_id = p_offer_id;
  DELETE FROM public.reviews WHERE offer_id = p_offer_id;
  DELETE FROM public.offers WHERE id = p_offer_id;
END;
$$;
-- ============================================================
-- POLÍTICAS RLS ENDURECIDAS
-- ============================================================
-- USERS
DROP POLICY IF EXISTS "Allow public read for users" ON users;
DROP POLICY IF EXISTS "Users can read own data or admin read all" ON users;
CREATE POLICY "Users can read own data or admin read all" ON users FOR SELECT
  USING (
    id = auth.uid() OR public.is_admin() OR
    EXISTS (SELECT 1 FROM applications a JOIN offers o ON a.offer_id = o.id
            WHERE (a.worker_id = users.id AND o.company_id = auth.uid())
               OR (o.company_id = users.id AND a.worker_id = auth.uid()))
  );
-- OFFERS
DROP POLICY IF EXISTS "Allow authenticated update for offers" ON offers;
DROP POLICY IF EXISTS "Company can update own offers" ON offers;
CREATE POLICY "Company can update own offers" ON offers FOR UPDATE
  USING (company_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Allow company insert for offers" ON offers;
DROP POLICY IF EXISTS "Company can insert offers" ON offers;
CREATE POLICY "Company can insert offers" ON offers FOR INSERT
  WITH CHECK (company_id = auth.uid());
DROP POLICY IF EXISTS "Allow admin delete for offers" ON offers;
DROP POLICY IF EXISTS "Company or admin can delete offers" ON offers;
CREATE POLICY "Company or admin can delete offers" ON offers FOR DELETE
  USING (company_id = auth.uid() OR public.is_admin());
-- APPLICATIONS
DROP POLICY IF EXISTS "Allow public read for applications" ON applications;
DROP POLICY IF EXISTS "Users see own applications or their offers' apps" ON applications;
CREATE POLICY "Users see own applications or their offers' apps" ON applications FOR SELECT
  USING (worker_id = auth.uid() OR offer_id IN (SELECT id FROM offers WHERE company_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated update for applications" ON applications;
DROP POLICY IF EXISTS "Company can update their offers' applications" ON applications;
CREATE POLICY "Company can update their offers' applications" ON applications FOR UPDATE
  USING (offer_id IN (SELECT id FROM offers WHERE company_id = auth.uid()));
DROP POLICY IF EXISTS "Allow admin delete for users" ON users;
DROP POLICY IF EXISTS "Worker can delete own applications" ON applications;
DROP POLICY IF EXISTS "Admin can delete applications" ON applications;
DROP POLICY IF EXISTS "Worker or admin can delete applications" ON applications;
CREATE POLICY "Worker or admin can delete applications" ON applications FOR DELETE
  USING (worker_id = auth.uid() OR public.is_admin());
-- CONVERSATIONS
DROP POLICY IF EXISTS "Participants can delete conversations" ON conversations;
DROP POLICY IF EXISTS "Participants or admin can delete conversations" ON conversations;
CREATE POLICY "Participants or admin can delete conversations" ON conversations FOR DELETE
  USING (company_id = auth.uid() OR worker_id = auth.uid() OR public.is_admin());
-- MESSAGES
DROP POLICY IF EXISTS "Participants can delete messages" ON messages;
DROP POLICY IF EXISTS "Participants or admin can delete messages" ON messages;
CREATE POLICY "Participants or admin can delete messages" ON messages FOR DELETE
  USING (conversation_id IN (SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()) OR public.is_admin());
-- REVIEWS
DROP POLICY IF EXISTS "Participants or admin can delete reviews" ON reviews;
CREATE POLICY "Participants or admin can delete reviews" ON reviews FOR DELETE
  USING (reviewer_id = auth.uid() OR reviewed_id = auth.uid() OR public.is_admin());
-- NOTIFICATIONS
DROP POLICY IF EXISTS "Allow public read for notifications" ON notifications;
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow authenticated insert for notifications" ON notifications;
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM applications a JOIN offers o ON a.offer_id = o.id
    WHERE a.worker_id = user_id AND o.company_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Allow authenticated update for notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());


  -- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/smjbepcthtzqtkjjhttr/sql/new
CREATE OR REPLACE FUNCTION public.get_company_applicants(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'offer_id', a.offer_id,
      'worker_id', a.worker_id,
      'status', a.status,
      'applied_at', a.applied_at,
      'worker', json_build_object(
        'id', u.id,
        'name', u.name,
        'phone', u.phone,
        'email', u.email,
        'cv_url', u.cv_url
      )
    )
    ORDER BY a.applied_at DESC
  ) INTO result
  FROM public.applications a
  JOIN public.users u ON u.id = a.worker_id
  WHERE a.offer_id IN (SELECT id FROM public.offers WHERE company_id = p_company_id)
    AND p_company_id = auth.uid();
  RETURN COALESCE(result, '[]'::json);
END;
$$;
DROP FUNCTION IF EXISTS public.get_company_applicants;
CREATE FUNCTION public.get_company_applicants(p_company_id UUID)
RETURNS SETOF JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT row_to_json(r.*) FROM (
    SELECT 
      a.id,
      a.offer_id,
      a.worker_id,
      a.status,
      a.applied_at,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'phone', u.phone,
        'email', u.email,
        'cv_url', u.cv_url
      ) AS worker
    FROM public.applications a
    JOIN public.users u ON u.id = a.worker_id
    WHERE a.offer_id IN (SELECT id FROM public.offers WHERE company_id = p_company_id)
      AND p_company_id = auth.uid()
    ORDER BY a.applied_at DESC
  ) r;
END;
$$;
DROP POLICY IF EXISTS "Allow authenticated insert for notifications" ON notifications;
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN offers o ON a.offer_id = o.id
      WHERE ((a.worker_id = user_id AND o.company_id = auth.uid())
          OR (a.worker_id = auth.uid() AND o.company_id = user_id))
    )
  );

DROP FUNCTION IF EXISTS public.get_company_applicants;
CREATE FUNCTION public.get_company_applicants(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $FUNC$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(sub), '[]'::json) INTO result
  FROM (
    SELECT 
      a.id, a.offer_id, a.worker_id, a.status, a.applied_at,
      json_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'email', u.email, 'cv_url', u.cv_url) AS worker
    FROM public.applications a
    JOIN public.users u ON u.id = a.worker_id
    WHERE a.offer_id IN (SELECT id FROM public.offers WHERE company_id = p_company_id)
      AND p_company_id = auth.uid()
    ORDER BY a.applied_at DESC
  ) sub;
  RETURN result;
END;
$FUNC$;
--Y además ejecuta esto para arreglar la RLS de notificaciones:
DROP POLICY IF EXISTS "Allow authenticated insert for notifications" ON notifications;
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN offers o ON a.offer_id = o.id
      WHERE ((a.worker_id = user_id AND o.company_id = auth.uid())
          OR (a.worker_id = auth.uid() AND o.company_id = user_id))
    )
  );

  -- 1. users: cualquier usuario autenticado puede leer datos básicos
DROP POLICY IF EXISTS "Users can read own data or admin read all" ON users;
CREATE POLICY "Users can read own data or admin read all" ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);
-- 2. applications: sin cambios, ya funciona
-- (ya permite a la empresa ver aplicaciones de sus ofertas)
-- 3. notifications: permitir insert en ambas direcciones
DROP POLICY IF EXISTS "Allow authenticated insert for notifications" ON notifications;
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN offers o ON a.offer_id = o.id
      WHERE ((a.worker_id = user_id AND o.company_id = auth.uid())
          OR (a.worker_id = auth.uid() AND o.company_id = user_id))
    )
  );

  1. Verificar qué políticas RLS existen actualmente en users
Ejecuta esto en el SQL Editor de Supabase:
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY tablename, policyname;
Dime qué resultado te da.
2. Si la política no está, forzar la creación
Ejecuta esto para asegurar que cualquier usuario autenticado pueda leer datos básicos de users:
DROP POLICY IF EXISTS "Allow public read for users" ON users;
DROP POLICY IF EXISTS "Users can read own data or admin read all" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);
3. También verificar políticas en notifications
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY tablename, policyname;

DROP POLICY IF EXISTS "Allow public read for users" ON users;
DROP POLICY IF EXISTS "Users can read own data or admin read all" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);


SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

DROP FUNCTION IF EXISTS public.get_company_applicants;

NOTIFY pgrst, 'reload schema';

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_id UUID REFERENCES users(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';

ALTER TABLE reports ALTER COLUMN description DROP NOT NULL;
NOTIFY pgrst, 'reload schema';

-- Asegurar columnas existan
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
-- Verificar constraints existentes
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid = 'reports'::regclass;


-- Eliminar FK duplicada
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
-- Asegurar columna reviewed_at exista
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';