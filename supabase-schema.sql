-- Tabla de usuarios (sin password - se usa Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'company', 'admin')),
  name TEXT NOT NULL,
  phone TEXT,
  cif TEXT,
  contact_person TEXT,
  avatar_url TEXT,
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
ALTER TABLE applications ADD CONSTRAINT unique_offer_worker UNIQUE (offer_id, worker_id);
ALTER TABLE applications DROP CONSTRAINT IF EXISTS unique_offer_worker;
ALTER TABLE applications ADD CONSTRAINT unique_offer_worker UNIQUE (offer_id, worker_id);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- Políticas RLS iniciales (se sobrescriben abajo)
DROP POLICY IF EXISTS "Allow public read for users" ON users;
CREATE POLICY "Allow public read for users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert for users" ON users;
CREATE POLICY "Allow authenticated insert for users" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow own update for users" ON users;
CREATE POLICY "Allow own update for users" ON users FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "Allow admin delete for users" ON users;
CREATE POLICY "Allow admin delete for users" ON users FOR DELETE USING (
  public.is_admin()
);
DROP POLICY IF EXISTS "Allow public read for offers" ON offers;
CREATE POLICY "Allow public read for offers" ON offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow company insert for offers" ON offers;
CREATE POLICY "Allow company insert for offers" ON offers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update for offers" ON offers;
CREATE POLICY "Allow authenticated update for offers" ON offers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow admin delete for offers" ON offers;
CREATE POLICY "Allow admin delete for offers" ON offers FOR DELETE USING (
  public.is_admin()
);
DROP POLICY IF EXISTS "Allow public read for applications" ON applications;
CREATE POLICY "Allow public read for applications" ON applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow worker insert for applications" ON applications;
CREATE POLICY "Allow worker insert for applications" ON applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update for applications" ON applications;
CREATE POLICY "Allow authenticated update for applications" ON applications FOR UPDATE USING (true);
-- Tabla de notificaciones
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
-- Password resets
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
-- Conversaciones
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
-- Mensajes
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
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;
CREATE POLICY "Participants can insert messages" ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Participants can mark messages as read" ON messages;
CREATE POLICY "Participants can mark messages as read" ON messages FOR UPDATE
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()
  ));
-- Reviews
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
-- Storage bucket para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket para CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Columna para CV en usuarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Tabla de reportes
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

CREATE POLICY "Authenticated users can insert reports" ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage reports" ON reports FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can update reports" ON reports FOR UPDATE
  USING (public.is_admin());
-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, phone, cif, contact_person)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'cif',
    NEW.raw_user_meta_data->>'contact_person'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Función helper is_admin (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;
-- ============================================================
-- POLÍTICAS RLS ENDURECIDAS
-- ============================================================
-- USERS: propio usuario, admin, o empresa/trabajador vinculados por aplicación
DROP POLICY IF EXISTS "Allow public read for users" ON users;
DROP POLICY IF EXISTS "Users can read own data or admin read all" ON users;
CREATE POLICY "Users can read own data or admin read all" ON users FOR SELECT
  USING (
    id = auth.uid() OR
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN offers o ON a.offer_id = o.id
      WHERE (a.worker_id = users.id AND o.company_id = auth.uid())
         OR (o.company_id = users.id AND a.worker_id = auth.uid())
    )
  );
