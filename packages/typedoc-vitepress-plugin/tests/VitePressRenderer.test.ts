import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VitePressRenderer } from '../src/VitePressRenderer'
import { ProjectReflection, DeclarationReflection, ReflectionKind, Options } from 'typedoc'

// Mock fs modules with factory functions
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    existsSync: vi.fn(),
    promises: {
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rm: vi.fn(),
      readdir: vi.fn(),
      readFile: vi.fn(),
      unlink: vi.fn()
    }
  }
})

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  rm: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn()
}))

describe('VitePressRenderer', () => {
  let mockOptions: Options
  let renderer: VitePressRenderer

  beforeEach(async () => {
    // Import mocked modules inside beforeEach
    const fs = await import('fs')
    const fsPromises = await import('fs/promises')
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock behaviors
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.promises.rm).mockResolvedValue(undefined)
    vi.mocked(fs.promises.readdir).mockResolvedValue([])
    vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined)
    vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined)
    vi.mocked(fsPromises.rm).mockResolvedValue(undefined)
    vi.mocked(fsPromises.readdir).mockResolvedValue([])
    
    mockOptions = {
      getValue: vi.fn((key: string) => {
        switch (key) {
          case 'vitepressOutput':
            return './docs/api'
          case 'vitepressBaseUrl':
            return '/'
          case 'vitepressTitle':
            return 'API Documentation'
          case 'vitepressDescription':
            return 'Generated API documentation'
          case 'vitepressIncremental':
            return false
          default:
            return undefined
        }
      })
    } as unknown as Options

    renderer = new VitePressRenderer(mockOptions)
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const renderer = new VitePressRenderer(mockOptions)
      expect(renderer).toBeDefined()
    })

    it('should use custom options when provided', () => {
      const customOptions = {
        getValue: vi.fn((key: string) => {
          switch (key) {
            case 'vitepressOutput':
              return './custom/docs'
            case 'vitepressBaseUrl':
              return '/api/'
            case 'vitepressTitle':
              return 'Custom API'
            case 'vitepressDescription':
              return 'Custom description'
            default:
              return undefined
          }
        })
      } as unknown as Options

      const renderer = new VitePressRenderer(customOptions)
      expect(renderer).toBeDefined()
    })
  })

  describe('renderProject', () => {
    it('should render project with no children', async () => {
      const mockProject = {
        name: 'TestProject',
        children: undefined
      } as unknown as ProjectReflection

      const fs = await import('fs')
      await renderer.renderProject(mockProject)

      // Verify directory creation was called
      expect(fs.promises.mkdir).toHaveBeenCalledWith('./docs/api', { recursive: true })
    })

    it('should handle incremental generation mode', async () => {
      const incrementalOptions = {
        getValue: vi.fn((key: string) => {
          switch (key) {
            case 'vitepressOutput':
              return './docs/api'
            case 'vitepressIncremental':
              return true
            default:
              return undefined
          }
        })
      } as unknown as Options

      const incrementalRenderer = new VitePressRenderer(incrementalOptions)
      const mockProject = {
        name: 'TestProject',
        children: undefined
      } as unknown as ProjectReflection

      const fs = await import('fs')
      
      vi.mocked(fs.existsSync).mockReturnValue(true)

      await incrementalRenderer.renderProject(mockProject)

      // In incremental mode, should not clear directory
      expect(fs.promises.rm).not.toHaveBeenCalled()
      expect(fs.promises.mkdir).toHaveBeenCalledWith('./docs/api', { recursive: true })
    })

    it('should handle errors during directory operations', async () => {
      const mockProject = {
        name: 'TestProject',
        children: undefined
      } as unknown as ProjectReflection

      const fs = await import('fs')
      
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.promises.rm).mockRejectedValue(new Error('Permission denied'))

      await expect(renderer.renderProject(mockProject)).rejects.toThrow('Permission denied')
    })
  })

  describe('error handling', () => {
    it('should handle file write errors', async () => {
      const mockReflection = {
        name: 'TestFunction',
        kind: ReflectionKind.Function,
        comment: {
          shortText: 'Test function'
        },
        signatures: [{
          parameters: [],
          type: { type: 'intrinsic', name: 'void' }
        }]
      } as unknown as DeclarationReflection

      const mockProject = {
        name: 'TestProject',
        children: [mockReflection]
      } as unknown as ProjectReflection

      const fs = await import('fs')
      
      vi.mocked(fs.promises.writeFile).mockRejectedValue(new Error('Write failed'))

      await expect(renderer.renderProject(mockProject)).rejects.toThrow('Write failed')
    })
  })
})