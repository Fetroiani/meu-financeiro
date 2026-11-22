import '../models/categoria_model.dart';
import '../models/comum.dart';
import 'repositorio_base.dart';

/// Acesso à tabela `public.categorias`.
class CategoriaRepository extends RepositorioBase {
  static const tabela = 'categorias';
  const CategoriaRepository(super.client);

  Future<List<CategoriaModel>> listar({TipoLancamento? tipo}) async {
    var q = client.from(tabela).select().eq('deleted', false);
    if (tipo != null) q = q.eq('tipo', tipo.name);
    final linhas = await q.order('created_at');
    return linhas.map(CategoriaModel.fromJson).toList();
  }

  Future<CategoriaModel> criar(CategoriaModel c) async {
    final novo = c.comDono(userId);
    exigirValido(novo.validar());
    final j = novo.toJson()..remove('id');
    final linha = await client.from(tabela).insert(j).select().single();
    return CategoriaModel.fromJson(linha);
  }

  Future<CategoriaModel> atualizar(CategoriaModel c) async {
    if (c.id == null) throw ArgumentError('categoria sem id');
    exigirValido(c.validar());
    final j = c.toJson()
      ..remove('id')
      ..remove('user_id');
    final linha = await client.from(tabela).update(j).eq('id', c.id!).select().single();
    return CategoriaModel.fromJson(linha);
  }

  /// Os lançamentos e vencimentos da categoria ficam sem categoria (on delete set null).
  Future<void> excluir(String id) async {
    await client.from(tabela).update({'deleted': true}).eq('id', id);
  }
}
