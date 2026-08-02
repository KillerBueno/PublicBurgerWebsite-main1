# Graph Report - .  (2026-06-30)

## Corpus Check
- 131 files · ~222,533 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 572 nodes · 875 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.88)
- Token cost: 28,520 input · 5,690 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Dashboard & Stats|Admin Dashboard & Stats]]
- [[_COMMUNITY_UIUX Design System Generator|UI/UX Design System Generator]]
- [[_COMMUNITY_Cart & Checkout Flow|Cart & Checkout Flow]]
- [[_COMMUNITY_Showcase & Menu UI|Showcase & Menu UI]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Search & Design Core|Search & Design Core]]
- [[_COMMUNITY_Dev Tools & Build Config|Dev Tools & Build Config]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_Security Best Practices Skills|Security Best Practices Skills]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_Auth & Admin Layout|Auth & Admin Layout]]
- [[_COMMUNITY_Checkout & App Config Context|Checkout & App Config Context]]
- [[_COMMUNITY_Kitchen Display & Menu Mgmt|Kitchen Display & Menu Mgmt]]
- [[_COMMUNITY_Food Cost & Recipe Analysis|Food Cost & Recipe Analysis]]
- [[_COMMUNITY_Menu Data & Allergens|Menu Data & Allergens]]
- [[_COMMUNITY_Cart Panel & Order Handling|Cart Panel & Order Handling]]
- [[_COMMUNITY_Claude Security Skills|Claude Security Skills]]
- [[_COMMUNITY_Color & Design Token Sync|Color & Design Token Sync]]
- [[_COMMUNITY_Burger Configurator|Burger Configurator]]
- [[_COMMUNITY_PWA & Page Components|PWA & Page Components]]
- [[_COMMUNITY_Supabase Auth & Login|Supabase Auth & Login]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_App Routing & Shell|App Routing & Shell]]
- [[_COMMUNITY_Claude Skills Licensing|Claude Skills Licensing]]
- [[_COMMUNITY_Hono API & Auth Utils|Hono API & Auth Utils]]
- [[_COMMUNITY_Gamification & Order Tiers|Gamification & Order Tiers]]
- [[_COMMUNITY_Menu Data Backup|Menu Data Backup]]
- [[_COMMUNITY_Layout Shell|Layout Shell]]
- [[_COMMUNITY_Rider Tracker & GPS|Rider Tracker & GPS]]
- [[_COMMUNITY_Legal Pages|Legal Pages]]
- [[_COMMUNITY_Order Details Page|Order Details Page]]
- [[_COMMUNITY_Service Worker Location|Service Worker Location]]
- [[_COMMUNITY_Vercel Deployment|Vercel Deployment]]
- [[_COMMUNITY_Root Brand Logos|Root Brand Logos]]
- [[_COMMUNITY_Public Brand Logo Variants|Public Brand Logo Variants]]
- [[_COMMUNITY_Public Burger Visual Identity|Public Burger Visual Identity]]
- [[_COMMUNITY_Admin Email Utilities|Admin Email Utilities]]
- [[_COMMUNITY_TypeScript Root Config|TypeScript Root Config]]
- [[_COMMUNITY_Menu Screenshots|Menu Screenshots]]

## God Nodes (most connected - your core abstractions)
1. `Vite React Starter Template` - 39 edges
2. `useConfig()` - 23 edges
3. `compilerOptions` - 20 edges
4. `compilerOptions` - 18 edges
5. `useAuth()` - 17 edges
6. `api` - 16 edges
7. `Security Best Practices Skill` - 13 edges
8. `DesignSystemGenerator` - 11 edges
9. `useCart()` - 11 edges
10. `_search_csv()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Security Best Practices Skill (Claude)` --semantically_similar_to--> `Security Best Practices Skill`  [INFERRED] [semantically similar]
  .claude/skills/security-best-practices/SKILL.md → .agents/skills/security-best-practices/SKILL.md
- `Logo MACELL 1980 Brand Design Asset` --conceptually_related_to--> `Public Burger Brand Identity`  [AMBIGUOUS]
  LOGO MACELL.1980  DEF.-1.pdf → design-system/MASTER.md
- `Frontend Design Skill (Claude)` --semantically_similar_to--> `Frontend Design Skill`  [INFERRED] [semantically similar]
  .claude/skills/frontend-design/SKILL.md → .agents/skills/frontend-design/SKILL.md
- `Apache License 2.0 (Frontend Design, Claude)` --semantically_similar_to--> `Apache License 2.0 (Frontend Design, Agents)`  [INFERRED] [semantically similar]
  .claude/skills/frontend-design/LICENSE.txt → .agents/skills/frontend-design/LICENSE.txt
