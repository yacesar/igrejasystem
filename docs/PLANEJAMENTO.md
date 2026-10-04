# MCA Igrejas — Documento de Planejamento

> Versão 0.2 · 04/10/2026 · Documento vivo: toda decisão de produto, design e arquitetura começa aqui.
> Decisões fundamentais fechadas em 04/10/2026 (ver seção 13).

---

## 1. Visão

Um sistema de gestão para igrejas que **cuida de pessoas, não só de cadastros**. A maioria dos sistemas do mercado nasceu como "secretaria digital" (fichas, dízimos, relatórios). Nós partimos de três convicções:

1. **Igreja é comunidade de discipulado.** O sistema precisa servir ao ensino, ao acompanhamento pastoral e à formação, não apenas à administração.
2. **Quem usa é voluntário, não operador.** Secretárias, tesoureiros e líderes de célula usam o sistema no celular, entre um compromisso e outro. Cada tela precisa ser óbvia em 10 segundos.
3. **Bonito é funcional.** Um sistema agradável de usar é usado mais; um sistema usado mais gera dados melhores; dados melhores geram cuidado melhor.

### Proposta de valor em uma frase

> "O sistema que a secretaria adora, o pastor confia e o membro realmente abre."

### Objetivos mensuráveis (12 meses após o lançamento)

| Métrica | Meta |
|---|---|
| Tempo para uma igreja nova estar operando (cadastro → primeiro culto registrado) | < 1 hora |
| Membros ativos no app por igreja (mensal) | > 40% da membresia |
| Lançamentos financeiros conciliados automaticamente | > 80% |
| Nota de satisfação (NPS) de secretários e tesoureiros | > 60 |
| Tempo médio para gerar uma carta/declaração | < 30 segundos |

---

## 2. Público e personas

| Persona | Contexto | O que precisa | Dor atual |
|---|---|---|---|
| **Pastor** | Lidera, prega, cuida; pouco tempo em tela | Visão da saúde da igreja, quem precisa de visita, planejamento de pregação | Sabe das ausências tarde demais; sermões espalhados em pastas |
| **Secretária(o)** | Usuário mais frequente; frequentemente voluntária | Cadastro rápido, documentos prontos, agenda, comunicação | Retrabalho em Word/Excel, sistema lento e feio |
| **Tesoureiro(a)** | Responsabilidade legal; prestação de contas | Conciliação PIX, centros de custo, relatórios para assembleia e contador | Planilhas, comprovantes no WhatsApp, fechamento manual |
| **Líder de ministério** | Louvor, infantil, recepção, mídia | Escalas, confirmação de voluntários, repertório | Grupos de WhatsApp caóticos, trocas não registradas |
| **Líder de célula / pequeno grupo** | Reunião semanal em casa | Relatório em 1 minuto, lista de presença, pedidos de oração | Esquece de reportar; planilha do supervisor |
| **Professor(a) de EBD / discipulador** | Ensina classes ou acompanha 1:1 | Plano de aula, material, presença e progresso dos alunos | Nenhum sistema atende; usa PDF e caderno |
| **Membro** | Usa no celular, no domingo | Agenda, ofertas, inscrições, conteúdo, pedidos de oração, sua ficha | App genérico que não abre, ou não existe |
| **Visitante** | Primeiro contato | Dizer "estive aqui", receber acolhimento | Cartão de papel que ninguém lê |
| **Contador externo** | Terceiro setor | Exportação organizada | Recebe caixa de sapato digital |

---

## 3. Papéis e permissões (RBAC)

O controle de acesso é **por papel + por escopo** (igreja/campus/ministério/célula). Um usuário pode ter vários papéis em escopos diferentes (ex.: líder de célula no campus A e professor de EBD no campus B).

### Papéis base

| Papel | Escopo | Resumo de acesso |
|---|---|---|
| `super_admin` | Plataforma (SaaS) | Tenants, planos, suporte, auditoria global. Nunca lê dados pastorais. |
| `admin_igreja` | Igreja (todos os campi) | Tudo da igreja, configurações, convites, papéis |
| `pastor` | Igreja ou campus | Tudo exceto configurações de plano; acesso a notas pastorais confidenciais |
| `secretaria` | Igreja ou campus | Pessoas, documentos, agenda, comunicação; **sem** finanças nem notas pastorais |
| `tesouraria` | Igreja ou campus | Finanças completas; pessoas somente leitura (para vincular contribuintes) |
| `lider_ministerio` | Ministério | Escalas, voluntários do ministério, comunicação segmentada |
| `lider_celula` | Célula | Membros da célula, relatório, presença, pedidos de oração |
| `professor` | Classe/trilha | Alunos, aulas, presença, avaliações |
| `voluntario` | Ministério | Própria escala, trocas, disponibilidade |
| `membro` | Próprio perfil | Perfil, família, ofertas próprias, inscrições, conteúdo |
| `visitante` | Próprio perfil | Perfil mínimo, agenda pública, formulário de contato |

### Princípios

- **Menor privilégio por padrão.** Papéis novos nascem só com leitura do próprio escopo.
- **Dados sensíveis segregados.** Notas de aconselhamento, disciplina eclesiástica e saúde ficam em tabela separada, com permissão explícita e log de leitura.
- **Papéis personalizáveis.** A igreja pode criar papéis derivados ("Diácono", "Supervisor de rede") a partir de um conjunto de permissões granulares (`pessoas.ler`, `financas.lancar`, `documentos.emitir` etc.).
- **Delegação temporária.** "Fulano assume a tesouraria de 10 a 20 de janeiro" — com expiração automática.

