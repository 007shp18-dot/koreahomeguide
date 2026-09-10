const COLUMNS = [
  'kind','email','language','district_code','property_type',
  'deposit_won','monthly_rent_won','area_sqm','rating','confidence',
  'asking_value_won','median_value_won','difference_pct','comparable_count','months_used','data_through_month',
  'source_page','utm_source','utm_medium','utm_campaign','referrer_host','help_requested','help_message','created_at','updated_at',
  'privacy_consent','privacy_notice_version'
];

const EXPERIENCE_COLUMNS = [
  'report_id','kind','language','district_code','property_type',
  'deposit_won','monthly_rent_won','area_sqm','agent_fee_paid_won','deposit_outcome',
  'legal_cap_won','fee_above_cap','cap_status','brokerage_rule_version','source_page','created_at',
  'privacy_consent','privacy_notice_version'
];

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}


function sanitizeCell_(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return value;
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function notificationValue_(value) {
  return String(value == null ? '' : value)
    .replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function notificationBody_(row, sheetId) {
  const kind = row.kind === 'help_request' ? 'Help request' : 'Rent Check lead';
  return [
    'A new KoreaHomeGuide submission was saved.',
    '',
    'Type: ' + kind,
    'Email: ' + notificationValue_(normalizeEmail_(row.email)),
    'Language: ' + notificationValue_(row.language),
    'Area: ' + notificationValue_(row.district_code),
    'Property type: ' + notificationValue_(row.property_type),
    'Source page: ' + notificationValue_(row.source_page),
    'Created at: ' + notificationValue_(row.created_at),
    '',
    'Open the lead sheet: https://docs.google.com/spreadsheets/d/' + encodeURIComponent(sheetId) + '/edit',
    '',
    'For privacy, exact quote amounts and the help message are not copied into this email.'
  ].join('\n');
}

function notifyOwner_(properties, row, result, sheetId) {
  if (!result || result.duplicate) return false;
  const recipient = notificationValue_(properties.getProperty('LEAD_NOTIFICATION_EMAIL'));
  if (!recipient) return false;
  try {
    MailApp.sendEmail({
      to:recipient,
      subject:row.kind === 'help_request' ? '[KoreaHomeGuide] New help request' : '[KoreaHomeGuide] New Rent Check lead',
      body:notificationBody_(row, sheetId)
    });
    return true;
  } catch (error) {
    console.error('Lead notification failed');
    return false;
  }
}

function ensureHeaders_(sheet, columns) {
  const targetColumns = columns || COLUMNS;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(targetColumns);
    return;
  }
  sheet.getRange(1, 1, 1, targetColumns.length).setValues([targetColumns]);
}

function appendSubmissionRow_(sheet, columns, row) {
  const rowNumber = sheet.getLastRow() + 1;
  const privacyVersionColumn = columns.indexOf('privacy_notice_version') + 1;
  if (privacyVersionColumn > 0) {
    sheet.getRange(rowNumber, privacyVersionColumn, 1, 1).setNumberFormat('@');
  }
  sheet.getRange(rowNumber, 1, 1, columns.length)
    .setValues([columns.map(key => sanitizeCell_(row[key]))]);
}

function findEmailRow_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = normalizeEmail_(email);
  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const index = values.findIndex(item => normalizeEmail_(item[0]) === target);
  return index < 0 ? 0 : index + 2;
}

function upsertLeadRow_(sheet, incomingRow) {
  const row = Object.assign({}, incomingRow || {});
  row.email = normalizeEmail_(row.email);
  ensureHeaders_(sheet);

  const existingRowNumber = findEmailRow_(sheet, row.email);
  if (existingRowNumber && row.kind === 'lead_capture') {
    return { ok:true, duplicate:true };
  }

  if (existingRowNumber && row.kind === 'help_request') {
    const existing = sheet.getRange(existingRowNumber, 1, 1, COLUMNS.length).getValues()[0];
    existing[COLUMNS.indexOf('help_requested')] = true;
    existing[COLUMNS.indexOf('help_message')] = sanitizeCell_(row.help_message);
    existing[COLUMNS.indexOf('updated_at')] = sanitizeCell_(row.created_at);
    sheet.getRange(existingRowNumber, 1, 1, COLUMNS.length).setValues([existing]);
    return { ok:true, updated:true };
  }

  row.help_requested = row.kind === 'help_request' || row.help_requested === true;
  row.updated_at = row.created_at;
  appendSubmissionRow_(sheet, COLUMNS, row);
  return { ok:true, created:true };
}

function findExperienceRow_(sheet, reportId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = String(reportId || '').trim();
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const index = values.findIndex(item => String(item[0] || '').trim() === target);
  return index < 0 ? 0 : index + 2;
}

function appendExperienceRow_(sheet, incomingRow) {
  const row = Object.assign({}, incomingRow || {});
  ensureHeaders_(sheet, EXPERIENCE_COLUMNS);
  if (findExperienceRow_(sheet, row.report_id)) return { ok:true, duplicate:true };
  appendSubmissionRow_(sheet, EXPERIENCE_COLUMNS, row);
  return { ok:true, created:true };
}

function storeSubmission_(spreadsheet, row) {
  if (row && row.kind === 'experience_report') {
    const experienceSheet = spreadsheet.getSheetByName('Experiences') || spreadsheet.insertSheet('Experiences');
    return appendExperienceRow_(experienceSheet, row);
  }
  const leadSheet = spreadsheet.getSheetByName('Leads') || spreadsheet.insertSheet('Leads');
  return upsertLeadRow_(leadSheet, row);
}

function doPost(e) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty('LEAD_SHARED_SECRET');
    const sheetId = properties.getProperty('LEAD_SHEET_ID');
    if (!expectedSecret || !sheetId) return jsonResponse_({ ok:false, error:'Not configured' });

    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!payload.secret || payload.secret !== expectedSecret) return jsonResponse_({ ok:false, error:'Unauthorized' });

    const row = payload.row || {};
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    let result;
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      result = storeSubmission_(spreadsheet, row);
    } finally {
      lock.releaseLock();
    }
    result.notified = row.kind === 'experience_report' ? false : notifyOwner_(properties, row, result, sheetId);
    return jsonResponse_(result);
  } catch (error) {
    console.error('Lead webhook failed');
    return jsonResponse_({ ok:false, error:'Write failed' });
  }
}
