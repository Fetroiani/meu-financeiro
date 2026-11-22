/// Camada de dados do Anotei Já. Os modelos espelham as tabelas de
/// `supabase/schema.sql` e repetem as mesmas regras (CHECK) em `validar()`;
/// os repositórios falam com o Supabase, onde o RLS garante que cada pessoa
/// só acessa os próprios dados.
library;

export 'models/comum.dart';
export 'models/categoria_model.dart';
export 'models/transacao_model.dart';
export 'models/vencimento_model.dart';
export 'models/preferencias_model.dart';
export 'repositories/repositorio_base.dart';
export 'repositories/categoria_repository.dart';
export 'repositories/transacao_repository.dart';
export 'repositories/vencimento_repository.dart';
export 'repositories/preferencias_repository.dart';