---

## 4. Mapa de módulos

Organizado em **Núcleo** (toda igreja usa desde o dia 1), **Vida da igreja** (ministério e comunidade) e **Plataforma** (infra e expansão).

### 4.1 Núcleo

#### Pessoas
- Cadastro completo com **famílias/unidades familiares** (responsável, cônjuge, filhos, dependentes).
- **Histórico eclesiástico**: conversão, batismo, recepção por transferência/aclamação, cargos, transferência de saída, disciplina (restrito), falecimento.
- Status de vínculo: visitante → frequentador → membro → inativo/transferido, com data e motivo.
- Foto, contatos, endereço com geocodificação, redes sociais, profissão, dons/habilidades, disponibilidade.
- **Tags e listas inteligentes** (filtros salvos: "jovens 18–30 sem célula", "membros que não dizimaram em 3 meses" — este último só para tesouraria/pastor).
- Importação assistida de Excel/CSV com mapeamento de colunas e detecção de duplicados.
- Fusão de duplicados.
- Linha do tempo por pessoa: tudo que aconteceu (presença, doações, visitas, documentos emitidos, mensagens).

#### Secretaria e documentos
- Emissão em 1 clique: carta de transferência/recomendação, certificado de batismo, declaração de membro, certificado de apresentação de criança, certificado de casamento religioso, credencial de obreiro.
- Modelos editáveis com variáveis (`{{nome}}`, `{{data_batismo}}`) e identidade visual da igreja.
- Assinatura digital do pastor (imagem + hash de verificação via QR code no documento).
- **Atas e assembleias**: convocação, quórum, pauta, votação (presencial ou remota), ata gerada e assinada.
- Agenda institucional (cultos, reuniões, uso de salas) com reserva de espaços.

#### Finanças
- Lançamentos de entrada (dízimos, ofertas, campanhas, eventos, aluguéis, doações em espécie) e saída, com **centros de custo por ministério/campus** e categorias de plano de contas pré-configurado para igrejas.
- **PIX dinâmico com conciliação automática**: cada contribuinte identificado tem QR próprio; o webhook do banco/PSP lança e vincula sozinho.
- Contas bancárias, caixa físico, cartões; transferências entre contas.
- Fechamento mensal com checklist, bloqueio de período fechado e trilha de auditoria.
- Campanhas com meta, progresso público e opcional de anonimato.
- Recibos automáticos para contribuintes (PDF + e-mail/WhatsApp) e extrato anual.
- Relatórios: DRE simplificado, fluxo de caixa, por centro de custo, comparativo mensal, orçamento x realizado.
- **Modo transparência**: painel público opcional (por link) com receitas e despesas agregadas para a congregação.
- Exportação para contador (CSV/OFX/layouts comuns) e pacote mensal de comprovantes.
- Patrimônio: bens, depreciação simples, responsável, manutenção.

#### Cultos, presença e visitantes
- Registro de cultos (série, pregador, texto, música, presença total, decisões, batismos).
- **Check-in** por QR code, NFC, autoatendimento em tablet ou manual.
- **Check-in infantil seguro**: etiqueta impressa com código do responsável, alergias e observações; retirada só com o código.
- Cartão de visitante digital (QR no banner) → fluxo de acolhimento automático (boas-vindas, atribuição a um integrador, lembrete de contato em 48h).

#### Comunicação
- Mensagens por segmento (lista inteligente) via **WhatsApp oficial (API)**, push, e-mail e SMS.
- Modelos com variáveis, agendamento, e janelas de silêncio (não enviar 22h–7h).
- Confirmação de leitura e relatório de entrega.
- Mural/feed interno do app com comentários moderados.
- Pedidos de oração com privacidade (público, só liderança, só pastor) e acompanhamento ("respondido").

### 4.2 Vida da igreja

#### Ministérios e escalas
- Ministérios com funções (ex.: Louvor → vocal, teclado, bateria; Infantil → berçário, maternal).
- Montagem de escala por **arrastar e soltar** com sugestão automática (disponibilidade, rodízio justo, bloqueios).
- Voluntário confirma/recusa pelo celular; **troca entre voluntários** sem passar pelo líder (com notificação).
- Indisponibilidades e férias.
- Repertório e ordem de culto para o louvor (cifras, tom, links), com histórico de músicas tocadas.

#### Células / pequenos grupos
- Rede → supervisão → célula; multiplicação com histórico (árvore genealógica das células).
- **Relatório semanal em 60 segundos**: presença por toque, visitantes, decisões, ofertas, pedidos.
- Mapa de células e membros (geolocalização) para sugerir célula mais próxima ao visitante.
- Saúde da célula: indicadores automáticos (frequência, crescimento, tempo sem relatório) com semáforo.
- Material de estudo da semana distribuído pelo sistema.

