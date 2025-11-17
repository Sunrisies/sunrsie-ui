import { describe, it, expect } from 'vitest'
import { SlugGenerator } from '../src/SlugGenerator'

describe('SlugGenerator', () => {
  describe('generateSlug', () => {
    it('should convert basic ASCII names to lowercase', () => {
      expect(SlugGenerator.generateSlug('MyClass')).toBe('myclass')
      expect(SlugGenerator.generateSlug('HTTPClient')).toBe('httpclient')
      expect(SlugGenerator.generateSlug('myFunction')).toBe('myfunction')
    })

    it('should handle names with spaces and special characters', () => {
      expect(SlugGenerator.generateSlug('My Class Name')).toBe('my-class-name')
      expect(SlugGenerator.generateSlug('Special@Class#Name')).toBe('specialclassname')
      expect(SlugGenerator.generateSlug('My-Class-Name')).toBe('my-class-name')
    })

    it('should handle Chinese characters', () => {
      const result = SlugGenerator.generateSlug('函数名称')
      // Chinese characters get normalized to empty string, so it should be a hash
      expect(result).toMatch(/^[a-f0-9]{8}$/)
    })

    it('should handle Japanese characters', () => {
      const result = SlugGenerator.generateSlug('関数名')
      // Japanese characters get normalized to empty string, so it should be a hash
      expect(result).toMatch(/^[a-f0-9]{8}$/)
    })

    it('should handle very long names', () => {
      const longName = 'ThisIsAVeryLongClassNameThatExceedsTheMaximumLengthAllowed'
      const result = SlugGenerator.generateSlug(longName)
      expect(result.length).toBeLessThanOrEqual(60) // 50 + hash + separator
      expect(result).toMatch(/^[a-z0-9-]+-[a-f0-9]{8}$/)
    })

    it('should handle empty names', () => {
      expect(SlugGenerator.generateSlug('')).toBe('unknown')
    })

    it('should handle names with only special characters', () => {
      // Special characters get removed, resulting in empty string, which becomes a hash
      expect(SlugGenerator.generateSlug('@#$%^&*()')).toMatch(/^[a-f0-9]{8}$/)
    })

    it('should produce consistent results for the same input', () => {
      const name = 'MyTestClass123'
      const result1 = SlugGenerator.generateSlug(name)
      const result2 = SlugGenerator.generateSlug(name)
      expect(result1).toBe(result2)
    })

    it('should handle names with diacritics', () => {
      expect(SlugGenerator.generateSlug('Café')).toBe('cafe')
      expect(SlugGenerator.generateSlug('Naïve')).toBe('naive')
      expect(SlugGenerator.generateSlug('Résumé')).toBe('resume')
    })
  })

  describe('generateFilePath', () => {
    it('should generate correct file paths', () => {
      expect(SlugGenerator.generateFilePath('MyClass', './docs/api'))
        .toBe('./docs/api/myclass.md')
      
      expect(SlugGenerator.generateFilePath('My Class', './docs'))
        .toBe('./docs/my-class.md')
    })

    it('should handle non-ASCII characters in file paths', () => {
      const result = SlugGenerator.generateFilePath('函数名称', './docs/api')
      // Chinese characters result in hash-based slug
      expect(result).toMatch(/^\.\/docs\/api\/[a-f0-9]{8}\.md$/)
    })
  })
})