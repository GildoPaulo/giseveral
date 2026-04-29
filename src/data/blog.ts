import antivirus from "@/assets/blog-antivirus.jpg";
import printingImg from "@/assets/blog-printing.jpg";
import performance from "@/assets/blog-performance.jpg";
import wifi from "@/assets/blog-wifi.jpg";
import printerChoice from "@/assets/blog-printer-choice.jpg";
import backup from "@/assets/blog-backup.jpg";
import passwords from "@/assets/blog-passwords.jpg";
import stationery from "@/assets/blog-stationery.jpg";
import format from "@/assets/blog-format.jpg";
import cabling from "@/assets/blog-cabling.jpg";

export type BlogCategory = "Informática" | "Impressão" | "Redes" | "Dicas";

export type BlogPost = {
  slug: string;
  title: string;
  date: string; // ISO
  category: BlogCategory;
  image: string;
  excerpt: string;
  content: { heading?: string; paragraphs: string[] }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "como-proteger-o-seu-computador-contra-virus",
    title: "Como proteger o seu computador contra vírus",
    date: "2026-04-22",
    category: "Informática",
    image: antivirus,
    excerpt:
      "Dicas práticas para manter o seu PC seguro contra vírus, malware e ataques que comprometem os seus ficheiros.",
    content: [
      {
        paragraphs: [
          "Os vírus de computador continuam a ser uma das principais causas de perda de dados, lentidão e falhas no sistema. A boa notícia é que a maioria das infeções pode ser evitada com hábitos simples e ferramentas adequadas.",
        ],
      },
      {
        heading: "1. Use sempre um antivírus atualizado",
        paragraphs: [
          "Instale um antivírus confiável e mantenha-o atualizado. Mesmo as opções gratuitas, como o Windows Defender, oferecem proteção sólida quando estão sempre atualizadas.",
        ],
      },
      {
        heading: "2. Atualize o sistema operativo",
        paragraphs: [
          "As atualizações do Windows corrigem falhas de segurança que os vírus exploram. Configure as atualizações automáticas e reinicie o computador quando solicitado.",
        ],
      },
      {
        heading: "3. Cuidado com pendrives e downloads",
        paragraphs: [
          "Não abra ficheiros de origem desconhecida e analise sempre as pendrives antes de usar. Evite descarregar programas de sites duvidosos.",
        ],
      },
      {
        heading: "4. Faça cópias de segurança regulares",
        paragraphs: [
          "Mesmo com toda a proteção, mantenha backups dos seus documentos importantes num disco externo ou na nuvem. Em caso de infeção, recupera tudo sem stress.",
        ],
      },
      {
        paragraphs: [
          "Se o seu computador já apresenta lentidão ou comportamentos estranhos, a Giseveral e Services faz limpeza completa, remoção de vírus e otimização. Fale connosco pelo WhatsApp 874 383 621.",
        ],
      },
    ],
  },
  {
    slug: "diferenca-entre-impressao-a-cores-e-preto-e-branco",
    title: "Diferença entre impressão a cores e preto e branco",
    date: "2026-04-18",
    category: "Impressão",
    image: printingImg,
    excerpt:
      "Quando vale a pena imprimir a cores e quando o preto e branco é a melhor escolha — em qualidade e custo.",
    content: [
      {
        paragraphs: [
          "Escolher entre impressão a cores e preto e branco vai muito além da estética. Cada opção tem vantagens diferentes em termos de custo, durabilidade e finalidade do documento.",
        ],
      },
      {
        heading: "Impressão a preto e branco",
        paragraphs: [
          "É a opção mais económica e rápida, ideal para documentos de texto, relatórios internos, apontamentos escolares e fotocópias de identificação. Usa apenas tinta ou toner preto, o que reduz o custo por página.",
        ],
      },
      {
        heading: "Impressão a cores",
        paragraphs: [
          "Recomendada para apresentações, brochuras, cartazes, gráficos e materiais de marketing. As cores ajudam a destacar informação importante e tornam o documento mais atrativo e profissional.",
        ],
      },
      {
        heading: "Qual escolher?",
        paragraphs: [
          "Para uso interno do dia a dia, prefira preto e branco. Para imagem de marca, vendas ou trabalhos académicos com gráficos, escolha cores. Na Giseveral oferecemos as duas opções com excelente qualidade e preços acessíveis.",
        ],
      },
    ],
  },
  {
    slug: "como-melhorar-o-desempenho-do-pc",
    title: "Como melhorar o desempenho do PC",
    date: "2026-04-12",
    category: "Dicas",
    image: performance,
    excerpt:
      "Passos simples para deixar o seu computador mais rápido sem precisar comprar um novo.",
    content: [
      {
        paragraphs: [
          "Se o seu PC ficou lento, antes de pensar em comprar outro, vale a pena tentar otimizá-lo. Pequenas mudanças podem dar uma sensação de equipamento novo.",
        ],
      },
      {
        heading: "1. Liberte espaço no disco",
        paragraphs: [
          "Apague ficheiros temporários, desinstale programas que não usa e esvazie a reciclagem. Um disco quase cheio reduz drasticamente a velocidade do sistema.",
        ],
      },
      {
        heading: "2. Reduza programas a iniciar com o Windows",
        paragraphs: [
          "Vá ao Gestor de Tarefas → Arranque e desative programas desnecessários. O computador arranca mais rápido e fica mais leve.",
        ],
      },
      {
        heading: "3. Mantenha o sistema atualizado",
        paragraphs: [
          "Atualizações do Windows e drivers melhoram desempenho e corrigem bugs.",
        ],
      },
      {
        heading: "4. Considere um SSD",
        paragraphs: [
          "Substituir o disco mecânico por um SSD é a melhoria mais significativa que pode fazer num computador antigo. A inicialização passa de minutos para segundos.",
        ],
      },
      {
        paragraphs: [
          "Quer otimizar o seu PC com a ajuda de um profissional? A Giseveral faz manutenção completa, formatação e upgrade de hardware.",
        ],
      },
    ],
  },
  {
    slug: "dicas-para-redes-wifi-mais-rapidas",
    title: "Dicas para redes Wi-Fi mais rápidas",
    date: "2026-04-05",
    category: "Redes",
    image: wifi,
    excerpt:
      "Pequenos ajustes que fazem grande diferença na velocidade e estabilidade da sua ligação Wi-Fi.",
    content: [
      {
        paragraphs: [
          "Uma rede Wi-Fi lenta pode arruinar o trabalho, os estudos e o lazer. Antes de mudar de operadora, experimente estas dicas para tirar o máximo do seu router.",
        ],
      },
      {
        heading: "1. Posicione bem o router",
        paragraphs: [
          "Coloque-o num local central da casa ou escritório, elevado e longe de paredes grossas, microondas e outros aparelhos eletrónicos.",
        ],
      },
      {
        heading: "2. Mude o canal Wi-Fi",
        paragraphs: [
          "Em zonas com muitos vizinhos, vários routers usam o mesmo canal e causam interferência. Aceda às definições do router e teste outros canais.",
        ],
      },
      {
        heading: "3. Use a banda 5 GHz",
        paragraphs: [
          "Se o seu router for dual-band, ligue os dispositivos mais exigentes (TV, computador, consola) à rede 5 GHz, que é mais rápida e menos congestionada.",
        ],
      },
      {
        heading: "4. Reinicie o router periodicamente",
        paragraphs: [
          "Um simples reboot resolve muitos problemas de lentidão acumulada.",
        ],
      },
      {
        paragraphs: [
          "Para uma rede verdadeiramente rápida e estável, a Giseveral faz instalação e configuração profissional de Wi-Fi, routers e cabeamento.",
        ],
      },
    ],
  },
  {
    slug: "como-escolher-a-impressora-ideal",
    title: "Como escolher a impressora ideal para casa ou escritório",
    date: "2026-03-28",
    category: "Impressão",
    image: printerChoice,
    excerpt:
      "Jato de tinta ou laser? Cores ou monocromática? Veja como escolher a impressora certa para o seu uso.",
    content: [
      {
        paragraphs: [
          "Comprar uma impressora sem perceber as diferenças entre tecnologias pode sair caro a longo prazo. Antes de decidir, pense no volume de impressão, no tipo de documentos e no orçamento para consumíveis.",
        ],
      },
      {
        heading: "Jato de tinta vs Laser",
        paragraphs: [
          "Impressoras a jato de tinta são mais baratas inicialmente e excelentes para fotografias, mas o custo por página é mais elevado. As impressoras laser custam mais, mas imprimem muito mais páginas por toner — ideais para escritórios.",
        ],
      },
      {
        heading: "Volume mensal",
        paragraphs: [
          "Para menos de 100 páginas/mês, qualquer modelo serve. Acima disso, prefira laser. Acima de 1000 páginas/mês, considere modelos profissionais com tanque de tinta (EcoTank) ou laser de alta capacidade.",
        ],
      },
      {
        heading: "Multifuncional ou só impressora?",
        paragraphs: [
          "Se precisa de digitalizar e fotocopiar, escolha uma multifuncional. O custo é semelhante e poupa espaço.",
        ],
      },
      {
        paragraphs: [
          "Na Giseveral aconselhamos sobre a melhor escolha e fazemos manutenção e recarga de toners. Fale connosco pelo WhatsApp 874 383 621.",
        ],
      },
    ],
  },
  {
    slug: "importancia-do-backup-de-dados",
    title: "A importância do backup dos seus dados",
    date: "2026-03-20",
    category: "Dicas",
    image: backup,
    excerpt:
      "Perder fotos, documentos e ficheiros de trabalho é mais comum do que pensa. Saiba como se proteger.",
    content: [
      {
        paragraphs: [
          "Discos avariam, telemóveis caem, vírus apagam ficheiros. Sem cópia de segurança, anos de trabalho podem desaparecer em segundos. O backup é o seguro mais barato que pode ter.",
        ],
      },
      {
        heading: "A regra 3-2-1",
        paragraphs: [
          "Mantenha 3 cópias dos dados importantes, em 2 tipos de armazenamento diferentes (disco interno + externo, por exemplo), com 1 cópia fora de casa (nuvem ou outro local).",
        ],
      },
      {
        heading: "Opções de backup",
        paragraphs: [
          "Disco externo USB: barato e simples para fotos e documentos. Pen drive: bom para ficheiros pontuais. Nuvem (Google Drive, OneDrive, Dropbox): acessível em qualquer lugar e protege contra problemas físicos.",
        ],
      },
      {
        heading: "Frequência",
        paragraphs: [
          "Backups semanais para dados pessoais e diários para empresas. Automatize sempre que possível para não depender da memória.",
        ],
      },
      {
        paragraphs: [
          "A Giseveral configura sistemas de backup automático para empresas e particulares. Garantimos que os seus ficheiros estão sempre protegidos.",
        ],
      },
    ],
  },
  {
    slug: "como-criar-passwords-seguras",
    title: "Como criar passwords seguras e fáceis de lembrar",
    date: "2026-03-12",
    category: "Informática",
    image: passwords,
    excerpt:
      "Passwords fracas são a porta de entrada para hackers. Aprenda a criar senhas fortes sem complicar.",
    content: [
      {
        paragraphs: [
          "A maior parte dos ataques a contas online acontece porque as passwords são demasiado simples ou repetidas em vários sites. Uma boa password protege e-mails, redes sociais, banco e ficheiros profissionais.",
        ],
      },
      {
        heading: "Características de uma boa password",
        paragraphs: [
          "Tem pelo menos 12 caracteres, mistura letras maiúsculas, minúsculas, números e símbolos, e não usa informações pessoais óbvias como datas de nascimento ou nomes de familiares.",
        ],
      },
      {
        heading: "Truque das frases",
        paragraphs: [
          "Em vez de palavras, use frases longas como \"AdoroCafé@Manhã2026!\" — fáceis de lembrar e muito difíceis de quebrar.",
        ],
      },
      {
        heading: "Use um gestor de passwords",
        paragraphs: [
          "Aplicações como Bitwarden ou o gestor do Google guardam todas as suas passwords de forma segura. Só precisa lembrar uma master password.",
        ],
      },
      {
        heading: "Ative a verificação em 2 passos",
        paragraphs: [
          "Mesmo que descubram a sua password, sem o código no telemóvel não conseguem entrar. Ative em todas as contas importantes.",
        ],
      },
    ],
  },
  {
    slug: "material-escolar-essencial",
    title: "Material escolar essencial para um bom ano letivo",
    date: "2026-03-05",
    category: "Dicas",
    image: stationery,
    excerpt:
      "Lista prática do material escolar e de escritório que faz a diferença no estudo e na produtividade.",
    content: [
      {
        paragraphs: [
          "Começar o ano letivo bem equipado faz toda a diferença na organização e no rendimento. Eis uma lista do essencial — sem exageros, mas sem falhas.",
        ],
      },
      {
        heading: "Cadernos e papel",
        paragraphs: [
          "Cadernos A4 pautados ou quadriculados consoante a disciplina. Um caderno de argolas com separadores ajuda a manter a matéria organizada por temas.",
        ],
      },
      {
        heading: "Escrita",
        paragraphs: [
          "Esferográficas azul, preta e vermelha; lápis HB, borracha e afia; marcadores fluorescentes para destacar matéria importante.",
        ],
      },
      {
        heading: "Organização",
        paragraphs: [
          "Mochila resistente, agenda escolar, dossiers e micas plásticas para guardar trabalhos e fichas sem dobrar.",
        ],
      },
      {
        heading: "Material extra",
        paragraphs: [
          "Calculadora científica, régua, esquadro, transferidor e compasso para Matemática e disciplinas técnicas.",
        ],
      },
      {
        paragraphs: [
          "Na papelaria da Giseveral encontra todo o material escolar e de escritório a preços acessíveis. Visite-nos na Beira ou ligue 874 383 621.",
        ],
      },
    ],
  },
  {
    slug: "quando-formatar-o-computador",
    title: "Quando formatar o computador é a melhor solução?",
    date: "2026-02-25",
    category: "Informática",
    image: format,
    excerpt:
      "Formatar não é sempre necessário. Saiba reconhecer os sinais de que o seu PC precisa de uma reinstalação.",
    content: [
      {
        paragraphs: [
          "Formatar e reinstalar o sistema operativo dá ao computador uma sensação de novo, mas envolve apagar tudo. Antes de avançar, vale a pena perceber se é mesmo necessário.",
        ],
      },
      {
        heading: "Sinais claros de que precisa de formatar",
        paragraphs: [
          "O sistema arranca cada vez mais devagar mesmo após limpezas; vírus persistentes que o antivírus não consegue remover; erros frequentes do Windows; muitos programas instalados ao longo dos anos a causar conflitos.",
        ],
      },
      {
        heading: "O que tentar antes",
        paragraphs: [
          "Limpeza de ficheiros temporários, desinstalação de programas inúteis, análise antivírus completa e reset de fábrica do Windows (mantém ficheiros). Se nada resolve, formatar é a melhor opção.",
        ],
      },
      {
        heading: "Antes de formatar",
        paragraphs: [
          "Faça backup completo de fotos, documentos, e-mails e licenças de software. Anote as palavras-passe guardadas no browser e tenha o instalador do Windows e drivers prontos.",
        ],
      },
      {
        paragraphs: [
          "A Giseveral faz formatação completa, instalação do Windows original, drivers, programas essenciais e antivírus. Tudo num só dia, com backup dos seus ficheiros incluído.",
        ],
      },
    ],
  },
  {
    slug: "cabeamento-estruturado-para-empresas",
    title: "Porque o cabeamento estruturado é essencial para empresas",
    date: "2026-02-18",
    category: "Redes",
    image: cabling,
    excerpt:
      "Wi-Fi não chega para empresas. Veja porque o cabeamento estruturado é mais rápido, seguro e fiável.",
    content: [
      {
        paragraphs: [
          "Empresas que dependem de internet para trabalhar não podem confiar apenas no Wi-Fi. O cabeamento estruturado garante velocidade máxima, estabilidade e segurança em todos os postos de trabalho.",
        ],
      },
      {
        heading: "Vantagens face ao Wi-Fi",
        paragraphs: [
          "Velocidade real e constante, sem quebras nem interferências. Maior segurança, pois o sinal não sai do edifício. Suporta mais utilizadores em simultâneo sem perder desempenho.",
        ],
      },
      {
        heading: "O que inclui",
        paragraphs: [
          "Cabos UTP categoria 6 ou superior, tomadas RJ45 nos postos de trabalho, switch central, patch panel e bastidor organizados num rack profissional.",
        ],
      },
      {
        heading: "Para quem é indicado",
        paragraphs: [
          "Escritórios, lojas, escolas, clínicas e qualquer espaço com mais de 5 computadores ligados em rede. Também para empresas que usam impressoras de rede, câmaras IP ou servidores locais.",
        ],
      },
      {
        paragraphs: [
          "A Giseveral projeta e instala redes estruturadas chave-na-mão na Beira e arredores. Peça um orçamento gratuito pelo WhatsApp 874 383 621.",
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export function formatPtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
}