-- OFFERS: empresa propietaria o admin
DROP POLICY IF EXISTS "Allow authenticated update for offers" ON offers;
DROP POLICY IF EXISTS "Company can update own offers" ON offers;
CREATE POLICY "Company can update own offers" ON offers FOR UPDATE
  USING (company_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Allow company insert for offers" ON offers;
DROP POLICY IF EXISTS "Company can insert offers" ON offers;
CREATE POLICY "Company can insert offers" ON offers FOR INSERT
  WITH CHECK (company_id = auth.uid());
-- APPLICATIONS: trabajador, empresa de la oferta, o admin
DROP POLICY IF EXISTS "Allow public read for applications" ON applications;
DROP POLICY IF EXISTS "Users see own applications or their offers' apps" ON applications;
CREATE POLICY "Users see own applications or their offers' apps" ON applications FOR SELECT
  USING (worker_id = auth.uid() OR
         offer_id IN (SELECT id FROM offers WHERE company_id = auth.uid()) OR
         public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated update for applications" ON applications;
DROP POLICY IF EXISTS "Company can update their offers' applications" ON applications;
CREATE POLICY "Company can update their offers' applications" ON applications FOR UPDATE
  USING (offer_id IN (SELECT id FROM offers WHERE company_id = auth.uid()));
DROP POLICY IF EXISTS "Worker can delete own applications" ON applications;
CREATE POLICY "Worker can delete own applications" ON applications FOR DELETE
  USING (worker_id = auth.uid());
-- NOTIFICATIONS: propio usuario o empresa hacia trabajador que aplicó
DROP POLICY IF EXISTS "Allow public read for notifications" ON notifications;
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow authenticated insert for notifications" ON notifications;
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN offers o ON a.offer_id = o.id
      WHERE a.worker_id = user_id AND o.company_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Allow authenticated update for notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

  -- 1. Eliminar duplicados (conserva la más reciente)
DELETE FROM applications a USING (
  SELECT id, offer_id, worker_id,
    ROW_NUMBER() OVER (PARTITION BY offer_id, worker_id ORDER BY applied_at DESC) AS rn
  FROM applications
) dup
WHERE a.id = dup.id AND dup.rn > 1;
-- 2. Crear la constraint única
ALTER TABLE applications ADD CONSTRAINT unique_offer_worker UNIQUE (offer_id, worker_id);

DROP POLICY IF EXISTS "Worker can delete own applications" ON applications;
CREATE POLICY "Worker can delete own applications" ON applications FOR DELETE
  USING (worker_id = auth.uid());

  ALTER TABLE users ADD COLUMN location TEXT;
  ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN company_name TEXT;

-- Eliminar TODAS las políticas de DELETE existentes
DROP POLICY IF EXISTS "Allow admin delete for offers" ON offers;
DROP POLICY IF EXISTS "Company or admin can delete offers" ON offers;
DROP POLICY IF EXISTS "Worker can delete own applications" ON applications;
DROP POLICY IF EXISTS "Admin can delete applications" ON applications;
DROP POLICY IF EXISTS "Worker or admin can delete applications" ON applications;
DROP POLICY IF EXISTS "Participants can delete conversations" ON conversations;
DROP POLICY IF EXISTS "Participants or admin can delete conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can delete messages" ON messages;
DROP POLICY IF EXISTS "Participants or admin can delete messages" ON messages;
-- Crear nuevas políticas
CREATE POLICY "Company or admin can delete offers" ON offers FOR DELETE
  USING (company_id = auth.uid() OR public.is_admin());
CREATE POLICY "Worker or admin can delete applications" ON applications FOR DELETE
  USING (worker_id = auth.uid() OR public.is_admin());
CREATE POLICY "Participants or admin can delete conversations" ON conversations FOR DELETE
  USING (company_id = auth.uid() OR worker_id = auth.uid() OR public.is_admin());
CREATE POLICY "Participants or admin can delete messages" ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE company_id = auth.uid() OR worker_id = auth.uid()
    ) OR public.is_admin()
  );
  DROP POLICY IF EXISTS "Participants or admin can delete reviews" ON reviews;
CREATE POLICY "Participants or admin can delete reviews" ON reviews FOR DELETE
  USING (reviewer_id = auth.uid() OR reviewed_id = auth.uid() OR public.is_admin());

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('offers','applications','conversations','messages','reviews')
ORDER BY tablename, policyname;

CREATE OR REPLACE FUNCTION public.delete_offer_with_deps(offer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE offer_id = delete_offer_with_deps.offer_id);
  DELETE FROM public.conversations WHERE offer_id = delete_offer_with_deps.offer_id;
  DELETE FROM public.applications WHERE offer_id = delete_offer_with_deps.offer_id;
  DELETE FROM public.reviews WHERE offer_id = delete_offer_with_deps.offer_id;
  DELETE FROM public.offers WHERE id = delete_offer_with_deps.offer_id;
END;
$$;
