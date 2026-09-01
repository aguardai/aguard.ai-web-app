-- =============================================================================
-- Aguard.ai — Massa de dados de demonstração (100% fictícia)
--
-- Gera:
--   2 clínicas, 5 unidades, 16 profissionais, 13 guichês, 22 locações
--   fila de recepção compartilhada por unidade: o guichê só entra no ticket ao chamar
--   17 contas de acesso no Supabase Auth (senha aguardai123)
--   2.000 pacientes
--   dias úteis de -90 a +90 em torno de hoje, nas duas filas
--     passado e futuro: tickets encerrados, que alimentam os relatórios em qualquer data
--     dias futuros: também uma fila em aberto, para o painel ter movimento quando o dia chegar
--   trilha completa em fila_evento
--   filas do dia corrente criadas pelo caminho real da aplicação (RPCs + triggers)
--
-- Uso exclusivo em ambiente de desenvolvimento: o script apaga fisicamente os
-- dados semeados anteriormente antes de recarregar.
-- =============================================================================

select setseed(0.4242);

-- -----------------------------------------------------------------------------
-- 1. Limpeza da carga anterior (triggers desligados para permitir DELETE físico)
-- -----------------------------------------------------------------------------
alter table public.fila_evento  disable trigger user;
alter table public.perfil       disable trigger user;
alter table public.consulta     disable trigger user;
alter table public.atendimento  disable trigger user;
alter table public.locacao      disable trigger user;
alter table public.guiche       disable trigger user;
alter table public.profissional disable trigger user;
alter table public.paciente     disable trigger user;
alter table public.unidade      disable trigger user;
alter table public.clinica      disable trigger user;

drop table if exists public.seed_usuario;
drop table if exists public.seed_paciente;
drop table if exists public.seed_atendimento;
drop table if exists public.seed_consulta;

delete from auth.users
 where email like '%@vidaplena.exemplo' or email like '%@odontosorriso.exemplo';

delete from public.fila_evento
 where clinica_id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');
delete from public.consulta
 where unidade_id in (select id from public.unidade
                       where clinica_id in ('a0000000-0000-4000-8000-000000000001',
                                            'a0000000-0000-4000-8000-000000000002'));
delete from public.atendimento
 where unidade_id in (select id from public.unidade
                       where clinica_id in ('a0000000-0000-4000-8000-000000000001',
                                            'a0000000-0000-4000-8000-000000000002'));
delete from public.locacao
 where unidade_id in (select id from public.unidade
                       where clinica_id in ('a0000000-0000-4000-8000-000000000001',
                                            'a0000000-0000-4000-8000-000000000002'));
delete from public.guiche
 where unidade_id in (select id from public.unidade
                       where clinica_id in ('a0000000-0000-4000-8000-000000000001',
                                            'a0000000-0000-4000-8000-000000000002'));
delete from public.profissional
 where clinica_id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');
delete from public.unidade
 where clinica_id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');
delete from public.paciente where telefone like '8799%';
delete from public.clinica
 where id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');

alter table public.fila_evento  enable trigger user;
alter table public.perfil       enable trigger user;
alter table public.consulta     enable trigger user;
alter table public.atendimento  enable trigger user;
alter table public.locacao      enable trigger user;
alter table public.guiche       enable trigger user;
alter table public.profissional enable trigger user;
alter table public.paciente     enable trigger user;
alter table public.unidade      enable trigger user;
alter table public.clinica      enable trigger user;

-- -----------------------------------------------------------------------------
-- 2. Cadastros (com todos os triggers ativos: auditoria e limites de plano)
-- -----------------------------------------------------------------------------
insert into public.clinica (id, nome, email, telefone, endereco, plano, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'Clínica Vida Plena',
   'contato@vidaplena.exemplo', '8730001000', 'Av. das Palmeiras, 100 - Petrolina/PE',
   'enterprise', now() - interval '18 months'),
  ('a0000000-0000-4000-8000-000000000002', 'Odonto Sorriso',
   'contato@odontosorriso.exemplo', '8730002000', 'Rua do Comércio, 88 - Juazeiro/BA',
   'enterprise', now() - interval '9 months');

insert into public.unidade
  (id, clinica_id, nome, endereco, telefone, latitude, longitude,
   codigo, tipo_servico, duracao_media_minutos, encaminha_para_consulta, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Unidade Centro', 'Rua Central, 45 - Petrolina/PE', '8730001001', -9.389800, -40.502700,
   'CTR', 'Recepção', 9, true, now() - interval '18 months'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Unidade Shopping', 'Av. Cardoso de Sá, 1200 - Petrolina/PE', '8730001002', -9.402100, -40.518300,
   'SHP', 'Recepção', 9, true, now() - interval '14 months'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Unidade Zona Norte', 'Av. Souza Filho, 730 - Petrolina/PE', '8730001003', -9.371500, -40.489900,
   'ZNO', 'Recepção', 10, true, now() - interval '7 months'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002',
   'Matriz Juazeiro', 'Rua do Comércio, 88 - Juazeiro/BA', '8730002001', -9.416200, -40.503100,
   'MTZ', 'Recepção', 9, true, now() - interval '9 months'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002',
   'Anexo Orla', 'Av. Beira Rio, 15 - Juazeiro/BA', '8730002002', -9.425400, -40.497600,
   'ORL', 'Recepção', 10, true, now() - interval '4 months');

