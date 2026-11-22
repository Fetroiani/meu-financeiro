import 'dart:math';

import '../models/comum.dart';
import '../models/transacao_model.dart';
import 'repositorio_base.dart';

/// Acesso à tabela `public.transacoes`.
class TransacaoRepository extends RepositorioBase {
  static const tabela = 'transacoes';
  const TransacaoRepository(super.client);

  /// Lançamentos de um mês (ex.: DateTime(2026, 11)), do mais recente para o mais antigo.
  Future<List<TransacaoModel>> doMes(DateTime mes) async {
    final inicio = DateTime(mes.year, mes.month, 1);
    final fim = DateTime(mes.year, mes.month + 1, 1);
    final linhas = await client
        .from(tabela)
        .select()
        .eq('deleted', false)
        .gte('data_transacao', dataDb(inicio))
        .lt('data_transacao', dataDb(fim))
        .order('data_transacao', ascending: false)
        .order('created_at', ascending: false);
    return linhas.map(TransacaoModel.fromJson).toList();
  }

  Future<TransacaoModel> criar(TransacaoModel t) async {
    final novo = t.comDono(userId);
    exigirValido(novo.validar());
    final j = novo.toJson()..remove('id');
    final linha = await client.from(tabela).insert(j).select().single();
    return TransacaoModel.fromJson(linha);
  }

  /// Divide a compra em parcelas mensais e grava todas de uma vez.
  Future<List<TransacaoModel>> criarParcelado({
    required String descricao,
    required double valorTotal,
    required int vezes,
    required DateTime primeiraData,
    String? categoriaId,
    String? subpasta,
    double? valorUsdTotal,
    double? cotacaoUsd,
    String? observacao,
  }) async {
    final parcelas = TransacaoModel.parcelar(
      userId: userId,
      descricao: descricao,
      valorTotal: valorTotal,
      vezes: vezes,
      primeiraData: primeiraData,
      grupoParcelamentoId: novoUuid(),
      categoriaId: categoriaId,
      subpasta: subpasta,
      valorUsdTotal: valorUsdTotal,
      cotacaoUsd: cotacaoUsd,
      observacao: observacao,
    );
    for (final p in parcelas) {
      exigirValido(p.validar());
    }
    final linhas = await client
        .from(tabela)
        .insert(parcelas.map((p) => p.toJson()..remove('id')).toList())
        .select()
        .order('parcela_atual');
    return linhas.map(TransacaoModel.fromJson).toList();
  }

  Future<TransacaoModel> atualizar(TransacaoModel t) async {
    if (t.id == null) throw ArgumentError('lançamento sem id');
    exigirValido(t.validar());
    final j = t.toJson()
      ..remove('id')
      ..remove('user_id');
    final linha = await client.from(tabela).update(j).eq('id', t.id!).select().single();
    return TransacaoModel.fromJson(linha);
  }

  Future<void> excluir(String id) async {
    await client.from(tabela).update({'deleted': true}).eq('id', id);
  }

  /// Apaga todas as parcelas de uma compra.
  Future<void> excluirParcelamento(String grupoParcelamentoId) async {
    await client.from(tabela).update({'deleted': true}).eq('grupo_parcelamento_id', grupoParcelamentoId);
  }
}

/// UUID v4 gerado no aparelho (para agrupar as parcelas antes de gravar).
String novoUuid() {
  final r = Random.secure();
  final b = List<int>.generate(16, (_) => r.nextInt(256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
  return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
}
