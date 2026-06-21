'use strict';

const {
  listMembersWithBirthdayToday,
  listMembersWithHireAnniversaryToday,
  hasCoinGrantToday
} = require('../db');
const { grantCoin } = require('./coins');

const ANNIVERSARY_RULES = [
  { years: 1, actionKey: 'anniversary_1y' },
  { years: 5, actionKey: 'anniversary_5y' },
  { years: 10, actionKey: 'anniversary_10y' }
];

async function runCoinAnniversariesJob() {
  const summary = { birthday: 0, anniversaries: 0, skipped: 0, errors: 0 };

  try {
    const birthdays = await listMembersWithBirthdayToday();
    for (const member of birthdays) {
      if (!member.brand_id || !member.pass_serial) {
        summary.skipped += 1;
        continue;
      }
      if (await hasCoinGrantToday(member.brand_id, member.pass_serial, 'birthday')) {
        summary.skipped += 1;
        continue;
      }
      try {
        const out = await grantCoin(member.brand_id, member.pass_serial, 'birthday', {
          user_id: member.id,
          description: 'Compleanno'
        });
        if (out.success) summary.birthday += 1;
        else summary.skipped += 1;
      } catch (err) {
        summary.errors += 1;
        console.warn('[coin-cron] birthday grant failed:', err.message);
      }
    }

    for (const rule of ANNIVERSARY_RULES) {
      const rows = await listMembersWithHireAnniversaryToday(rule.years);
      for (const member of rows) {
        if (!member.brand_id || !member.pass_serial) {
          summary.skipped += 1;
          continue;
        }
        if (await hasCoinGrantToday(member.brand_id, member.pass_serial, rule.actionKey)) {
          summary.skipped += 1;
          continue;
        }
        try {
          const out = await grantCoin(member.brand_id, member.pass_serial, rule.actionKey, {
            user_id: member.id,
            description: `${rule.years} anni in azienda`
          });
          if (out.success) summary.anniversaries += 1;
          else summary.skipped += 1;
        } catch (err) {
          summary.errors += 1;
          console.warn('[coin-cron] anniversary grant failed:', err.message);
        }
      }
    }
  } catch (err) {
    summary.errors += 1;
    console.error('[coin-cron] job failed:', err.message);
  }

  if (summary.birthday || summary.anniversaries || summary.errors) {
    console.log('[coin-cron] anniversaries summary:', summary);
  }
  return summary;
}

function scheduleCoinAnniversariesJob() {
  const MS_DAY = 24 * 60 * 60 * 1000;
  const targetHour = 6;

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(targetHour, 0, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    setTimeout(async () => {
      try {
        await runCoinAnniversariesJob();
      } catch (err) {
        console.error('[coin-cron] tick error:', err.message);
      }
      scheduleNext();
    }, delay);
  };

  scheduleNext();
  console.log('🪙 Coin anniversaries cron scheduled (daily 06:00 Europe/Rome)');
}

module.exports = {
  runCoinAnniversariesJob,
  scheduleCoinAnniversariesJob
};
