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
