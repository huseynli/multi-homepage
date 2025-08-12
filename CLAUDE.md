# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homepage is a Next.js-based application dashboard that provides a customizable startpage with integrations for over 100 services. It's designed to be fully static, fast, and secure with proxied API requests.

## Development Commands

**Package Manager**: This project uses `pnpm` (required, enforced by preinstall hook)

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build production bundle
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

**Note**: No test framework is currently configured in this project.

## Architecture Overview

### Core Structure
- **Next.js 15** with React 18, using standalone output mode
- **Tailwind CSS 4** for styling with custom theme system
- **SWR** for data fetching and caching
- **i18next** for internationalization (40+ languages supported)

### Key Directories

- `/src/pages/` - Next.js pages and API routes
- `/src/components/` - Reusable React components (bookmarks, services, widgets, toggles)
- `/src/widgets/` - 100+ service integrations, each with component.jsx and widget.js
- `/src/utils/` - Utilities for config, contexts, proxy handling, and theming
- `/config/` - YAML configuration files (services, bookmarks, widgets, settings)
- `/src/skeleton/` - Default configuration templates

### Configuration System

Homepage uses YAML-based configuration with environment variable substitution:
- `settings.yaml` - Main application settings
- `services.yaml` - Service definitions and layouts
- `bookmarks.yaml` - Bookmark groups
- `widgets.yaml` - Information widgets configuration
- `docker.yaml` - Docker integration settings

Configuration files are auto-created from `/src/skeleton/` if missing.

### Widget Architecture

Each service widget follows a standard pattern:
- `component.jsx` - React component for display
- `widget.js` - Data fetching and API integration logic
- `proxy.js` - Optional proxy configuration for API calls

### Theme and Styling

- Custom CSS variables for theme colors (`--color-50` to `--color-900`)
- Dynamic theme switching (light/dark/auto)
- Multiple color schemes (slate, gray, zinc, etc.)
- Backdrop blur and transparency effects
- Custom CSS/JS injection support

### Context Providers

- `ThemeContext` - Theme management
- `ColorContext` - Color scheme selection
- `SettingsContext` - Application settings
- `TabContext` - Tab navigation state

### API Structure

API routes handle:
- `/api/services` - Service data and status
- `/api/bookmarks` - Bookmark configuration
- `/api/widgets` - Widget data fetching
- `/api/config/[path]` - Dynamic configuration access
- Proxy endpoints for secure API forwarding

### Service Integration Pattern

Services integrate through standardized patterns:
1. Define service in `services.yaml`
2. Create widget component in `/src/widgets/[service]/`
3. Implement data fetching logic
4. Add proxy configuration if needed
5. Services auto-discover via Docker labels

## Development Notes

- Uses ESLint with Next.js, Prettier, and React-specific rules
- TypeScript config present but project uses JSX/JS
- Custom Tailwind safelist for dynamic classes
- Static generation at build time for performance
- Docker integration for container status/stats
- Kubernetes integration for cluster monitoring

## Configuration Tips

- YAML files support environment variable substitution with `{{HOMEPAGE_VAR_*}}` syntax
- Docker services can auto-discover via container labels
- Layout system supports tabs and responsive grid columns
- Widgets can be positioned left or right aligned
- Background images, blur, and opacity effects supported