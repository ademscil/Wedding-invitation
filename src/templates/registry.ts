import type { ComponentType } from 'react';
import type { TemplateProps, TemplateTheme } from './types';
import { ElegantTemplate, elegantTheme } from './elegant';
import { ModernTemplate, modernTheme } from './modern';
import { MinimalistTemplate, minimalistTheme } from './minimalist';
import { IslamicTemplate, islamicTheme } from './islamic';
import { RusticTemplate, rusticTheme } from './rustic';
import { ChristianTemplate, christianTheme } from './christian';
import { JavaneseTemplate, javaneseTheme } from './javanese';
import { ModernDarkTemplate, modernDarkTheme } from './modern-dark';
import { ChineseTemplate, chineseTheme } from './chinese';
import { FloralTemplate, floralTheme } from './floral';
import { VintageArchTemplate, theme as vintageArchTheme } from './vintage-arch';
import { BotanicalLineTemplate, theme as botanicalLineTheme } from './botanical-line';
import { RoyalGoldTemplate, theme as royalGoldTheme } from './royal-gold';
import { FloralVintageTemplate, theme as floralVintageTheme } from './floral-vintage';

export const templateRegistry: Record<string, ComponentType<TemplateProps>> = {
  elegant: ElegantTemplate,
  modern: ModernTemplate,
  minimalist: MinimalistTemplate,
  islamic: IslamicTemplate,
  rustic: RusticTemplate,
  christian: ChristianTemplate,
  javanese: JavaneseTemplate,
  'modern-dark': ModernDarkTemplate,
  chinese: ChineseTemplate,
  floral: FloralTemplate,
  'vintage-arch': VintageArchTemplate,
  'botanical-line': BotanicalLineTemplate,
  'royal-gold': RoyalGoldTemplate,
  'floral-vintage': FloralVintageTemplate,
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
