import 'dart:convert';

import 'comum.dart';

/// Tabela `public.categorias`.
class CategoriaModel {
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
  /// Atualizado pelo banco a cada alteração (usado na sincronização).
  final DateTime? updatedAt;
  /// Exclusão lógica: o registro some do app, mas os outros aparelhos ficam sabendo.
  final bool deleted;
  /// Campos próprios do app web (itens do cupom, loja, cartão, moeda €…).
  final Map<String, dynamic> extra;

  const CategoriaModel({
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
    this.updatedAt,
    this.deleted = false,
    this.extra = const {},
  });

  static final _cor = RegExp(r'^#[0-9a-f]{6}$', caseSensitive: false);

  /// Cópia com o dono definido pela sessão (o RLS exige user_id = auth.uid()).
  CategoriaModel comDono(String uid) => CategoriaModel(
        id: id,
        userId: uid,
        nome: nome,
        tipo: tipo,
        cor: cor,
        icone: icone,
        palavrasChave: palavrasChave,
        metaMensal: metaMensal,
        subpastas: subpastas,
        createdAt: createdAt,
        updatedAt: updatedAt,
        deleted: deleted,
        extra: extra,
      );

  factory CategoriaModel.fromJson(Map<String, dynamic> j) => CategoriaModel(
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
        updatedAt: j['updated_at'] == null ? null : DateTime.parse(j['updated_at'] as String),
        deleted: (j['deleted'] as bool?) ?? false,
        extra: Map<String, dynamic>.from((j['extra'] as Map?) ?? const {}),
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
        'deleted': deleted,
        'extra': extra,
      };

  /// Mesmas regras dos CHECK da tabela. Lista vazia = válido.
  List<String> validar() => [
        if (tamanho(nome.trim()) < 1 || tamanho(nome.trim()) > 60) 'O nome deve ter de 1 a 60 caracteres.',
        if (!_cor.hasMatch(cor)) 'A cor deve estar no formato #RRGGBB.',
        if (icone != null && tamanho(icone!) > 40) 'O ícone deve ter até 40 caracteres.',
        if (metaMensal != null && metaMensal! <= 0) 'A meta mensal deve ser maior que zero.',
        if (utf8.encode(jsonEncode(extra)).length > 16000) 'Dados extras grandes demais (limite de 16 KB).',
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

  CategoriaModel copyWith({
    String? nome,
    TipoLancamento? tipo,
    String? cor,
    String? icone,
    List<String>? palavrasChave,
    double? metaMensal,
    bool limparMeta = false,
    List<String>? subpastas,
  }) =>
      CategoriaModel(
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
        updatedAt: updatedAt,
        deleted: deleted,
        extra: extra,
      );
}
