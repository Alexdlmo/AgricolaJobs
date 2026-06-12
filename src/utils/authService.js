import { supabase } from './supabaseClient'

const API_BASE = 'http://127.0.0.1:8000/api'

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

  const displayName = role === 'worker' ? name : companyName

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      data: {
        role,
        name: displayName,
        phone,
        ...(role === 'company' && { cif, contact_person: contactPerson })
      }
    }
  })

  if (error) {
    throw new Error('Error al registrar usuario: ' + error.message)
  }

  if (!data.user) {
    throw new Error('Error al registrar usuario')
  }

  const profileData = {
    id: data.user.id,
    email: email.toLowerCase(),
    role,
    name: displayName,
    phone,
    ...(role === 'company' && { cif, contact_person: contactPerson })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert(profileData)
    .select()
    .single()

  if (profileError) {
    if (profileError.code === '23505') {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      if (existingProfile) return existingProfile
    }
    throw new Error('Error al crear perfil: ' + profileError.message)
  }

  return profile
}

export const login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Completa todos los campos')
  }

  if (!validateEmail(email)) {
    throw new Error('El email no es válido')
  }

  let data, error
  try {
    const result = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    })
    data = result.data
    error = result.error
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor no responde. Comprueba tu conexión e inténtalo de nuevo.')
    }
    throw new Error('Error de conexión con el servidor. Inténtalo de nuevo.')
  }

  if (error) {
    throw new Error('Email o contraseña incorrectos')
  }

  try {
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)
  } catch {
    // Si falla el last_login, continuamos de todas formas
  }

  let profile, profileError
  try {
    const profileResult = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    profile = profileResult.data
    profileError = profileResult.error
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor no responde. Comprueba tu conexión e inténtalo de nuevo.')
    }
    profileError = err
  }

  if (profileError || !profile) {
    return {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'worker',
      name: data.user.user_metadata?.name || '',
      phone: data.user.user_metadata?.phone || ''
    }
  }

  return profile
}

function clearSupabaseKeys() {
  const patterns = [
    key => key.startsWith('supabase.auth.'),
    key => key.startsWith('sb-') && key.endsWith('-auth-token'),
    key => key.startsWith('sb-') && key.endsWith('-auth-token-code-verifier'),
  ]
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && patterns.some(match => match(key))) {
      localStorage.removeItem(key)
    }
  }
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error al cerrar sesión:', error)
  }
  clearSupabaseKeys()
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profile) return profile

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.user_metadata?.role || 'worker',
    name: session.user.user_metadata?.name || '',
    phone: session.user.user_metadata?.phone || ''
  }
}

export const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session !== null
}

export const isAdmin = async () => {
  const session = await getSession()
  return session?.role === 'admin'
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
  const { error } = await supabase.rpc('delete_offer_with_deps', { p_offer_id: offerId })
  if (error) throw new Error('Error al eliminar oferta: ' + error.message)
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

export const createNotification = async (userId, title, message, type) => {
  console.log('Creating notification:', { userId, title, message, type })
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type
    })

  if (error) {
    console.error('Error creating notification:', error)
    alert('Error al crear notificación: ' + error.message)
    return null
  }
  console.log('Notification created successfully')
  return true
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

