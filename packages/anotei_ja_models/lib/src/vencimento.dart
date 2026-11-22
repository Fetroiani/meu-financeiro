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
class Vencimento {
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

  const Vencimento({
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
  });

  factory Vencimento.fromJson(Map<String, dynamic> j) => Vencimento(
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
      };

  List<String> validar() => [
        if (tamanho(conta.trim()) < 1 || tamanho(conta.trim()) > 120) 'O nome da conta deve ter de 1 a 120 caracteres.',
        if (valorEstimado != null && centavos(valorEstimado!) <= 0) 'O valor estimado deve ser maior que zero.',
        if (diasAviso < 0 || diasAviso > 30) 'O aviso vai de 0 a 30 dias antes.',
      ];

  /// Dias até o vencimento (negativo = atrasado).
  int diasAte(DateTime hoje) =>
      dataVencimento.difference(DateTime(hoje.year, hoje.month, hoje.day)).inDays;

  /// Deve aparecer no aviso hoje?
  bool avisar(DateTime hoje) => !pago && diasAte(hoje) <= diasAviso;

  /// Próxima ocorrência depois de paga (null para conta única).
  Vencimento? proxima() {
    final n = switch (recorrencia) {
      Recorrencia.mensal => somarMeses(dataVencimento, 1),
      Recorrencia.anual => somarMeses(dataVencimento, 12),
      Recorrencia.unica => null,
    };
    if (n == null) return null;
    return Vencimento(
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
