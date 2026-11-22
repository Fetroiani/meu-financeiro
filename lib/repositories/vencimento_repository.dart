import '../models/comum.dart';
import '../models/vencimento_model.dart';
import 'repositorio_base.dart';

/// Acesso à tabela `public.vencimentos`.
class VencimentoRepository extends RepositorioBase {
  static const tabela = 'vencimentos';
  const VencimentoRepository(super.client);

  /// Contas ainda não pagas, da mais próxima para a mais distante.
  Future<List<VencimentoModel>> pendentes() async {
    final linhas = await client.from(tabela).select().eq('pago', false).order('data_vencimento');
    return linhas.map(VencimentoModel.fromJson).toList();
  }

  Future<List<VencimentoModel>> doMes(DateTime mes) async {
    final linhas = await client
        .from(tabela)
        .select()
        .gte('data_vencimento', dataDb(DateTime(mes.year, mes.month, 1)))
        .lt('data_vencimento', dataDb(DateTime(mes.year, mes.month + 1, 1)))
        .order('data_vencimento');
    return linhas.map(VencimentoModel.fromJson).toList();
  }

  Future<VencimentoModel> criar(VencimentoModel v) async {
    final novo = v.comDono(userId);
    exigirValido(novo.validar());
    final j = novo.toJson()..remove('id');
    final linha = await client.from(tabela).insert(j).select().single();
    return VencimentoModel.fromJson(linha);
  }

  Future<VencimentoModel> atualizar(VencimentoModel v) async {
    if (v.id == null) throw ArgumentError('vencimento sem id');
    exigirValido(v.validar());
    final j = v.toJson()
      ..remove('id')
      ..remove('user_id');
    final linha = await client.from(tabela).update(j).eq('id', v.id!).select().single();
    return VencimentoModel.fromJson(linha);
  }

  /// Marca como paga e, se for recorrente, agenda a próxima. Devolve a próxima (ou null).
  Future<VencimentoModel?> marcarPago(VencimentoModel v) async {
    if (v.id == null) throw ArgumentError('vencimento sem id');
    await client.from(tabela).update({'pago': true}).eq('id', v.id!);
    final prox = v.proxima();
    return prox == null ? null : criar(prox);
  }

  Future<void> excluir(String id) async {
    await client.from(tabela).delete().eq('id', id);
  }
}
