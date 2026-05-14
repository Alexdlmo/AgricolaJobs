import { supabase } from './supabaseClient'

const SESSION_KEY = 'agricolaJobsSession'

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateCIF = (cif) => {
  const cifRegex = /^[A-Z]\d{8}$/
  return cifRegex.test(cif)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const register = async (userData) => {
  const { email, password, role, name, phone, companyName, cif, contactPerson } = userData

  if (!email || !password || !role) {
    throw new Error('Faltan datos requeridos')
  }

  if (!validateEmail(email)) {
    throw new Error('El email no es válido')
  }

  if (!validatePassword(password)) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const { data: existingUsers } = await supabase
    .from('users')
    .select('email')
    .ilike('email', email)

  if (existingUsers && existingUsers.length > 0) {
    throw new Error('Este email ya está registrado')
  }

  if (role === 'worker') {
    if (!name || !phone) {
      throw new Error('Completa todos los campos')
    }
    if (!validatePhone(phone)) {
      throw new Error('El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9')
    }
  }

  if (role === 'company') {
    if (!companyName || !cif || !contactPerson || !phone) {
      throw new Error('Completa todos los campos')
    }
    if (!validateCIF(cif)) {
      throw new Error('El CIF debe tener formato de letra + 8 números')
    }
    if (!validatePhone(phone)) {
      throw new Error('El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9')
    }
  }

  const userToInsert = {
    email: email.toLowerCase(),
    password,
    role,
    name: role === 'worker' ? name : companyName,
    phone,
    ...(role === 'company' && { cif, contact_person: contactPerson })
  }

  const { data, error } = await supabase
    .from('users')
    .insert(userToInsert)
    .select()
    .single()

  if (error) {
    throw new Error('Error al registrar usuario: ' + error.message)
  }

  const { password: _, ...userWithoutPassword } = data
  localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword))

  return userWithoutPassword
}

export const login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Completa todos los campos')
  }

  if (!validateEmail(email)) {
    throw new Error('El email no es válido')
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .eq('password', password)
    .single()

  if (error || !data) {
    throw new Error('Email o contraseña incorrectos')
  }

  const updatedUser = { ...data, last_login: new Date().toISOString() }
  
  await supabase
    .from('users')
    .update({ last_login: updatedUser.last_login })
    .eq('id', data.id)

  const { password: _, ...userWithoutPassword } = updatedUser
  localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword))

  return userWithoutPassword
}

export const logout = () => {
  localStorage.removeItem(SESSION_KEY)
}

export const getSession = () => {
  const session = localStorage.getItem(SESSION_KEY)
  return session ? JSON.parse(session) : null
}

export const checkAuth = () => {
  return getSession() !== null
}

export const isAdmin = () => {
  const session = getSession()
  return session && session.role === 'admin'
}

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  return data || []
}

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    throw new Error('Error al eliminar usuario')
  }
  return true
}

export const getAllOffers = async () => {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching offers:', error)
    return []
  }
  return data || []
}

export const deleteOffer = async (offerId) => {
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', offerId)

  if (error) {
    throw new Error('Error al eliminar oferta')
  }
  return true
}

export const updateOfferStatus = async (offerId, status) => {
  const { error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', offerId)

  if (error) {
    throw new Error('Error al actualizar estado')
  }
  return true
}

export const createOffer = async (offerData) => {
  const { data, error } = await supabase
    .from('offers')
    .insert(offerData)
    .select()
    .single()

  if (error) {
    throw new Error('Error al crear oferta: ' + error.message)
  }
  return data
}

export const getOffersByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching company offers:', error)
    return []
  }
  return data || []
}

export const createAdminIfNotExists = async () => {
  const { data: existingAdmin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!existingAdmin) {
    const { error } = await supabase
      .from('users')
      .insert({
        email: 'admin@agricolajobs.com',
        password: 'Admin123!',
        role: 'admin',
        name: 'Administrador',
        phone: ''
      })

    if (error) {
      console.log('Admin creation skipped (table may not be set up yet):', error.message)
    }
  }
}

export const createNotification = async (userId, title, message, type) => {
  console.log('Creating notification:', { userId, title, message, type })
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    alert('Error al crear notificación: ' + error.message)
    return null
  }
  console.log('Notification created successfully:', data)
  return data
}

export const getNotifications = async (userId) => {
  console.log('Fetching notifications for userId:', userId)
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    alert('Error al obtener notificaciones: ' + error.message)
    return []
  }
  
  console.log('Notifications fetched:', data)
  return data || []
}

export const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
  }
}

export const markAllNotificationsAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error marking notifications as read:', error)
  }
}

export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    throw new Error('Error al eliminar notificación')
  }
  return true
}

export const deleteAllNotifications = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error('Error al eliminar notificaciones')
  }
  return true
}