#### Ensino e discipulado (**diferencial central**)
- **Escola Bíblica (EBD)**: classes por faixa/turma, matrícula, presença, plano de aulas, materiais, avaliações opcionais.
- **Trilhas de discipulado**: percursos (ex.: "Novos convertidos → Batismo → Membresia → Liderança") com etapas, conteúdo, encontros 1:1 e marcos; o pastor vê onde cada pessoa está.
- Biblioteca de conteúdo: aulas, PDFs, vídeos, áudios, com controle de acesso por trilha/classe.
- **Bíblia integrada** na **Almeida Revista e Atualizada (ARA)**, licenciada junto à Sociedade Bíblica do Brasil (SBB), com busca por referência, vinculação a aulas e sermões e cópia com citação correta. Enquanto a licença não é assinada, o desenvolvimento usa uma versão de domínio público como texto provisório.
- Certificados automáticos ao concluir trilha.
- Painel de formação: quantos % da membresia passaram por cada etapa.

#### Pregação (**diferencial**)
- **Planejamento de séries** em calendário (texto, tema, pregador, status: ideia → em preparo → pronto → pregado).
- Mapa de textos já pregados (por livro bíblico) para equilíbrio canônico ao longo dos anos.
- Arquivo de sermões com manuscrito, áudio/vídeo, slides e esboço; busca por texto bíblico e tema.
- Transcrição automática do áudio e geração de **resumo, devocional da semana e roteiro de célula** (IA, com revisão humana obrigatória antes de publicar).
- Compartilhamento do sermão com a congregação via app (notas pessoais do membro vinculadas).

#### Cuidado pastoral (**diferencial**)
- **Radar de cuidado**: alertas automáticos — membro ausente há N semanas, aniversário, luto, nascimento, internação registrada, mudança de status, dízimo interrompido (sinal visível só para pastor, nunca para cobrança).
- Visitas e aconselhamento: agendamento, registro confidencial, acompanhamento, próximos passos.
- Fila de acolhimento de visitantes com responsável e prazos.
- Enfermos/hospital e lista de oração da liderança.
- Registro de ocorrências sensíveis com acesso restrito e log de leitura (quem viu, quando).

#### Eventos e inscrições
- Criação de evento com ingressos (gratuitos/pagos), lotes, cupons, limite de vagas, lista de espera, formulário personalizado.
- Pagamento via PIX/cartão e recibo; inscrição pelo app ou link público (sem precisar de conta).
- Check-in no evento por QR; crachá imprimível.
- Hospedagem/transporte para retiros e congressos (quartos, ônibus, alimentação).
- Pós-evento: pesquisa de satisfação e integração automática à base de pessoas.

#### Site e app da igreja
- Site público gerado a partir dos dados (cultos, eventos, séries de pregação, células, doações, formulário de contato), com domínio próprio e temas.
- **App white-label**: PWA instalável com nome, ícone e cores da igreja; publicação opcional nas lojas (build único por igreja).
- Transmissão ao vivo (YouTube/Vimeo embutido) com presença online e oferta integrada.

### 4.3 Plataforma

- **Multi-igreja / multi-campus / denominação**: sede vê consolidado; cada campus opera independente; relatórios denominacionais agregados.
- Painel do administrador com saúde geral: cadastros, finanças, presença, formação, cuidado.
- Automações ("se visitante retornou 3x → criar tarefa para integrador") com editor visual simples.
- Formulários personalizados (construtor arrasta-e-solta) para qualquer finalidade.
- Importação/exportação total dos dados (sem aprisionamento).
- API pública e webhooks para integrações (contabilidade, streaming, telão).
- Auditoria completa: quem fez o quê, quando, de onde.
- **Assistente de IA** (contextual, com permissões do usuário): "quem da célula X não vem há 1 mês?", "redija um aviso sobre o retiro", "resumo da semana para a reunião de liderança".

---

## 5. Diferenciais frente à concorrência

Avaliamos soluções nacionais (gestão de membros + dízimo, geralmente com UX datada) e internacionais (Planning Center, Breeze, Tithe.ly, Subsplash, Pushpay: fortes, mas em inglês, com pagamento em dólar e sem PIX nativo). Em geral, as lacunas recorrentes são:

| Lacuna comum no mercado | Nossa resposta |
|---|---|
| Interface antiga, desktop-first, muitos cliques | Mobile-first, design system próprio, fluxos de 1–3 toques, modo escuro, acessibilidade |
| Nenhum módulo sério de **ensino/discipulado** | EBD + trilhas + biblioteca + Bíblia integrada + certificados |
| Nada para o **pregador** | Planejamento de séries, mapa canônico, arquivo de sermões, transcrição e materiais derivados |
| Cuidado pastoral reativo | Radar de cuidado com alertas automáticos e registro confidencial auditado |
| PIX manual (tesoureiro digita comprovante) | PIX dinâmico identificado com conciliação automática via webhook |
| Escalas que dependem do líder para tudo | Troca entre voluntários self-service, sugestão automática de escala |
| Check-in infantil inexistente ou pago à parte | Check-in seguro com etiqueta e código do responsável no núcleo |
| WhatsApp "integrado" via link ou gambiarra | API oficial, segmentação, modelos aprovados, relatório de entrega |
| Sem funcionamento offline | PWA offline-first: presença, relatório de célula e check-in funcionam sem internet e sincronizam depois |
| Relatórios rígidos | Listas inteligentes, filtros salvos, exportação em qualquer tela, painel público de transparência |
| Multi-campus caro ou inexistente | Multi-campus nativo, consolidado por denominação |
| LGPD tratada como rodapé | Consentimento granular, exportação/exclusão por pessoa, segregação de dados sensíveis, log de leitura |
| Aprisionamento de dados | Exportação total a qualquer momento, API pública |
| Onboarding longo e dependente de suporte | Assistente de configuração em 7 passos + importação guiada, igreja operando em < 1 hora |
| Para idosos é difícil | Modo "texto grande", alto contraste, ícones com rótulo, linguagem simples |