insert into public.profissional
  (id, clinica_id, nome, email, telefone, especialidade, registro_profissional, codigo, duracao_media_minutos, created_at) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Rafael Andrade',      'rafael.andrade@vidaplena.exemplo',   '87991000001', 'Odontologia',      'CRO-PE 12345', 'RAF', 30, now() - interval '17 months'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Ana Beatriz Lima',    'ana.lima@vidaplena.exemplo',         '87991000002', 'Dermatologia',     'CRM-PE 54321', 'ANA', 25, now() - interval '17 months'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Marcos Vinícius Rocha','marcos.rocha@vidaplena.exemplo',    '87991000003', 'Cardiologia',      'CRM-PE 22110', 'MAR', 35, now() - interval '16 months'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Juliana Prado',       'juliana.prado@vidaplena.exemplo',    '87991000004', 'Pediatria',        'CRM-PE 33220', 'JUL', 20, now() - interval '15 months'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Fernando Teixeira',   'fernando.teixeira@vidaplena.exemplo','87991000005', 'Ortopedia',        'CRM-PE 44330', 'FER', 28, now() - interval '14 months'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Camila Nogueira',     'camila.nogueira@vidaplena.exemplo',  '87991000006', 'Ginecologia',      'CRM-PE 55440', 'CAM', 32, now() - interval '13 months'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Ricardo Menezes',     'ricardo.menezes@vidaplena.exemplo',  '87991000007', 'Clínica Geral',    'CRM-PE 66550', 'RIC', 18, now() - interval '12 months'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'Patrícia Gomes',      'patricia.gomes@vidaplena.exemplo',   '87991000008', 'Nutrição',         'CRN-PE 77660', 'PAT', 40, now() - interval '10 months'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'Bruno Carvalho',      'bruno.carvalho@vidaplena.exemplo',   '87991000009', 'Oftalmologia',     'CRM-PE 88770', 'BRU', 22, now() - interval '8 months'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001', 'Letícia Barros',      'leticia.barros@vidaplena.exemplo',   '87991000010', 'Psicologia',       'CRP-PE 99880', 'LET', 50, now() - interval '6 months'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'Otávio Ramos',        'otavio.ramos@vidaplena.exemplo',     '87991000011', 'Clínica Geral',    'CRM-PE 10090', 'OTA', 20, now() - interval '16 months'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'Débora Fontes',       'debora.fontes@odontosorriso.exemplo','87992000001', 'Odontologia',      'CRO-BA 11223', 'DEB', 35, now() - interval '9 months'),
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'Gustavo Aragão',      'gustavo.aragao@odontosorriso.exemplo','87992000002','Ortodontia',       'CRO-BA 22334', 'GUS', 40, now() - interval '9 months'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'Sílvia Menezes',      'silvia.menezes@odontosorriso.exemplo','87992000003','Odontopediatria',  'CRO-BA 33445', 'SIL', 30, now() - interval '7 months'),
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', 'Thiago Moura',        'thiago.moura@odontosorriso.exemplo', '87992000004', 'Implantodontia',   'CRO-BA 44556', 'THI', 55, now() - interval '5 months'),
  ('c0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000002', 'Renata Vasques',      'renata.vasques@odontosorriso.exemplo','87992000005','Endodontia',       'CRO-BA 55667', 'REN', 45, now() - interval '4 months');

insert into public.locacao (unidade_id, profissional_id, data_inicio, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', current_date - 400, now() - interval '13 months'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', current_date - 300, now() - interval '10 months'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', current_date - 400, now() - interval '13 months'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', current_date - 200, now() - interval '7 months'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', current_date - 200, now() - interval '7 months'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', current_date - 380, now() - interval '12 months'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', current_date - 360, now() - interval '12 months'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000004', current_date - 180, now() - interval '6 months'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000005', current_date - 200, now() - interval '7 months'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000005', current_date - 300, now() - interval '10 months'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000006', current_date - 300, now() - interval '10 months'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000007', current_date - 340, now() - interval '11 months'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008', current_date - 280, now() - interval '9 months'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000009', current_date - 220, now() - interval '8 months'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000010', current_date - 160, now() - interval '6 months'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000011', current_date - 380, now() - interval '12 months'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000012', current_date - 260, now() - interval '9 months'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000013', current_date - 110, now() - interval '4 months'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000013', current_date - 260, now() - interval '9 months'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000014', current_date - 110, now() - interval '4 months'),
  ('b0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000015', current_date - 140, now() - interval '5 months'),
  ('b0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000016', current_date - 110, now() - interval '4 months');

insert into public.guiche (id, unidade_id, nome, codigo, created_at) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Guichê 1 - Recepção', 'REC1', now() - interval '18 months'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Guichê 2 - Triagem',  'TRI1', now() - interval '18 months'),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Guichê 3 - Apoio',    'APO1', now() - interval '17 months'),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'Guichê 1 - Recepção', 'REC2', now() - interval '14 months'),
  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'Guichê 2 - Triagem',  'TRI2', now() - interval '14 months'),
  ('d0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002', 'Guichê 3 - Apoio',    'APO2', now() - interval '12 months'),
  ('d0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000003', 'Guichê 1 - Recepção', 'REC3', now() - interval '7 months'),
  ('d0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000003', 'Guichê 2 - Triagem',  'TRI3', now() - interval '7 months'),
  ('d0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000003', 'Guichê 3 - Apoio',    'APO3', now() - interval '6 months'),
  ('d0000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-000000000004', 'Recepção Matriz',     'REC4', now() - interval '9 months'),
  ('d0000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-000000000004', 'Apoio Matriz',        'APO4', now() - interval '8 months'),
  ('d0000000-0000-4000-8000-00000000000c', 'b0000000-0000-4000-8000-000000000005', 'Recepção Orla',       'REC5', now() - interval '4 months'),
  ('d0000000-0000-4000-8000-00000000000d', 'b0000000-0000-4000-8000-000000000005', 'Triagem Orla',        'TRI5', now() - interval '4 months');

