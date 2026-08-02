import type { ComponentType } from 'react';
import type { TemplateProps } from './types';
import { ElegantTemplate } from './elegant';
import { ModernTemplate } from './modern';
import { MinimalistTemplate } from './minimalist';
import { IslamicTemplate } from './islamic';
import { RusticTemplate } from './rustic';

export const templateRegistry: Record<string, ComponentType<TemplateProps>> = {
  elegant: ElegantTemplate,
  modern: ModernTemplate,
  minimalist: MinimalistTemplate,
  islamic: IslamicTemplate,
  rustic: RusticTemplate,
};

export function getTemplate(
  componentName: string
): ComponentType<TemplateProps> {
  return templateRegistry[componentName] || templateRegistry.elegant;
}
