# Directory Structure

> How frontend (Flutter/Dart) code is organized in this project.

---

## Overview

MemexFlow frontend is a Flutter application targeting **macOS + Windows** first, with **iOS + Android** as second phase. The project uses feature-first organization with a shared core layer.

---

## Directory Layout

```
app/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── app.dart                     # MaterialApp / router setup
│   ├── core/                        # Shared infrastructure
│   │   ├── config/                  # App config, env, constants
│   │   │   ├── app_config.dart
│   │   │   └── constants.dart
│   │   ├── database/                # SQLite local database
│   │   │   ├── database.dart        # Database singleton
│   │   │   ├── tables.dart          # Drift table definitions
│   │   │   └── daos/               # Data access objects
│   │   ├── network/                 # Supabase client, API helpers
│   │   │   ├── supabase_client.dart
│   │   │   └── api_error.dart
│   │   ├── models/                  # Shared domain models
│   │   │   ├── project.dart
│   │   │   ├── candidate.dart
│   │   │   ├── memory.dart
│   │   │   └── brief.dart
│   │   ├── theme/                   # Theme data, colors, typography
│   │   │   ├── app_theme.dart
│   │   │   └── app_colors.dart
│   │   ├── routing/                 # GoRouter configuration
│   │   │   └── app_router.dart
│   │   └── utils/                   # Pure utility functions
│   │       ├── date_utils.dart
│   │       └── string_utils.dart
│   ├── features/                    # Feature modules
│   │   ├── home/
│   │   │   ├── home_screen.dart
│   │   │   └── widgets/
│   │   ├── projects/
│   │   │   ├── projects_screen.dart
│   │   │   ├── project_detail_screen.dart
│   │   │   ├── providers/
│   │   │   └── widgets/
│   │   ├── capture/
│   │   │   ├── capture_screen.dart
│   │   │   ├── providers/
│   │   │   └── widgets/
│   │   ├── signals/
│   │   │   ├── signals_screen.dart
│   │   │   ├── providers/
│   │   │   └── widgets/
│   │   ├── memory/
│   │   │   ├── memory_screen.dart
│   │   │   ├── providers/
│   │   │   └── widgets/
│   │   ├── briefs/
│   │   │   ├── briefs_screen.dart
│   │   │   ├── providers/
│   │   │   └── widgets/
│   │   └── recall/
│   │       ├── recall_screen.dart
│   │       ├── providers/
│   │       └── widgets/
│   └── shared/                      # Reusable widgets across features
│       ├── widgets/
│       │   ├── candidate_card.dart
│       │   ├── memory_card.dart
│       │   ├── project_selector.dart
│       │   └── tag_chips.dart
│       └── layouts/
│           ├── scaffold_with_nav.dart
│           └── responsive_layout.dart
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── pubspec.yaml
└── analysis_options.yaml
```

---

## Module Organization

### Feature-first structure

Each feature in `features/` contains:
- **Screen widgets** — top-level page widgets
- **providers/** — Riverpod providers for state and data access
- **widgets/** — feature-specific widgets (not reusable outside the feature)

### Rules

1. **Features don't import from other features** — share via `core/` or `shared/`
2. **core/** has no Flutter widget imports — it's pure Dart (models, database, network)
3. **shared/widgets/** contains reusable UI components used by 2+ features
4. **One widget per file** for top-level widgets; small helper widgets can be in the same file

### Adding a new feature

1. Create directory under `features/<feature_name>/`
2. Add screen widget(s)
3. Add providers in `providers/`
4. Add feature-specific widgets in `widgets/`
5. Register routes in `core/routing/app_router.dart`

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `snake_case.dart` | `project_detail_screen.dart` |
| Classes | `PascalCase` | `ProjectDetailScreen` |
| Widgets | `PascalCase`, suffix describes type | `CandidateCard`, `MemoryListTile` |
| Screens | `*Screen` suffix | `HomeScreen`, `BriefsScreen` |
| Providers | `camelCase` + `Provider` suffix | `projectListProvider` |
| Extensions | `*Extension` suffix | `DateTimeExtension` |
| Constants | `camelCase` for top-level | `defaultPadding` |
| Private | Leading underscore | `_buildHeader()` |
| Test files | `<file>_test.dart` | `candidate_card_test.dart` |

---

## Examples

- Feature module: `lib/features/projects/`
- Shared widget: `lib/shared/widgets/candidate_card.dart`
- Domain model: `lib/core/models/project.dart`
- Provider: `lib/features/projects/providers/project_list_provider.dart`
