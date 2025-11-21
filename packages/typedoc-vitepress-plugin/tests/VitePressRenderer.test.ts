import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VitePressRenderer } from '../src/VitePressRenderer'
import { ProjectReflection, DeclarationReflection, ReflectionKind, Options } from 'typedoc'

// Create simple mock functions
const mockExistsSync = vi.fn()
const mockMkdir = vi.fn()
const mockWriteFile = vi.fn()
const mockRm = vi.fn()
const mockReaddir = vi.fn()

// Mock the fs modules
vi.mock('fs', () => ({
  existsSync: mockExistsSync
}))

vi.mock('fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  rm: mockRm,
  readdir: mockReaddir
}))

describe('VitePressRenderer', () => {
  let mockOptions: Options
  let renderer: VitePressRenderer

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock behaviors
    mockExistsSync.mockReturnValue(false)
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
    mockRm.mockResolvedValue(undefined)
    mockReaddir.mockResolvedValue([])
    
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

      await renderer.renderProject(mockProject)

      // Verify directory creation was called
      expect(mockMkdir).toHaveBeenCalledWith('./docs/api', { recursive: true })
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

      mockExistsSync.mockReturnValue(true)

      await incrementalRenderer.renderProject(mockProject)

      // In incremental mode, should not clear directory
      expect(mockRm).not.toHaveBeenCalled()
      expect(mockMkdir).toHaveBeenCalledWith('./docs/api', { recursive: true })
    })

    it('should handle errors during directory operations', async () => {
      const mockProject = {
        name: 'TestProject',
        children: undefined
      } as unknown as ProjectReflection

      mockExistsSync.mockReturnValue(true)
      mockRm.mockRejectedValue(new Error('Permission denied'))

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
        }
      } as unknown as DeclarationReflection

      const mockProject = {
        name: 'TestProject',
        children: [mockReflection]
      } as unknown as ProjectReflection

      mockExistsSync.mockReturnValue(false)
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      await expect(renderer.renderProject(mockProject)).rejects.toThrow('Write failed')
    })
  })
})