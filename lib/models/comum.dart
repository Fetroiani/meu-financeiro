/// Tipo de lançamento, igual ao CHECK `tipo in ('entrada', 'gasto')`.
enum TipoLancamento {
  entrada,
  gasto;

  static TipoLancamento fromDb(String valor) => TipoLancamento.values.firstWhere(
        (t) => t.name == valor,
        orElse: () => throw FormatException('tipo inválido: $valor'),
      );
}

/// Converte `numeric` do Postgres (o Supabase pode devolver número ou texto).
double? lerNumero(Object? v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.parse(v.toString());
}

/// Arredonda para 2 casas, como `numeric(12, 2)`.
double centavos(double v) => (v * 100).roundToDouble() / 100;

/// Data sem hora no formato do Postgres (`date`): AAAA-MM-DD.
String dataDb(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

DateTime lerData(Object v) {
  final d = DateTime.parse(v.toString());
  return DateTime(d.year, d.month, d.day);
}

List<String> lerLista(Object? v) =>
    v == null ? <String>[] : (v as List).map((e) => e.toString()).toList();

/// Soma meses mantendo o dia; se o mês for mais curto, usa o último dia (31/01 + 1 = 28/02).
DateTime somarMeses(DateTime d, int meses) {
  final alvo = DateTime(d.year, d.month + meses, 1);
  final ultimo = DateTime(alvo.year, alvo.month + 1, 0).day;
  return DateTime(alvo.year, alvo.month, d.day > ultimo ? ultimo : d.day);
}

/// Mantém o comprimento como o `char_length` do Postgres (conta caracteres, não bytes).
int tamanho(String s) => s.runes.length;