- `Apache License 2.0 (Security Best Practices, Claude)` --semantically_similar_to--> `Apache License 2.0 (Security Best Practices, Agents)`  [INFERRED] [semantically similar]
  .claude/skills/security-best-practices/LICENSE.txt → .agents/skills/security-best-practices/LICENSE.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Security Best Practices Reference Documentation System** — _agents_skills_security_best_practices_skill_security_best_practices, _agents_skills_security_best_practices_references_golang_general_backend_security_spec, _agents_skills_security_best_practices_references_javascript_express_web_server_security_spec, _agents_skills_security_best_practices_references_javascript_general_web_frontend_security_spec, _agents_skills_security_best_practices_references_javascript_jquery_web_frontend_security_spec, _agents_skills_security_best_practices_references_javascript_typescript_nextjs_web_server_security_spec, _agents_skills_security_best_practices_references_javascript_typescript_react_web_frontend_security_spec, _agents_skills_security_best_practices_references_javascript_typescript_vue_web_frontend_security_spec, _agents_skills_security_best_practices_references_python_django_web_server_security_spec, _agents_skills_security_best_practices_references_python_fastapi_web_server_security_spec, _agents_skills_security_best_practices_references_python_flask_web_server_security_spec [INFERRED 0.95]
- **Claude Code Installed Skills Suite** — _agents_skills_frontend_design_skill_frontend_design, _agents_skills_security_best_practices_skill_security_best_practices, _agents_skills_ui_ux_pro_max_skill_ui_ux_pro_max [INFERRED 0.85]
- **Dual-Location Skill Installation Pattern (.agents and .claude)** — _agents_skills_frontend_design_skill_frontend_design, _claude_skills_frontend_design_skill_frontend_design, _agents_skills_security_best_practices_skill_security_best_practices, _claude_skills_security_best_practices_skill_security_best_practices [INFERRED 0.95]
- **Security Best Practices Skill Framework — Interface + Reference Specs** — _claude_skills_security_best_practices_agents_openai_interface, _claude_skills_security_best_practices_references_golang_general_backend_security_go_security_spec, _claude_skills_security_best_practices_references_javascript_express_web_server_security_express_security_spec, _claude_skills_security_best_practices_references_javascript_typescript_react_web_frontend_security_react_security_spec, _claude_skills_security_best_practices_references_python_django_web_server_security_django_security_spec, _claude_skills_security_best_practices_references_python_flask_web_server_security_flask_security_spec, _claude_skills_security_best_practices_references_python_fastapi_web_server_security_fastapi_security_spec, _claude_skills_security_best_practices_references_javascript_typescript_nextjs_web_server_security_nextjs_security_spec [INFERRED 0.95]
- **Frontend XSS Defense Across JS Frameworks** — _claude_skills_security_best_practices_references_javascript_general_web_frontend_security_frontend_security_spec, _claude_skills_security_best_practices_references_javascript_jquery_web_frontend_security_jquery_security_spec, _claude_skills_security_best_practices_references_javascript_typescript_react_web_frontend_security_react_security_spec, _claude_skills_security_best_practices_references_javascript_typescript_vue_web_frontend_security_vue_security_spec, concept_xss_prevention, concept_content_security_policy [INFERRED 0.85]
- **PublicBurger Design System Creation and Brand Identity** — _claude_skills_ui_ux_pro_max_skill_ui_ux_pro_max, design_system_master_publicburger_design_system, design_system_publicburger_master_publicburger_design_system, concept_publicburger_brand, index_public_burger_app [INFERRED 0.85]
- **Food Delivery Partner Logos** — just_eat_logo_png_seeklogo_408326, kisspng_deliveroo_logo_brand_food_delivery_1713922910643 [INFERRED 0.95]
- **Restaurant Partner and Supplier Brands** — logo_macell_1980_def_1, logo_non_solo_pane, just_eat_logo_png_seeklogo_408326, kisspng_deliveroo_logo_brand_food_delivery_1713922910643 [INFERRED 0.75]
- **Food Delivery Platform Logos** — public_deliveroo_logo, public_just_eat_logo [INFERRED 0.95]
- **Macelleria Franco Capobianco Brand Logo Variants** — public_logo_macelleria, public_logo_macelleria_test [INFERRED 0.95]
- **Restaurant Brand and Delivery Partner Assets** — public_deliveroo_logo, public_just_eat_logo, public_logo_macelleria, public_logo_macelleria_test [INFERRED 0.85]
- **Public Burger Brand Visual Assets** — public_logo_non_solo_pane, public_logo_public_512, public_logo_public_burger, public_logo_public_favicon [INFERRED 0.85]

