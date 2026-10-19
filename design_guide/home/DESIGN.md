---
name: Clarion Books
colors:
  surface: '#f8f9ff'
  surface-dim: '#d5dae7'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e9eefb'
  surface-container-high: '#e3e8f5'
  surface-container-highest: '#dde3ef'
  on-surface: '#161c25'
  on-surface-variant: '#404752'
  inverse-surface: '#2b313a'
  inverse-on-surface: '#ebf1fe'
  outline: '#707783'
  outline-variant: '#c0c7d4'
  surface-tint: '#0060a8'
  primary: '#005ea4'
  on-primary: '#ffffff'
  primary-container: '#0077ce'
  on-primary-container: '#fdfcff'
  inverse-primary: '#a2c9ff'
  secondary: '#555f6e'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f2'
  on-secondary-container: '#596372'
  tertiary: '#b6152e'
  on-tertiary: '#ffffff'
  tertiary-container: '#d93344'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#a2c9ff'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#004881'
  secondary-fixed: '#d9e3f5'
  secondary-fixed-dim: '#bdc7d9'
  on-secondary-fixed: '#121c29'
  on-secondary-fixed-variant: '#3d4756'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#ffb3b2'
  on-tertiary-fixed: '#410008'
  on-tertiary-fixed-variant: '#92001f'
  background: '#f8f9ff'
  on-background: '#161c25'
  surface-variant: '#dde3ef'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-clarity Korean digital editorial minimalism, inspired by contemporary mobile reading platforms such as Ridi and Toss-era commerce apps. The visual language favors absolute content legibility, crisp structural hierarchy, and calm, unadorned surfaces. 

The emotional tone balances literary trust with modern digital agility: effortless browsing, quiet reading focus, and frictionless purchase utility. Key aesthetic pillars include:
- **Pure White Canvases:** Seamless background surfaces without decorative gradients or heavy card elevation.
- **Editorial Micro-Detailing:** Ultra-fine 1px divider lines, precise metadata typography, and carefully measured vertical rhythm.
- **Cobalt Electric Focus:** High-contrast blue accents used sparingly for actionable commitments (buying, reading, primary actions) and vibrant user feedback.

## Colors

The palette is engineered around pure whites, deep functional charcoals, and high-energy cobalt highlights:

- **Primary (`#1E88E5` / `#3182F6`):** Vibrant cobalt blue used for main conversion buttons (e.g., "소장", "구매"), active tab indicators, and critical links.
- **Secondary (`#333D4B`):** Deep slate grey used for secondary actions, subtle interactive states, and strong subheadings.
- **Tertiary (`#F04452`):** Vivid Korean editorial red/coral used exclusively for ratings stars (`★ 4.8`), discount percentages, and badge alerts.
- **Neutrals:**
  - Base Background: `#FFFFFF` (Pure White).
  - Background Subtle: `#F8F9FA` / `#F1F3F5` (Segmented backgrounds, preview sheets, pill badges).
  - Borders & Hairlines: `#F1F3F5` (Subtle list dividers) and `#E9ECEF` (Interactive component borders).
  - Text Primary: `#191F28` (Korean headlines, primary book titles).
  - Text Secondary: `#4E5968` / `#333D4B` (Authors, publishers, category chains).
  - Text Muted: `#8B95A1` (Ranking numbers, review counts, timestamps, disabled states).

## Typography

Typography prioritizes Korean character readability (Hangul) along with Latin numeral sharpness. `Plus Jakarta Sans` is matched with system CJK falls (Pretendard / Apple SD Gothic Neo / Noto Sans KR).

- **Headlines (`headline-lg`, `headline-md`):** Compact vertical line-heights prevent Korean word-wraps from blowing out vertical screen real estate.
- **Rankings & Numerals:** Best-seller indices (1, 2, 3...) use `headline-md` with `fontWeight: 600` and muted charcoal tint (`#191F28` for top ranks, `#8B95A1` for standard ranks).
- **Metadata Strings:** Author, publisher, and genre pairings (`김난도 외 12명 · 미래의창`) use `body-sm` (`13px`) with a fixed subtle pipe or bullet delimiter to maintain clear line separation.