export const uploadAvatar = async (userId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { 
      upsert: true,
      contentType: file.type
    })

  if (error) {
    throw new Error('Error al subir la imagen: ' + error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  return publicUrl
}

export const updateAvatarInUser = async (userId, avatarUrl) => {
  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (error) {
    throw new Error('Error al actualizar el avatar: ' + error.message)
  }
  return true
}

export const uploadCV = async (userId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `cv-${userId}-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('cvs')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type
    })

  if (error) {
    throw new Error('Error al subir el CV: ' + error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('cvs')
    .getPublicUrl(fileName)

  return { url: publicUrl, fileName: file.name }
}

export const deleteCV = async (userId) => {
  const { data: user } = await supabase
    .from('users')
    .select('cv_url')
    .eq('id', userId)
    .single()

  if (user?.cv_url) {
    const oldFileName = user.cv_url.split('/').pop()
    await supabase.storage
      .from('cvs')
      .remove([oldFileName])
  }

  const { error } = await supabase
    .from('users')
    .update({ cv_url: null })
    .eq('id', userId)

  if (error) {
    throw new Error('Error al eliminar el CV: ' + error.message)
  }
  return true
}

export const createReport = async ({ reporter_id, reported_id, offer_id, reason, description }) => {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id,
      reported_id,
      offer_id: offer_id || null,
      reason,
      description: description || ''
    })
    .select()
    .single()

  if (error) {
    throw new Error('Error al enviar el reporte: ' + error.message)
  }
  return data
}

export const getAllReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reports_reporter_id_fkey(name, email), reported:users!reports_reported_id_fkey(name, email)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }
  return data || []
}

export const updateReportStatus = async (reportId, status) => {
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId)

  if (error) {
    throw new Error('Error al actualizar el reporte: ' + error.message)
  }
  return true
}

export const createReview = async ({ reviewer_id, reviewed_id, offer_id, rating, comment, reviewer_role }) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id,
      reviewed_id,
      offer_id,
      rating,
      comment: comment || null,
      reviewer_role
    })
    .select()
    .single()

  if (error) {
    throw new Error('Error al crear la valoración: ' + error.message)
  }
  return data
}

export const getReviewsForUser = async (userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)
    `)
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Error al obtener las valoraciones: ' + error.message)
  }
  return data || []
}

export const getUserAverageRating = async (userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_id', userId)

  if (error) {
    throw new Error('Error al obtener el rating: ' + error.message)
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0 }
  }

  const total = data.reduce((sum, r) => sum + r.rating, 0)
  const average = Math.round((total / data.length) * 10) / 10

  return { average, count: data.length }
}

export const canReview = async (reviewerId, offerId, reviewerRole) => {
  const { data: application, error } = await supabase
    .from('applications')
    .select('id, status, worker_id, offer_id')
    .eq('offer_id', offerId)
    .eq('worker_id', reviewerRole === 'worker' ? reviewerId : 'neq')
    .single()

  if (error || !application) {
    return { canReview: false, reason: 'No existe la solicitud' }
  }

  if (reviewerRole === 'company') {
    if (application.status !== 'accepted' && application.status !== 'rejected') {
      return { canReview: false, reason: 'La solicitud aún está en revisión' }
    }
  }

  if (reviewerRole === 'worker') {
    if (application.status !== 'accepted') {
      return { canReview: false, reason: 'Solo puedes valorar si fuiste aceptado' }
    }
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('offer_id', offerId)
    .single()

  if (existingReview) {
    return { canReview: false, reason: 'Ya has valorado esta oferta' }
  }

  return { canReview: true, application }
}

export const requestPasswordReset = async (email) => {
  if (!email || !validateEmail(email)) {
    throw new Error('El email no es válido')
  }

  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'No existe ningún usuario con ese email')
  }

  return await response.json()
}

export const validateResetToken = async (token) => {
  const { data, error } = await supabase
    .from('password_resets')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .single()

  if (error || !data) {
    return { valid: false, reason: 'Token no válido' }
  }

  if (data.used) {
    return { valid: false, reason: 'Este token ya ha sido utilizado' }
  }

  const expiresAt = new Date(data.expires_at + 'Z')
  const now = new Date()
  if (expiresAt.getTime() <= now.getTime()) {
    return { valid: false, reason: 'El token ha expirado' }
  }

  return { valid: true, userId: data.user_id }
}

export const resetPassword = async (token, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const tokenValidation = await validateResetToken(token)
  if (!tokenValidation.valid) {
    throw new Error(tokenValidation.reason)
  }

  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: tokenValidation.userId,
      new_password: newPassword
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Error al actualizar la contraseña')
  }

  const { error: markUsedError } = await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('token', token)

  if (markUsedError) {
    console.error('Error al marcar token como usado:', markUsedError)
  }

  return true
}

export const createConversation = async (offerId, companyId, workerId) => {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('offer_id', offerId)
    .eq('worker_id', workerId)
    .maybeSingle()

  if (existing) {
    return existing
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      offer_id: offerId,
      company_id: companyId,
      worker_id: workerId
    })
    .select()
    .single()

  if (error) {
    throw new Error('Error al crear conversación: ' + error.message)
  }

  return data
}