## Communities (46 total, 4 thin omitted)

### Community 0 - "Admin Dashboard & Stats"
Cohesion: 0.05
Nodes (41): ALL_INGREDIENTS, DailyStat, DAY_LABELS, DAY_ORDER, fmtDate(), NON_DISABLEABLE, OrariTab(), ORDER_STATUSES (+33 more)

### Community 1 - "UI/UX Design System Generator"
Cohesion: 0.07
Nodes (31): ansi_ljust(), DesignSystemGenerator, _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system() (+23 more)

### Community 2 - "Cart & Checkout Flow"
Cohesion: 0.09
Nodes (27): CartDrawer(), CartDrawerProps, CheckoutModalProps, DEFAULT_MAP_CENTER, OpenStatus(), ProductCard(), ProductCardProps, Step (+19 more)

### Community 3 - "Showcase & Menu UI"
Cohesion: 0.10
Nodes (13): BurgerFilter, BurgerRow(), CartFAB(), ExtraRow(), FILTERS, fmt(), FryModal(), isOpen() (+5 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, clsx, date-fns, ffmpeg-static, framer-motion, hono, lucide-react, react (+15 more)

### Community 5 - "Search & Design Core"
Cohesion: 0.12
Nodes (17): BM25, detect_domain(), _load_csv(), BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts (+9 more)

### Community 6 - "Dev Tools & Build Config"
Cohesion: 0.09
Nodes (22): devDependencies, autoprefixer, @cloudflare/workers-types, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+14 more)

### Community 7 - "TypeScript App Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 8 - "Security Best Practices Skills"
Cohesion: 0.15
Nodes (21): Security Best Practices Skill Interface, Go Backend Security Spec, Express.js Web Server Security Spec, General Frontend JavaScript Security Spec, jQuery Frontend Security Spec, Next.js Web Server Security Spec, React Frontend Security Spec, Vue.js Frontend Security Spec (+13 more)

### Community 9 - "TypeScript Node Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 10 - "Auth & Admin Layout"
Cohesion: 0.18
Nodes (10): AdminLayout(), AuthContext, AuthContextType, useAuth(), AdminDashboard(), RiderScanner(), AuthPage(), Order (+2 more)

### Community 11 - "Checkout & App Config Context"
Cohesion: 0.18
Nodes (12): CheckoutModal(), MaintenanceGuard(), ConfigContext, ConfigContextType, useConfig(), FasciaOrariaSlot, useOpeningHours(), SettingsManagement() (+4 more)

### Community 12 - "Kitchen Display & Menu Mgmt"
Cohesion: 0.14
Nodes (8): KitchenDisplay(), Order, OrderItem, Window, ALLERGENS_LIST, Order, OrderItem, api

### Community 13 - "Food Cost & Recipe Analysis"
Cohesion: 0.14
Nodes (14): AnalisiTab(), CATEGORY_COLORS, CATEGORY_LABELS, FCIngredient, FCRecipe, FCRecipeItem, fcStatus(), fmt2() (+6 more)

### Community 14 - "Menu Data & Allergens"
Cohesion: 0.14
Nodes (10): ALLERGEN_LABELS, BURGERS, FRIES, SALSE_ALLERGENS, ALLERGEN_LABELS, ALLERGENS, DRINKS, FRIES_ALLERGENS (+2 more)

### Community 15 - "Cart Panel & Order Handling"
Cohesion: 0.18
Nodes (10): AdminPage(), CartPanel(), OrderType, Props, Step, CartExtra, CartFry, CartItem (+2 more)

### Community 16 - "Claude Security Skills"
Cohesion: 0.20
Nodes (14): Security Best Practices OpenAI Agent Config, Go (Golang) Backend Security Spec, Express Web Server Security Spec, JavaScript General Web Frontend Security Spec, jQuery Web Frontend Security Spec, Next.js Web Server Security Spec, React Web Frontend Security Spec, Vue Web Frontend Security Spec (+6 more)

### Community 17 - "Color & Design Token Sync"
Cohesion: 0.29
Nodes (13): blend(), derive_row(), derive_ui_reasoning(), h2r(), is_dark(), lum(), on_color(), r2h() (+5 more)

### Community 18 - "Burger Configurator"
Cohesion: 0.24
Nodes (12): buildSteps(), BurgerConfigurator(), NON_REMOVABLE, Props, Step, STEP_LABELS, CartBurger, PriceOverrides (+4 more)

### Community 19 - "PWA & Page Components"
Cohesion: 0.20
Nodes (4): React Logo SVG, React Framework, testimonials, Vite React Starter Template

