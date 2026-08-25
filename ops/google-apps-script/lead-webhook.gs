const COLUMNS = [
  'kind','email','language','district_code','property_type',
  'deposit_won','monthly_rent_won','area_sqm','rating','confidence',
  'asking_value_won','median_value_won','difference_pct','comparable_count','months_used','data_through_month',
  'source_page','utm_source','utm_medium','utm_campaign','referrer_host','help_requested','help_message','created_at'
];

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}


function sanitizeCell_(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return value;
  return /^[=+\-@]/.test(value) ? "'" + value : value;
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
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const sheet = spreadsheet.getSheetByName('Leads') || spreadsheet.insertSheet('Leads');
      if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
      sheet.appendRow(COLUMNS.map(key => sanitizeCell_(row[key])));
    } finally {
      lock.releaseLock();
    }
    return jsonResponse_({ ok:true });
  } catch (error) {
    console.error('Lead webhook failed');
    return jsonResponse_({ ok:false, error:'Write failed' });
  }
}
