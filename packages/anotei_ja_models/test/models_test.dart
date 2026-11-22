import 'package:anotei_ja_models/anotei_ja_models.dart';
import 'package:test/test.dart';

const u = '11111111-1111-1111-1111-111111111111';

void main() {
  group('Categoria', () {
    test('lê e grava o JSON do Supabase', () {
      final c = Categoria.fromJson({
        'id': 'c1',
        'user_id': u,
        'nome': 'Mercado',
        'tipo': 'gasto',
        'cor': '#4ECDC4',
        'icone': 'shopping_cart',
        'palavras_chave': ['supermercado', 'pao de acucar'],
        'meta_mensal': '800.00',
        'subpastas': [],
        'created_at': '2026-11-22T12:00:00+00:00',
      });
      expect(c.tipo, TipoLancamento.gasto);
      expect(c.metaMensal, 800);
      expect(c.validar(), isEmpty);
      expect(c.toJson()['palavras_chave'], ['supermercado', 'pao de acucar']);
      expect(c.toJson().containsKey('created_at'), isFalse);
    });
    test('valida como os CHECK do banco', () {
      final c = Categoria(userId: u, nome: '  ', tipo: TipoLancamento.gasto, cor: 'red', metaMensal: 0);
      expect(c.validar().length, 3);
    });
    test('palavra-chave inteira e sem acento', () {
      final c = Categoria(userId: u, nome: 'Lazer', tipo: TipoLancamento.gasto, palavrasChave: ['bar', 'amazon prime']);
      expect(c.combina('Bar do Zé'), isTrue);
      expect(c.combina('BARRA DE CEREAL'), isFalse);
      expect(c.combina('AMAZON PRIME*BR'), isTrue);
    });
  });

  group('Transacao', () {
    test('parcela com centavos na última', () {
      final p = Transacao.parcelar(
        userId: u,
        descricao: 'Compra Loja',
        valorTotal: 100,
        vezes: 3,
        primeiraData: DateTime(2026, 1, 31),
        grupoParcelamentoId: 'g1',
      );
      expect(p.map((t) => t.valorBrl), [33.33, 33.33, 33.34]);
      expect(p.map((t) => t.descricao), ['Compra Loja (1/3)', 'Compra Loja (2/3)', 'Compra Loja (3/3)']);
      expect(p.map((t) => dataDb(t.dataTransacao)), ['2026-01-31', '2026-02-28', '2026-03-31']);
      expect(p.every((t) => t.validar().isEmpty), isTrue);
      expect(p.first.toJson()['grupo_parcelamento_id'], 'g1');
    });
    test('à vista não tem grupo', () {
      final p = Transacao.parcelar(userId: u, descricao: 'X', valorTotal: 10, vezes: 1, primeiraData: DateTime(2026), grupoParcelamentoId: 'g');
      expect(p.single.grupoParcelamentoId, isNull);
      expect(p.single.descricao, 'X');
    });
    test('fromJson e validação', () {
      final t = Transacao.fromJson({
        'user_id': u,
        'descricao': 'Hotel',
        'valor_brl': 550,
        'valor_usd': '100.00',
        'cotacao_usd': '5.5000',
        'tipo': 'gasto',
        'data_transacao': '2026-11-22',
        'parcela_atual': 1,
        'total_parcelas': 1,
      });
      expect(t.valorUsd, 100);
      expect(t.toJson()['data_transacao'], '2026-11-22');
      expect(Transacao(userId: u, descricao: 'x', valorBrl: 1, tipo: TipoLancamento.gasto, dataTransacao: DateTime(2026), parcelaAtual: 3, totalParcelas: 2).validar(), isNotEmpty);
    });
  });

  group('Vencimento', () {
    test('aviso e próxima ocorrência', () {
      final v = Vencimento(userId: u, conta: 'Aluguel', valorEstimado: 1500, dataVencimento: DateTime(2026, 11, 30), diasAviso: 3);
      expect(v.avisar(DateTime(2026, 11, 26)), isFalse);
      expect(v.avisar(DateTime(2026, 11, 27)), isTrue);
      expect(dataDb(v.proxima()!.dataVencimento), '2026-12-30');
      expect(Vencimento(userId: u, conta: 'IPVA', dataVencimento: DateTime(2026), recorrencia: Recorrencia.unica).proxima(), isNull);
      expect(Vencimento.fromJson(v.toJson()).recorrencia, Recorrencia.mensal);
    });
  });
}
