import 'comum.dart';

/// Tabela `public.categorias`.
class Categoria {
  final String? id;
  final String userId;
  final String nome;
  final TipoLancamento tipo;
  final String cor;
  final String? icone;
  final List<String> palavrasChave;
  final double? metaMensal;
  final List<String> subpastas;
  final DateTime? createdAt;

  const Categoria({
    this.id,
    required this.userId,
    required this.nome,
    required this.tipo,
    this.cor = '#00B4D8',
    this.icone = 'category',
    this.palavrasChave = const [],
    this.metaMensal,
    this.subpastas = const [],
    this.createdAt,
  });

  static final _cor = RegExp(r'^#[0-9a-f]{6}$', caseSensitive: false);

  factory Categoria.fromJson(Map<String, dynamic> j) => Categoria(
        id: j['id'] as String?,
        userId: j['user_id'] as String,
        nome: j['nome'] as String,
        tipo: TipoLancamento.fromDb(j['tipo'] as String),
        cor: (j['cor'] as String?) ?? '#00B4D8',
        icone: j['icone'] as String?,
        palavrasChave: lerLista(j['palavras_chave']),
        metaMensal: lerNumero(j['meta_mensal']),
        subpastas: lerLista(j['subpastas']),
        createdAt: j['created_at'] == null ? null : DateTime.parse(j['created_at'] as String),
      );

  /// Para insert/update: `id` e `created_at` ficam com o banco.
  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'user_id': userId,
        'nome': nome.trim(),
        'tipo': tipo.name,
        'cor': cor,
        'icone': icone,
        'palavras_chave': palavrasChave,
        'meta_mensal': metaMensal == null ? null : centavos(metaMensal!),
        'subpastas': subpastas,
      };

  /// Mesmas regras dos CHECK da tabela. Lista vazia = válido.
  List<String> validar() => [
        if (tamanho(nome.trim()) < 1 || tamanho(nome.trim()) > 60) 'O nome deve ter de 1 a 60 caracteres.',
        if (!_cor.hasMatch(cor)) 'A cor deve estar no formato #RRGGBB.',
        if (icone != null && tamanho(icone!) > 40) 'O ícone deve ter até 40 caracteres.',
        if (metaMensal != null && metaMensal! <= 0) 'A meta mensal deve ser maior que zero.',
      ];

  /// Usada pelo leitor de cupom: a descrição contém alguma palavra-chave inteira?
  bool combina(String descricao) {
    String n(String s) => s
        .toLowerCase()
        .replaceAll(RegExp('[áàâãä]'), 'a')
        .replaceAll(RegExp('[éèêë]'), 'e')
        .replaceAll(RegExp('[íìîï]'), 'i')
        .replaceAll(RegExp('[óòôõö]'), 'o')
        .replaceAll(RegExp('[úùûü]'), 'u')
        .replaceAll('ç', 'c')
        .replaceAll(RegExp(r'[^a-z0-9$€&]+'), ' ')
        .trim();
    final t = ' ${n(descricao)} ';
    return palavrasChave.map(n).any((p) => p.isNotEmpty && t.contains(' $p '));
  }

  Categoria copyWith({
    String? nome,
    TipoLancamento? tipo,
    String? cor,
    String? icone,
    List<String>? palavrasChave,
    double? metaMensal,
    bool limparMeta = false,
    List<String>? subpastas,
  }) =>
      Categoria(
        id: id,
        userId: userId,
        nome: nome ?? this.nome,
        tipo: tipo ?? this.tipo,
        cor: cor ?? this.cor,
        icone: icone ?? this.icone,
        palavrasChave: palavrasChave ?? this.palavrasChave,
        metaMensal: limparMeta ? null : (metaMensal ?? this.metaMensal),
        subpastas: subpastas ?? this.subpastas,
        createdAt: createdAt,
      );
}