## Layout & Spacing

The layout is built for hand-held vertical rhythm:
- **Margins:** Standard mobile canvas padding is `1.25rem` (20px) on outer sides, reducing to `1rem` (16px) on compact handsets.
- **Book Details Layout:** Uses a two-tier presentation: an upper hero region with a soft blurred ambient backdrop behind the primary book jacket, transitioning seamlessly via an arched sheet into the white product body.
- **Book List Matrix:** Vertical ranked list items feature a strict 80px thumbnail width, 24px left ranking indicator column, and flexible content column separated by a hairline border (`#F1F3F5`) with `space-lg` (20px) vertical padding.
- **Responsive Handling:** On tablet and wide views, book listing converts into a multi-column fluid grid (2 to 3 columns) while preserving the 1:1.45 aspect ratio standard of paperback covers.

## Elevation & Depth

This design system avoids heavy drop-shadows and skeuomorphic embossing in favor of flat editorial layers:

- **Flat White Tiers:** Elevated sheets and floating bars rely on `#FFFFFF` backgrounds bordered by a subtle 1px line (`#F1F3F5`) instead of prominent shadows.
- **Book Cover Dimension:** Books receive an ultra-delicate 1px inset border (`rgba(0, 0, 0, 0.08)`) and an ambient, whisper-soft shadow (`0 4px 12px rgba(0, 0, 0, 0.06)`) to lift the cover gently above the flat surface.
- **Bottom Action Drawer:** The fixed bottom purchase navigation bar rests on an ambient top border (`#F1F3F5`) backed by `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(12px)`.

## Shapes

The interface balances sharp editorial discipline with modern mobile tactility:
- **Book Covers:** Retain tight, natural paper corners (`4px` radius) with a 1px boundary stroke to mimic real print volumes.
- **Interactive Surfaces:** Standard cards and preview modules employ `0.5rem` (8px) corner rounding.
- **Floating Modals & Bottom Sheets:** Feature soft `1rem` (16px) top corner radii.
- **Chips & Pills:** Filter pills and status indicators use fully circular/pill geometries (`9999px`) for quick tactile identification.

## Components

### Buttons
- **Primary Action (Purchase/Read):** Full-width or dominant button styled with primary cobalt (`#1E88E5`), 10px-12px vertical padding, 8px border radius, bold white text (`15px`), accompanied by dynamic price metadata (e.g., "소장 15,400원").
- **Secondary / Preview Buttons:** Ghost or light-grey outline buttons (`#FFFFFF` fill, 1px border `#E9ECEF`, text `#333D4B`) with `8px` corner radius.
- **Icon Action Buttons (Wishlist, Share, More):** Transparent round touch targets (40×40px) with clean monochrome vector strokes (`#191F28`).

### Book List Item (Best-seller format)
- Left ranking index (fixed 24px width, centered/left-aligned, bold typography).
- Book thumbnail (60-80px width, aspect ratio 1:1.45, subtle rounded corners, 1px boundary stroke).
- Right detail stack:
  - Title: Bold `15px` (`#191F28`), max 2 lines with truncation.
  - Subtitle/Authors: `13px` (`#4E5968`), single line.
  - Rating & Review: Coral star (`★ #F04452`) alongside score and count in parentheses (`4.1(24)`).
- Separator: 1px hairline horizontal rule (`#F1F3F5`) spanning the full content width.

### Detail Navigation & Tab Bars
- **Segmented Page Tabs (Info / Reviews / Recommendations):** Equal width, flat, borderless design. Active tab features a 2px `#191F28` or `#1E88E5` bottom accent bar with bold text; inactive tabs use muted slate (`#8B95A1`).
- **Floating Bottom Bar:** Fixed height 64px bar featuring quick-access Wish (`위시`), Cart (`카트`), and an expanded Cobalt primary action button (`소장 / 대여`).

### Badges & Chips
- Category pills and metadata indicators use faint grey backgrounds (`#F8F9FA`), subtle `#E9ECEF` outlines, and compact `11px` typography (`#4E5968`).