import { describe, it, expect } from 'vitest'
import { CommentParser } from '../src/CommentParser'
import { DeclarationReflection, ReflectionKind, Comment, ProjectReflection } from 'typedoc'

describe('CommentParser', () => {
  describe('getCategory', () => {
    it('should extract category from comment block tags', () => {
      const reflection = {
        comment: {
          blockTags: [
            { tag: '@category', content: [{ text: 'Utilities' }] }
          ]
        }
      } as DeclarationReflection

      expect(CommentParser.getCategory(reflection)).toBe('Utilities')
    })

    it('should extract category from signatures', () => {
      const reflection = {
        signatures: [{
          comment: {
            blockTags: [
              { tag: '@category', content: [{ text: 'Network' }] }
            ]
          }
        }]
      } as DeclarationReflection

      expect(CommentParser.getCategory(reflection)).toBe('Network')
    })

    it('should return null when no category tag exists', () => {
      const reflection = {
        comment: {
          blockTags: [
            { tag: '@param', content: [{ text: 'param description' }] }
          ]
        }
      } as DeclarationReflection

      expect(CommentParser.getCategory(reflection)).toBeNull()
    })
  })

  describe('getModuleTag', () => {
    it('should extract module tag from comment', () => {
      const reflection = {
        comment: {
          blockTags: [
            { tag: '@module', content: [{ text: 'HTTP' }] }
          ]
        }
      } as DeclarationReflection

      expect(CommentParser.getModuleTag(reflection)).toBe('HTTP')
    })

    it('should extract module tag from signatures', () => {
      const reflection = {
        signatures: [{
          comment: {
            blockTags: [
              { tag: '@module', content: [{ text: 'Utils' }] }
            ]
          }
        }]
      } as DeclarationReflection

      expect(CommentParser.getModuleTag(reflection)).toBe('Utils')
    })
  })

  describe('getFullDescription', () => {
    it('should combine shortText and text from comment', () => {
      const reflection = {
        comment: {
          shortText: 'Short description',
          text: 'Longer description with details'
        }
      } as DeclarationReflection

      const result = CommentParser.getFullDescription(reflection)
      expect(result).toBe('Short description\n\nLonger description with details')
    })

    it('should return only shortText if text is empty', () => {
      const reflection = {
        comment: {
          shortText: 'Short description',
          text: ''
        }
      } as DeclarationReflection

      const result = CommentParser.getFullDescription(reflection)
      expect(result).toBe('Short description')
    })

    it('should return default description when no comment exists', () => {
      const reflection = {
        name: 'MyFunction',
        kind: ReflectionKind.Function
      } as DeclarationReflection

      const result = CommentParser.getFullDescription(reflection)
      expect(result).toBe('MyFunction function')
    })
  })

  describe('getFunctionDescription', () => {
    it('should extract function description from @function tag', () => {
      const reflection = {
        comment: {
          tags: [
            { tagName: 'function', text: 'Creates a new user' }
          ]
        }
      } as DeclarationReflection

      expect(CommentParser.getFunctionDescription(reflection)).toBe('Creates a new user')
    })

    it('should extract from signatures if not in main comment', () => {
      const reflection = {
        signatures: [{
          comment: {
            tags: [
              { tagName: 'function', text: 'Processes data' }
            ]
          }
        }]
      } as DeclarationReflection

      expect(CommentParser.getFunctionDescription(reflection)).toBe('Processes data')
    })

    it('should return null when no function tag exists', () => {
      const reflection = {
        comment: {
          tags: [
            { tagName: 'param', text: 'param description' }
          ]
        }
      } as DeclarationReflection

      expect(CommentParser.getFunctionDescription(reflection)).toBeNull()
    })
  })
})