-- O profissional padrão do encaminhamento automático é definido na unidade
update public.unidade set profissional_padrao_id = v.prof
  from (values
    ('b0000000-0000-4000-8000-000000000001'::uuid, 'c0000000-0000-4000-8000-000000000001'::uuid),
    ('b0000000-0000-4000-8000-000000000002'::uuid, 'c0000000-0000-4000-8000-000000000006'::uuid),
    ('b0000000-0000-4000-8000-000000000003'::uuid, 'c0000000-0000-4000-8000-000000000005'::uuid),
    ('b0000000-0000-4000-8000-000000000004'::uuid, 'c0000000-0000-4000-8000-000000000012'::uuid),
    ('b0000000-0000-4000-8000-000000000005'::uuid, 'c0000000-0000-4000-8000-000000000013'::uuid)
  ) as v(unidade, prof)
 where public.unidade.id = v.unidade;

-- -----------------------------------------------------------------------------
-- 2b. Contas de acesso no Supabase Auth
--     Senha única de desenvolvimento: aguardai123
-- -----------------------------------------------------------------------------
create table public.seed_usuario (
  id              uuid,
  email           text,
  nome            text,
  papel           text,
  clinica_id      uuid,
  unidade_id      uuid,
  profissional_id uuid
);

insert into public.seed_usuario values
  -- Administração das clínicas
  ('e0000000-0000-4000-8000-000000000001', 'admin@vidaplena.exemplo',            'Vanessa Prado',        'clinica',      'a0000000-0000-4000-8000-000000000001', null, null),
  ('e0000000-0000-4000-8000-000000000002', 'admin@odontosorriso.exemplo',        'Sérgio Aragão',        'clinica',      'a0000000-0000-4000-8000-000000000002', null, null),
  -- Operação das unidades
  ('e0000000-0000-4000-8000-000000000003', 'centro@vidaplena.exemplo',           'Recepção Centro',      'unidade',      null, 'b0000000-0000-4000-8000-000000000001', null),
  ('e0000000-0000-4000-8000-000000000004', 'shopping@vidaplena.exemplo',         'Recepção Shopping',    'unidade',      null, 'b0000000-0000-4000-8000-000000000002', null),
  ('e0000000-0000-4000-8000-000000000005', 'zonanorte@vidaplena.exemplo',        'Recepção Zona Norte',  'unidade',      null, 'b0000000-0000-4000-8000-000000000003', null),
  ('e0000000-0000-4000-8000-000000000006', 'matriz@odontosorriso.exemplo',       'Recepção Matriz',      'unidade',      null, 'b0000000-0000-4000-8000-000000000004', null),
  ('e0000000-0000-4000-8000-000000000007', 'orla@odontosorriso.exemplo',         'Recepção Orla',        'unidade',      null, 'b0000000-0000-4000-8000-000000000005', null),
  -- Dois profissionais por unidade
  ('e0000000-0000-4000-8000-000000000008', 'rafael.andrade@vidaplena.exemplo',   'Rafael Andrade',       'profissional', null, null, 'c0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000009', 'ana.lima@vidaplena.exemplo',         'Ana Beatriz Lima',     'profissional', null, null, 'c0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-00000000000a', 'fernando.teixeira@vidaplena.exemplo','Fernando Teixeira',    'profissional', null, null, 'c0000000-0000-4000-8000-000000000005'),
  ('e0000000-0000-4000-8000-00000000000b', 'camila.nogueira@vidaplena.exemplo',  'Camila Nogueira',      'profissional', null, null, 'c0000000-0000-4000-8000-000000000006'),
  ('e0000000-0000-4000-8000-00000000000c', 'marcos.rocha@vidaplena.exemplo',     'Marcos Vinícius Rocha','profissional', null, null, 'c0000000-0000-4000-8000-000000000003'),
  ('e0000000-0000-4000-8000-00000000000d', 'leticia.barros@vidaplena.exemplo',   'Letícia Barros',       'profissional', null, null, 'c0000000-0000-4000-8000-000000000010'),
  ('e0000000-0000-4000-8000-00000000000e', 'debora.fontes@odontosorriso.exemplo','Débora Fontes',        'profissional', null, null, 'c0000000-0000-4000-8000-000000000012'),
  ('e0000000-0000-4000-8000-00000000000f', 'thiago.moura@odontosorriso.exemplo', 'Thiago Moura',         'profissional', null, null, 'c0000000-0000-4000-8000-000000000015'),
  ('e0000000-0000-4000-8000-000000000010', 'gustavo.aragao@odontosorriso.exemplo','Gustavo Aragão',      'profissional', null, null, 'c0000000-0000-4000-8000-000000000013'),
  ('e0000000-0000-4000-8000-000000000011', 'silvia.menezes@odontosorriso.exemplo','Sílvia Menezes',      'profissional', null, null, 'c0000000-0000-4000-8000-000000000014');

-- As colunas de token não aceitam NULL do lado do GoTrue: sem elas o login
-- falha com "Database error querying schema"
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
  email_change, email_change_confirm_status, phone_change, phone_change_token,
  reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('aguardai123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nome', u.nome),
  now(),
  now(),
  '', '', '', '',
  '', 0, '', '',
  ''
from public.seed_usuario u;

-- Sem a identidade de e-mail o GoTrue não aceita login por senha
insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email',
  now(),
  now(),
  now()
