-- Imita a opção do Supabase "Grant API access to new tables automatically" (aplicada antes das migrações seguintes).
grant select, insert, update, delete on all tables in schema public to authenticated, anon;
