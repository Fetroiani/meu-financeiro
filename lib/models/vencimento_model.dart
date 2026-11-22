import 'dart:convert';

import 'comum.dart';

/// Igual ao CHECK `recorrencia in ('mensal', 'anual', 'unica')`.
enum Recorrencia {
  mensal,
  anual,
  unica;

  static Recorrencia fromDb(String valor) => Recorrencia.values.firstWhere(
        (r) => r.name == valor,
        orElse: () => throw FormatException('recorrência inválida: $valor'),
      );
}

/// Tabela `public.vencimentos`: contas a pagar e alertas recorrentes.
class VencimentoModel {
  final String? id;
  final String userId;
  final String? categoriaId;
  final String conta;
  final double? valorEstimado;
  final DateTime dataVencimento;
  final Recorrencia recorrencia;
  final int diasAviso;
  final bool pago;
  final DateTime? createdAt;
  /// Atualizado pelo banco a cada alteração (usado na sincronização).
  final DateTime? updatedAt;
  /// Exclusão lógica: o registro some do app, mas os outros aparelhos ficam sabendo.
  final bool deleted;
  /// Campos próprios do app web (itens do cupom, loja, cartão, moeda €…).
  final Map<String, dynamic> extra;

  const VencimentoModel({
    this.id,
    required this.userId,
    this.categoriaId,
    required this.conta,
    this.valorEstimado,
    required this.dataVencimento,
    this.recorrencia = Recorrencia.mensal,
    this.diasAviso = 1,
    this.pago = false,
    this.createdAt,
    this.updatedAt,
    this.deleted = false,
    this.extra = const {},
  });

  /// Cópia com o dono definido pela sessão (o RLS exige user_id = auth.uid()).
  VencimentoModel comDono(String uid) => VencimentoModel(
        id: id,
        userId: uid,
        categoriaId: categoriaId,
        conta: conta,
        valorEstimado: valorEstimado,
        dataVencimento: dataVencimento,
        recorrencia: recorrencia,
        diasAviso: diasAviso,
        pago: pago,
        createdAt: createdAt,
        updatedAt: updatedAt,
        deleted: deleted,
        extra: extra,
      );

  factory VencimentoModel.fromJson(Map<String, dynamic> j) => VencimentoModel(
        id: j['id'] as String?,
        userId: j['user_id'] as String,
        categoriaId: j['categoria_id'] as String?,
        conta: j['conta'] as String,
        valorEstimado: lerNumero(j['valor_estimado']),
        dataVencimento: lerData(j['data_vencimento'] as Object),
        recorrencia: Recorrencia.fromDb((j['recorrencia'] as String?) ?? 'mensal'),
        diasAviso: (j['dias_aviso'] as num?)?.toInt() ?? 1,
        pago: (j['pago'] as bool?) ?? false,
        createdAt: j['created_at'] == null ? null : DateTime.parse(j['created_at'] as String),
        updatedAt: j['updated_at'] == null ? null : DateTime.parse(j['updated_at'] as String),
        deleted: (j['deleted'] as bool?) ?? false,
        extra: Map<String, dynamic>.from((j['extra'] as Map?) ?? const {}),
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'user_id': userId,
        'categoria_id': categoriaId,
        'conta': conta.trim(),
        'valor_estimado': valorEstimado == null ? null : centavos(valorEstimado!),
        'data_vencimento': dataDb(dataVencimento),
        'recorrencia': recorrencia.name,
        'dias_aviso': diasAviso,
        'pago': pago,
        'deleted': deleted,
        'extra': extra,
      };

  List<String> validar() => [
        if (tamanho(conta.trim()) < 1 || tamanho(conta.trim()) > 120) 'O nome da conta deve ter de 1 a 120 caracteres.',
        if (valorEstimado != null && centavos(valorEstimado!) <= 0) 'O valor estimado deve ser maior que zero.',
        if (diasAviso < 0 || diasAviso > 30) 'O aviso vai de 0 a 30 dias antes.',
        if (utf8.encode(jsonEncode(extra)).length > 16000) 'Dados extras grandes demais (limite de 16 KB).',
      ];

  /// Dias até o vencimento (negativo = atrasado).
  int diasAte(DateTime hoje) =>
      dataVencimento.difference(DateTime(hoje.year, hoje.month, hoje.day)).inDays;

  /// Deve aparecer no aviso hoje?
  bool avisar(DateTime hoje) => !pago && diasAte(hoje) <= diasAviso;

  /// Próxima ocorrência depois de paga (null para conta única).
  VencimentoModel? proxima() {
    final n = switch (recorrencia) {
      Recorrencia.mensal => somarMeses(dataVencimento, 1),
      Recorrencia.anual => somarMeses(dataVencimento, 12),
      Recorrencia.unica => null,
    };
    if (n == null) return null;
    return VencimentoModel(
      userId: userId,
      categoriaId: categoriaId,
      conta: conta,
      valorEstimado: valorEstimado,
      dataVencimento: n,
      recorrencia: recorrencia,
      diasAviso: diasAviso,
    );
  }
}