from public.seed_usuario u;

-- O trigger de vínculo cria o perfil do profissional a partir do user_id
update public.profissional p
   set user_id = u.id
  from public.seed_usuario u
 where u.profissional_id = p.id;

update public.perfil p
   set clinica_id = u.clinica_id
  from public.seed_usuario u
 where u.id = p.id and u.papel = 'clinica';

update public.perfil p
   set papel      = 'unidade'::public.papel_usuario,
       unidade_id = u.unidade_id
  from public.seed_usuario u
 where u.id = p.id and u.papel = 'unidade';

update public.perfil pf
   set clinica_id = pr.clinica_id,
       papel      = 'profissional'::public.papel_usuario,
       updated_at = now()
  from public.seed_usuario u
  join public.profissional pr on pr.id = u.profissional_id
 where u.id = pf.id and u.papel = 'profissional';

-- -----------------------------------------------------------------------------
-- 3. 2.000 pacientes fictícios
--    seq 1..400  reservados para a fila de hoje (criada pelas RPCs)
--    seq 401..2000 usados pelas filas em aberto dos dias futuros
-- -----------------------------------------------------------------------------
insert into public.paciente (nome, telefone, email, created_at)
select
  (array['Ana','Bruno','Camila','Diego','Eduarda','Felipe','Gabriela','Henrique','Isabela','João',
         'Karina','Lucas','Mariana','Nathan','Olívia','Pedro','Rafaela','Samuel','Tatiane','Vinícius'])[1 + (n * 7) % 20]
  || ' ' ||
  (array['Almeida','Barbosa','Cardoso','Duarte','Esteves','Fonseca','Gonçalves','Henriques','Jardim',
         'Lacerda','Moreira','Nunes','Oliveira','Rezende','Tavares'])[1 + (n * 11) % 15]
  || ' ' ||
  (array['Pereira','Queiroz','Ramos','Santana','Teixeira','Uchoa','Vasconcelos','Xavier','Zanetti',
         'Antunes','Bezerra','Coelho','Dias','Farias','Guedes','Martins','Peixoto','Siqueira'])[1 + (n * 13) % 18],
  '8799' || lpad(n::text, 7, '0'),
  case when n % 3 = 0 then 'paciente' || n || '@exemplo.com' end,
  now() - ((n % 120) * interval '1 day')
from generate_series(1, 2000) as n;

create table public.seed_paciente as
select cast(row_number() over (order by telefone) as integer) as seq, id
  from public.paciente
 where telefone like '8799%';

create unique index on public.seed_paciente (seq);

-- -----------------------------------------------------------------------------
-- 4. Histórico e agenda futura (-90 a +90 dias) — carga em massa com triggers desligados
-- -----------------------------------------------------------------------------
alter table public.atendimento disable trigger user;
alter table public.consulta    disable trigger user;
alter table public.fila_evento disable trigger user;

