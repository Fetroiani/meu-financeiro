/* Anotei Já: idiomas (Português, Español, English).
   O app é escrito em português. Em espanhol ou inglês, este arquivo troca os textos da tela
   à medida que aparecem (textos, placeholder, aria-label, title e alt).
   Dados do usuário (descrições, nomes de categorias criadas por ele) não são traduzidos. */
(function(){
'use strict';
const K='anoteija.lang';
const LANGS={pt:'Português',es:'Español',en:'English'};
const LOC={pt:'pt-BR',es:'es-ES',en:'en-US'};
let L=null;try{L=localStorage.getItem(K)}catch(e){}
if(!LANGS[L]){const n=String((navigator.languages&&navigator.languages[0])||navigator.language||'pt').slice(0,2).toLowerCase();L=LANGS[n]?n:'pt'}
const I=L==='es'?0:1;

/* Português -> [Español, English] */
const D={
// --- telas fixas
'+ Entrada':['+ Ingreso','+ Income'],'+ Gasto':['+ Gasto','+ Expense'],'+ Item':['+ Ítem','+ Item'],
'1 dia antes':['1 día antes','1 day before'],'3 dias antes':['3 días antes','3 days before'],'5 dias antes':['5 días antes','5 days before'],'7 dias antes':['7 días antes','7 days before'],
'A pagar no mês':['A pagar en el mes','Due this month'],
'Aceita PDF, foto, CSV, OFX, Excel (.xlsx, .xls) e TXT':['Acepta PDF, foto, CSV, OFX, Excel (.xlsx, .xls) y TXT','Accepts PDF, photo, CSV, OFX, Excel (.xlsx, .xls) and TXT'],
'As contas de consumo e as faturas de cartão que você lê ganham alerta sozinhas. Aqui você também cadastra outras contas (aluguel, escola, plano de saúde…). Quando pagar, toque em':['Las facturas de servicios y de tarjeta que leas reciben un aviso automáticamente. Aquí también puedes registrar otras cuentas (alquiler, colegio, seguro médico…). Cuando pagues, toca','Utility bills and card statements you scan get a reminder automatically. You can also add other bills here (rent, school, health plan…). When you pay, tap'],
': o valor vai para o extrato e, se a conta é mensal, o próximo mês já fica agendado.':[': el importe pasa al extracto y, si la cuenta es mensual, el próximo mes queda programado.',': the amount goes to the statement and, if the bill is monthly, next month is scheduled.'],
'Avisar quantos dias antes':['Avisar cuántos días antes','Remind how many days before'],
'Backup dos dados':['Copia de seguridad','Data backup'],
'Baixar planilha Excel (.xlsx)':['Descargar hoja de Excel (.xlsx)','Download Excel sheet (.xlsx)'],
'Bloquear':['Bloquear','Lock'],'Bloquear agora':['Bloquear ahora','Lock now'],'Bloquear o app':['Bloquear la app','Lock the app'],
'Calendário':['Calendario','Calendar'],'Cancelar':['Cancelar','Cancel'],'Cancelar edição':['Cancelar edición','Cancel editing'],
'Carregando…':['Cargando…','Loading…'],'Cartão':['Tarjeta','Card'],'Categoria':['Categoría','Category'],'Categorias':['Categorías','Categories'],
'Categorias do mês':['Categorías del mes','Categories this month'],
'Colocar todos os alertas na agenda':['Poner todos los avisos en el calendario','Add all reminders to calendar'],
'Como usar o app':['Cómo usar la app','How to use the app'],'Confira a fatura':['Revisa la factura','Check the statement'],
'Confira antes de salvar':['Revisa antes de guardar','Check before saving'],'Conta':['Cuenta','Bill'],'Copiar backup':['Copiar copia de seguridad','Copy backup'],
'Cotação':['Cotización','Exchange rate'],'Criar':['Crear','Create'],'Criar conta':['Crear cuenta','Create account'],'Cupom':['Ticket','Receipt'],
'Data':['Fecha','Date'],'Depois':['Después','Later'],'Descrição':['Descripción','Description'],'Desfazer':['Deshacer','Undo'],
'Desmarque o que não quer salvar. Pagamentos e estornos já vêm desmarcados. Itens sem categoria clara vão para Cartão de crédito.':['Desmarca lo que no quieras guardar. Pagos y devoluciones ya vienen desmarcados. Los ítems sin categoría clara van a Tarjeta de crédito.','Untick what you don\'t want to save. Payments and refunds come unticked. Items without a clear category go to Credit card.'],
'E-mail':['Correo','Email'],'Entrada':['Ingreso','Income'],'Entradas':['Ingresos','Income'],'Entrar':['Entrar','Sign in'],
'Entre com uma conta para ver os mesmos dados no celular, no computador e em outros aparelhos. Os dados continuam guardados neste aparelho e também vão para o servidor, protegidos pelo seu login.':['Entra con una cuenta para ver los mismos datos en el móvil, en el ordenador y en otros dispositivos. Los datos siguen guardados en este dispositivo y también van al servidor, protegidos por tu inicio de sesión.','Sign in with an account to see the same data on your phone, computer and other devices. Your data stays on this device and also goes to the server, protected by your login.'],
'Enviar fatura ou documento':['Enviar factura o documento','Upload statement or document'],
'Esqueci a senha':['Olvidé la contraseña','Forgot password'],'Esqueci meu PIN':['Olvidé mi PIN','Forgot my PIN'],
'Extrato':['Extracto','Statement'],'Extrato do banco':['Extracto bancario','Bank statement'],'Fatura de cartão':['Factura de tarjeta','Card statement'],
'Fazer backup':['Hacer copia','Back up'],'Fechar':['Cerrar','Close'],'Fechar menu':['Cerrar menú','Close menu'],'Ferramentas':['Herramientas','Tools'],
'Fotografe o cupom inteiro, reto, com boa luz e sem dobras. A leitura acontece no próprio celular, sem internet. Quando você troca a categoria de um item, o app aprende para a próxima vez.':['Fotografía el ticket entero, recto, con buena luz y sin pliegues. La lectura se hace en el propio móvil, sin internet. Cuando cambias la categoría de un ítem, la app aprende para la próxima vez.','Photograph the whole receipt, straight, in good light and without folds. Reading happens on your phone, offline. When you change an item\'s category, the app learns for next time.'],
'Início':['Inicio','Home'],'Lançar':['Registrar','Add'],'Ler cupom, nota, conta ou fatura':['Leer ticket, factura o cuenta','Scan receipt, invoice, bill or statement'],
'Ler e separar itens':['Leer y separar ítems','Read and split items'],'Loja':['Tienda','Store'],'Moeda':['Moneda','Currency'],
'Mude nome, cor e palavras-chave (separadas por vírgula). As palavras-chave ajudam o app a separar sozinho os itens do cupom e da fatura. Use subpastas para separar, por exemplo, cada cartão de crédito. Com uma':['Cambia nombre, color y palabras clave (separadas por coma). Las palabras clave ayudan a la app a separar sola los ítems del ticket y de la factura. Usa subcarpetas para separar, por ejemplo, cada tarjeta de crédito. Con una','Change name, colour and keywords (comma separated). Keywords help the app sort receipt and statement items by itself. Use subfolders to split, for example, each credit card. With a'],
'meta mensal':['meta mensual','monthly goal'],
', a tela inicial mostra quanto da meta já foi usado: verde até 75%, amarelo até 99% e vermelho a partir de 100%.':[', la pantalla de inicio muestra cuánto de la meta ya se usó: verde hasta 75%, amarillo hasta 99% y rojo desde 100%.',', the home screen shows how much of the goal is used: green up to 75%, yellow up to 99% and red from 100%.'],
'No dia':['El mismo día','On the day'],'Nova categoria':['Nueva categoría','New category'],'Nova senha':['Nueva contraseña','New password'],
'Novo alerta':['Nuevo aviso','New reminder'],'Novo lançamento':['Nuevo registro','New entry'],
'O backup sai criptografado, protegido pelo seu PIN atual. Guarde o texto (num e-mail ou nota) antes de trocar de celular. Para restaurar, cole o texto, informe o PIN que você usava quando fez o backup e toque em Restaurar.':['La copia sale cifrada, protegida por tu PIN actual. Guarda el texto (en un correo o nota) antes de cambiar de móvil. Para restaurar, pega el texto, indica el PIN que usabas cuando hiciste la copia y toca Restaurar.','The backup is encrypted with your current PIN. Keep the text (in an email or note) before changing phones. To restore, paste the text, enter the PIN you used when you made the backup and tap Restore.'],
'Paguei':['Pagué','Paid'],'Para onde foi o dinheiro':['A dónde fue el dinero','Where the money went'],'Parcelas':['Cuotas','Instalments'],
'Personalizar categorias':['Personalizar categorías','Customise categories'],'Previsão de sobra':['Previsión de sobrante','Expected leftover'],
'Protegido com PIN':['Protegido con PIN','Protected by PIN'],'Próximo':['Siguiente','Next'],'Pular':['Saltar','Skip'],'R$ (real)':['R$ (real)','R$ (real)'],
'Receber aviso com o app fechado':['Recibir aviso con la app cerrada','Get reminders with the app closed'],'Repetir':['Repetir','Repeat'],'Restaurar':['Restaurar','Restore'],
'Sair da conta':['Cerrar sesión','Sign out'],'Saldo do mês':['Saldo del mes','Month balance'],'Salvar':['Guardar','Save'],'Salvar alerta':['Guardar aviso','Save reminder'],
'Salvar no extrato':['Guardar en el extracto','Save to statement'],'Salvar nova senha':['Guardar nueva contraseña','Save new password'],
'Saída':['Gasto','Expense'],'Saídas':['Gastos','Expenses'],'Segurança':['Seguridad','Security'],'Segurança e backup':['Seguridad y copia','Security and backup'],'Senha':['Contraseña','Password'],
'Seus dados ficam só neste celular, criptografados (AES-256). Sem o seu PIN ou a sua biometria ninguém consegue lê-los. O app se bloqueia sozinho 1 minuto depois que você sai dele.':['Tus datos quedan solo en este móvil, cifrados (AES-256). Sin tu PIN o tu biometría nadie puede leerlos. La app se bloquea sola 1 minuto después de que sales de ella.','Your data stays only on this phone, encrypted (AES-256). Without your PIN or biometrics nobody can read it. The app locks itself 1 minute after you leave it.'],
'Sincronizar agora':['Sincronizar ahora','Sync now'],'Sincronizar entre aparelhos':['Sincronizar entre dispositivos','Sync across devices'],'Subpasta':['Subcarpeta','Subfolder'],
'Só uma vez':['Solo una vez','Just once'],'Tipo':['Tipo','Type'],'Tirar foto ou escolher imagem':['Tomar foto o elegir imagen','Take photo or choose image'],
'Todo ano':['Cada año','Every year'],'Todo mês':['Cada mes','Every month'],'Toque em':['Toca','Tap'],'Trocar PIN':['Cambiar PIN','Change PIN'],
'US$ (dólar)':['US$ (dólar)','US$ (dollar)'],'€ (euro)':['€ (euro)','€ (euro)'],'Valor (R$)':['Importe (R$)','Amount (R$)'],'Valor (R$, opcional)':['Importe (R$, opcional)','Amount (R$, optional)'],
'Valor em US$':['Importe en US$','Amount in US$'],'Vencimento':['Vencimiento','Due date'],'Vencimentos':['Vencimientos','Bills due'],'Ver o texto que o app leu':['Ver el texto que leyó la app','See the text the app read'],
'num alerta para colocar o lembrete na agenda do celular. A agenda avisa no dia certo, mesmo com o app fechado, e não envia nada para a internet. Com o app instalado na tela inicial, o ícone também mostra quantas contas estão vencendo.':['en un aviso para ponerlo en el calendario del móvil. El calendario avisa el día correcto, incluso con la app cerrada, y no envía nada a internet. Con la app instalada en la pantalla de inicio, el ícono también muestra cuántas cuentas vencen.','on a reminder to add it to your phone\'s calendar. The calendar alerts you on the right day, even with the app closed, and sends nothing to the internet. With the app installed on the home screen, the icon also shows how many bills are due.'],
'Últimos 6 meses':['Últimos 6 meses','Last 6 months'],'⟳ Atualizar app':['⟳ Actualizar app','⟳ Update app'],
'💾 Faz tempo que você não salva uma cópia dos seus dados. Se o celular quebrar ou for trocado, o backup é o que salva tudo.':['💾 Hace tiempo que no guardas una copia de tus datos. Si el móvil se rompe o lo cambias, la copia es lo que salva todo.','💾 It\'s been a while since you saved a copy of your data. If your phone breaks or is replaced, the backup is what saves everything.'],
'📷 Ler cupom':['📷 Leer ticket','📷 Scan receipt'],'📷 Ler cupom fiscal':['📷 Leer ticket','📷 Scan receipt'],
// --- atributos
'Abrir menu':['Abrir menú','Open menu'],'Ajuda':['Ayuda','Help'],'Buscar por descrição ou loja':['Buscar por descripción o tienda','Search by description or store'],'Cor':['Color','Colour'],
'Esconder valores':['Ocultar importes','Hide amounts'],'Mostrar valores':['Mostrar importes','Show amounts'],
'Ex.: Aluguel, Escola, Plano de saúde':['Ej.: Alquiler, Colegio, Seguro médico','E.g. Rent, School, Health plan'],
'Ex.: Netflix, salário, almoço (opcional)':['Ej.: Netflix, salario, almuerzo (opcional)','E.g. Netflix, salary, lunch (optional)'],
'Foto do cupom':['Foto del ticket','Receipt photo'],'Gráfico de gastos por categoria':['Gráfico de gastos por categoría','Spending by category chart'],'Lembrar depois':['Recordar después','Remind me later'],
'Menu':['Menú','Menu'],'Mês anterior':['Mes anterior','Previous month'],'Próximo mês':['Mes siguiente','Next month'],'Nome (ex.: Saúde, Pet, Escola)':['Nombre (ej.: Salud, Mascota, Colegio)','Name (e.g. Health, Pet, School)'],
'PIN do backup (se for outro)':['PIN de la copia (si es otro)','Backup PIN (if different)'],'Pelo menos 8 caracteres':['Al menos 8 caracteres','At least 8 characters'],'Texto do backup':['Texto de la copia','Backup text'],
'Editar':['Editar','Edit'],'Duplicar':['Duplicar','Duplicate'],'Duplicar com a data de hoje':['Duplicar con la fecha de hoy','Duplicate with today\'s date'],'Apagar':['Borrar','Delete'],
'Apagar dígito':['Borrar dígito','Delete digit'],'Entrar com Face ID ou digital':['Entrar con Face ID o huella','Sign in with Face ID or fingerprint'],'Face ID / digital':['Face ID / huella','Face ID / fingerprint'],
'Item':['Ítem','Item'],'Valor':['Importe','Amount'],'Nome':['Nombre','Name'],'Subir':['Subir','Move up'],'Descer':['Bajar','Move down'],'Palavras-chave':['Palabras clave','Keywords'],
'Palavras-chave (ex.: drogaria, farmácia)':['Palabras clave (ej.: droguería, farmacia)','Keywords (e.g. drugstore, pharmacy)'],'Palavras-chave de entradas':['Palabras clave de ingresos','Income keywords'],
'Palavras que indicam uma entrada (ex.: salário)':['Palabras que indican un ingreso (ej.: salario)','Words that mean income (e.g. salary)'],
'Ao digitar uma dessas palavras num lançamento, o app já marca como Entrada.':['Al escribir una de estas palabras en un registro, la app lo marca como Ingreso.','When you type one of these words in an entry, the app marks it as Income.'],
'Meta mensal (R$, opcional)':['Meta mensual (R$, opcional)','Monthly goal (R$, optional)'],'Sem meta':['Sin meta','No goal'],'Salvar este lançamento':['Guardar este registro','Save this entry'],
// --- mensagens do app
' (valor estimado)':[' (importe estimado)',' (estimated amount)'],'(valor estimado)':['(importe estimado)','(estimated amount)'],
'A biometria mudou neste celular. Entre com o PIN e ligue de novo em Segurança.':['La biometría cambió en este móvil. Entra con el PIN y actívala de nuevo en Seguridad.','Biometrics changed on this phone. Sign in with your PIN and turn it on again in Security.'],
'A planilha ainda está carregando, tente de novo':['La hoja aún está cargando, inténtalo de nuevo','The spreadsheet is still loading, try again'],
'A senha precisa ter pelo menos 8 caracteres.':['La contraseña necesita al menos 8 caracteres.','The password needs at least 8 characters.'],
'A sincronização entre aparelhos ainda não foi configurada neste app.':['La sincronización entre dispositivos aún no está configurada en esta app.','Sync across devices hasn\'t been set up in this app yet.'],
'Abra o arquivo para adicionar à agenda':['Abre el archivo para añadirlo al calendario','Open the file to add it to your calendar'],'Abrir o Anotei Já':['Abrir Anotei Já','Open Anotei Já'],
'Abrindo…':['Abriendo…','Opening…'],'Atualizando…':['Actualizando…','Updating…'],'Procurando atualização…':['Buscando actualización…','Checking for updates…'],
'Aguardando a primeira sincronização':['Esperando la primera sincronización','Waiting for the first sync'],'Alerta alterado':['Aviso modificado','Reminder updated'],'Alerta apagado':['Aviso borrado','Reminder deleted'],
'Algo deu errado.':['Algo salió mal.','Something went wrong.'],'App atualizado. A nova versão abre quando você bloquear ou reabrir.':['App actualizada. La nueva versión se abre cuando bloquees o vuelvas a abrir.','App updated. The new version opens when you lock or reopen it.'],
'Ativar biometria':['Activar biometría','Turn on biometrics'],'Backup criptografado copiado':['Copia cifrada copiada','Encrypted backup copied'],'Biometria desligada':['Biometría desactivada','Biometrics off'],
'Biometria ligada':['Biometría activada','Biometrics on'],'Biometria não ativada':['Biometría no activada','Biometrics not turned on'],
'Comece lançando um gasto, uma entrada ou lendo um cupom fiscal.':['Empieza registrando un gasto, un ingreso o leyendo un ticket.','Start by adding an expense, income or scanning a receipt.'],'Começar':['Empezar','Start'],
'Conectado. Sincronizando seus dados…':['Conectado. Sincronizando tus datos…','Connected. Syncing your data…'],'Confirme com Face ID ou digital…':['Confirma con Face ID o huella…','Confirm with Face ID or fingerprint…'],
'Confirme o seu e-mail pelo link que enviamos antes de entrar.':['Confirma tu correo con el enlace que enviamos antes de entrar.','Confirm your email using the link we sent before signing in.'],'Confirme que é você':['Confirma que eres tú','Confirm it\'s you'],
'Conforme você lança, aqui aparece quanto gastou em cada um dos últimos 6 meses.':['A medida que registres, aquí aparece cuánto gastaste en cada uno de los últimos 6 meses.','As you add entries, this shows how much you spent in each of the last 6 months.'],
'Conta criada. Sincronizando seus dados…':['Cuenta creada. Sincronizando tus datos…','Account created. Syncing your data…'],'Conta de consumo':['Factura de servicio','Utility bill'],
'Criando seu cofre…':['Creando tu caja fuerte…','Creating your vault…'],'Crie a nova senha da sua conta.':['Crea la nueva contraseña de tu cuenta.','Create a new password for your account.'],
'Crie um PIN de 6 dígitos para proteger seus dados':['Crea un PIN de 6 dígitos para proteger tus datos','Create a 6-digit PIN to protect your data'],
'DESCRIPTION:Lembrete do Anotei Já':['DESCRIPTION:Recordatorio de Anotei Já','DESCRIPTION:Anotei Já reminder'],
'Desligar Face ID / digital':['Desactivar Face ID / huella','Turn off Face ID / fingerprint'],'Digite a senha.':['Escribe la contraseña.','Enter the password.'],
'Digite o PIN de novo para confirmar':['Escribe el PIN de nuevo para confirmar','Enter the PIN again to confirm'],'Digite o novo PIN de 6 dígitos':['Escribe el nuevo PIN de 6 dígitos','Enter the new 6-digit PIN'],
'Digite o seu e-mail acima e toque de novo em Esqueci a senha.':['Escribe tu correo arriba y toca de nuevo Olvidé la contraseña.','Enter your email above and tap Forgot password again.'],
'Digite seu PIN':['Escribe tu PIN','Enter your PIN'],'Digite um e-mail válido.':['Escribe un correo válido.','Enter a valid email.'],'Duplicado com a data de hoje':['Duplicado con la fecha de hoy','Duplicated with today\'s date'],
'E-mail ou senha incorretos.':['Correo o contraseña incorrectos.','Wrong email or password.'],'Editar alerta':['Editar aviso','Edit reminder'],'Editar lançamento':['Editar registro','Edit entry'],
'Entrar com Face ID / digital':['Entrar con Face ID / huella','Sign in with Face ID / fingerprint'],'Envie a fatura do cartão ou o extrato do banco em PDF, OFX, CSV ou Excel. Os lançamentos entram de uma vez, já separados, e o vencimento vira alerta.':['Envía la factura de la tarjeta o el extracto bancario en PDF, OFX, CSV o Excel. Los registros entran de una vez, ya separados, y el vencimiento se convierte en aviso.','Upload your card statement or bank statement as PDF, OFX, CSV or Excel. Entries come in all at once, already sorted, and the due date becomes a reminder.'],
'Escolher da galeria':['Elegir de la galería','Choose from gallery'],'Esse PIN é fácil de adivinhar. Escolha outro.':['Ese PIN es fácil de adivinar. Elige otro.','That PIN is easy to guess. Choose another.'],
'Este celular ainda não permite Face ID / digital em apps de navegador. Continue usando o PIN.':['Este móvil aún no permite Face ID / huella en apps del navegador. Sigue usando el PIN.','This phone doesn\'t allow Face ID / fingerprint in browser apps yet. Keep using your PIN.'],
'Este e-mail já tem conta. Toque em Entrar.':['Este correo ya tiene cuenta. Toca Entrar.','This email already has an account. Tap Sign in.'],'Este navegador não suporta criptografia. Abra pelo app.':['Este navegador no admite cifrado. Ábrelo desde la app.','This browser doesn\'t support encryption. Open it from the app.'],
'Face ID / digital ligado':['Face ID / huella activado','Face ID / fingerprint on'],'Face ID / digital: este navegador não oferece. No iPhone, use o Safari (iOS 18 ou mais novo). No Android, use o Chrome.':['Face ID / huella: este navegador no lo ofrece. En iPhone, usa Safari (iOS 18 o más reciente). En Android, usa Chrome.','Face ID / fingerprint: this browser doesn\'t offer it. On iPhone, use Safari (iOS 18 or newer). On Android, use Chrome.'],
'Fatura do cartão':['Factura de la tarjeta','Card statement'],'Fatura marcada como paga':['Factura marcada como pagada','Statement marked as paid'],'Fotografe o cupom fiscal':['Fotografía el ticket','Photograph the receipt'],
'Imagem carregada. Toque em':['Imagen cargada. Toca','Image loaded. Tap'],'Importe faturas e extratos':['Importa facturas y extractos','Import statements'],
'Informe o PIN usado quando o backup foi feito':['Indica el PIN usado cuando se hizo la copia','Enter the PIN used when the backup was made'],'Informe um valor maior que zero.':['Indica un importe mayor que cero.','Enter an amount greater than zero.'],
'Lance um gasto ou fotografe um cupom: o app separa cada item na categoria certa.':['Registra un gasto o fotografía un ticket: la app separa cada ítem en la categoría correcta.','Add an expense or photograph a receipt: the app puts each item in the right category.'],
'Lançamento apagado':['Registro borrado','Entry deleted'],'Lançamentos':['Registros','Entries'],'Lendo o cupom…':['Leyendo el ticket…','Reading the receipt…'],'Lendo':['Leyendo','Reading'],
'Lendo os itens no próprio celular. Na primeira vez leva um pouco mais.':['Leyendo los ítems en el propio móvil. La primera vez tarda un poco más.','Reading the items on your phone. The first time takes a bit longer.'],
'Muitas tentativas. Espere alguns minutos e tente de novo.':['Demasiados intentos. Espera unos minutos e inténtalo de nuevo.','Too many attempts. Wait a few minutes and try again.'],'Mês':['Mes','Month'],
'Nenhum alerta pendente':['Ningún aviso pendiente','No pending reminders'],'Nenhum item com valor.':['Ningún ítem con importe.','No items with an amount.'],'Nome da subpasta':['Nombre de la subcarpeta','Subfolder name'],
'Nome da subpasta e Enter':['Nombre de la subcarpeta y Enter','Subfolder name and Enter'],'Nome do cartão (ex.: Nubank, Itaú Visa)':['Nombre de la tarjeta (ej.: Nubank, Visa)','Card name (e.g. Nubank, Visa)'],'Nome do cartão e Enter':['Nombre de la tarjeta y Enter','Card name and Enter'],
'Nome do cartão':['Nombre de la tarjeta','Card name'],'Ex.: Nubank, Itaú Visa':['Ej.: Nubank, Visa','E.g. Nubank, Visa'],'Criar cartão':['Crear tarjeta','Create card'],
'Não encontrei itens com valor nesta foto. Tente outra foto mais perto e com mais luz, ou preencha abaixo.':['No encontré ítems con importe en esta foto. Prueba otra foto más cerca y con más luz, o completa abajo.','I found no items with an amount in this photo. Try another photo closer and with more light, or fill in below.'],
'Não encontrei lançamentos neste arquivo. Veja abaixo o texto que o app conseguiu ler.':['No encontré registros en este archivo. Mira abajo el texto que la app pudo leer.','I found no entries in this file. See below the text the app could read.'],
'Não foi possível ligar a biometria':['No fue posible activar la biometría','Couldn\'t turn on biometrics'],
'O app lê cada item do cupom e separa na categoria certa: mercado, alimentação, saúde… Se você corrigir uma categoria, ele aprende para a próxima vez.':['La app lee cada ítem del ticket y lo separa en la categoría correcta: supermercado, comida, salud… Si corriges una categoría, aprende para la próxima vez.','The app reads each item on the receipt and puts it in the right category: groceries, food, health… If you correct a category, it learns for next time.'],
'Os PINs não conferem. Crie de novo.':['Los PIN no coinciden. Créalo de nuevo.','The PINs don\'t match. Create it again.'],'Os PINs não conferem. Tente de novo.':['Los PIN no coinciden. Inténtalo de nuevo.','The PINs don\'t match. Try again.'],
'PIN do backup incorreto':['PIN de la copia incorrecto','Wrong backup PIN'],'PIN incorreto. Tente de novo.':['PIN incorrecto. Inténtalo de nuevo.','Wrong PIN. Try again.'],'PIN trocado':['PIN cambiado','PIN changed'],
'Pago e lançado no extrato':['Pagado y registrado en el extracto','Paid and added to the statement'],'Paga':['Pagada','Paid'],'Preparando a leitura…':['Preparando la lectura…','Preparing to read…'],'Qual cartão':['Qué tarjeta','Which card'],
'Quer abrir o app com Face ID ou digital da próxima vez?':['¿Quieres abrir la app con Face ID o huella la próxima vez?','Open the app with Face ID or fingerprint next time?'],'Sim, usar biometria':['Sí, usar biometría','Yes, use biometrics'],'Agora não':['Ahora no','Not now'],
'Resumo por mês':['Resumen por mes','Monthly summary'],'Se houver conta com esse e-mail, enviamos um link para criar uma nova senha.':['Si hay una cuenta con ese correo, enviamos un enlace para crear una nueva contraseña.','If there\'s an account with that email, we sent a link to create a new password.'],
'Selecione o texto e copie':['Selecciona el texto y cópialo','Select the text and copy it'],'Sem conexão com o servidor. Os dados continuam salvos neste aparelho.':['Sin conexión con el servidor. Los datos siguen guardados en este dispositivo.','No connection to the server. Your data is still saved on this device.'],
'Sem histórico ainda':['Aún sin historial','No history yet'],'Sem internet: sincroniza quando voltar.':['Sin internet: se sincroniza cuando vuelva.','Offline: will sync when back online.'],'Sem gastos':['Sin gastos','No expenses'],
'Sem o PIN, ninguém consegue abrir os dados, nem nós. Você pode apagar tudo neste celular e começar de novo. Depois, se tiver um backup, é só restaurar.':['Sin el PIN nadie puede abrir los datos, ni nosotros. Puedes borrar todo en este móvil y empezar de nuevo. Después, si tienes una copia, solo restáurala.','Without the PIN nobody can open the data, not even us. You can erase everything on this phone and start again. Then, if you have a backup, just restore it.'],
'Digite APAGAR para confirmar':['Escribe APAGAR para confirmar','Type APAGAR to confirm'],'Apagar tudo e recomeçar':['Borrar todo y empezar de nuevo','Erase everything and start over'],'Voltar':['Volver','Back'],
'Senha alterada.':['Contraseña cambiada.','Password changed.'],'Seu extrato está vazio':['Tu extracto está vacío','Your statement is empty'],'Seus dados ficam só com você':['Tus datos quedan solo contigo','Your data stays with you'],
'Sincronizando…':['Sincronizando…','Syncing…'],'☁ Sincronizado':['☁ Sincronizado','☁ Synced'],'⚠ Não sincronizado':['⚠ No sincronizado','⚠ Not synced'],'Situação':['Estado','Status'],
'Texto de backup inválido':['Texto de copia no válido','Invalid backup text'],'Tirar foto':['Tomar foto','Take photo'],'Toque em Biometria ou digite seu PIN':['Toca Biometría o escribe tu PIN','Tap Biometrics or enter your PIN'],
'Total de saídas':['Total de gastos','Total expenses'],'Tudo é guardado neste aparelho, criptografado com AES-256 e protegido pelo seu PIN. Nada vai para a internet. Por isso, de vez em quando faça um backup em ☰ > Segurança e backup.':['Todo se guarda en este dispositivo, cifrado con AES-256 y protegido por tu PIN. Nada va a internet. Por eso, de vez en cuando haz una copia en ☰ > Seguridad y copia.','Everything is stored on this device, encrypted with AES-256 and protected by your PIN. Nothing goes to the internet. So now and then make a backup in ☰ > Security and backup.'],
'Uma vez':['Una vez','Once'],'Usar PIN':['Usar PIN','Use PIN'],'Valor na moeda':['Importe en la moneda','Amount in currency'],'Vence amanhã':['Vence mañana','Due tomorrow'],'Vence hoje':['Vence hoy','Due today'],
'Venceu ontem':['Venció ayer','Was due yesterday'],'Você saiu da conta. Os dados continuam neste aparelho.':['Cerraste sesión. Los datos siguen en este dispositivo.','You signed out. Your data stays on this device.'],
'Nenhum vencimento ainda. Leia uma conta de consumo ou uma fatura, ou cadastre abaixo.':['Aún no hay vencimientos. Lee una factura de servicio o de tarjeta, o regístrala abajo.','No bills due yet. Scan a utility bill or a statement, or add one below.'],
'Nada encontrado':['Nada encontrado','Nothing found'],'Nenhum lançamento com esse filtro ou busca.':['Ningún registro con ese filtro o búsqueda.','No entries match this filter or search.'],
'Fazer primeiro lançamento':['Hacer el primer registro','Add first entry'],'Extrato completo':['Extracto completo','Full statement'],'Nenhum':['Ninguno','None'],'Nenhuma':['Ninguna','None'],
'+ Criar nova…':['+ Crear nueva…','+ Create new…'],'+ Novo cartão…':['+ Nueva tarjeta…','+ New card…'],'+ Cartão':['+ Tarjeta','+ Card'],'+ Subpasta':['+ Subcarpeta','+ Subfolder'],
'gasto':['gasto','spent'],'valor a definir':['importe por definir','amount to be set'],'Valor pago (R$)':['Importe pagado (R$)','Amount paid (R$)'],'Data do pagamento':['Fecha del pago','Payment date'],'Confirmar':['Confirmar','Confirm'],
'Criar o atalho na tela':['Crear el acceso en la pantalla','Add the shortcut to your screen'],'Compartilhar':['Compartir','Share'],'Adicionar à Tela de Início':['Agregar a inicio','Add to Home Screen'],
'Adicionar à tela inicial':['Añadir a pantalla de inicio','Add to Home screen'],'Instalar':['Instalar','Install'],'Instalar app':['Instalar app','Install app'],'Instale o Anotei Já no celular':['Instala Anotei Já en el móvil','Install Anotei Já on your phone'],
'O atalho abre em tela cheia, como um app.':['El acceso se abre a pantalla completa, como una app.','The shortcut opens full screen, like an app.'],
'Para criar o atalho, abra no Safari':['Para crear el acceso, ábrelo en Safari','To add the shortcut, open in Safari'],'Para instalar, abra no Chrome':['Para instalar, ábrelo en Chrome','To install, open in Chrome'],
'Abrir no Safari':['Abrir en Safari','Open in Safari'],'Abrir no Chrome':['Abrir en Chrome','Open in Chrome'],
'Escolha o idioma':['Elige el idioma','Choose language'],'Idioma':['Idioma','Language'],'Entrada ou saída':['Ingreso o gasto','Income or expense'],
'Pagamento':['Pago','Payment'],'Estorno':['Devolución','Refund'],'sim':['sí','yes'],'não':['no','no'],
'Sem internet agora. Tente de novo quando estiver conectado.':['Sin internet ahora. Inténtalo de nuevo cuando tengas conexión.','No internet right now. Try again when you\'re online.'],'Vence:':['Vence:','Due:'],'Itens':['Ítems','Items'],'Saldo':['Saldo','Balance'],
'Ver vencimentos ›':['Ver vencimientos ›','See bills due ›'],
'Todas':['Todas','All'],'Todos':['Todos','All'],
'📷 Tirar foto ou escolher imagem':['📷 Tomar foto o elegir imagen','📷 Take photo or choose image'],
'▦ Escanear QR Code ou código de barras':['▦ Escanear código QR o de barras','▦ Scan QR code or barcode'],
'⌨ Digitar código de barras ou chave da nota':['⌨ Escribir código de barras o clave de la factura','⌨ Type barcode or invoice key'],
'Linha digitável do boleto ou chave de 44 dígitos':['Línea digitable del boleto o clave de 44 dígitos','Boleto number or 44-digit key'],
'Código':['Código','Code'],'Usar código':['Usar código','Use code'],
'Para contas e boletos, escaneie o código de barras: o app pega o valor e o vencimento certinhos e cria o alerta. O QR Code do cupom ou da nota fiscal traz a loja, a data e, em algumas notas, o total.':['Para cuentas y boletos, escanea el código de barras: la app toma el importe y el vencimiento exactos y crea el aviso. El código QR del ticket o de la factura trae la tienda, la fecha y, en algunas, el total.','For bills and boletos, scan the barcode: the app gets the exact amount and due date and creates the reminder. The QR code on a receipt or invoice gives the store, the date and, on some, the total.'],
'Aponte para o QR Code ou o código de barras':['Apunta al código QR o al código de barras','Point at the QR code or barcode'],
'Para o código de barras de boletos e contas, deite o celular.':['Para el código de barras de boletos y cuentas, pon el móvil en horizontal.','For boleto and bill barcodes, turn your phone sideways.'],
'Lanterna':['Linterna','Flashlight'],'Digitar código':['Escribir código','Type code'],
'Este navegador não deixa usar a câmera ao vivo. Use Tirar foto: o app também lê o código pela foto.':['Este navegador no permite usar la cámara en vivo. Usa Tomar foto: la app también lee el código en la foto.','This browser doesn\'t allow the live camera. Use Take photo: the app also reads the code from the photo.'],
'Sem permissão para usar a câmera. Libere a câmera para este site nas configurações do navegador, ou use Tirar foto.':['Sin permiso para usar la cámara. Permite la cámara para este sitio en los ajustes del navegador, o usa Tomar foto.','No permission to use the camera. Allow the camera for this site in your browser settings, or use Take photo.'],
'O leitor de códigos não carregou. Tente de novo com internet uma vez.':['El lector de códigos no cargó. Inténtalo de nuevo con internet una vez.','The code reader didn\'t load. Try again once with internet.'],
'Não reconheci este código.':['No reconocí este código.','I didn\'t recognise this code.'],
'QR Code da nota lido.':['Código QR de la factura leído.','Invoice QR code read.'],
'Toque em Ler e separar itens para separar os produtos, ou lance só o total.':['Toca Leer y separar ítems para separar los productos, o registra solo el total.','Tap Read and split items to split the products, or add just the total.'],
'Lançar só o total':['Registrar solo el total','Add just the total'],
'Cupom fiscal lido pelo QR Code':['Ticket leído por el código QR','Receipt read from the QR code'],'Nota fiscal lida pelo QR Code':['Factura leída por el código QR','Invoice read from the QR code'],
'Esta nota não traz o valor no QR Code: digite o total abaixo.':['Esta factura no trae el importe en el código QR: escribe el total abajo.','This invoice\'s QR code has no amount: type the total below.'],
'Digite o nome da loja: nas próximas notas desse CNPJ o app já preenche.':['Escribe el nombre de la tienda: en las próximas facturas de ese CNPJ la app lo completa.','Type the store name: the app fills it in on future invoices from this CNPJ.'],
'O QR Code não traz a lista de produtos. Para separar cada item por categoria, fotografe o cupom.':['El código QR no trae la lista de productos. Para separar cada ítem por categoría, fotografía el ticket.','The QR code doesn\'t include the product list. To split each item by category, photograph the receipt.'],
'Abrir a nota no site da Sefaz':['Abrir la factura en el sitio de la Sefaz','Open the invoice on the Sefaz website'],
'Código de barras lido':['Código de barras leído','Barcode read'],'O código não traz o valor: digite abaixo.':['El código no trae el importe: escríbelo abajo.','The code has no amount: type it below.'],
'Confira a data de vencimento no campo Data.':['Revisa la fecha de vencimiento en el campo Fecha.','Check the due date in the Date field.'],
'Ao salvar, vira um alerta de vencimento. Quando pagar, toque em Paguei.':['Al guardar, se convierte en un aviso de vencimiento. Cuando pagues, toca Pagué.','When saved, it becomes a due-date reminder. When you pay, tap Paid.'],
'QR Code Pix lido':['Código QR Pix leído','Pix QR code read'],'Este Pix não traz o valor: digite abaixo.':['Este Pix no trae el importe: escríbelo abajo.','This Pix has no amount: type it below.'],
'Escolha a categoria e toque em Salvar no extrato.':['Elige la categoría y toca Guardar en el extracto.','Choose the category and tap Save to statement.'],
'Esse é o código de barras de um produto, não de uma nota ou conta. Aponte para o QR Code do cupom ou para o código de barras do boleto.':['Ese es el código de barras de un producto, no de una factura o cuenta. Apunta al código QR del ticket o al código de barras del boleto.','That\'s a product barcode, not an invoice or bill. Point at the receipt\'s QR code or the boleto barcode.'],
'O código parece de um boleto, mas os números não conferem. Leia de novo ou digite a linha digitável.':['El código parece de un boleto, pero los números no coinciden. Léelo de nuevo o escribe la línea digitable.','The code looks like a boleto, but the digits don\'t check out. Scan again or type the number.'],
'Este QR Code não é de nota fiscal nem de Pix.':['Este código QR no es de factura ni de Pix.','This QR code isn\'t an invoice or Pix.'],
'Copiar código':['Copiar código','Copy code'],'Código copiado. Cole no app do banco para pagar.':['Código copiado. Pégalo en la app del banco para pagar.','Code copied. Paste it in your bank app to pay.'],
'Entradas e saídas':['Ingresos y gastos','Income and expenses'],'Categorias · ':['Categorías · ','Categories · ']
};
/* Textos com partes variáveis: [regex, es, en] (substituição com $1, $2…) */
const R=[
[/^(\d+) lanç\.$/,'$1 reg.','$1 entr.'],[/^(\d+) lanç\.( · .*) vs\. mês anterior$/,'$1 reg.$2 vs. mes anterior','$1 entr.$2 vs. last month'],
[/^(\d+) lançamentos?$/,'$1 registros','$1 entries'],[/^(\d+) lançamento\(s\)$/,'$1 registro(s)','$1 entry(ies)'],
[/^(.*) de (R\$.*) \((\d+%)\)$/,'$1 de $2 ($3)','$1 of $2 ($3)'],[/^(\d+)% da meta$/,'$1% de la meta','$1% of goal'],
[/^ · meta estourada$/,' · meta superada',' · goal exceeded'],[/^ · perto da meta$/,' · cerca de la meta',' · close to goal'],
[/^(.*) · meta estourada$/,'$1 · meta superada','$1 · goal exceeded'],[/^(.*) · perto da meta$/,'$1 · cerca de la meta','$1 · close to goal'],
[/^Cor de (.+)$/,'Color de $1','$1 colour'],[/^Emitente: CNPJ (.+)$/,'Emisor: CNPJ $1','Issuer: CNPJ $1'],[/^Valor: (.+)$/,'Importe: $1','Amount: $1'],[/^Vencimento: (.+)$/,'Vencimiento: $1','Due date: $1'],[/^Recebedor: (.+)$/,'Destinatario: $1','Payee: $1'],[/^Venceu há (\d+) dias$/,'Venció hace $1 días','$1 days overdue'],[/^Vence em (\d+) dias$/,'Vence en $1 días','Due in $1 days'],[/^Em (\d+) dias$/,'En $1 días','In $1 days'],
[/^Sincronizado às (.+)$/,'Sincronizado a las $1','Synced at $1'],[/^Versão (.+)$/,'Versión $1','Version $1'],[/^Conectado como (.+)$/,'Conectado como $1','Signed in as $1'],
[/^Saldo acumulado: (.+)$/,'Saldo acumulado: $1','Running balance: $1'],[/^Saldo: (.+)$/,'Saldo: $1','Balance: $1'],[/^Salvo: (.+)$/,'Guardado: $1','Saved: $1'],[/^Gastos: (.+)$/,'Gastos: $1','Expenses: $1'],
[/^Total (.+)$/,'Total $1','Total $1'],[/^Alerta criado: (.+) vence (\d\d\/\d\d\/\d{4})$/,'Aviso creado: $1 vence el $2','Reminder created: $1 due $2'],[/^Alerta criado: (.+)$/,'Aviso creado: $1','Reminder created: $1'],[/^Erro ao salvar: (.+)$/,'Error al guardar: $1','Error saving: $1'],
[/^Planilha baixada: (.+)$/,'Hoja descargada: $1','Spreadsheet downloaded: $1'],[/^Cupom salvo em (.+)$/,'Ticket guardado en $1','Receipt saved in $1'],
[/^Nenhum gasto em (.+)$/,'Ningún gasto en $1','No expenses in $1'],[/^Valor em (.+)$/,'Importe en $1','Amount in $1'],[/^Cartão (.+)$/,'Tarjeta $1','Card $1'],[/^Conta de (.+)$/,'Cuenta de $1','$1 bill'],
[/^Muitas tentativas\. Espere (\d+) segundos\.$/,'Demasiados intentos. Espera $1 segundos.','Too many attempts. Wait $1 seconds.'],
[/^PIN incorreto\. Aguarde (\d+) segundos\.$/,'PIN incorrecto. Espera $1 segundos.','Wrong PIN. Wait $1 seconds.'],
[/^Você já está na versão mais nova \((.+)\)\.?$/,'Ya tienes la versión más nueva ($1).','You already have the latest version ($1).'],
[/^Não consegui abrir a câmera: (.*)$/,'No pude abrir la cámara: $1','Couldn\'t open the camera: $1'],
[/^Não consegui abrir este arquivo \((.*)\)\. Tente de novo ou lance à mão\.$/,'No pude abrir este archivo ($1). Inténtalo de nuevo o regístralo a mano.','Couldn\'t open this file ($1). Try again or add it by hand.'],
[/^Não consegui ler este cupom \((.*)\)\. Tente de novo ou lance à mão\.$/,'No pude leer este ticket ($1). Inténtalo de nuevo o regístralo a mano.','Couldn\'t read this receipt ($1). Try again or add it by hand.'],
[/^(\d+) parcelas de (.+) lançadas$/,'$1 cuotas de $2 registradas','$1 instalments of $2 added'],
[/^(\d+) parcelas de (.+), uma por mês a partir da data escolhida\. O valor acima é o total da compra\.$/,'$1 cuotas de $2, una por mes desde la fecha elegida. El importe de arriba es el total de la compra.','$1 instalments of $2, one a month from the chosen date. The amount above is the purchase total.'],
[/^Informe o valor total da compra; o app divide em (\d+) meses\.$/,'Indica el importe total de la compra; la app lo divide en $1 meses.','Enter the purchase total; the app splits it into $1 months.'],
[/^(\d+)x \(à vista\)$/,'$1x (al contado)','$1x (single payment)'],
[/^Conta criada\. Enviamos um link de confirmação para (.+)\. Abra o e-mail, toque no link e depois entre aqui com o e-mail e a senha\.$/,'Cuenta creada. Enviamos un enlace de confirmación a $1. Abre el correo, toca el enlace y luego entra aquí con el correo y la contraseña.','Account created. We sent a confirmation link to $1. Open the email, tap the link and then sign in here with your email and password.'],
[/^(\d+) lançamentos (salvos|restaurados)$/,'$1 registros $2','$1 entries $2'],
[/^"(.+)" apagada; (\d+) lançamento\(s\) foram para (.+)$/,'"$1" borrada; $2 registro(s) pasaron a $3','"$1" deleted; $2 entry(ies) moved to $3'],[/^"(.+)" apagada$/,'"$1" borrada','"$1" deleted'],
[/^Categoria "(.+)" criada$/,'Categoría "$1" creada','Category "$1" created'],
[/^💾 Seu último backup foi há (\d+) dias\. Que tal salvar uma cópia nova\?$/,'💾 Tu última copia fue hace $1 días. ¿Qué tal guardar una nueva?','💾 Your last backup was $1 days ago. How about saving a new one?'],
[/^💾 Você ainda não fez backup\. Se o celular quebrar ou for trocado, é o backup que salva seus dados\.$/,'💾 Aún no hiciste una copia. Si el móvil se rompe o lo cambias, la copia es lo que salva tus datos.','💾 You haven\'t made a backup yet. If your phone breaks or is replaced, the backup is what saves your data.'],
[/^(.+) vence hoje$/,'$1 vence hoy','$1 is due today'],[/^(.+) vence em (\d+) dia\(s\)$/,'$1 vence en $2 día(s)','$1 is due in $2 day(s)'],
[/^Lendo o cupom… (\d+)%$/,'Leyendo el ticket… $1%','Reading the receipt… $1%'],
[/^(\d+) a pagar$/,'$1 a pagar','$1 due'],[/^(\d+) selecionados$/,'$1 seleccionados','$1 selected'],[/^(\d+) agendados$/,'$1 programados','$1 scheduled'],
[/^Encontrei (\d+) itens(.*)$/,'Encontré $1 ítems$2','Found $1 items$2'],[/^Encontrei$/,'Encontré','Found'],
[/^em (.+)\. Confira as categorias e toque em Salvar\.$/,'en $1. Revisa las categorías y toca Guardar.','in $1. Check the categories and tap Save.'],
[/^Identifiquei uma$/,'Identifiqué una','I found a'],[/^conta de (.+)$/,'factura de $1','$1 bill'],
[/^e mais (\d+) conta\(s\) para pagar$/,'y $1 cuenta(s) más por pagar','and $1 more bill(s) to pay']
];
/* trechos que aparecem dentro de frases montadas (só frases inteiras, para não mexer em dados) */
const P=[
[' · todo mês',' · cada mes',' · every month'],[' · todo ano',' · cada año',' · every year'],[' (estimado)',' (estimado)',' (estimated)'],
[' · atualiza sozinho ao abrir',' · se actualiza sola al abrir',' · updates itself on open'],[' · total do cupom ',' · total del ticket ',' · receipt total '],
[' Toque na categoria para trocar.',' Toca la categoría para cambiarla.',' Tap the category to change it.'],
['A soma dos itens (','La suma de los ítems (','The items add up to ('],[') difere do total',') difiere del total',') which differs from the total'],
[': confira os valores, a foto pode ter cortado alguma linha.',': revisa los importes, la foto pudo cortar alguna línea.',': check the amounts, the photo may have cut off a line.'],
['QR da NFC-e lido. Chave: ','QR de la NFC-e leído. Clave: ','NFC-e QR read. Key: '],
[', vencimento ',', vencimiento ',', due '],
[' Ao salvar, vira um ',' Al guardar, se convierte en un ',' When saved, it becomes a '],['alerta de vencimento','aviso de vencimiento','due-date reminder'],
['; quando pagar, toque em Paguei.','; cuando pagues, toca Pagué.','; when you pay, tap Paid.'],
[' Já venceu: vai direto para o extrato e o próximo mês fica agendado.',' Ya venció: va directo al extracto y el próximo mes queda programado.',' Already due: it goes straight to the statement and next month is scheduled.'],
[' Confira o valor antes de salvar.',' Revisa el importe antes de guardar.',' Check the amount before saving.'],
['Toque no botão ','Toca el botón ','Tap the '],[' (quadrado com seta ↑, na barra de baixo ou no ⋯). Role a lista para baixo e toque em ',' (cuadrado con flecha ↑, en la barra de abajo o en ⋯). Desplázate hacia abajo y toca ',' button (square with an ↑ arrow, in the bottom bar or under ⋯). Scroll down and tap '],
['Toque nos ⋮ do Chrome, no canto de cima, e depois em ','Toca los ⋮ de Chrome, arriba, y luego ','Tap Chrome\'s ⋮ at the top, then '],
['Você abriu o link dentro de outro app. Toque nos ⋯ ou no ícone de bússola e escolha ','Abriste el enlace dentro de otra app. Toca ⋯ o el ícono de brújula y elige ','You opened the link inside another app. Tap ⋯ or the compass icon and choose '],
['. Ou copie o link e cole no Safari.','. O copia el enlace y pégalo en Safari.','. Or copy the link and paste it into Safari.'],
['Você abriu o link dentro de outro app. Toque nos ⋮ e escolha ','Abriste el enlace dentro de otra app. Toca ⋮ y elige ','You opened the link inside another app. Tap ⋮ and choose '],
[' (ou no navegador).',' (o en el navegador).',' (or your browser).'],[' e ',' y ',' and '],[' de ',' de ',' of ']
];
const NOMES={ // nomes das categorias padrão
alimentacao:['Alimentação','Comida','Food'],mercado:['Mercado','Supermercado','Groceries'],transporte:['Transporte','Transporte','Transport'],
saude:['Saúde','Salud','Health'],contas:['Casa e Contas','Casa y Facturas','Home and Bills'],lazer:['Lazer e Assinaturas','Ocio y Suscripciones','Leisure and Subscriptions'],
compras:['Compras e Vestuário','Compras y Ropa','Shopping and Clothing'],cartao:['Cartão de Crédito','Tarjeta de Crédito','Credit Card'],extra:['Outros','Otros','Other'],
receita:['Salário e Entradas','Salario e Ingresos','Salary and Income'],
combustivel:['Combustível','Combustible','Fuel'],vestuario:['Vestuário','Ropa','Clothing'],bares:['Bares','Bares','Bars'],assinaturas:['Assinaturas','Suscripciones','Subscriptions'],
presentes:['Presentes','Regalos','Gifts'],investimentos:['Investimentos','Inversiones','Investments'],dolar:['Dólar','Dólar','Dollar'],euro:['Euro','Euro','Euro']};
const NOMES_ALT={cartao:['Cartão de crédito'],contas:['Conta de consumo'],extra:['Extra']};
const IDX={pt:0,es:1,en:2};
function nomeCat(k,atual){const n=NOMES[k];if(!n)return atual;const cands=n.concat(NOMES_ALT[k]||[]);if(atual==null||cands.includes(atual))return n[IDX[L]];return atual}

const norm=s=>s.replace(/\s+/g,' ');
function tr(s){
 if(L==='pt'||s==null)return s;const src=String(s);const m=src.match(/^(\s*)([\s\S]*?)(\s*)$/);const core=norm(m[2]);if(!core||!/[A-Za-zÀ-ú]/.test(core))return src;
 let out=null;const d=D[core];if(d)out=d[I];
 if(out==null&&D[m[2]])out=D[m[2]][I];
 if(out==null){const sp=m[1]+core+m[3];const dd=D[sp]||D[sp.trim()+' ']||D[' '+sp.trim()];if(dd&&(sp.startsWith(' ')||sp.endsWith(' ')))return dd[I]}
 if(out==null)for(const r of R){if(r[0].test(core)){out=core.replace(r[0],r[1+I]);for(const p of P)if(p[0].length>4&&out.includes(p[0]))out=out.split(p[0]).join(p[1+I]);break}}
 if(out==null){const raw=m[1]+core+m[3];for(const r of R){if(r[0].test(raw)){return raw.replace(r[0],r[1+I])}}}
 if(out==null&&core.includes(' · ')){const ps=core.split(' · ');const t=ps.map(p=>{const x=D[p];if(x)return x[I];for(const r of R)if(r[0].test(p))return p.replace(r[0],r[1+I]);return p});if(t.some((x,i)=>x!==ps[i]))out=t.join(' · ')}
 if(out==null){let t=m[1]+core+m[3],ch=false;for(const p of P){if(p[0].length>4&&t.includes(p[0])){t=t.split(p[0]).join(p[1+I]);ch=true}}if(ch)return t}
 if(out==null){const raw=m[1]+core+m[3];for(const p of P)if(raw===p[0])return p[1+I];return src}
 return m[1]+out+m[3]}

const ATTR=['placeholder','aria-label','title','alt'];
function pular(el){return el&&el.closest&&el.closest('[translate="no"],script,style,textarea,#bkTxt,#cupomTxt,#fatTxt')}
function noTexto(n){if(pular(n.parentElement))return;const v=n.nodeValue,t=tr(v);if(t!==v)n.nodeValue=t}
function noEl(el){if(el.closest&&el.closest('[translate="no"]'))return;for(const a of ATTR){if(el.hasAttribute&&el.hasAttribute(a)){const v=el.getAttribute(a),t=tr(v);if(t!==v)el.setAttribute(a,t)}}}
function varrer(root){
 if(root.nodeType===3){noTexto(root);return}if(root.nodeType!==1&&root.nodeType!==11)return;
 if(root.nodeType===1)noEl(root);
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
 while((n=w.nextNode())){if(n.nodeType===3)noTexto(n);else noEl(n)}}
let obs=null;
function ligar(){
 document.documentElement.lang=LOC[L];
 if(L==='pt')return;varrer(document.body);
 obs=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')noTexto(m.target);else if(m.type==='attributes')noEl(m.target);else m.addedNodes.forEach(varrer)}});
 obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR})}
function setLang(l){if(!LANGS[l])return;try{localStorage.setItem(K,l)}catch(e){}location.reload()}
window.I18N={lang:L,loc:LOC[L],LANGS,T:tr,nomeCat,setLang,varrer};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ligar);else ligar();
})();
