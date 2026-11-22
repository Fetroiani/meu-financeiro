import 'package:supabase/supabase.dart';

/// Erro de validação: o registro não passaria nos CHECK do banco.
class DadosInvalidos implements Exception {
  final List<String> erros;
  const DadosInvalidos(this.erros);
  @override
  String toString() => 'DadosInvalidos: ${erros.join(' ')}';
}

/// Sem sessão não há `auth.uid()`, e o RLS recusaria tudo.
class SemLogin implements Exception {
  @override
  String toString() => 'SemLogin: entre na sua conta para acessar os dados.';
}

abstract class RepositorioBase {
  final SupabaseClient client;
  const RepositorioBase(this.client);

  /// Id do usuário logado. O app nunca escolhe o user_id: ele vem da sessão.
  String get userId {
    final id = client.auth.currentUser?.id;
    if (id == null) throw SemLogin();
    return id;
  }

  void exigirValido(List<String> erros) {
    if (erros.isNotEmpty) throw DadosInvalidos(erros);
  }
}
