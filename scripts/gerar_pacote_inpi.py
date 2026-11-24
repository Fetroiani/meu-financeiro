#!/usr/bin/env python3
"""Gera o pacote de registro do Anotei Já no INPI dentro de inpi_pacote/ (fora do Git).

1. inpi_pacote/marca_mista_anotei_ja.jpg  -> imagem da marca mista para o e-Marcas
   (JPG sem transparência, 945 x 945 px, 300 DPI, fundo branco #FFFFFF com margem).
2. inpi_pacote/anotei_ja_codigo_fonte.zip -> código-fonte autoral para o e-Software
   (somente arquivos versionados no Git, sem build, dependências, imagens nem segredos).
3. inpi_pacote/DADOS_PROTOCOLO_INPI.txt   -> hash SHA-512 do zip e dados para os formulários.

Uso (Windows, macOS ou Linux, na raiz do projeto):  python scripts/gerar_pacote_inpi.py
Requer Python 3.8+ e Pillow (pip install pillow). O zip é determinístico: os mesmos
arquivos geram sempre o mesmo hash.
"""
import fnmatch
import hashlib
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "inpi_pacote"
LOGO = RAIZ / "design" / "anotei-ja-marca.png"  # ícone 3D "AJ" + texto "Anotei Já", fundo transparente
JPG = SAIDA / "marca_mista_anotei_ja.jpg"
ZIP = SAIDA / "anotei_ja_codigo_fonte.zip"
TXT = SAIDA / "DADOS_PROTOCOLO_INPI.txt"

# Código autoral que entra no zip (prefixos de caminho relativos à raiz).
INCLUIR = [
    "lib/", "test/",                                   # Dart: modelos e repositórios + testes
    "www/",                                            # app web (HTML, CSS, JavaScript)
    "supabase/schema.sql", "supabase/migrations/", "supabase/tests/",  # SQL
    "scripts/",                                        # testes e ferramentas de build
    "pubspec.yaml", "analysis_options.yaml", "package.json", "capacitor.config.json",
    "LEIA-ME.md",
]
# Nunca entram: build, dependências de terceiros, segredos, chaves e mídia.
EXCLUIR = [
    ".env", ".env.*", "*.pem", "*.key", "*.jks", "*.keystore", "*.p12",
    ".git/*", "build/*", "*/build/*", ".dart_tool/*", "node_modules/*", "*/node_modules/*",
    "www/vendor/*", "supabase/.temp/*", "supabase/.branches/*", "supabase/config.toml",
    "inpi_pacote/*",
    "*.png", "*.jpg", "*.jpeg", "*.webp", "*.ico", "*.gif", "*.svg",
]
EXT_LINGUAGEM = {".dart": "DART", ".sql": "SQL", ".js": "JAVA SCRIPT",
                 ".html": "HTML", ".css": "CSS", ".py": "PYTHON"}


def git(*args):
    return subprocess.run(["git", *args], cwd=RAIZ, check=True,
                          capture_output=True, text=True).stdout


