# GA4 Product Funnel

KoreaHomeGuide uses consented GA4 events to measure whether a visitor reaches a useful housing decision. Vercel Web Analytics remains the aggregate traffic baseline. GA4 must not receive exact rent, deposit, floor area, coordinates, building names or keys, saved-home IDs, labels, notes, checklist values, email, or help text.

## Primary funnels

### Rent Check and saved-home return

1. `page_view`
2. `rent_check_cta_click`
3. `rent_check_start`
4. `rent_check_result`
5. `quote_saved`
6. `saved_quotes_opened`
7. `saved_quotes_compared`
8. `saved_quotes_return_visit`

Use `saved_count_bucket=3+` on `saved_quotes_compared` as the shortlist-depth signal. The event deliberately reports a bucket, not home IDs or quote values.

### Explorer and building evidence

1. `explorer_search_start`
2. `explorer_search_result`
3. `explorer_map_select`
4. `explorer_building_detail_view`
5. `explorer_street_view_result`
6. `rent_check_cta_click`
7. `rent_check_start`
8. `rent_check_result`

`explorer_search_error` diagnoses failed searches. `explorer_street_view_result` uses only `ready`, `empty`, `error`, or `unconfigured`; it never sends the selected building or coordinates.

## GA4 setup

In Admin → Data display → Events, mark these as **Key events**:

- `rent_check_result`
- `quote_saved`
- `saved_quotes_compared`
- `saved_quotes_return_visit`

Register these event-scoped custom dimensions:

- `language`
- `district_code`
- `property_type`
- `saved_count_bucket`
- `budget_filter_count`
- `result_count_bucket`
- `contract_count_bucket`
- `result_state`
- `error_category`

Do not register exact price, deposit, area, address, building, coordinate, saved-home, note, checklist, email, or free-text dimensions. They are intentionally absent from the event builders.

## Weekly read

Compare like-for-like seven-day windows. Read the funnel in order: acquisition → useful result → save → comparison → return. If starts fall before results, investigate data or validation. If results do not lead to saves, inspect result usefulness. If saved homes do not reach `3+`, inspect the shortlist workflow. If `ready` street views fall while building detail views remain stable, inspect NAVER configuration and SDK delivery before changing UI.
