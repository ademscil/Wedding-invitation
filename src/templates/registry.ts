import type { ComponentType } from 'react';
import type { TemplateProps } from './types';
import { ElegantTemplate } from './elegant';
import { ModernTemplate } from './modern';
import { MinimalistTemplate } from './minimalist';
import { IslamicTemplate } from './islamic';
import { RusticTemplate } from './rustic';
import { ChristianTemplate } from './christian';
import { JavaneseTemplate } from './javanese';
import { ModernDarkTemplate } from './modern-dark';
import { ChineseTemplate } from './chinese';
import { FloralTemplate } from './floral';
import { VintageArchTemplate } from './vintage-arch';
import { BotanicalLineTemplate } from './botanical-line';
import { RoyalGoldTemplate } from './royal-gold';
import { FloralVintageTemplate } from './floral-vintage';

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