def gerar_marca():
    from PIL import Image
    lado, margem = 945, 95                      # 8 x 8 cm a 300 DPI; ~1 cm de margem branca
    logo = Image.open(LOGO).convert("RGBA")
    logo = logo.crop(logo.getbbox())            # remove bordas transparentes
    caixa = lado - 2 * margem
    escala = min(caixa / logo.width, caixa / logo.height)
    logo = logo.resize((round(logo.width * escala), round(logo.height * escala)), Image.LANCZOS)
    tela = Image.new("RGB", (lado, lado), (255, 255, 255))
    tela.paste(logo, ((lado - logo.width) // 2, (lado - logo.height) // 2), logo)
    tela.save(JPG, "JPEG", quality=95, dpi=(300, 300), subsampling=0, optimize=True)


def arquivos_do_zip():
    versionados = git("ls-files", "-z").split("\0")
    lista = []
    for caminho in versionados:
        if not caminho or not any(caminho == p or caminho.startswith(p) for p in INCLUIR):
            continue
        nome = caminho.rsplit("/", 1)[-1]
        if any(fnmatch.fnmatch(caminho, e) or fnmatch.fnmatch(nome, e) for e in EXCLUIR):
            continue
        if (RAIZ / caminho).is_file():
            lista.append(caminho)
    return sorted(lista)


def gerar_zip(arquivos):
    # Data fixa = data do último commit, para o zip ser reproduzível (mesmo hash).
    ts = git("log", "-1", "--format=%cd", "--date=format:%Y %m %d %H %M %S").split()
    data = tuple(int(x) for x in ts)
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for caminho in arquivos:
            info = zipfile.ZipInfo("anotei_ja/" + caminho, date_time=data)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, (RAIZ / caminho).read_bytes())


def sha512(caminho):
    h = hashlib.sha512()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def escrever_guia(arquivos, hash_zip):
    primeiro = git("log", "--reverse", "--format=%ad", "--date=format:%d/%m/%Y").split()[0]
    commit = git("rev-parse", "HEAD").strip()
    linhas_por_ling, total = {}, 0
    for c in arquivos:
        ling = EXT_LINGUAGEM.get(Path(c).suffix.lower())
        n = (RAIZ / c).read_bytes().count(b"\n")
        total += n
        if ling:
            linhas_por_ling[ling] = linhas_por_ling.get(ling, 0) + n
    linguagens = "; ".join(sorted(linhas_por_ling))
    resumo_ling = "\n".join(f"    - {l}: {n} linhas" for l, n in sorted(linhas_por_ling.items()))
    tam_zip = ZIP.stat().st_size
    gerado = datetime.now().strftime("%d/%m/%Y %H:%M")

    TXT.write_text(f"""DADOS PARA PROTOCOLO NO INPI - ANOTEI JÁ
Gerado em {gerado} por scripts/gerar_pacote_inpi.py
================================================================

ARQUIVOS DESTE PACOTE
  - marca_mista_anotei_ja.jpg   (e-Marcas: imagem da marca mista)
  - anotei_ja_codigo_fonte.zip  (e-Software: código-fonte; NÃO é enviado ao INPI)
  - DADOS_PROTOCOLO_INPI.txt    (este guia)

================================================================
1) e-MARCAS - REGISTRO DE MARCA MISTA
================================================================
  Nome da marca (elemento nominativo): Anotei Já
  Natureza:     Produto/Serviço  (marca de produto ou serviço)
  Apresentação: Mista
  Imagem:       inpi_pacote/marca_mista_anotei_ja.jpg
                JPG sem transparência, 945 x 945 px, 300 DPI, fundo branco #FFFFFF
  Classe:       NCL 9 - Software aplicativo para dispositivos móveis;
                programas de computador baixáveis (gravados ou descarregáveis).
                Prefira os termos já aprovados da lista do próprio e-Marcas
                (ex.: "Aplicativos de software para computador, baixáveis";
                "Software aplicativo para telefones móveis"): com termos
                pré-aprovados o INPI não questiona a especificação.
  Sugestão:     como o Anotei Já também funciona como site (link no navegador),
                avalie um 2º pedido na NCL 42 (software como serviço - SaaS).
                Cada classe é um pedido e uma taxa (GRU) separados.
  Elementos figurativos (Classificação de Viena): o formulário exige de 1 a 5
                códigos. Sugestões para conferir na busca do e-Marcas:
                27.5 (letras com desenho), 24.15 (setas), 26.4 (quadriláteros).

================================================================
2) e-SOFTWARE - REGISTRO DE PROGRAMA DE COMPUTADOR
================================================================
  Título do programa:  Anotei Já
  Data de criação:     {primeiro}   (primeiro commit do projeto)
  Data de publicação:  {primeiro}   (o app foi publicado no GitHub Pages no mesmo dia;
                       confira e informe a data em que ele ficou público)
  Linguagens:          {linguagens}
  Campo de aplicação:  FN-01 (Finanças / gestão financeira pessoal)
  Tipo de programa:    AP-01 (Aplicativo)
     ATENÇÃO: os códigos FN-xx e AP-xx existem na tabela do INPI, mas confirme
     a descrição de cada um na lista do próprio formulário antes de enviar
     (ex.: se houver um código FN mais específico para finanças pessoais).

  Algoritmo hash:      SHA-512
  Resumo digital hash do arquivo anotei_ja_codigo_fonte.zip:
{hash_zip}

  Tamanho do zip:      {tam_zip} bytes
  Arquivos no zip:     {len(arquivos)}  (linhas totais: {total})
{resumo_ling}
  Versão (commit Git): {commit}

  ### GUARDE O ZIP COM CUIDADO ###
  O INPI recebe só o hash, nunca o código. O arquivo anotei_ja_codigo_fonte.zip,
  exatamente como está (byte a byte), é a sua prova técnica em caso de perícia
  judicial. Guarde ao menos 2 cópias em locais privados (ex.: nuvem privada e HD
  externo). NÃO abra e salve de novo, NÃO recompacte e NÃO renomeie o conteúdo:
  qualquer alteração muda o hash e a prova deixa de valer.
  Para conferir depois:
    Windows:      certutil -hashfile anotei_ja_codigo_fonte.zip SHA512
    macOS/Linux:  shasum -a 512 anotei_ja_codigo_fonte.zip

================================================================
CONTEÚDO DO ZIP
================================================================
""" + "\n".join("  " + c for c in arquivos) + "\n", encoding="utf-8")


def main():
    SAIDA.mkdir(exist_ok=True)
    gerar_marca()
    arquivos = arquivos_do_zip()
    gerar_zip(arquivos)
    h = sha512(ZIP)
    escrever_guia(arquivos, h)
    print(f"Pronto: {SAIDA}")
    print(f"Arquivos no zip: {len(arquivos)}")
    print(f"SHA-512 do zip: {h}")


if __name__ == "__main__":
    sys.exit(main())
