import '../models/preferencias_model.dart';
import 'repositorio_base.dart';

/// Acesso à tabela `public.preferencias` (uma linha por usuário).
class PreferenciasRepository extends RepositorioBase {
  static const tabela = 'preferencias';
  const PreferenciasRepository(super.client);

  Future<PreferenciasModel> carregar() async {
    final linha = await client.from(tabela).select().eq('user_id', userId).maybeSingle();
    return linha == null ? PreferenciasModel(userId: userId) : PreferenciasModel.fromJson(linha);
  }

  Future<void> salvar(Map<String, dynamic> dados) async {
    await client.from(tabela).upsert({'user_id': userId, 'dados': dados}, onConflict: 'user_id');
  }
}