create table public.seed_atendimento as
with dias as (
  select d::date                        as data_fila,
         extract(isodow from d)::int    as dow,
         (d::date > current_date)       as futuro
    from generate_series(current_date - 90, current_date + 90, interval '1 day') as d
   where extract(isodow from d) between 1 and 5
     and d::date <> current_date
),
unidades as (
  select u.id as unidade_id, u.clinica_id, u.codigo, u.duracao_media_minutos,
         u.encaminha_para_consulta, u.profissional_padrao_id,
         (select count(*) from public.guiche g
           where g.unidade_id = u.id and g.deleted_at is null) as qtd_guiches,
         case when u.clinica_id = 'a0000000-0000-4000-8000-000000000001'::uuid
              then 1.0::double precision else 0.55::double precision end as fator
    from public.unidade u
),
-- Guichês numerados para sortear quem chamou cada ticket
guiches_num as (
  select g.id as guiche_id, g.unidade_id,
         cast(row_number() over (partition by g.unidade_id order by g.codigo) as integer) as n
    from public.guiche g
   where g.deleted_at is null
),
-- Tickets já encerrados: alimentam relatórios em todo o período, passado e futuro
encerrados as materialized (
  select
    d.data_fila,
    d.futuro,
    un.*,
    (d.data_fila + time '07:20' + (s.seq * interval '2 minutes')
      + (floor(random() * 4) * interval '1 minute'))::timestamptz as entrada_fila,
    random() as r_status,
    random() as r_espera,
    random() as r_dur,
    random() as r_prio,
    random() as r_enc,
    random() as r_pac,
    random() as r_guiche
  from dias d
  cross join unidades un
  cross join lateral generate_series(1, greatest(8, floor(
      (13 + random() * 9)
      * un.qtd_guiches
      * un.fator
      * (case when d.dow = 1 then 1.15 when d.dow = 5 then 0.85 else 1.0 end)
    )::int)) as s(seq)
),
-- Tickets ainda na fila, só nos dias futuros: quando o dia chegar o painel abre com fila
na_fila as materialized (
  select
    d.data_fila,
    d.futuro,
    un.*,
    (d.data_fila + time '10:30' + (s.seq * interval '4 minutes'))::timestamptz as entrada_fila,
    random() as r_prio,
    cast(row_number() over (partition by un.unidade_id order by d.data_fila, s.seq) as integer) as ordinal
  from dias d
  cross join unidades un
  cross join lateral generate_series(1, 8 + (extract(day from d.data_fila)::int % 7)) as s(seq)
  where d.futuro
),
combinados as (
  select
    gen_random_uuid() as id,
    e.unidade_id,
    e.clinica_id,
    e.codigo,
    gn.guiche_id,
    p.id as paciente_id,
    e.data_fila,
    (case when e.r_status < 0.86 then 'finalizado'
          when e.r_status < 0.93 then 'cancelado'
          else 'ausente' end)::public.status_fila as status,
    (case when e.r_prio < 0.15 then 'preferencial' else 'normal' end)::public.prioridade_fila as prioridade,
    e.entrada_fila,
    case when e.r_status < 0.86 or e.r_status >= 0.93
         then e.entrada_fila + ((2 + e.r_espera * 26) * interval '1 minute') end as chamado_em,
    case when e.r_status < 0.86
         then e.entrada_fila + ((3 + e.r_espera * 26) * interval '1 minute') end as atendido_em,
    case when e.r_status < 0.86
         then e.entrada_fila + ((3 + e.r_espera * 26 + e.duracao_media_minutos * (0.6 + e.r_dur * 0.9)) * interval '1 minute')
         when e.r_status < 0.93
         then e.entrada_fila + ((5 + e.r_espera * 30) * interval '1 minute') end as finalizado_em,
    (e.encaminha_para_consulta and e.r_status < 0.86 and e.r_enc < 0.7) as encaminhado,
    case when e.encaminha_para_consulta and e.r_status < 0.86 and e.r_enc < 0.7
         then e.profissional_padrao_id end as proximo_profissional_id,
    case when e.encaminha_para_consulta and e.r_status < 0.86 and e.r_enc < 0.7
         then (array['Primeira vez','Retorno','Avaliação','Urgência'])[1 + floor(e.r_prio * 4)::int] end as tipo_consulta,
    case when e.encaminha_para_consulta and e.r_status < 0.86 and e.r_enc < 0.7
         then gen_random_uuid() end as consulta_id
  from encerrados e
  join public.seed_paciente p on p.seq = 1 + floor(e.r_pac * 2000)::int
  -- O ticket cancelado antes da chamada nunca chegou a um guichê
  left join guiches_num gn
    on gn.unidade_id = e.unidade_id
   and gn.n = 1 + floor(e.r_guiche * e.qtd_guiches)::int
   and (e.r_status < 0.86 or e.r_status >= 0.93)

  union all

  select
    gen_random_uuid(),
    a.unidade_id,
    a.clinica_id,
    a.codigo,
    null::uuid,
    p.id,
    a.data_fila,
    'aguardando'::public.status_fila,
    (case when a.r_prio < 0.15 then 'preferencial' else 'normal' end)::public.prioridade_fila,
    a.entrada_fila,
    null::timestamptz,
    null::timestamptz,
    null::timestamptz,
    false,
    null::uuid,
    null::text,
    null::uuid
  from na_fila a
  -- Faixa reservada de pacientes: o índice único impede repetir alguém na fila da mesma unidade
  join public.seed_paciente p on p.seq = 401 + ((a.ordinal - 1) % 1600)
)
select
  c.*,
  cast(row_number() over (partition by c.unidade_id, c.data_fila
                          order by c.entrada_fila, c.id) as integer) as numero_senha,
  case when c.status = 'aguardando'
       then cast(row_number() over (partition by c.unidade_id, c.data_fila, c.status
                                    order by c.entrada_fila, c.id) as integer) end as posicao
from combinados c;

create index on public.seed_atendimento (consulta_id);

insert into public.atendimento (
  id, unidade_id, guiche_id, paciente_id, status, prioridade, posicao, data_fila, numero_senha, senha,
  encaminhar_para_consulta, proximo_profissional_id, tipo_consulta,
  entrada_fila, chamado_em, atendido_em, finalizado_em, created_at, updated_at
)
select
  id, unidade_id, guiche_id, paciente_id, status, prioridade, posicao, data_fila, numero_senha,
  upper(codigo) || '-' || lpad(numero_senha::text, 3, '0'),
  encaminhado, proximo_profissional_id, tipo_consulta,
  entrada_fila, chamado_em, atendido_em, finalizado_em,
  entrada_fila, coalesce(finalizado_em, chamado_em, entrada_fila)
from public.seed_atendimento;

