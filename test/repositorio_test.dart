import 'package:anotei_ja/anotei_ja.dart';
import 'package:supabase/supabase.dart';
import 'package:test/test.dart';

void main() {
  // Cliente apontando para um endereço local: nenhum teste aqui faz chamada de rede.
  final client = SupabaseClient('http://localhost:54321', 'chave-de-teste');

  test('sem login não grava nada (o RLS exige auth.uid())', () {
    final repo = TransacaoRepository(client);
    expect(
      () => repo.criar(TransacaoModel(userId: '', descricao: 'x', valorBrl: 1, tipo: TipoLancamento.gasto, dataTransacao: DateTime(2026))),
      throwsA(isA<SemLogin>()),
    );
  });

  test('UUID v4 para agrupar parcelas', () {
    final id = novoUuid();
    expect(RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$').hasMatch(id), isTrue);
    expect(novoUuid(), isNot(id));
  });

  test('comDono troca só o user_id', () {
    const c = CategoriaModel(userId: 'a', nome: 'Pet', tipo: TipoLancamento.gasto, palavrasChave: ['petz']);
    final d = c.comDono('b');
    expect(d.userId, 'b');
    expect(d.palavrasChave, ['petz']);
  });
}
