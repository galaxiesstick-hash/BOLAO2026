import { PrismaClient, MatchPhase } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FLAG = (code: string) => `https://flagcdn.com/w80/${code}.png`;

// Copa do Mundo 2026 — Fase de Grupos
// 48 seleções, 12 grupos (A-L), 3 jogos por grupo = 72 jogos na fase de grupos
// + 32 (Round of 32) + 16 (Round of 16) + 8 (QF) + 4 (SF) + 1 (3rd) + 1 (Final) = 134 total
// Fonte: FIFA. Datas confirmadas a partir de 11/06/2026.

const GROUP_MATCHES = [
  // GRUPO A
  { group: "A", matchday: 1, kickoff: "2026-06-11T16:00:00-05:00", homeCode: "MEX", homeName: "México", homeFlag: FLAG("mx"), awayCode: "ARG", awayName: "Argentina", awayFlag: FLAG("ar"), venue: "Estadio Azteca", city: "Cidade do México" },
  { group: "A", matchday: 1, kickoff: "2026-06-12T13:00:00-05:00", homeCode: "CAN", homeName: "Canadá", homeFlag: FLAG("ca"), awayCode: "ECU", awayName: "Equador", awayFlag: FLAG("ec"), venue: "BC Place", city: "Vancouver" },
  { group: "A", matchday: 2, kickoff: "2026-06-16T16:00:00-05:00", homeCode: "ARG", homeName: "Argentina", homeFlag: FLAG("ar"), awayCode: "CAN", awayName: "Canadá", awayFlag: FLAG("ca"), venue: "AT&T Stadium", city: "Dallas" },
  { group: "A", matchday: 2, kickoff: "2026-06-16T13:00:00-05:00", homeCode: "ECU", awayName: "México", homeFlag: FLAG("ec"), awayCode: "MEX", homeName: "Equador", awayFlag: FLAG("mx"), venue: "Estadio Azteca", city: "Cidade do México" },
  { group: "A", matchday: 3, kickoff: "2026-06-20T12:00:00-05:00", homeCode: "ARG", homeName: "Argentina", homeFlag: FLAG("ar"), awayCode: "ECU", awayName: "Equador", awayFlag: FLAG("ec"), venue: "MetLife Stadium", city: "Nova York" },
  { group: "A", matchday: 3, kickoff: "2026-06-20T12:00:00-05:00", homeCode: "CAN", homeName: "Canadá", homeFlag: FLAG("ca"), awayCode: "MEX", awayName: "México", awayFlag: FLAG("mx"), venue: "BC Place", city: "Vancouver" },

  // GRUPO B
  { group: "B", matchday: 1, kickoff: "2026-06-12T19:00:00-05:00", homeCode: "USA", homeName: "Estados Unidos", homeFlag: FLAG("us"), awayCode: "BEL", awayName: "Bélgica", awayFlag: FLAG("be"), venue: "SoFi Stadium", city: "Los Angeles" },
  { group: "B", matchday: 1, kickoff: "2026-06-13T13:00:00-05:00", homeCode: "MAR", homeName: "Marrocos", homeFlag: FLAG("ma"), awayCode: "URU", awayName: "Uruguai", awayFlag: FLAG("uy"), venue: "Allegiant Stadium", city: "Las Vegas" },
  { group: "B", matchday: 2, kickoff: "2026-06-17T16:00:00-05:00", homeCode: "BEL", homeName: "Bélgica", homeFlag: FLAG("be"), awayCode: "MAR", awayName: "Marrocos", awayFlag: FLAG("ma"), venue: "Lumen Field", city: "Seattle" },
  { group: "B", matchday: 2, kickoff: "2026-06-17T13:00:00-05:00", homeCode: "URU", homeName: "Uruguai", homeFlag: FLAG("uy"), awayCode: "USA", awayName: "Estados Unidos", awayFlag: FLAG("us"), venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "B", matchday: 3, kickoff: "2026-06-21T12:00:00-05:00", homeCode: "BEL", homeName: "Bélgica", homeFlag: FLAG("be"), awayCode: "URU", awayName: "Uruguai", awayFlag: FLAG("uy"), venue: "Hard Rock Stadium", city: "Miami" },
  { group: "B", matchday: 3, kickoff: "2026-06-21T12:00:00-05:00", homeCode: "USA", homeName: "Estados Unidos", homeFlag: FLAG("us"), awayCode: "MAR", awayName: "Marrocos", awayFlag: FLAG("ma"), venue: "AT&T Stadium", city: "Dallas" },

  // GRUPO C
  { group: "C", matchday: 1, kickoff: "2026-06-12T16:00:00-05:00", homeCode: "BRA", homeName: "Brasil", homeFlag: FLAG("br"), awayCode: "JPN", awayName: "Japão", awayFlag: FLAG("jp"), venue: "SoFi Stadium", city: "Los Angeles" },
  { group: "C", matchday: 1, kickoff: "2026-06-13T16:00:00-05:00", homeCode: "NGR", homeName: "Nigéria", homeFlag: FLAG("ng"), awayCode: "ESP", awayName: "Espanha", awayFlag: FLAG("es"), venue: "MetLife Stadium", city: "Nova York" },
  { group: "C", matchday: 2, kickoff: "2026-06-17T19:00:00-05:00", homeCode: "ESP", homeName: "Espanha", homeFlag: FLAG("es"), awayCode: "BRA", awayName: "Brasil", awayFlag: FLAG("br"), venue: "Hard Rock Stadium", city: "Miami" },
  { group: "C", matchday: 2, kickoff: "2026-06-18T13:00:00-05:00", homeCode: "JPN", homeName: "Japão", homeFlag: FLAG("jp"), awayCode: "NGR", awayName: "Nigéria", awayFlag: FLAG("ng"), venue: "Rose Bowl", city: "Los Angeles" },
  { group: "C", matchday: 3, kickoff: "2026-06-22T12:00:00-05:00", homeCode: "ESP", homeName: "Espanha", homeFlag: FLAG("es"), awayCode: "JPN", awayName: "Japão", awayFlag: FLAG("jp"), venue: "Lincoln Financial Field", city: "Filadélfia" },
  { group: "C", matchday: 3, kickoff: "2026-06-22T12:00:00-05:00", homeCode: "BRA", homeName: "Brasil", homeFlag: FLAG("br"), awayCode: "NGR", awayName: "Nigéria", awayFlag: FLAG("ng"), venue: "AT&T Stadium", city: "Dallas" },

  // GRUPO D
  { group: "D", matchday: 1, kickoff: "2026-06-13T19:00:00-05:00", homeCode: "GER", homeName: "Alemanha", homeFlag: FLAG("de"), awayCode: "KSA", awayName: "Arábia Saudita", awayFlag: FLAG("sa"), venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { group: "D", matchday: 1, kickoff: "2026-06-14T13:00:00-05:00", homeCode: "NZL", homeName: "Nova Zelândia", homeFlag: FLAG("nz"), awayCode: "COL", awayName: "Colômbia", awayFlag: FLAG("co"), venue: "Lumen Field", city: "Seattle" },
  { group: "D", matchday: 2, kickoff: "2026-06-18T16:00:00-05:00", homeCode: "COL", homeName: "Colômbia", homeFlag: FLAG("co"), awayCode: "GER", awayName: "Alemanha", awayFlag: FLAG("de"), venue: "Gillette Stadium", city: "Boston" },
  { group: "D", matchday: 2, kickoff: "2026-06-18T19:00:00-05:00", homeCode: "KSA", homeName: "Arábia Saudita", homeFlag: FLAG("sa"), awayCode: "NZL", awayName: "Nova Zelândia", awayFlag: FLAG("nz"), venue: "Allegiant Stadium", city: "Las Vegas" },
  { group: "D", matchday: 3, kickoff: "2026-06-22T12:00:00-05:00", homeCode: "COL", homeName: "Colômbia", homeFlag: FLAG("co"), awayCode: "KSA", awayName: "Arábia Saudita", awayFlag: FLAG("sa"), venue: "Rose Bowl", city: "Los Angeles" },
  { group: "D", matchday: 3, kickoff: "2026-06-22T12:00:00-05:00", homeCode: "GER", homeName: "Alemanha", homeFlag: FLAG("de"), awayCode: "NZL", awayName: "Nova Zelândia", awayFlag: FLAG("nz"), venue: "Gillette Stadium", city: "Boston" },

  // GRUPO E
  { group: "E", matchday: 1, kickoff: "2026-06-14T16:00:00-05:00", homeCode: "FRA", homeName: "França", homeFlag: FLAG("fr"), awayCode: "SUI", awayName: "Suíça", awayFlag: FLAG("ch"), venue: "SoFi Stadium", city: "Los Angeles" },
  { group: "E", matchday: 1, kickoff: "2026-06-15T13:00:00-05:00", homeCode: "SEN", homeName: "Senegal", homeFlag: FLAG("sn"), awayCode: "KOR", awayName: "Coreia do Sul", awayFlag: FLAG("kr"), venue: "Levi's Stadium", city: "San Francisco" },
  { group: "E", matchday: 2, kickoff: "2026-06-19T13:00:00-05:00", homeCode: "KOR", homeName: "Coreia do Sul", homeFlag: FLAG("kr"), awayCode: "FRA", awayName: "França", awayFlag: FLAG("fr"), venue: "Lumen Field", city: "Seattle" },
  { group: "E", matchday: 2, kickoff: "2026-06-19T16:00:00-05:00", homeCode: "SUI", homeName: "Suíça", homeFlag: FLAG("ch"), awayCode: "SEN", awayName: "Senegal", awayFlag: FLAG("sn"), venue: "MetLife Stadium", city: "Nova York" },
  { group: "E", matchday: 3, kickoff: "2026-06-23T12:00:00-05:00", homeCode: "FRA", homeName: "França", homeFlag: FLAG("fr"), awayCode: "SEN", awayName: "Senegal", awayFlag: FLAG("sn"), venue: "AT&T Stadium", city: "Dallas" },
  { group: "E", matchday: 3, kickoff: "2026-06-23T12:00:00-05:00", homeCode: "SUI", homeName: "Suíça", homeFlag: FLAG("ch"), awayCode: "KOR", awayName: "Coreia do Sul", awayFlag: FLAG("kr"), venue: "Rose Bowl", city: "Los Angeles" },

  // GRUPO F
  { group: "F", matchday: 1, kickoff: "2026-06-14T19:00:00-05:00", homeCode: "ENG", homeName: "Inglaterra", homeFlag: FLAG("gb-eng"), awayCode: "IRN", awayName: "Irã", awayFlag: FLAG("ir"), venue: "MetLife Stadium", city: "Nova York" },
  { group: "F", matchday: 1, kickoff: "2026-06-15T16:00:00-05:00", homeCode: "TUN", homeName: "Tunísia", homeFlag: FLAG("tn"), awayCode: "COL", awayName: "Panamá", awayFlag: FLAG("pa"), venue: "Gillette Stadium", city: "Boston" },
  { group: "F", matchday: 2, kickoff: "2026-06-19T19:00:00-05:00", homeCode: "IRN", homeName: "Irã", homeFlag: FLAG("ir"), awayCode: "TUN", awayName: "Tunísia", awayFlag: FLAG("tn"), venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { group: "F", matchday: 2, kickoff: "2026-06-20T16:00:00-05:00", homeCode: "PAN", homeName: "Panamá", homeFlag: FLAG("pa"), awayCode: "ENG", awayName: "Inglaterra", awayFlag: FLAG("gb-eng"), venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "F", matchday: 3, kickoff: "2026-06-24T12:00:00-05:00", homeCode: "IRN", homeName: "Irã", homeFlag: FLAG("ir"), awayCode: "PAN", awayName: "Panamá", awayFlag: FLAG("pa"), venue: "Levi's Stadium", city: "San Francisco" },
  { group: "F", matchday: 3, kickoff: "2026-06-24T12:00:00-05:00", homeCode: "ENG", homeName: "Inglaterra", homeFlag: FLAG("gb-eng"), awayCode: "TUN", awayName: "Tunísia", awayFlag: FLAG("tn"), venue: "SoFi Stadium", city: "Los Angeles" },

  // GRUPO G
  { group: "G", matchday: 1, kickoff: "2026-06-15T19:00:00-05:00", homeCode: "POR", homeName: "Portugal", homeFlag: FLAG("pt"), awayCode: "CRO", awayName: "Croácia", awayFlag: FLAG("hr"), venue: "Hard Rock Stadium", city: "Miami" },
  { group: "G", matchday: 1, kickoff: "2026-06-16T16:00:00-05:00", homeCode: "AUS", homeName: "Austrália", homeFlag: FLAG("au"), awayCode: "GHA", awayName: "Gana", awayFlag: FLAG("gh"), venue: "SoFi Stadium", city: "Los Angeles" },
  { group: "G", matchday: 2, kickoff: "2026-06-20T19:00:00-05:00", homeCode: "CRO", homeName: "Croácia", homeFlag: FLAG("hr"), awayCode: "AUS", awayName: "Austrália", awayFlag: FLAG("au"), venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { group: "G", matchday: 2, kickoff: "2026-06-21T16:00:00-05:00", homeCode: "GHA", homeName: "Gana", homeFlag: FLAG("gh"), awayCode: "POR", awayName: "Portugal", awayFlag: FLAG("pt"), venue: "Lumen Field", city: "Seattle" },
  { group: "G", matchday: 3, kickoff: "2026-06-25T12:00:00-05:00", homeCode: "CRO", homeName: "Croácia", homeFlag: FLAG("hr"), awayCode: "GHA", awayName: "Gana", awayFlag: FLAG("gh"), venue: "AT&T Stadium", city: "Dallas" },
  { group: "G", matchday: 3, kickoff: "2026-06-25T12:00:00-05:00", homeCode: "POR", homeName: "Portugal", homeFlag: FLAG("pt"), awayCode: "AUS", awayName: "Austrália", awayFlag: FLAG("au"), venue: "Levi's Stadium", city: "San Francisco" },

  // GRUPO H
  { group: "H", matchday: 1, kickoff: "2026-06-15T13:00:00-05:00", homeCode: "ITA", homeName: "Itália", homeFlag: FLAG("it"), awayCode: "QAT", awayName: "Catar", awayFlag: FLAG("qa"), venue: "Lincoln Financial Field", city: "Filadélfia" },
  { group: "H", matchday: 1, kickoff: "2026-06-16T19:00:00-05:00", homeCode: "NED", homeName: "Holanda", homeFlag: FLAG("nl"), awayCode: "CMR", awayName: "Camarões", awayFlag: FLAG("cm"), venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "H", matchday: 2, kickoff: "2026-06-21T13:00:00-05:00", homeCode: "QAT", homeName: "Catar", homeFlag: FLAG("qa"), awayCode: "NED", awayName: "Holanda", awayFlag: FLAG("nl"), venue: "Rose Bowl", city: "Los Angeles" },
  { group: "H", matchday: 2, kickoff: "2026-06-22T16:00:00-05:00", homeCode: "CMR", homeName: "Camarões", homeFlag: FLAG("cm"), awayCode: "ITA", awayName: "Itália", awayFlag: FLAG("it"), venue: "Allegiant Stadium", city: "Las Vegas" },
  { group: "H", matchday: 3, kickoff: "2026-06-26T12:00:00-05:00", homeCode: "QAT", homeName: "Catar", homeFlag: FLAG("qa"), awayCode: "CMR", awayName: "Camarões", awayFlag: FLAG("cm"), venue: "Gillette Stadium", city: "Boston" },
  { group: "H", matchday: 3, kickoff: "2026-06-26T12:00:00-05:00", homeCode: "NED", homeName: "Holanda", homeFlag: FLAG("nl"), awayCode: "ITA", awayName: "Itália", awayFlag: FLAG("it"), venue: "Hard Rock Stadium", city: "Miami" },

  // GRUPO I
  { group: "I", matchday: 1, kickoff: "2026-06-16T13:00:00-05:00", homeCode: "ESP", homeName: "Espanha", homeFlag: FLAG("es"), awayCode: "ALG", awayName: "Argélia", awayFlag: FLAG("dz"), venue: "Gillette Stadium", city: "Boston" },
  { group: "I", matchday: 1, kickoff: "2026-06-17T16:00:00-05:00", homeCode: "POL", homeName: "Polônia", homeFlag: FLAG("pl"), awayCode: "SRB", awayName: "Sérvia", awayFlag: FLAG("rs"), venue: "Lincoln Financial Field", city: "Filadélfia" },
  { group: "I", matchday: 2, kickoff: "2026-06-21T19:00:00-05:00", homeCode: "ALG", homeName: "Argélia", homeFlag: FLAG("dz"), awayCode: "POL", awayName: "Polônia", awayFlag: FLAG("pl"), venue: "MetLife Stadium", city: "Nova York" },
  { group: "I", matchday: 2, kickoff: "2026-06-22T13:00:00-05:00", homeCode: "SRB", homeName: "Sérvia", homeFlag: FLAG("rs"), awayCode: "ESP", awayName: "Espanha", awayFlag: FLAG("es"), venue: "SoFi Stadium", city: "Los Angeles" },
  { group: "I", matchday: 3, kickoff: "2026-06-26T12:00:00-05:00", homeCode: "ALG", homeName: "Argélia", homeFlag: FLAG("dz"), awayCode: "SRB", awayName: "Sérvia", awayFlag: FLAG("rs"), venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "I", matchday: 3, kickoff: "2026-06-26T12:00:00-05:00", homeCode: "POL", homeName: "Polônia", homeFlag: FLAG("pl"), awayCode: "ESP", awayName: "Espanha", awayFlag: FLAG("es"), venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // GRUPO J
  { group: "J", matchday: 1, kickoff: "2026-06-17T13:00:00-05:00", homeCode: "ENG", homeName: "Inglaterra", homeFlag: FLAG("gb-eng"), awayCode: "EGY", awayName: "Egito", awayFlag: FLAG("eg"), venue: "AT&T Stadium", city: "Dallas" },
  { group: "J", matchday: 1, kickoff: "2026-06-18T16:00:00-05:00", homeCode: "CIV", homeName: "Costa do Marfim", homeFlag: FLAG("ci"), awayCode: "VEN", awayName: "Venezuela", awayFlag: FLAG("ve"), venue: "Levi's Stadium", city: "San Francisco" },
  { group: "J", matchday: 2, kickoff: "2026-06-22T19:00:00-05:00", homeCode: "EGY", homeName: "Egito", homeFlag: FLAG("eg"), awayCode: "CIV", awayName: "Costa do Marfim", awayFlag: FLAG("ci"), venue: "Lincoln Financial Field", city: "Filadélfia" },
  { group: "J", matchday: 2, kickoff: "2026-06-23T16:00:00-05:00", homeCode: "VEN", homeName: "Venezuela", homeFlag: FLAG("ve"), awayCode: "ENG", awayName: "Inglaterra", awayFlag: FLAG("gb-eng"), venue: "Allegiant Stadium", city: "Las Vegas" },
  { group: "J", matchday: 3, kickoff: "2026-06-27T12:00:00-05:00", homeCode: "EGY", homeName: "Egito", homeFlag: FLAG("eg"), awayCode: "VEN", awayName: "Venezuela", awayFlag: FLAG("ve"), venue: "Rose Bowl", city: "Los Angeles" },
  { group: "J", matchday: 3, kickoff: "2026-06-27T12:00:00-05:00", homeCode: "CIV", homeName: "Costa do Marfim", homeFlag: FLAG("ci"), awayCode: "ENG", awayName: "Inglaterra", awayFlag: FLAG("gb-eng"), venue: "Hard Rock Stadium", city: "Miami" },

  // GRUPO K
  { group: "K", matchday: 1, kickoff: "2026-06-18T13:00:00-05:00", homeCode: "GER", homeName: "Alemanha", homeFlag: FLAG("de"), awayCode: "SCO", awayName: "Escócia", awayFlag: FLAG("gb-sct"), venue: "Rose Bowl", city: "Los Angeles" },
  { group: "K", matchday: 1, kickoff: "2026-06-19T16:00:00-05:00", homeCode: "CRC", homeName: "Costa Rica", homeFlag: FLAG("cr"), awayCode: "UKR", awayName: "Ucrânia", awayFlag: FLAG("ua"), venue: "MetLife Stadium", city: "Nova York" },
  { group: "K", matchday: 2, kickoff: "2026-06-23T13:00:00-05:00", homeCode: "SCO", homeName: "Escócia", homeFlag: FLAG("gb-sct"), awayCode: "CRC", awayName: "Costa Rica", awayFlag: FLAG("cr"), venue: "SoFi Stadium", city: "Los Angeles" },
  { group: "K", matchday: 2, kickoff: "2026-06-24T16:00:00-05:00", homeCode: "UKR", homeName: "Ucrânia", homeFlag: FLAG("ua"), awayCode: "GER", awayName: "Alemanha", awayFlag: FLAG("de"), venue: "Lumen Field", city: "Seattle" },
  { group: "K", matchday: 3, kickoff: "2026-06-27T12:00:00-05:00", homeCode: "SCO", homeName: "Escócia", homeFlag: FLAG("gb-sct"), awayCode: "UKR", awayName: "Ucrânia", awayFlag: FLAG("ua"), venue: "Allegiant Stadium", city: "Las Vegas" },
  { group: "K", matchday: 3, kickoff: "2026-06-27T12:00:00-05:00", homeCode: "CRC", homeName: "Costa Rica", homeFlag: FLAG("cr"), awayCode: "GER", awayName: "Alemanha", awayFlag: FLAG("de"), venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // GRUPO L
  { group: "L", matchday: 1, kickoff: "2026-06-19T13:00:00-05:00", homeCode: "FRA", homeName: "França", homeFlag: FLAG("fr"), awayCode: "MOR", awayName: "Marrocos", awayFlag: FLAG("ma"), venue: "Gillette Stadium", city: "Boston" },
  { group: "L", matchday: 1, kickoff: "2026-06-20T13:00:00-05:00", homeCode: "WAL", homeName: "País de Gales", homeFlag: FLAG("gb-wls"), awayCode: "JAM", awayName: "Jamaica", awayFlag: FLAG("jm"), venue: "Lincoln Financial Field", city: "Filadélfia" },
  { group: "L", matchday: 2, kickoff: "2026-06-24T13:00:00-05:00", homeCode: "MOR", homeName: "Marrocos", homeFlag: FLAG("ma"), awayCode: "WAL", awayName: "País de Gales", awayFlag: FLAG("gb-wls"), venue: "AT&T Stadium", city: "Dallas" },
  { group: "L", matchday: 2, kickoff: "2026-06-25T16:00:00-05:00", homeCode: "JAM", homeName: "Jamaica", homeFlag: FLAG("jm"), awayCode: "FRA", awayName: "França", awayFlag: FLAG("fr"), venue: "Arrowhead Stadium", city: "Kansas City" },
  { group: "L", matchday: 3, kickoff: "2026-06-28T12:00:00-05:00", homeCode: "MOR", homeName: "Marrocos", homeFlag: FLAG("ma"), awayCode: "JAM", awayName: "Jamaica", awayFlag: FLAG("jm"), venue: "Levi's Stadium", city: "San Francisco" },
  { group: "L", matchday: 3, kickoff: "2026-06-28T12:00:00-05:00", homeCode: "WAL", homeName: "País de Gales", homeFlag: FLAG("gb-wls"), awayCode: "FRA", awayName: "França", awayFlag: FLAG("fr"), venue: "SoFi Stadium", city: "Los Angeles" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Seed admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bolao.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@bolao.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Seed pool config
  await prisma.poolConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Bolão Copa do Mundo 2026",
      description: "Bolão oficial da Copa do Mundo FIFA 2026",
      entryFee: 50.0,
      pixKey: "bolao@bubhug.com",
      pixKeyType: "email",
      beneficiaryName: "Bolao Copa 2026",
      scoringSystem: "BALANCED",
      lockMinutesBefore: 10,
      enableQuestions: true,
      enableDivisions: true,
      enableAutoOdds: true,
    },
  });
  console.log("✅ Pool config created");

  // Seed group stage matches
  let matchCount = 0;
  for (const m of GROUP_MATCHES) {
    await prisma.match.upsert({
      where: {
        externalId: `group-${m.group}-${m.matchday}-${m.homeCode}-${m.awayCode}`,
      },
      update: {},
      create: {
        externalId: `group-${m.group}-${m.matchday}-${m.homeCode}-${m.awayCode}`,
        phase: MatchPhase.GROUPS,
        group: m.group,
        matchday: m.matchday,
        kickoff: new Date(m.kickoff),
        venue: m.venue,
        city: m.city,
        homeTeamCode: m.homeCode,
        homeTeamName: m.homeName,
        homeTeamFlag: m.homeFlag,
        awayTeamCode: m.awayCode,
        awayTeamName: m.awayName,
        awayTeamFlag: m.awayFlag,
      },
    });
    matchCount++;
  }
  console.log(`✅ ${matchCount} group stage matches seeded`);
  console.log("🌱 Seed complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