create table public.seed_consulta as
with encaminhadas as materialized (
  select
    a.consulta_id as id,
    a.proximo_profissional_id as profissional_id,
    a.unidade_id,
    a.paciente_id,
    a.id as origem_atendimento_id,
    a.data_fila,
    a.tipo_consulta,
    a.finalizado_em as entrada_fila,
    a.prioridade,
    pr.duracao_media_minutos,
    random() as r_status,
    random() as r_espera,
    random() as r_dur
  from public.seed_atendimento a
  join public.profissional pr on pr.id = a.proximo_profissional_id
  where a.consulta_id is not null
),
dias as (
  select d::date as data_fila, (d::date > current_date) as futuro
    from generate_series(current_date - 90, current_date + 90, interval '1 day') as d
   where extract(isodow from d) between 1 and 5
     and d::date <> current_date
),
diretas_base as materialized (
  select
    gen_random_uuid() as id,
    l.profissional_id,
    l.unidade_id,
    d.data_fila,
    pr.duracao_media_minutos,
    s.seq,
    random() as r_status,
    random() as r_espera,
    random() as r_dur,
    random() as r_prio,
    random() as r_tipo,
    random() as r_pac
  from dias d
  join public.locacao l on l.ativa and l.deleted_at is null
  join public.profissional pr on pr.id = l.profissional_id and pr.deleted_at is null
  cross join lateral generate_series(1, 2 + floor(random() * 5)::int) as s(seq)
  where random() < 0.55
),
diretas as (
  select
    b.id,
    b.profissional_id,
    b.unidade_id,
    p.id as paciente_id,
    null::uuid as origem_atendimento_id,
    b.data_fila,
    (array['Primeira vez','Retorno','Avaliação'])[1 + floor(b.r_tipo * 3)::int] as tipo_consulta,
    (b.data_fila + time '08:00' + (b.seq * interval '25 minutes'))::timestamptz as entrada_fila,
    (case when b.r_prio < 0.12 then 'preferencial' else 'normal' end)::public.prioridade_fila as prioridade,
    b.duracao_media_minutos,
    b.r_status,
    b.r_espera,
    b.r_dur
  from diretas_base b
  join public.seed_paciente p on p.seq = 1 + floor(b.r_pac * 2000)::int
),
na_fila_base as materialized (
  select
    gen_random_uuid() as id,
    l.profissional_id,
    l.unidade_id,
    d.data_fila,
    pr.duracao_media_minutos,
    s.seq,
    random() as r_prio,
    random() as r_tipo,
    cast(row_number() over (partition by l.profissional_id order by d.data_fila, s.seq) as integer) as ordinal
  from dias d
  join public.locacao l on l.ativa and l.deleted_at is null
  join public.profissional pr on pr.id = l.profissional_id and pr.deleted_at is null
  cross join lateral generate_series(1, 2 + (extract(day from d.data_fila)::int % 3)) as s(seq)
  where d.futuro
),
na_fila as (
  select
    b.id,
    b.profissional_id,
    b.unidade_id,
    p.id as paciente_id,
    null::uuid as origem_atendimento_id,
    b.data_fila,
    (array['Primeira vez','Retorno','Avaliação'])[1 + floor(b.r_tipo * 3)::int] as tipo_consulta,
    (b.data_fila + time '13:00' + (b.seq * interval '20 minutes'))::timestamptz as entrada_fila,
    (case when b.r_prio < 0.12 then 'preferencial' else 'normal' end)::public.prioridade_fila as prioridade,
    b.duracao_media_minutos
  from na_fila_base b
  -- Faixa reservada: o índice único impede repetir o paciente na fila do mesmo profissional
  join public.seed_paciente p on p.seq = 401 + ((b.ordinal - 1) % 1600)
),
fontes as (
  select id, profissional_id, unidade_id, paciente_id, origem_atendimento_id, data_fila,
         tipo_consulta, entrada_fila, prioridade, duracao_media_minutos, r_status, r_espera, r_dur,
         false as na_fila
    from encaminhadas
  union all
  select id, profissional_id, unidade_id, paciente_id, origem_atendimento_id, data_fila,
         tipo_consulta, entrada_fila, prioridade, duracao_media_minutos, r_status, r_espera, r_dur,
         false
    from diretas
  union all
  select id, profissional_id, unidade_id, paciente_id, origem_atendimento_id, data_fila,
         tipo_consulta, entrada_fila, prioridade, duracao_media_minutos,
         0::double precision, 0::double precision, 0::double precision,
         true
    from na_fila
)
select
  f.id,
  f.profissional_id,
  f.unidade_id,
  f.paciente_id,
  f.origem_atendimento_id,
  f.data_fila,
  f.tipo_consulta,
  f.entrada_fila,
  f.prioridade,
  (case when f.na_fila then 'aguardando'
        when f.r_status < 0.88 then 'finalizado'
        when f.r_status < 0.94 then 'cancelado'
        else 'ausente' end)::public.status_fila as status,
  case when f.na_fila then null
       when f.r_status < 0.88 or f.r_status >= 0.94
       then f.entrada_fila + ((3 + f.r_espera * 25) * interval '1 minute') end as chamado_em,
  case when f.na_fila then null
       when f.r_status < 0.88
       then f.entrada_fila + ((4 + f.r_espera * 25) * interval '1 minute') end as atendido_em,
  case when f.na_fila then null
       when f.r_status < 0.88
       then f.entrada_fila + ((4 + f.r_espera * 25 + f.duracao_media_minutos * (0.6 + f.r_dur * 0.9)) * interval '1 minute')
       when f.r_status < 0.94
       then f.entrada_fila + ((6 + f.r_espera * 30) * interval '1 minute') end as finalizado_em,
  cast(row_number() over (partition by f.profissional_id, f.data_fila
                          order by f.entrada_fila, f.id) as integer) as numero_senha,
  case when f.na_fila
       then cast(row_number() over (partition by f.profissional_id, f.data_fila, f.na_fila
                                    order by f.entrada_fila, f.id) as integer) end as posicao
from fontes f;

insert into public.consulta (
  id, profissional_id, paciente_id, unidade_id, origem_atendimento_id, status, prioridade, posicao,
  data_fila, numero_senha, senha, tipo_consulta,
  entrada_fila, chamado_em, atendido_em, finalizado_em, created_at, updated_at
)
select
  c.id, c.profissional_id, c.paciente_id, c.unidade_id, c.origem_atendimento_id, c.status, c.prioridade, c.posicao,
  c.data_fila, c.numero_senha,
  upper(coalesce(pr.codigo, 'CON')) || '-' || lpad(c.numero_senha::text, 3, '0'),
  c.tipo_consulta,
  c.entrada_fila, c.chamado_em, c.atendido_em, c.finalizado_em,
  c.entrada_fila, coalesce(c.finalizado_em, c.chamado_em, c.entrada_fila)
from public.seed_consulta c
join public.profissional pr on pr.id = c.profissional_id;

update public.atendimento a
   set consulta_gerada_id = s.consulta_id
  from public.seed_atendimento s
 where s.id = a.id
   and s.consulta_id is not null;

