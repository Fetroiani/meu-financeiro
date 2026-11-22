/// Modelos do Anotei Já. Cada classe espelha uma tabela de `supabase/schema.sql`
/// e repete as mesmas regras (CHECK) em `validar()`, para o app avisar o usuário
/// antes de o banco recusar o registro.
library;

export 'src/comum.dart';
export 'src/categoria.dart';
export 'src/transacao.dart';
export 'src/vencimento.dart';
