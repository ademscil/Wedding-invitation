import { describe, it, expect } from 'vitest';
import { templateRegistry, getTemplate } from '@/templates/registry';

describe('templateRegistry', () => {
  it('resolves every registered template to a component', () => {
    for (const [name, component] of Object.entries(templateRegistry)) {
      expect(component, `template "${name}" is not a component`).toBeDefined();
      expect(['function', 'object']).toContain(typeof component);
    }
  });

  it('includes the floral-vintage template', () => {
    expect(templateRegistry).toHaveProperty('floral-vintage');
    expect(getTemplate('floral-vintage')).toBe(
      templateRegistry['floral-vintage']
    );
  });

  it('falls back to elegant for an unknown component name', () => {
    expect(getTemplate('does-not-exist')).toBe(templateRegistry.elegant);
  });
});