-- -----------------------------------------------------------------------------
-- 5. Trilha de eventos do histórico
-- -----------------------------------------------------------------------------
insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_at)
select 'atendimento'::public.tipo_fila, a.id, a.clinica_id, a.unidade_id, null::public.status_fila, 'aguardando'::public.status_fila, false,
       jsonb_build_object('senha', upper(a.codigo) || '-' || lpad(a.numero_senha::text, 3, '0'), 'origem', 'seed'), a.entrada_fila
  from public.seed_atendimento a
union all
select 'atendimento'::public.tipo_fila, a.id, a.clinica_id, a.unidade_id, 'aguardando'::public.status_fila, 'chamado'::public.status_fila, false,
       jsonb_build_object('senha', upper(a.codigo) || '-' || lpad(a.numero_senha::text, 3, '0')), a.chamado_em
  from public.seed_atendimento a where a.chamado_em is not null
union all
select 'atendimento'::public.tipo_fila, a.id, a.clinica_id, a.unidade_id, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila, false,
       jsonb_build_object('senha', upper(a.codigo) || '-' || lpad(a.numero_senha::text, 3, '0')), a.atendido_em
  from public.seed_atendimento a where a.atendido_em is not null
union all
select 'atendimento'::public.tipo_fila, a.id, a.clinica_id, a.unidade_id, 'em_atendimento'::public.status_fila, 'finalizado'::public.status_fila, false,
       jsonb_build_object('senha', upper(a.codigo) || '-' || lpad(a.numero_senha::text, 3, '0'), 'encaminhado', a.encaminhado), a.finalizado_em
  from public.seed_atendimento a where a.status = 'finalizado'
union all
select 'atendimento'::public.tipo_fila, a.id, a.clinica_id, a.unidade_id, 'aguardando'::public.status_fila, 'cancelado'::public.status_fila, false,
       jsonb_build_object('senha', upper(a.codigo) || '-' || lpad(a.numero_senha::text, 3, '0')), a.finalizado_em
  from public.seed_atendimento a where a.status = 'cancelado'
union all
select 'atendimento'::public.tipo_fila, a.id, a.clinica_id, a.unidade_id, 'chamado'::public.status_fila, 'ausente'::public.status_fila, false,
       jsonb_build_object('senha', upper(a.codigo) || '-' || lpad(a.numero_senha::text, 3, '0')), a.chamado_em + interval '3 minutes'
  from public.seed_atendimento a where a.status = 'ausente';

insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_at)
select 'consulta'::public.tipo_fila, c.id, u.clinica_id, c.unidade_id, null::public.status_fila, 'aguardando'::public.status_fila, c.origem_atendimento_id is not null,
       jsonb_build_object('origem_atendimento_id', c.origem_atendimento_id), c.entrada_fila
  from public.seed_consulta c join public.unidade u on u.id = c.unidade_id
union all
select 'consulta'::public.tipo_fila, c.id, u.clinica_id, c.unidade_id, 'aguardando'::public.status_fila, 'chamado'::public.status_fila, false, '{}'::jsonb, c.chamado_em
  from public.seed_consulta c join public.unidade u on u.id = c.unidade_id where c.chamado_em is not null
union all
select 'consulta'::public.tipo_fila, c.id, u.clinica_id, c.unidade_id, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila, false, '{}'::jsonb, c.atendido_em
  from public.seed_consulta c join public.unidade u on u.id = c.unidade_id where c.atendido_em is not null
union all
select 'consulta'::public.tipo_fila, c.id, u.clinica_id, c.unidade_id, 'em_atendimento'::public.status_fila, 'finalizado'::public.status_fila, false, '{}'::jsonb, c.finalizado_em
  from public.seed_consulta c join public.unidade u on u.id = c.unidade_id where c.status = 'finalizado'
union all
select 'consulta'::public.tipo_fila, c.id, u.clinica_id, c.unidade_id, 'aguardando'::public.status_fila, 'cancelado'::public.status_fila, false, '{}'::jsonb, c.finalizado_em
  from public.seed_consulta c join public.unidade u on u.id = c.unidade_id where c.status = 'cancelado'
union all
select 'consulta'::public.tipo_fila, c.id, u.clinica_id, c.unidade_id, 'chamado'::public.status_fila, 'ausente'::public.status_fila, false, '{}'::jsonb, c.chamado_em + interval '3 minutes'
  from public.seed_consulta c join public.unidade u on u.id = c.unidade_id where c.status = 'ausente';

alter table public.atendimento enable trigger user;
alter table public.consulta    enable trigger user;
alter table public.fila_evento enable trigger user;

-- -----------------------------------------------------------------------------
-- 6. Filas do dia corrente pelo caminho real da aplicação
--    (RPCs públicas, senhas, posições, máquina de estados e encaminhamento)
-- -----------------------------------------------------------------------------

do $$
declare
  un       record;
  g        record;
  p        record;
  loc      record;
  prof     record;
  v_id     uuid;
  i        integer;
