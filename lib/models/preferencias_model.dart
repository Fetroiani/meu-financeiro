/// Tabela `public.preferencias`: uma linha por usuário com o que o app aprendeu
/// (categorias corrigidas no leitor de cupom, palavras de entrada etc.).
class PreferenciasModel {
  final String userId;
  final Map<String, dynamic> dados;
  final DateTime? updatedAt;

  const PreferenciasModel({required this.userId, this.dados = const {}, this.updatedAt});

  factory PreferenciasModel.fromJson(Map<String, dynamic> j) => PreferenciasModel(
        userId: j['user_id'] as String,
        dados: Map<String, dynamic>.from((j['dados'] as Map?) ?? const {}),
        updatedAt: j['updated_at'] == null ? null : DateTime.parse(j['updated_at'] as String),
      );

  Map<String, dynamic> toJson() => {'user_id': userId, 'dados': dados};

  /// Categoria que o usuário escolheu para um item do cupom (chave = descrição normalizada).
  Map<String, String> get aprendido => Map<String, String>.from((dados['aprendido'] as Map?) ?? const {});
}
