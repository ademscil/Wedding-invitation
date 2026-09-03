import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { TemplateProps, TemplateTheme } from './types';
import { elegantTheme } from './elegant';
import { modernTheme } from './modern';
import { minimalistTheme } from './minimalist';
import { islamicTheme } from './islamic';
import { rusticTheme } from './rustic';
import { christianTheme } from './christian';
import { javaneseTheme } from './javanese';
import { modernDarkTheme } from './modern-dark';
import { chineseTheme } from './chinese';
import { floralTheme } from './floral';
import { theme as vintageArchTheme } from './vintage-arch';
import { theme as botanicalLineTheme } from './botanical-line';
import { theme as royalGoldTheme } from './royal-gold';
import { theme as floralVintageTheme } from './floral-vintage';

export const templateRegistry: Record<string, ComponentType<TemplateProps>> = {
  elegant: dynamic(() => import('./elegant').then((m) => m.ElegantTemplate)),
  modern: dynamic(() => import('./modern').then((m) => m.ModernTemplate)),
  minimalist: dynamic(() => import('./minimalist').then((m) => m.MinimalistTemplate)),
  islamic: dynamic(() => import('./islamic').then((m) => m.IslamicTemplate)),
  rustic: dynamic(() => import('./rustic').then((m) => m.RusticTemplate)),
  christian: dynamic(() => import('./christian').then((m) => m.ChristianTemplate)),
  javanese: dynamic(() => import('./javanese').then((m) => m.JavaneseTemplate)),
  'modern-dark': dynamic(() => import('./modern-dark').then((m) => m.ModernDarkTemplate)),
  chinese: dynamic(() => import('./chinese').then((m) => m.ChineseTemplate)),
  floral: dynamic(() => import('./floral').then((m) => m.FloralTemplate)),
  'vintage-arch': dynamic(() => import('./vintage-arch').then((m) => m.VintageArchTemplate)),
  'botanical-line': dynamic(() => import('./botanical-line').then((m) => m.BotanicalLineTemplate)),
  'royal-gold': dynamic(() => import('./royal-gold').then((m) => m.RoyalGoldTemplate)),
  'floral-vintage': dynamic(() => import('./floral-vintage').then((m) => m.FloralVintageTemplate)),
};

export function getTemplate(
  componentName: string
): ComponentType<TemplateProps> {
  return templateRegistry[componentName] || templateRegistry.elegant;
}

/**
 * The palette each template renders with, keyed the same way as the registry.
 *
 * The desktop frame paints the area beside the invitation, so it has to know
 * the template's own background — otherwise the page reads as a narrow strip
 * floating on an unrelated colour. Only the base palette is published here:
 * a couple's custom primary/secondary applies inside the invitation, while the
 * backdrop stays the template's own.
 */
export const templateThemes: Record<string, TemplateTheme> = {
  elegant: elegantTheme,
  modern: modernTheme,
  minimalist: minimalistTheme,
  islamic: islamicTheme,
  rustic: rusticTheme,
  christian: christianTheme,
  javanese: javaneseTheme,
  'modern-dark': modernDarkTheme,
  chinese: chineseTheme,
  floral: floralTheme,
  'vintage-arch': vintageArchTheme,
  'botanical-line': botanicalLineTheme,
  'royal-gold': royalGoldTheme,
  'floral-vintage': floralVintageTheme,
};

export function getTemplateTheme(componentName: string): TemplateTheme {
  return templateThemes[componentName] || templateThemes.elegant;
}