begin
  -- Pacientes entram na fila compartilhada de cada unidade pela rota pública
  for un in
    select id from public.unidade
     where ativa and deleted_at is null order by nome
  loop
    for p in
      select pa.nome, pa.telefone
        from public.paciente pa
        join public.seed_paciente sp on sp.id = pa.id
       where sp.seq <= 400
       order by md5(pa.telefone || un.id::text)
       limit 26
    loop
      perform public.fn_entrar_fila_atendimento(
        un.id, p.nome, p.telefone, null,
        (case when random() < 0.15 then 'preferencial' else 'normal' end)::public.prioridade_fila
      );
    end loop;
  end loop;

  -- Cada guichê consome a fila da sua unidade: quem fica livre chama o próximo
  for g in
    select id from public.guiche where ativo and deleted_at is null order by codigo
  loop
    -- dois atendimentos concluídos: disparam o encaminhamento automático para a consulta
    for i in 1..2 loop
      select id into v_id from public.fn_chamar_proximo_atendimento(g.id);
      if v_id is not null then
        update public.atendimento set status = 'em_atendimento' where id = v_id;
        perform public.fn_finalizar_atendimento(v_id, null, null, null);
      end if;
    end loop;

    -- um paciente chamado que não compareceu
    select id into v_id from public.fn_chamar_proximo_atendimento(g.id);
    if v_id is not null then
      update public.atendimento set status = 'ausente' where id = v_id;
    end if;

    -- um paciente em atendimento neste momento
    select id into v_id from public.fn_chamar_proximo_atendimento(g.id);
    if v_id is not null then
      update public.atendimento set status = 'em_atendimento' where id = v_id;
    end if;
  end loop;

  -- Um cancelamento por unidade, feito pelo próprio paciente
  for un in
    select id from public.unidade where ativa and deleted_at is null
  loop
    select a.id into v_id
      from public.atendimento a
     where a.unidade_id = un.id and a.data_fila = current_date and a.status = 'aguardando'
     order by a.entrada_fila desc
     limit 1;
    if v_id is not null then
      perform public.fn_cancelar_ticket(v_id);
    end if;
  end loop;

  -- Entradas diretas nas filas de consulta
  for loc in
    select l.profissional_id, l.unidade_id
      from public.locacao l
      join public.profissional pr on pr.id = l.profissional_id
     where l.ativa and l.deleted_at is null and pr.ativo and pr.deleted_at is null
  loop
    for p in
      select pa.nome, pa.telefone
        from public.paciente pa
        join public.seed_paciente sp on sp.id = pa.id
       where sp.seq <= 400
       order by md5(pa.telefone || loc.profissional_id::text || loc.unidade_id::text)
       limit 5
    loop
      perform public.fn_entrar_fila_consulta(
        loc.profissional_id, loc.unidade_id, p.nome, p.telefone, null,
        (array['Primeira vez','Retorno','Avaliação'])[1 + floor(random() * 3)::int],
        (case when random() < 0.12 then 'preferencial' else 'normal' end)::public.prioridade_fila
      );
    end loop;
  end loop;

  -- Os profissionais avançam suas próprias filas
  for prof in
    select distinct profissional_id from public.consulta where data_fila = current_date
  loop
    for i in 1..2 loop
      select id into v_id from public.fn_chamar_proximo_consulta(prof.profissional_id);
      if v_id is not null then
        update public.consulta set status = 'em_atendimento' where id = v_id;
        if random() < 0.65 then
          update public.consulta set status = 'finalizado' where id = v_id;
        end if;
      end if;
    end loop;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Cenários de auditoria: desativação de guichê, desligamento e locação encerrada
-- -----------------------------------------------------------------------------
-- Guichê desativado: a fila da unidade continua, os demais guichês absorvem
update public.guiche
   set deleted_at = now(), ativo = false
 where id = 'd0000000-0000-4000-8000-000000000009';

update public.consulta
   set status = 'cancelado'
 where profissional_id = 'c0000000-0000-4000-8000-000000000011'
   and data_fila = current_date
   and status in ('aguardando', 'chamado');

update public.profissional
   set deleted_at = now(), ativo = false
 where id = 'c0000000-0000-4000-8000-000000000011';

update public.locacao
   set ativa = false, data_fim = current_date - 10
 where unidade_id = 'b0000000-0000-4000-8000-000000000002'
   and profissional_id = 'c0000000-0000-4000-8000-000000000008';

-- -----------------------------------------------------------------------------
-- 8. Encerramento
-- -----------------------------------------------------------------------------
drop table public.seed_usuario;
drop table public.seed_paciente;
drop table public.seed_atendimento;
drop table public.seed_consulta;

do $$
declare
  v_pacientes    bigint;
  v_atendimentos bigint;
  v_consultas    bigint;
  v_encaminhadas bigint;
  v_eventos      bigint;
  v_hoje         bigint;
  v_futuros      bigint;
  v_futuros_fila bigint;
  v_ultimo_dia   date;
begin
  select count(*) into v_pacientes    from public.paciente where telefone like '8799%';
  select count(*) into v_atendimentos from public.atendimento;
  select count(*) into v_consultas    from public.consulta;
  select count(*) into v_encaminhadas from public.consulta where origem_atendimento_id is not null;
  select count(*) into v_eventos      from public.fila_evento;
  select count(*) into v_hoje         from public.atendimento where data_fila = current_date;
  select count(*) into v_futuros      from public.atendimento where data_fila > current_date;
  select count(*) into v_futuros_fila from public.atendimento
   where data_fila > current_date and status = 'aguardando';
  select max(data_fila) into v_ultimo_dia from public.atendimento;

  raise notice 'Seed concluído: % pacientes, % atendimentos, % consultas (% encaminhadas automaticamente), % eventos de fila.',
    v_pacientes, v_atendimentos, v_consultas, v_encaminhadas, v_eventos;
  raise notice 'Fila de hoje: % tickets. Dias futuros: % tickets, sendo % ainda na fila. Último dia com dados: %.',
    v_hoje, v_futuros, v_futuros_fila, v_ultimo_dia;
end;
$$;
