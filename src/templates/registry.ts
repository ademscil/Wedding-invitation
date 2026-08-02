import type { ComponentType } from 'react';
import type { TemplateProps } from './types';
import { ElegantTemplate } from './elegant';
import { ModernTemplate } from './modern';
import { MinimalistTemplate } from './minimalist';

export const templateRegistry: Record<string, ComponentType<TemplateProps>> = {
  elegant: ElegantTemplate,
  modern: ModernTemplate,
  minimalist: MinimalistTemplate,
};

export function getTemplate(
  componentName: string
): ComponentType<TemplateProps> {
  return templateRegistry[componentName] || templateRegistry.elegant;
}