---

## 6. Experiência e design

### 6.1 Princípios

1. **Clareza antes de densidade.** Uma ação principal por tela, bem visível.
2. **Linguagem da igreja, não do software.** "Registrar culto", não "Criar evento tipo 3". Termos configuráveis por tradição (célula/PG/GC; dízimo/contribuição; pastor/presbítero/ministro).
3. **Zero tela vazia sem orientação.** Todo estado vazio ensina e oferece a próxima ação.
4. **Confiança visível.** Ações financeiras e documentos mostram quem fez e quando; nada é apagado de verdade (arquivamento).
5. **Rápido no celular ruim.** Páginas leves, carregamento progressivo, funciona em 3G e offline.
6. **Agradável.** Microinterações sutis, feedback imediato, tipografia que respira, ilustrações próprias nos estados vazios e no onboarding.
7. **Acessível por padrão.** WCAG 2.2 AA, navegação por teclado, leitores de tela, contraste verificado, foco visível, tamanho mínimo de toque 44px.

### 6.2 Design system ("MCA UI")

- **Tipografia**: uma sans legível para interface (Inter ou Geist) e uma serifada discreta para títulos e conteúdo bíblico/devocional (Source Serif ou Fraunces), transmitindo seriedade sem frieza.
- **Cores**: paleta neutra quente como base; cor primária configurável por igreja (gerada em escala 50–950 automaticamente com contraste garantido); semânticas fixas (sucesso, alerta, erro, informação). Modo claro e escuro de primeira classe.
- **Tokens** em CSS variables (`--color-primary-600`, `--radius-md`, `--space-4`) para permitir tema por igreja sem rebuild.
- **Componentes** sobre shadcn/ui + Radix (acessibilidade garantida): botões, formulários, tabelas com densidade ajustável, cartões, folhas inferiores (bottom sheets) no mobile, calendários, seletor de pessoas com busca, timeline, estados vazios ilustrados, skeletons.
- **Padrões de navegação**: no desktop, barra lateral recolhível por módulo; no mobile, barra inferior com 4 destinos + "mais". **Paleta de comandos (Ctrl/Cmd+K)** para buscar pessoas, ações e telas.
- **Padrões de formulário**: salvamento automático de rascunho, validação inline, máscaras brasileiras (CPF, CEP com preenchimento automático, telefone), botões de ação fixos no rodapé no mobile.
- **Dados**: tabelas com filtros salvos, agrupamento, exportação; gráficos simples e consistentes (uma biblioteca, um estilo).
- **Ilustrações e ícones**: Lucide para ícones; conjunto próprio de ilustrações leves (SVG) para onboarding e estados vazios.

### 6.3 Fluxos-chave que precisam ser perfeitos (medidos em toques)

| Fluxo | Meta |
|---|---|
| Registrar presença de uma célula | ≤ 60 s, ≤ 15 toques |
| Cadastrar um visitante no domingo | ≤ 30 s |
| Lançar uma oferta em dinheiro do culto | ≤ 20 s |
| Emitir uma carta de transferência | 3 cliques |
| Confirmar escala pelo voluntário | 1 toque na notificação |
| Membro doar via PIX | 2 toques + leitura do QR |
| Trocar escala com outro voluntário | ≤ 4 toques |

### 6.4 Onboarding da igreja (7 passos)

1. Dados da igreja e logotipo (gera tema automaticamente a partir da cor do logo).
2. Tradição e vocabulário: escolher um preset (ex.: **Assembleia de Deus**, Batista, Presbiteriana, Independente) que pré-carrega termos, cargos, classes de EBD e categorias financeiras; tudo editável depois.
3. Campi e horários de culto.
4. Importar pessoas (CSV/Excel) ou começar do zero.
5. Conta bancária e PIX (conectar PSP).
6. Convidar equipe e atribuir papéis.
7. Publicar site/app básico.

Cada passo é opcional e retomável; um checklist de "primeiros 30 dias" acompanha o administrador.

---

## 7. Stack técnica

### 7.1 Decisões

