'use strict';

const PGA_DEFAULT_EXPERIENCES = [
  {
    key: 'ceo_lunch', name: 'Colazione/pranzo con il CEO',
    description: 'Un\'ora con il/la CEO per parlare di carriera, idee, futuro.',
    category: 'career', coin_cost: 1500, max_per_user_per_year: 1, max_total_per_month: 2,
    internal: true, requires_booking: true, display_order: 10
  },
  {
    key: 'mentoring_leader', name: 'Mentoring 1:1 con un leader (3 sessioni)',
    description: '3 incontri da 1 ora con un leader interno distribuiti su 3 mesi.',
    category: 'career', coin_cost: 1000, max_per_user_per_year: 2, max_total_per_month: 5,
    internal: true, requires_booking: true, display_order: 20
  },
  {
    key: 'growth_day_half', name: 'Mezza giornata "Growth day"',
    description: 'Mezza giornata di permesso pagato dedicata a crescita personale.',
    category: 'time', coin_cost: 300, max_per_user_per_year: 6,
    internal: true, requires_booking: true, display_order: 30
  },
  {
    key: 'linkedin_learning', name: 'LinkedIn Learning · abbonamento annuale',
    description: 'Accesso a LinkedIn Learning per 12 mesi.',
    category: 'learning', coin_cost: 800, max_per_user_per_year: 1,
    internal: false, external_provider: 'LinkedIn', external_cost_eur: 240,
    requires_booking: false, display_order: 40
  },
  {
    key: 'workshop_softskill', name: 'Workshop interno · soft skill',
    description: 'Workshop mensile su soft skill. Gruppo max 10 partecipanti.',
    category: 'softskill', coin_cost: 600, max_per_user_per_year: 3, max_total_per_month: 10,
    internal: true, requires_booking: true, display_order: 50
  },
  {
    key: 'library_book', name: 'Library aziendale · 1 libro/audiolibro',
    description: 'Scegli un libro o audiolibro da catalogo curato.',
    category: 'learning', coin_cost: 100, max_per_user_per_year: 12,
    internal: false, external_provider: 'Amazon', external_cost_eur: 20,
    requires_booking: false, display_order: 60
  },
  {
    key: 'volunteer_day', name: '1 giornata di volontariato pagata',
    description: 'Una giornata di permesso pagato per volontariato.',
    category: 'purpose', coin_cost: 500, max_per_user_per_year: 2,
    internal: true, requires_booking: true, display_order: 70
  },
  {
    key: 'sabbatical_mini', name: 'Sabbatical mini · 1 settimana',
    description: 'Una settimana di permesso pagato aggiuntiva per progetto personale.',
    category: 'time', coin_cost: 5000, max_per_user_per_year: 1, max_total_per_month: 1,
    internal: true, requires_booking: true, display_order: 80
  },
  {
    key: 'coaching_external', name: 'Coaching professionale · 3 sessioni',
    description: '3 sessioni di coaching 1:1 con coach certificato.',
    category: 'softskill', coin_cost: 1500, max_per_user_per_year: 2,
    internal: false, external_provider: 'BetterUp', external_cost_eur: 400,
    requires_booking: true, display_order: 90
  },
  {
    key: 'personal_spotlight', name: 'Personal Spotlight · Meet the Team',
    description: 'In evidenza nel Meet the team per 30 giorni.',
    category: 'brand', coin_cost: 300, max_per_user_per_year: 1, max_total_per_month: 4,
    internal: true, requires_booking: true, display_order: 100
  }
];

const COIN_ACTIONS_DEFAULT = [
  { action_key: 'onboarding', coin_amount: 200, description: 'Welcome bonus al primo onboarding' },
  { action_key: 'birthday', coin_amount: 50, description: 'Compleanno' },
  { action_key: 'anniversary_1y', coin_amount: 100, description: '1 anno in azienda' },
  { action_key: 'anniversary_5y', coin_amount: 500, description: '5 anni in azienda' },
  { action_key: 'anniversary_10y', coin_amount: 1500, description: '10 anni in azienda' },
  { action_key: 'quiz_completed', coin_amount: 20, description: 'Quiz compliance completato' },
  { action_key: 'survey_completed', coin_amount: 5, description: 'Survey compilato' },
  { action_key: 'recognition_received', coin_amount: 10, description: 'Recognition ricevuta da un collega' },
  { action_key: 'recognition_given', coin_amount: 0, description: 'Recognition data (no coin perso)' },
  { action_key: 'convention_first_use', coin_amount: 5, description: 'Prima attivazione di una convenzione' },
  { action_key: 'challenge_completed', coin_amount: 50, description: 'Sfida team completata' },
  { action_key: 'manual_grant', coin_amount: 0, description: 'Assegnazione manuale HR' }
];

async function seedPgaDefaultsForBrand(brandId, db) {
  if (!brandId) throw new Error('brandId richiesto');
  const experiences = await db.seedExperiencesCatalog(brandId, PGA_DEFAULT_EXPERIENCES);
  const actions = await db.seedCoinActionsConfig(brandId, COIN_ACTIONS_DEFAULT);
  return { experiences_seeded: experiences, actions_seeded: actions };
}

module.exports = {
  PGA_DEFAULT_EXPERIENCES,
  COIN_ACTIONS_DEFAULT,
  seedPgaDefaultsForBrand
};
