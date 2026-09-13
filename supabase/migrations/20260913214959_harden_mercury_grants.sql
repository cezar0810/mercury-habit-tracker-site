-- Project default privileges can include operations that RLS does not protect,
-- such as TRUNCATE. Keep only what the security-invoker sync RPC requires.
revoke all privileges on table public.mercury_documents, public.mercury_devices, public.mercury_annual from authenticated;
grant select, insert, update on table public.mercury_documents, public.mercury_devices, public.mercury_annual to authenticated;

revoke all privileges on table public.mercury_documents, public.mercury_devices, public.mercury_annual from anon;
revoke all on function public.mercury_apply(uuid,bigint,jsonb) from public, anon;
grant execute on function public.mercury_apply(uuid,bigint,jsonb) to authenticated;