| Camada | Escolha | Justificativa |
|---|---|---|
| Linguagem | **TypeScript** ponta a ponta | Um só vocabulário, tipos compartilhados entre web, API e mobile |
| Monorepo | **pnpm workspaces + Turborepo** | Pacotes compartilhados (`ui`, `db`, `validators`, `config`) com build incremental |
| Web | **Next.js 15 (App Router) + React 19** | SSR/streaming, Server Actions, excelente no Vercel, PWA via `serwist` |
| Estilo | **Tailwind CSS v4 + shadcn/ui + Radix** | Produtividade, acessibilidade, tokens via CSS variables |
| Estado/dados no cliente | **TanStack Query** + Zustand (pouco) | Cache, otimismo, sincronização offline |
| Formulários | **react-hook-form + zod** | Validação única compartilhada com o backend |
| API | **tRPC** (interna) + **Hono** (API pública REST/webhooks) | Tipagem de ponta a ponta sem código gerado; REST onde terceiros precisam |
| Banco | **PostgreSQL via Supabase** (decidido) | Maturidade, RLS para multi-tenant, extensões (`pg_trgm` busca, `postgis` geolocalização); Auth, Storage e Realtime na mesma plataforma |
| ORM | **Drizzle ORM** | SQL-first, migrações legíveis, leve em serverless |
| Autenticação | **Supabase Auth** (decidido) | E-mail/senha, link mágico, Google/Apple, MFA, gestão de sessão; integração nativa com RLS |
| Arquivos | **Supabase Storage** (S3 compatível) | Fotos, documentos, áudios; URLs assinadas; Cloudflare R2 apenas se o custo de egress justificar |
| Jobs e filas | **Inngest** (ou Trigger.dev) | Lembretes, radar de cuidado, transcrições, envios em massa, retries |
| Cache/tempo real | **Supabase Realtime** + Upstash Redis | Presença ao vivo no culto, escalas atualizando, rate limiting |
| Pagamentos/PIX | **Asaas** (decidido): PIX dinâmico com identificação do pagador, boleto, cartão, assinaturas, split e subcontas por congregação, webhooks | PSP brasileiro com API madura, subcontas (white-label) para que cada igreja receba na própria conta e split nativo para sede/congregações |
| WhatsApp | **Meta WhatsApp Cloud API** (oficial) | Modelos aprovados, entrega confiável, sem risco de banimento |
| E-mail | **Resend** + React Email | Transacionais com templates em React |
| Push | **Web Push (VAPID)** + FCM/OneSignal para apps nativos | PWA primeiro |
| Transcrição/IA | **Whisper (via API)** para áudio; **Claude** para resumos, redação e assistente com ferramentas restritas por permissão | Qualidade em português; IA sempre com revisão humana |
| Mapas/geocodificação | **MapLibre + OpenStreetMap/Nominatim** (ou Google Maps se orçamento) | Mapa de células e membros |
| PDF | **@react-pdf/renderer** ou HTML → PDF via Playwright | Documentos e recibos com identidade visual |
| Busca | Postgres `pg_trgm` + `tsvector`; Meilisearch se escalar | Busca de pessoas tolerante a erro de digitação |
| Mobile nativo (fase 2) | **Expo (React Native)** reutilizando `validators`, `api-client` e tokens de design | Lojas quando o PWA não bastar (push no iOS antigo, NFC) |
| Testes | **Vitest** (unidade), **Playwright** (E2E), Testing Library | Pirâmide de testes com E2E nos fluxos-chave |
| Qualidade | ESLint, Prettier, TypeScript estrito, Husky + lint-staged, Changesets | Padrão desde o primeiro commit |
| CI/CD | **GitHub Actions** → **Vercel** (web) + migrações automatizadas | Preview por PR, deploy contínuo |
| Observabilidade | **Sentry** (erros), **PostHog** (produto, self-host opcional), Axiom/Better Stack (logs) | Saber o que quebra e o que é usado |
| Infra como código | Terraform/Pulumi para recursos fora do Vercel (banco, buckets, DNS) | Reprodutibilidade |

### 7.2 Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│  Clientes                                                        │
│  Web (Next.js, PWA offline-first) · App Expo (fase 2) · Site     │
│  público por igreja · Telão/check-in (modo quiosque)             │
└───────────────┬───────────────────────────────┬──────────────────┘
                │ tRPC (tipado)                 │ REST/Webhooks (Hono)
┌───────────────▼───────────────────────────────▼──────────────────┐
│  Camada de aplicação (Next.js Route Handlers + Server Actions)   │
│  · Autorização por papel+escopo (middleware)                     │
│  · Casos de uso por módulo (pessoas, finanças, ensino…)          │
│  · Eventos de domínio → fila (Inngest)                           │
└───────┬───────────────────┬───────────────────┬──────────────────┘
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌───────▼────────────────┐
│ PostgreSQL    │  │ Storage (S3)    │  │ Workers (Inngest)      │
│ RLS por       │  │ fotos, docs,    │  │ lembretes, radar,      │
│ tenant        │  │ áudios          │  │ transcrição, envios    │
└───────────────┘  └─────────────────┘  └───────┬────────────────┘
                                                │
                     ┌──────────────────────────▼─────────────────┐
                     │ Integrações: PSP (PIX), WhatsApp API,      │
                     │ Resend, Push, Whisper/Claude, Mapas        │
                     └────────────────────────────────────────────┘