export const getConversations = async (userId) => {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`company_id.eq.${userId},worker_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  if (!conversations || conversations.length === 0) {
    return []
  }

  const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
    const enriched = { ...conv }
    
    const { data: offer } = await supabase
      .from('offers')
      .select('id, title')
      .eq('id', conv.offer_id)
      .maybeSingle()
    enriched.offer = offer

    const companyId = conv.company_id
    const workerId = conv.worker_id
    
    if (companyId) {
      const { data: company } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('id', companyId)
        .maybeSingle()
      enriched.company = company
    }
    
    if (workerId) {
      const { data: worker } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('id', workerId)
        .maybeSingle()
      enriched.worker = worker
    }
    
    return enriched
  }))

  return enrichedConversations
}

export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users(id, name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

export const sendMessage = async (conversationId, senderId, content) => {
  if (!content || !content.trim()) {
    throw new Error('El mensaje no puede estar vacío')
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      read: false
    })
    .select()
    .single()

  if (error) {
    throw new Error('Error al enviar mensaje: ' + error.message)
  }

  return data
}

export const markMessagesAsRead = async (conversationId, userId) => {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)

  if (error) {
    console.error('Error marking messages as read:', error)
  }
}

export const getUnreadCount = async (userId) => {
  const conversations = await getConversations(userId)
  let totalUnread = 0

  for (const conv of conversations) {
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conv.id)
      .eq('read', false)
      .neq('sender_id', userId)

    if (messages) {
      totalUnread += messages.length
    }
  }

  return totalUnread
}

export const getDashboardStats = async () => {
  const { data: users } = await supabase
    .from('users')
    .select('id, role, created_at')

  const { data: offers } = await supabase
    .from('offers')
    .select('id, company_id, created_at')

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status')

  const workers = users?.filter(u => u.role === 'worker').length || 0
  const companies = users?.filter(u => u.role === 'company').length || 0
  const totalOffers = offers?.length || 0
  const activeOffers = offers?.filter(o => {
    const status = o.status || 'active'
    return status === 'active'
  }).length || 0

  const pendingApps = applications?.filter(a => a.status === 'pending').length || 0
  const acceptedApps = applications?.filter(a => a.status === 'accepted').length || 0
  const rejectedApps = applications?.filter(a => a.status === 'rejected').length || 0

  return {
    totalUsers: users?.length || 0,
    workers,
    companies,
    totalOffers,
    activeOffers,
    pendingApps,
    acceptedApps,
    rejectedApps,
    usersData: users || [],
    offersData: offers || [],
    applicationsData: applications || []
  }
}

export const getMonthlyStats = async (months = 12) => {
  const { data: users } = await supabase
    .from('users')
    .select('id, created_at')

  const { data: offers } = await supabase
    .from('offers')
    .select('id, created_at')

  const { data: applications } = await supabase
    .from('applications')
    .select('id, applied_at')

  const now = new Date()
  const monthsData = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const monthLabel = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })

    const newUsers = users?.filter(u => {
      const created = new Date(u.created_at)
      return created >= date && created < nextDate
    }).length || 0

    const newOffers = offers?.filter(o => {
      const created = new Date(o.created_at)
      return created >= date && created < nextDate
    }).length || 0

    const newApplications = applications?.filter(a => {
      const applied = new Date(a.applied_at)
      return applied >= date && applied < nextDate
    }).length || 0

    monthsData.push({
      month: monthLabel,
      users: newUsers,
      offers: newOffers,
      applications: newApplications
    })
  }

  return monthsData
}

export const getTopCompanies = async (limit = 5) => {
  const { data: offers, error } = await supabase
    .from('offers')
    .select('company_id, company:users!offers_company_id_fkey(name)')

  if (error) {
    console.error('Error fetching offers:', error)
    return []
  }

  const companyCounts = {}

  offers?.forEach(offer => {
    if (offer.company_id) {
      const companyName = offer.company?.name || 'Empresa'
      companyCounts[offer.company_id] = {
        name: companyName,
        count: (companyCounts[offer.company_id]?.count || 0) + 1
      }
    }
  })

  const topCompanies = Object.entries(companyCounts)
    .map(([id, data]) => ({ id, name: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return topCompanies
}