### Community 20 - "Supabase Auth & Login"
Cohesion: 0.22
Nodes (7): PBUser, signInWithProvider(), signOut(), SUPABASE_KEY, SUPABASE_URL, Provider, PROVIDERS

### Community 21 - "PWA Manifest"
Cohesion: 0.22
Nodes (8): background_color, display, icons, name, orientation, short_name, start_url, theme_color

### Community 22 - "App Routing & Shell"
Cohesion: 0.22
Nodes (5): AdminPage, LegalPage, LOADING_MESSAGES, LoginPage, MenuDisplay

### Community 23 - "Claude Skills Licensing"
Cohesion: 0.29
Nodes (8): Apache License 2.0 (Frontend Design, Agents), Frontend Design Skill, Apache License 2.0 (Security Best Practices, Agents), UI/UX Pro Max Skill, Apache License 2.0 (Frontend Design, Claude), Frontend Design Skill (Claude), Apache License 2.0 (Security Best Practices, Claude), Distinctive Anti-Template Visual Design Principle

### Community 24 - "Hono API & Auth Utils"
Cohesion: 0.32
Nodes (4): hashPassword(), verifyPassword(), app, Bindings

### Community 25 - "Gamification & Order Tiers"
Cohesion: 0.29
Nodes (7): getOrderCount(), getTier(), incrementOrderCount(), Tier, TIERS, OrderCounter(), ShowcasePage()

### Community 26 - "Menu Data Backup"
Cohesion: 0.25
Nodes (7): ALL_EXTRAS, BurgerDef, BURGERS, BurgerSize, DRINKS, FRIES, FryDef

### Community 27 - "Layout Shell"
Cohesion: 0.38
Nodes (3): Footer(), Header(), LayoutProps

### Community 28 - "Rider Tracker & GPS"
Cohesion: 0.29
Nodes (6): defaultCenter, ISOLA_DEL_LIRI, mapContainerStyle, RiderHistory, RiderLocation, RiderTracker()

### Community 30 - "Order Details Page"
Cohesion: 0.50
Nodes (4): clsx(), Order, OrderDetailsPage(), OrderItem

### Community 33 - "Vercel Deployment"
Cohesion: 0.40
Nodes (4): buildCommand, framework, outputDirectory, rewrites

### Community 34 - "Root Brand Logos"
Cohesion: 0.67
Nodes (4): Just Eat Logo, Deliveroo Logo, Macelleria Franco Capobianco Logo, Non Solo Pane Logo

### Community 35 - "Public Brand Logo Variants"
Cohesion: 0.67
Nodes (4): Deliveroo Logo, Just Eat Logo, Macelleria Franco Capobianco Logo (Production/Red Variant), Macelleria Franco Capobianco Logo (Test/White Variant)

### Community 36 - "Public Burger Visual Identity"
Cohesion: 0.67
Nodes (4): Non Solo Pane Logo (JPG), Public Burger Logo 512px (App Icon), Public Burger Full Brand Logo, Public Burger Favicon (Burger Icon Only)

### Community 37 - "Admin Email Utilities"
Cohesion: 0.67
Nodes (3): FALLBACK_ADMIN_EMAILS, getAdminEmails(), isAdminEmail()

## Ambiguous Edges - Review These
- `Logo MACELL 1980 Brand Design Asset` → `Public Burger Brand Identity`  [AMBIGUOUS]
  LOGO MACELL.1980  DEF.-1.pdf · relation: conceptually_related_to

## Knowledge Gaps
- **204 isolated node(s):** `Bindings`, `app`, `CartDrawerProps`, `DEFAULT_MAP_CENTER`, `CheckoutModalProps` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Logo MACELL 1980 Brand Design Asset` and `Public Burger Brand Identity`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Vite React Starter Template` connect `PWA & Page Components` to `Admin Dashboard & Stats`, `Cart & Checkout Flow`, `Showcase & Menu UI`, `Project Dependencies`, `Auth & Admin Layout`, `Checkout & App Config Context`, `Kitchen Display & Menu Mgmt`, `Food Cost & Recipe Analysis`, `Cart Panel & Order Handling`, `Burger Configurator`, `Supabase Auth & Login`, `App Routing & Shell`, `Layout Shell`, `Rider Tracker & GPS`, `Order Details Page`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `react` connect `Project Dependencies` to `PWA & Page Components`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `Generate full 16-token color row from 4 base colors.`, `Generate ui-reasoning row from products.csv row.`, `BM25 ranking algorithm for text search` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Dashboard & Stats` be split into smaller, more focused modules?**
  _Cohesion score 0.05117845117845118 - nodes in this community are weakly interconnected._
- **Should `UI/UX Design System Generator` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._
- **Should `Cart & Checkout Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._