```

**Multi-tenant**: um banco, coluna `church_id` em todas as tabelas de domínio, **Row Level Security** no Postgres como segunda linha de defesa (além da autorização na aplicação). Igrejas grandes ou denominações podem ter banco dedicado (tenant isolado) sem mudança de código.

**Offline-first**: as telas de presença, relatório de célula, check-in e cadastro rápido usam fila local (IndexedDB) com sincronização e resolução de conflito "último registro vence com histórico".

**Eventos de domínio**: `pessoa.criada`, `presenca.registrada`, `doacao.conciliada`, `membro.ausente_4_semanas`… alimentam automações, radar de cuidado e webhooks externos.

### 7.3 Estrutura do repositório

```
mca-igrejas/
├── apps/
│   ├── web/              # Next.js (painel + app do membro + site público)
│   ├── api/              # Hono: API pública e webhooks (PSP, WhatsApp)
│   └── mobile/           # Expo (fase 2)
├── packages/
│   ├── ui/               # Design system (componentes, tokens, ilustrações)
│   ├── db/               # Drizzle schema, migrações, seeds, políticas RLS
│   ├── validators/       # Schemas zod compartilhados
│   ├── core/             # Casos de uso e regras de domínio por módulo
│   ├── integrations/     # Adaptadores: PSP, WhatsApp, e-mail, IA, mapas
│   ├── jobs/             # Funções Inngest
│   └── config/           # ESLint, TS, Tailwind presets
├── docs/                 # Este documento, ADRs, guias
├── .github/workflows/    # CI
└── turbo.json · pnpm-workspace.yaml · package.json
```

---

## 8. Modelo de dados (entidades principais)

```
Church (tenant) ─┬─ Campus ─┬─ Service (culto)  ─ Attendance
                 │          └─ Room (salas)
                 ├─ Person ─┬─ Household (família)
                 │          ├─ MembershipEvent (batismo, transferência…)
                 │          ├─ Contact / Address (geo)
                 │          ├─ Tag · SmartList
                 │          ├─ PastoralNote (restrito, log de leitura)
                 │          └─ Consent (LGPD)
                 ├─ User ─ RoleAssignment (papel + escopo)
                 ├─ Ministry ─┬─ Position ─ Volunteer
                 │            └─ Schedule ─ Shift ─ Assignment (confirmações/trocas)
                 ├─ Network ─ Supervision ─ CellGroup ─ CellMeetingReport
                 ├─ Class (EBD) ─ Lesson ─ Enrollment ─ Attendance
                 ├─ Track (discipulado) ─ Step ─ Progress
                 ├─ ContentItem (aulas, PDFs, vídeos) ─ AccessRule
                 ├─ SermonSeries ─ Sermon ─ Transcript ─ DerivedMaterial
                 ├─ Account (bancária/caixa) ─ Transaction ─ Category · CostCenter
                 ├─ Contribution (vincula Transaction ↔ Person) ─ PixCharge
                 ├─ Campaign · Budget · Asset (patrimônio)
                 ├─ Event ─ TicketType ─ Registration ─ Payment ─ CheckIn
                 ├─ DocumentTemplate ─ IssuedDocument (hash, QR)
                 ├─ Meeting (assembleia) ─ Agenda ─ Vote ─ Minutes
                 ├─ Message ─ Delivery (canal, status) · PrayerRequest
                 ├─ Automation ─ Trigger ─ Action
                 ├─ Form ─ Field ─ Submission
                 └─ AuditLog
