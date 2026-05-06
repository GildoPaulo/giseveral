-- ── Newsletter subscribers ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        UNIQUE NOT NULL,
  source        TEXT        NOT NULL DEFAULT 'footer',
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_insert_anyone"
  ON newsletter_subscribers FOR INSERT WITH CHECK (true);

CREATE POLICY "newsletter_select_staff"
  ON newsletter_subscribers FOR SELECT USING (is_staff());

-- ── Hub Scholarships ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_scholarships (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL,
  country       TEXT        NOT NULL,
  flag          TEXT        NOT NULL DEFAULT '',
  level         TEXT        NOT NULL,
  area          TEXT        NOT NULL,
  coverage      TEXT        NOT NULL,
  language      TEXT        NOT NULL,
  deadline      DATE        NOT NULL,
  institution   TEXT        NOT NULL,
  description   TEXT,
  apply_url     TEXT        NOT NULL,
  benefits      TEXT[]      NOT NULL DEFAULT '{}',
  requirements  TEXT[]      NOT NULL DEFAULT '{}',
  process_steps TEXT[]      NOT NULL DEFAULT '{}',
  documents     TEXT[]      NOT NULL DEFAULT '{}',
  tips          TEXT[]      NOT NULL DEFAULT '{}',
  featured      BOOLEAN     NOT NULL DEFAULT false,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hub_scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scholarships_public_read"
  ON hub_scholarships FOR SELECT USING (active = true);

CREATE POLICY "scholarships_staff_all"
  ON hub_scholarships FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- ── Seed scholarships ─────────────────────────────────────────────────────────

INSERT INTO hub_scholarships (id, title, country, flag, level, area, coverage, language, deadline, institution, description, apply_url, benefits, requirements, process_steps, documents, tips, featured) VALUES

('chevening-2026', 'Bolsa Chevening 2026 — Reino Unido', 'Reino Unido', '🇬🇧', 'Mestrado', 'Várias áreas', 'Total', 'Inglês', '2026-11-05', 'Governo do Reino Unido',
 'A Chevening é a bolsa internacional emblemática do Reino Unido, financiada pelo Foreign, Commonwealth & Development Office. Cobre um mestrado completo (1 ano) em qualquer universidade britânica, incluindo propinas, voos, alojamento, seguro e subsídio mensal. É altamente competitiva e procura líderes emergentes com forte impacto comunitário.',
 'https://www.chevening.org/',
 ARRAY['Propinas pagas', 'Subsídio mensal', 'Voos ida e volta', 'Seguro médico'],
 ARRAY['Licenciatura concluída', '2 anos de experiência', 'IELTS / TOEFL'],
 ARRAY['Crie conta no portal oficial Chevening em Agosto', 'Escolha 3 cursos de mestrado em universidades do Reino Unido', 'Complete os 4 ensaios (liderança, networking, estudos, carreira)', 'Submeta candidatura até início de Novembro', 'Entrevista (Fev–Abr) na Embaixada Britânica em Maputo', 'Receba carta de aceitação até Junho e parta em Setembro'],
 ARRAY['Passaporte válido', 'Transcripts da licenciatura', '2 cartas de recomendação', 'Carta de aceitação condicional', 'Certificado IELTS/TOEFL'],
 ARRAY['Comece os ensaios 2 meses antes do prazo', 'Mostre liderança concreta com números e impacto', 'Escolha universidades realistas e diversificadas'],
 true),

('daad-2026', 'DAAD — Bolsas para Estudantes Africanos', 'Alemanha', '🇩🇪', 'Mestrado', 'Engenharia, Ciências, Economia', 'Total', 'Inglês / Alemão', '2026-09-30', 'DAAD — Alemanha',
 'O DAAD oferece bolsas integrais para estudantes de países em desenvolvimento, com foco em programas de mestrado relacionados ao desenvolvimento. Estuda numa universidade alemã de topo com subsídio mensal, propinas pagas e seguro completo.',
 'https://www.daad.de/',
 ARRAY['850€/mês', 'Propinas', 'Seguro saúde', 'Subsídio de viagem'],
 ARRAY['Licenciatura', 'Experiência profissional de 2 anos'],
 ARRAY['Escolha um curso na lista DAAD de programas elegíveis', 'Candidate-se directamente ao programa escolhido', 'Submeta documentos via portal do DAAD', 'Entrevista em Setembro/Outubro', 'Resultado em Janeiro/Fevereiro'],
 ARRAY['CV em formato europeu', 'Carta de motivação', '2 referências académicas', 'Comprovativo de inglês/alemão', 'Certificado de licenciatura'],
 ARRAY['Realce a relevância do curso para o desenvolvimento de Moçambique', 'Procure programas com foco africano'],
 true),

('erasmus-mundus-2026', 'Erasmus Mundus Joint Masters', 'União Europeia', '🇪🇺', 'Mestrado', 'Várias áreas', 'Total', 'Inglês', '2026-02-15', 'Comissão Europeia',
 'Os Erasmus Mundus Joint Masters decorrem em pelo menos duas universidades europeias. A bolsa cobre propinas, viagens, instalação e subsídio mensal generoso. Receberá um diploma conjunto reconhecido em toda a Europa.',
 'https://www.eacea.ec.europa.eu/',
 ARRAY['1400€/mês', 'Propinas pagas', 'Estudo em 2-3 países', 'Seguro completo'],
 ARRAY['Licenciatura', 'Inglês fluente'],
 ARRAY['Pesquise programas EMJM no catálogo oficial', 'Candidate-se directamente ao consórcio do programa', 'Cada programa tem prazo próprio (Nov–Fev)', 'Resultados entre Abril e Maio'],
 ARRAY['Transcripts oficiais', 'Carta de motivação por programa', '2 cartas de recomendação', 'Certificado de inglês'],
 ARRAY['Pode candidatar-se a até 3 programas EMJM', 'Personalize a carta de motivação para cada consórcio'],
 true),

('fulbright-2026', 'Fulbright — Estudo nos EUA', 'Estados Unidos', '🇺🇸', 'Mestrado', 'Várias áreas', 'Total', 'Inglês', '2026-05-15', 'Governo dos EUA',
 'O Programa Fulbright cobre mestrado ou doutoramento em qualquer universidade norte-americana, com forte componente de intercâmbio cultural.',
 'https://foreign.fulbrightonline.org/',
 ARRAY['Propinas', 'Subsídio mensal', 'Seguro de saúde', 'Voos pagos'],
 ARRAY['Licenciatura', 'TOEFL/IELTS', 'Forte plano académico'],
 ARRAY['Candidate-se via Embaixada dos EUA em Maputo', 'Submeta projecto académico detalhado', 'Entrevista entre Junho e Agosto', 'Resultado e atribuição de universidade até Março seguinte'],
 ARRAY['TOEFL ou IELTS', 'GRE (alguns cursos)', '3 cartas de recomendação', 'Plano de estudo de 2 páginas', 'Currículo académico'],
 ARRAY['Demonstre intenção clara de regressar a Moçambique', 'Foque-se em projectos com impacto bilateral'],
 true),

('mext-japao', 'MEXT — Bolsa do Governo Japonês', 'Japão', '🇯🇵', 'Licenciatura', 'Várias áreas', 'Total', 'Japonês / Inglês', '2026-06-30', 'MEXT — Japão',
 'A bolsa MEXT cobre licenciatura completa numa universidade japonesa, incluindo um ano preparatório de japonês, alojamento subsidiado e subsídio mensal.',
 'https://www.studyinjapan.go.jp/',
 ARRAY['117 000 ¥/mês', 'Propinas pagas', 'Voo de ida e volta', 'Curso de japonês'],
 ARRAY['Ensino secundário concluído', 'Idade até 24'],
 ARRAY['Candidate-se via Embaixada do Japão em Maputo', 'Exame escrito (Inglês, Matemática, Ciências)', 'Entrevista em Julho/Agosto', 'Partida em Abril do ano seguinte'],
 ARRAY['Certificado do 12.º ano', 'Notas detalhadas', 'Atestado médico', 'Carta de motivação'],
 ARRAY['Estude japonês básico antes — dá vantagem na entrevista', 'Boas notas em ciências fazem diferença'],
 false),

('csc-china', 'Chinese Government Scholarship (CSC)', 'China', '🇨🇳', 'Mestrado', 'Engenharia, Medicina, TI', 'Total', 'Chinês / Inglês', '2026-04-30', 'Governo da China',
 'A CSC cobre mestrado ou doutoramento em mais de 280 universidades chinesas, com programas em inglês ou chinês.',
 'https://www.campuschina.org/',
 ARRAY['Propinas', 'Alojamento', 'Subsídio mensal', 'Seguro médico'],
 ARRAY['Licenciatura', 'Carta de recomendação'],
 ARRAY['Escolha universidade e programa no portal CSC', 'Candidate-se via Embaixada da China ou universidade', 'Submeta antes do final de Abril', 'Resultado em Julho'],
 ARRAY['Plano de estudo', 'Carta de aceitação da universidade', '2 referências', 'Atestado médico'],
 ARRAY['Contacte a universidade primeiro — facilita a aprovação', 'Programas em inglês são muito procurados'],
 false),

('calmette-portugal', 'Bolsas Camões — Estudar em Portugal', 'Portugal', '🇵🇹', 'Licenciatura', 'Várias áreas', 'Parcial', 'Português', '2026-07-31', 'Instituto Camões',
 'As Bolsas Camões apoiam estudantes dos PALOP a estudar em universidades portuguesas com propinas reduzidas e apoio à integração.',
 'https://www.instituto-camoes.pt/',
 ARRAY['Propinas reduzidas', 'Subsídio mensal', 'Apoio à integração'],
 ARRAY['Ensino secundário', 'Nacionalidade PALOP'],
 ARRAY['Candidate-se à universidade portuguesa pretendida', 'Submeta candidatura à bolsa Camões em paralelo', 'Entrega de documentação até Julho', 'Resultado em Agosto/Setembro'],
 ARRAY['Certificado do 12.º ano', 'Carta de aceitação da universidade', 'Comprovativo de rendimentos da família'],
 ARRAY['Combine com bolsas das próprias universidades portuguesas', 'Trate cedo do visto de estudante'],
 false),

('mandela-rhodes', 'Mandela Rhodes Scholarship', 'África do Sul', '🇿🇦', 'Mestrado', 'Liderança e várias áreas', 'Total', 'Inglês', '2026-04-30', 'Mandela Rhodes Foundation',
 'Inspirada no legado de Nelson Mandela, esta bolsa cobre mestrado em qualquer universidade sul-africana, com componente forte de liderança e empreendedorismo.',
 'https://www.mandelarhodes.org/',
 ARRAY['Propinas', 'Alojamento', 'Subsídio', 'Programa de liderança'],
 ARRAY['Idade até 30', 'Liderança comprovada'],
 ARRAY['Submeta candidatura online até final de Abril', 'Avaliação por painel africano', 'Entrevistas regionais (Maputo possível)', 'Resultado em Setembro'],
 ARRAY['CV', 'Ensaios sobre liderança', '3 referências', 'Plano académico'],
 ARRAY['Conte uma história autêntica de liderança', 'Evite clichés — seja específico'],
 false)

ON CONFLICT (id) DO NOTHING;
