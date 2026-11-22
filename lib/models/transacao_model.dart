import 'dart:convert';

import 'comum.dart';

/// Tabela `public.transacoes`: entradas, gastos, parcelas e moeda estrangeira.
class TransacaoModel {
  final String? id;
  final String userId;
  final String? categoriaId;
  final String? subpasta;
  final String descricao;
  final double valorBrl;
  final double? valorUsd;
  final double? cotacaoUsd;
  final TipoLancamento tipo;
  final DateTime dataTransacao;
  final bool pago;
  final int parcelaAtual;
  final int totalParcelas;
  final String? grupoParcelamentoId;
  final String? observacao;
  final DateTime? createdAt;
  /// Atualizado pelo banco a cada alteração (usado na sincronização).
  final DateTime? updatedAt;
  /// Exclusão lógica: o registro some do app, mas os outros aparelhos ficam sabendo.
  final bool deleted;
  /// Campos próprios do app web (itens do cupom, loja, cartão, moeda €…).
  final Map<String, dynamic> extra;

  const TransacaoModel({
    this.id,
    required this.userId,
    this.categoriaId,
    this.subpasta,
    required this.descricao,
    required this.valorBrl,
    this.valorUsd,
    this.cotacaoUsd,
    required this.tipo,
    required this.dataTransacao,
    this.pago = true,
    this.parcelaAtual = 1,
    this.totalParcelas = 1,
    this.grupoParcelamentoId,
    this.observacao,
    this.createdAt,
    this.updatedAt,
    this.deleted = false,
    this.extra = const {},
  });

  bool get parcelada => totalParcelas > 1;

  /// Cópia com o dono definido pela sessão (o RLS exige user_id = auth.uid()).
  TransacaoModel comDono(String uid) => TransacaoModel(
        id: id,
        userId: uid,
        categoriaId: categoriaId,
        subpasta: subpasta,
        descricao: descricao,
        valorBrl: valorBrl,
        valorUsd: valorUsd,
        cotacaoUsd: cotacaoUsd,
        tipo: tipo,
        dataTransacao: dataTransacao,
        pago: pago,
        parcelaAtual: parcelaAtual,
        totalParcelas: totalParcelas,
        grupoParcelamentoId: grupoParcelamentoId,
        observacao: observacao,
        createdAt: createdAt,
        updatedAt: updatedAt,
        deleted: deleted,
        extra: extra,
      );

  factory TransacaoModel.fromJson(Map<String, dynamic> j) => TransacaoModel(
        id: j['id'] as String?,
        userId: j['user_id'] as String,
        categoriaId: j['categoria_id'] as String?,
        subpasta: j['subpasta'] as String?,
        descricao: j['descricao'] as String,
        valorBrl: lerNumero(j['valor_brl'])!,
        valorUsd: lerNumero(j['valor_usd']),
        cotacaoUsd: lerNumero(j['cotacao_usd']),
        tipo: TipoLancamento.fromDb(j['tipo'] as String),
        dataTransacao: lerData(j['data_transacao'] as Object),
        pago: (j['pago'] as bool?) ?? true,
        parcelaAtual: (j['parcela_atual'] as num?)?.toInt() ?? 1,
        totalParcelas: (j['total_parcelas'] as num?)?.toInt() ?? 1,
        grupoParcelamentoId: j['grupo_parcelamento_id'] as String?,
        observacao: j['observacao'] as String?,
        createdAt: j['created_at'] == null ? null : DateTime.parse(j['created_at'] as String),
        updatedAt: j['updated_at'] == null ? null : DateTime.parse(j['updated_at'] as String),
        deleted: (j['deleted'] as bool?) ?? false,
        extra: Map<String, dynamic>.from((j['extra'] as Map?) ?? const {}),
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'user_id': userId,
        'categoria_id': categoriaId,
        'subpasta': subpasta,
        'descricao': descricao.trim(),
        'valor_brl': centavos(valorBrl),
        'valor_usd': valorUsd == null ? null : centavos(valorUsd!),
        'cotacao_usd': cotacaoUsd == null ? null : (cotacaoUsd! * 10000).roundToDouble() / 10000,
        'tipo': tipo.name,
        'data_transacao': dataDb(dataTransacao),
        'pago': pago,
        'parcela_atual': parcelaAtual,
        'total_parcelas': totalParcelas,
        'grupo_parcelamento_id': grupoParcelamentoId,
        'observacao': observacao,
        'deleted': deleted,
        'extra': extra,
      };

  List<String> validar() => [
        if (tamanho(descricao.trim()) < 1 || tamanho(descricao.trim()) > 200) 'A descrição deve ter de 1 a 200 caracteres.',
        if (subpasta != null && tamanho(subpasta!) > 60) 'A subpasta deve ter até 60 caracteres.',
        if (centavos(valorBrl) <= 0) 'O valor deve ser maior que zero.',
        if (valorUsd != null && centavos(valorUsd!) <= 0) 'O valor em US\$ deve ser maior que zero.',
        if (cotacaoUsd != null && cotacaoUsd! <= 0) 'A cotação deve ser maior que zero.',
        if (parcelaAtual < 1) 'A parcela atual deve ser 1 ou mais.',
        if (totalParcelas < 1 || totalParcelas > 120) 'O parcelamento vai de 1 a 120 vezes.',
        if (parcelaAtual > totalParcelas) 'A parcela atual não pode passar do total.',
        if (observacao != null && tamanho(observacao!) > 500) 'A observação deve ter até 500 caracteres.',
        if (utf8.encode(jsonEncode(extra)).length > 16000) 'Dados extras grandes demais (limite de 16 KB).',
      ];

  /// Divide uma compra em [vezes] parcelas mensais, como o app faz hoje:
  /// todas iguais e os centavos que sobram vão para a última.
  /// Ex.: R$ 100,00 em 3x = 33,33 + 33,33 + 33,34.
  static List<TransacaoModel> parcelar({
    required String userId,
    required String descricao,
    required double valorTotal,
    required int vezes,
    required DateTime primeiraData,
    required String grupoParcelamentoId,
    String? categoriaId,
    String? subpasta,
    double? valorUsdTotal,
    double? cotacaoUsd,
    String? observacao,
  }) {
    if (vezes < 1 || vezes > 120) throw ArgumentError.value(vezes, 'vezes', 'deve ser de 1 a 120');
    final totalC = (valorTotal * 100).round();
    final baseC = totalC ~/ vezes;
    final usdC = valorUsdTotal == null ? null : (valorUsdTotal * 100).round();
    return List.generate(vezes, (i) {
      final ultima = i == vezes - 1;
      final valorC = ultima ? totalC - baseC * (vezes - 1) : baseC;
      int? usd;
      if (usdC != null) {
        final b = usdC ~/ vezes;
        usd = ultima ? usdC - b * (vezes - 1) : b;
      }
      return TransacaoModel(
        userId: userId,
        categoriaId: categoriaId,
        subpasta: subpasta,
        descricao: vezes == 1 ? descricao : '$descricao (${i + 1}/$vezes)',
        valorBrl: valorC / 100,
        valorUsd: usd == null ? null : usd / 100,
        cotacaoUsd: cotacaoUsd,
        tipo: TipoLancamento.gasto,
        dataTransacao: somarMeses(primeiraData, i),
        pago: i == 0,
        parcelaAtual: i + 1,
        totalParcelas: vezes,
        grupoParcelamentoId: vezes == 1 ? null : grupoParcelamentoId,
        observacao: observacao,
      );
    });
  }
}