```

Convenções: UUID v7 como chave, `created_at/updated_at/deleted_at` (soft delete), `church_id` obrigatório, enums em tabelas de domínio quando a igreja pode personalizar (ex.: tipos de evento de membresia).

---

## 9. Segurança, privacidade e conformidade

- **LGPD**: base legal registrada por finalidade; consentimento granular (comunicação, fotos, compartilhamento de aniversário); exportação completa e exclusão/anonimização por pessoa; relatório de impacto para dados sensíveis (religião é dado sensível por definição — tratar tudo como tal).
- **Dados sensíveis segregados**: notas pastorais, disciplina, saúde — criptografia em nível de coluna, acesso explícito, log de leitura visível ao pastor titular.
- **Autenticação**: MFA opcional (obrigatório para tesouraria e admin), sessões por dispositivo, revogação remota.
- **Autorização em duas camadas**: aplicação (papel + escopo) e banco (RLS).
- **Auditoria imutável** de ações financeiras, documentos e permissões.
- **Backups** diários com retenção de 30 dias, restauração testada mensalmente, exportação sob demanda pela igreja.
- **Segurança de aplicação**: dependências auditadas em CI, cabeçalhos de segurança, rate limiting, validação zod em toda entrada, proteção de webhooks por assinatura.
- **Menores**: dados de crianças só via responsável; check-in infantil com código; fotos de crianças exigem consentimento específico.
- **Transparência**: página de status e política de privacidade clara em português simples.

---

## 10. Modelo de negócio (hipótese inicial)

- **SaaS por igreja**, preço por faixa de membros ativos (não por usuário), para não punir quem engaja a equipe.
- Plano gratuito até ~50 pessoas (igrejas em plantação), planos pagos a partir daí, denominações com contrato.
- Receita adicional opcional: pequena taxa de serviço sobre doações via plataforma (transparente e desativável se a igreja usar o próprio PSP).
- Sem cobrança por módulo no núcleo; módulos avançados (app nas lojas, transcrição por IA, denominação) em planos superiores.

---

## 11. Roadmap

### Fase 0 — Fundação (semanas 1–3)
- Monorepo, CI, design tokens, componentes base, autenticação, multi-tenant com RLS, onboarding mínimo.
- Pessoas (cadastro, famílias, status, importação CSV).
- Decidir PSP e abrir contas de sandbox (PIX, WhatsApp).

### Fase 1 — MVP "Secretaria + Tesouraria que encantam" (semanas 4–10)
- Documentos (cartas, certificados) com modelos.
- Finanças: contas, lançamentos, categorias, centros de custo, PIX dinâmico conciliado, recibos, relatórios essenciais, fechamento mensal.
- Cultos e presença (incluindo visitantes e fluxo de acolhimento).
- Comunicação: WhatsApp + push + e-mail segmentados.
- PWA do membro: agenda, doar, perfil, pedidos de oração.
- Painel do administrador.
- **Piloto com a ADEMAN** (matriz + 1 congregação); em seguida, 2–4 igrejas adicionais de tamanhos e tradições diferentes.

### Fase 2 — Vida da igreja (semanas 11–18)
- Ministérios e escalas com trocas.
- Células com relatório offline e mapa.
- Eventos com inscrição e pagamento.
- Check-in infantil com etiquetas.
- Radar de cuidado (versão 1: ausências, aniversários, luto).
- Site público por igreja.

### Fase 3 — Ensino e pregação (semanas 19–26)
- EBD, trilhas de discipulado, biblioteca de conteúdo, Bíblia integrada, certificados.
- Planejamento de séries, mapa canônico, arquivo de sermões.
- Transcrição e materiais derivados por IA com revisão.
- Assistente de IA no painel.

### Fase 4 — Escala (semanas 27+)
- Multi-campus/denominação consolidado.
- Automações visuais, formulários, API pública, webhooks.
- App nativo (Expo) nas lojas, white-label.
- Assembleias e votações, patrimônio, orçamento x realizado.
- Marketplace de modelos (documentos, trilhas, materiais) entre igrejas.

### Critérios de saída do MVP
- ADEMAN (matriz e congregação) usando semanalmente por 4 semanas, com relatório de EBD e tesouraria fechados pelo sistema.
- 80% dos PIX conciliados sem toque humano.
- Secretaria emite documentos sem suporte.
- Nenhum incidente de permissão (dados sensíveis vistos por quem não devia).

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Escopo grande demais e nada fica excelente | Fases com critérios de saída; MVP focado em secretaria e tesouraria |
| Igrejas pequenas com baixa alfabetização digital | Onboarding guiado, vocabulário configurável, modo texto grande, vídeos curtos de ajuda em cada tela |
| Dependência de PSP/WhatsApp | Adaptadores por interface (`PaymentProvider`, `MessagingProvider`); troca sem tocar no domínio |
| Dados sensíveis vazados | Segregação, criptografia, RLS, testes automatizados de permissão em todo PR |
| Custo de IA | Uso sob demanda em planos superiores; cache de resultados; modelos pequenos para tarefas simples |
| Resistência de tradições diferentes | Vocabulário e fluxos configuráveis; evitar impor eclesiologia na estrutura de dados |
| Licença da ARA não sair a tempo ou custar caro | Texto de domínio público como fallback; arquitetura da Bíblia integrada independente da versão (múltiplas versões por tabela) |
| Preset AD vazar para o núcleo e dificultar outras denominações | Revisão de arquitetura: tudo do preset vive em `packages/core/presets/assembleia-de-deus` e em dados, nunca em regra de domínio |

---

## 13. Decisões fundamentais (fechadas em 04/10/2026)

| # | Decisão | Escolha | Observações |
|---|---|---|---|
| 1 | Nome e marca | **MCA Igrejas** | Registrar domínio e marca; o design system passa a se chamar "MCA UI" |
| 2 | Plataforma de dados | **Supabase** (Postgres + Auth + Storage + Realtime) | Domínio desacoplado via `packages/core` e `packages/db` para permitir migração futura |
| 3 | PSP (PIX, boleto, cartão) | **Asaas** | Subcontas por igreja/congregação, split sede ↔ congregações, webhooks assinados; sandbox desde a Fase 0 |
| 4 | Versão bíblica | **Almeida Revista e Atualizada (ARA)** | Texto protegido por direitos autorais da SBB: **negociar licença de uso em software** antes da Fase 3. Até então, usar versão de domínio público como texto provisório |
| 5 | Faixas de preço | **A definir** | Decidir após o piloto, com dados reais de uso e custo por igreja. Hipótese de trabalho na seção 10 |
| 6 | Igreja piloto | **ADEMAN — Assembleia de Deus em Mangueiras** | Escopo inicial: **matriz + 1 congregação**. Ver seção 14 |

### Decisões ainda abertas
- Faixas de preço e política do plano gratuito (item 5).
- Modelo de acordo do piloto com a ADEMAN (sugestão: uso gratuito por 6 meses em troca de feedback semanal).

---

## 14. Contexto do piloto: Assembleia de Deus

A Assembleia de Deus (AD) é a maior denominação evangélica do Brasil e tem estrutura e vocabulário próprios. O sistema precisa falar essa língua **sem engessar** outras tradições: tudo abaixo é implementado como **vocabulário configurável e modelos pré-carregados** ("Preset Assembleia de Deus"), não como regra fixa no código.

### 14.1 Estrutura eclesiástica

| Conceito na AD | Como o sistema modela | Observação |
|---|---|---|
| **Ministério / Campo** (ex.: AD Ministério X, presidido por um pastor presidente) | `Church` (tenant) | Nível do contrato e da visão consolidada |
| **Igreja sede** | `Campus` marcado como sede | Concentra tesouraria central e secretaria geral |
| **Congregações** (dezenas ou centenas, cada uma com dirigente) | `Campus` filhos da sede, agrupáveis em **setores/áreas** | Hierarquia de 3 níveis: campo → setor → congregação |
| **Pastor presidente, vice-presidente, pastores setoriais** | Papéis derivados de `pastor` com escopo (campo, setor, congregação) | Criados pelo preset |
| **Dirigente de congregação** (pastor, evangelista ou presbítero) | Papel `dirigente` = `pastor` com escopo de um campus | Vê só sua congregação; sede vê tudo |
| **Obreiros**: diácono, presbítero, evangelista, pastor; auxiliares, cooperadores | Cargos em `MembershipEvent` (consagração/ordenação, data, local) + credencial de obreiro | Documento "credencial" já previsto em Secretaria |
| **Rol de membros** | Lista de pessoas com status `membro` por congregação, com número de rol | Impressão de rol e "cartão de membro" com QR |
| **Disciplina** (afastamento, exclusão) e **reconciliação** | `MembershipEvent` restrito | Visível só para pastor/dirigente e secretaria geral |
| **Convenção** (CGADB e convenções estaduais) | Campo de filiação no tenant + exportação de relatório anual | Relatórios estatísticos padronizados para a convenção |

### 14.2 Vocabulário padrão do preset AD
- "Congregação" (não "campus"); "Dirigente"; "Obreiro"; "Cooperador(a)"; "Auxiliar".
- "Dízimos e ofertas", "Oferta missionária", "Círculo de oração", "Culto de doutrina", "Culto de ensino", "Santa Ceia".
- "Departamentos" para ministérios internos (Mocidade/UMADEB-like, Senhoras, Varões, Crianças, Adolescentes, Louvor, Mídia).
- "EBD" com classes por faixa e **trimestres**.

### 14.3 Escola Bíblica Dominical no centro
A EBD é uma das instituições mais fortes da AD. O módulo de ensino nasce com:
- Estrutura **trimestral** de lições (13 lições por trimestre) com cadastro da revista em uso (ex.: CPAD) por classe e por trimestre.
- Classes por faixa etária padrão (Berçário, Maternal, Jardim, Primários, Juniores, Pré-adolescentes, Adolescentes, Jovens, Adultos, Novos convertidos, Discipulado) editáveis.
- **Relatório de EBD** por domingo: presentes, visitantes, Bíblias, revistas, ofertas, por classe e consolidado por congregação e campo.
- Painel de EBD no nível do campo: frequência por congregação, classes sem professor, crescimento trimestral.
- Secretário(a) de EBD como papel específico (derivado de `professor` com escopo de congregação).

### 14.4 Finanças na AD
- **Repasse congregação → sede** (percentual ou valor fixo) e prestação de contas por congregação: modelado com split do Asaas e com lançamento automático de repasse.
- Dízimo de obreiros e cooperação de pastores: categorias pré-cadastradas.
- Relatório mensal padrão de tesouraria da congregação para a sede (formato impresso e digital).
- Campanhas comuns pré-criadas: construção, missões, congressos de departamentos.

### 14.5 Igreja piloto: ADEMAN

| Item | Definição |
|---|---|
| Igreja | **ADEMAN — Assembleia de Deus em Mangueiras** |
| Escopo inicial | **Matriz (sede) + 1 congregação** |
| Modelo no sistema | 1 `Church` (ADEMAN) · 2 `Campus` (matriz marcada como sede; congregação vinculada à matriz) · setores desativados nesta fase |
| Papéis a provisionar | Pastor presidente (admin + pastor no campo), dirigente da congregação, secretaria geral, tesouraria geral, tesoureiro da congregação, secretário(a) de EBD por congregação, professores, obreiros, membros |
| Finanças | Duas subcontas Asaas (matriz e congregação) ou uma conta com split; repasse congregação → matriz configurado em percentual |
| Dados iniciais | Importar rol de membros (matriz e congregação), cargos de obreiros, classes de EBD e plano de contas atual |
| Objetivo da fase | Validar os fluxos abaixo com dois níveis reais (sede ↔ congregação) antes de abrir para mais congregações |

O escopo pequeno é intencional: dois campi já exercitam toda a hierarquia, as permissões por escopo e o repasse financeiro, sem o volume de uma rede grande. Novas congregações da ADEMAN entram como `Campus` adicionais sem mudança de código.

### 14.6 Fluxos que o piloto vai validar primeiro
1. Cadastro do rol de membros e emissão de cartão de membro e carta de mudança (transferência entre congregações do mesmo campo e para outros ministérios).
2. Relatório de EBD dominical pelo celular do secretário de classe.
3. Dízimos e ofertas por PIX identificado na congregação, com repasse automático à sede.
4. Consagração/ordenação de obreiros e credencial com QR.
5. Escala de dirigentes de culto e de louvor.
6. Relatório estatístico anual para a convenção.

### 14.7 Cuidados
- Diversidade interna: ministérios diferentes da AD têm costumes diferentes (uso de instrumentos, vestuário, estrutura de departamentos). Nada disso vai para o código; tudo é configuração.
- Grande parte dos dirigentes de congregação tem pouco tempo e usa só o celular: o fluxo do dirigente (presença, oferta, relatório de EBD, pedido de oração) tem de caber inteiro na barra inferior do app.
- Linguagem e imagética do produto devem ser sóbrias e respeitosas, evitando estética "startup" que soe estranha ao público.

---

## 15. Próximos passos imediatos

1. Registrar domínio e marca "MCA Igrejas"; definir logotipo e paleta base do MCA UI.
2. Criar o monorepo com a estrutura da seção 7.3, CI e design tokens.
3. Criar projeto Supabase (dev) e conta sandbox Asaas; configurar webhooks assinados.
4. Iniciar contato com a SBB para licença da ARA em software.
5. Desenhar os fluxos-chave da seção 6.3 e os seis fluxos do piloto (14.6), mobile primeiro.
6. Modelar e migrar o esquema de **Pessoas** (com hierarquia campo → setor → congregação) e **Finanças** (com repasse).
7. Formalizar o acordo de piloto com a ADEMAN (matriz + 1 congregação) e levantar os dados iniciais: rol de membros, obreiros, classes de EBD e plano de contas.
8. Decidir faixas de preço após 4 semanas de piloto.
