-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'company', 'admin')),
  name TEXT NOT NULL,
  phone TEXT,
  cif TEXT,
  contact_person TEXT,
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

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Allow public read for users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert for users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update for users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow admin delete for users" ON users FOR DELETE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Políticas RLS para offers
CREATE POLICY "Allow public read for offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow company insert for offers" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update for offers" ON offers FOR UPDATE USING (true);
CREATE POLICY "Allow admin delete for offers" ON offers FOR DELETE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Políticas RLS para applications
CREATE POLICY "Allow public read for applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Allow worker insert for applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update for applications" ON applications FOR UPDATE USING (true);

-- Insertar usuario admin inicial
INSERT INTO users (email, password, role, name, phone)
VALUES ('admin@agricolajobs.com', 'Admin123!', 'admin', 'Administrador', '')
ON CONFLICT (email) DO NOTHING;

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

-- Habilitar RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
CREATE POLICY "Allow public read for notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert for notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update for notifications" ON notifications FOR UPDATE USING (true);