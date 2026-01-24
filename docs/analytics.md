# Analytics event schema (Firebase / GA4)

Cil: jednotny a konzistentni event schema pro prehledne dashboardy, bez PII.

## Konvence
- Event names: lower_snake_case
- Param names: lower_snake_case
- Povinne parametry jsou oznaceny **(req)**
- Vsechny ID jsou stringy (pokud jde o cislo, predat jako string)

## Spolecne parametry (doporucene)
- `source`: odkud akce prisla (home_tile, program, artists_grid, artist_detail, map, settings, ...)
- `destination`: cil akce (napr. screen name)
- `status`: success / error

## Eventy a parametry

| Event name | Kdy se loguje | Parametry |
| --- | --- | --- |
| `screen_view` | pri fokusu obrazovky | `screen_name` (req), `screen_class` |
| `content_load` | pri chybe nebo uspechu nacteni dat | `content_type` (req: maps/news/events/partners/faq/timeline), `status` (req), `from_cache` |
| `cta_click` | klik na hlavni CTA | `cta_name` (req), `destination`, `source` |
| `news_open` | otevreni novinky z listu/home | `news_id` (req), `source` |
| `news_detail_view` | zobrazeni detailu novinky | `news_id` (req), `source` |
| `partner_click` | klik na partnera | `partner_id` (req), `partner_name`, `source`, `position` |
| `map_select` | zmena mapy (uzivatel/auto) | `map_key` (req), `source` (user/auto) |
| `map_load` | nacteni mapy | `map_key` (req), `status` (req) |
| `map_retry` | retry nacteni mapy | `map_key` |
| `filter_select` | vyber filtru | `category` (req), `source` |
| `artist_open` | otevreni detailu interpreta | `artist_id` (req), `artist_name`, `source` |
| `event_open` | otevreni interpreta z programu | `event_id` (req), `artist_id`, `stage`, `source` |
| `event_selection_modal` | otevreni/zavreni modalu vyberu koncertu | `action` (req: open/close), `artist_id`, `events_count` |
| `favorite_change` | pridani/odebrani oblibenych | `action` (req: add/remove), `entity_type` (req: event), `event_id` (req), `artist_id`, `source` |
| `program_day_switch` | prepnuti dne programu | `day` (req: dayOne/dayTwo), `source` |
| `layout_switch` | prepnuti layoutu programu | `to` (req: horizontal/vertical), `source` |
| `help_bubble_toggle` | otevreni/zavreni napovedy | `state` (req: open/close), `source` |
| `favorite_open` | otevreni detailu z "Muj program" | `event_id` (req), `artist_id`, `source` |
| `favorites_toggle_past` | prepnuti zobrazeni minulych koncertu | `value` (req: true/false) |
| `notification_settings_change` | zmena nastaveni notifikaci | `type` (req: favorite_events/important_festival/favorite_events_lead_time), `value` (req), `lead_minutes` |
| `notification_prompt` | zobrazeni / akce na modal pro notifikace | `action` (req: shown/accepted/dismissed), `source` |
| `open_system_settings` | otevreni system nastaveni notifikaci | `source` |
| `clear_favorites_confirmed` | potvrzeni vymazani "Muj program" | `source` |
| `refresh_data` | obnoveni dat v nastaveni | `status` (req: success/error), `source` |

## Dulezite zdroje (source)
- `home_tile`, `home_news`, `home_partners`
- `program`, `program_longpress`, `program_horizontal`, `program_horizontal_longpress`
- `artists_grid`, `artist_detail`, `event_selection_modal`
- `favorites_upcoming`, `favorites_past`
- `settings`, `settings_notifications`
- `map`

## Dashboardy, ktere z toho pujdou
- Adopce funkci: podil uzivatelu se `screen_view` pro Program/Mapa/Novinky/Muj program
- Engagement programu: `event_open` a `favorite_change` v programu
- Notifikace funnel: `notification_settings_change` (povoleni + lead time)
- Mapa health: `map_load` error rate + `map_retry`
- Partneri: `partner_click` (CTR po doplneni impression eventu)

## Poznamky k implementaci
- Vsechny eventy jsou implementovane v UI vrstvach, aby slo doplnovat `source`.
- Detail interpreta loguje `favorite_change` se `source: artist_detail` (pozadavek UX).
