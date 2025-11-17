import { describe, it, expect, beforeEach, vi } from 'vitest'
import { load } from '../src/index'
import { Application, ParameterType, Converter, Context, EventDispatcher } from 'typedoc'
import { VitePressRenderer } from '../src/VitePressRenderer'

// Mock the VitePressRenderer
vi.mock('../src/VitePressRenderer', () => {
  return {
    VitePressRenderer: vi.fn().mockImplementation(() => ({
      renderProject: vi.fn().mockResolvedValue(undefined)
    }))
  }
})

describe('TypeDoc VitePress Plugin', () => {
  let mockApp: Application
  let mockOptions: any
  let mockConverter: any
  let mockEventDispatcher: EventDispatcher

  beforeEach(() => {
    mockOptions = {
      addDeclaration: vi.fn(),
      getValue: vi.fn()
    }
    
    mockConverter = {
      on: vi.fn()
    }
    
    mockEventDispatcher = {
      on: vi.fn()
    } as unknown as EventDispatcher
    
    mockApp = {
      options: mockOptions,
      converter: mockConverter
    } as unknown as Application
    
    // Mock the type assertion
    Object.defineProperty(mockApp.converter, 'as EventDispatcher', {
      get: () => mockEventDispatcher,
      configurable: true
    })
  })

  describe('load function', () => {
    it('should register all required options', () => {
      load(mockApp)
      
      expect(mockOptions.addDeclaration).toHaveBeenCalledTimes(5)
      
      // Check vitepressOutput option
      expect(mockOptions.addDeclaration).toHaveBeenCalledWith({
        name: 'vitepressOutput',
        help: 'Output directory for VitePress documentation',
        type: ParameterType.String,
        defaultValue: './docs/.vitepress/api'
      })
      
      // Check vitepressBaseUrl option
      expect(mockOptions.addDeclaration).toHaveBeenCalledWith({
        name: 'vitepressBaseUrl',
        help: 'Base URL for VitePress documentation',
        type: ParameterType.String,
        defaultValue: '/'
      })
      
      // Check vitepressTitle option
      expect(mockOptions.addDeclaration).toHaveBeenCalledWith({
        name: 'vitepressTitle',
        help: 'Title for VitePress documentation',
        type: ParameterType.String,
        defaultValue: 'API Documentation'
      })
      
      // Check vitepressDescription option
      expect(mockOptions.addDeclaration).toHaveBeenCalledWith({
        name: 'vitepressDescription',
        help: 'Description for VitePress documentation',
        type: ParameterType.String,
        defaultValue: 'Auto-generated API documentation'
      })
      
      // Check vitepressIncremental option
      expect(mockOptions.addDeclaration).toHaveBeenCalledWith({
        name: 'vitepressIncremental',
        help: 'Enable incremental generation (only regenerate changed files)',
        type: ParameterType.Boolean,
        defaultValue: false
      })
    })

    it('should register event listener for Converter.EVENT_END', () => {
      load(mockApp)
      
      expect(mockConverter.on).toHaveBeenCalledWith(
        Converter.EVENT_END,
        expect.any(Function)
      )
    })

    it('should handle event and render project', async () => {
      load(mockApp)
      
      // Get the event handler
      const eventHandler = mockConverter.on.mock.calls[0][1]
      
      // Create mock context
      const mockContext = {
        project: { name: 'TestProject' }
      } as Context
      
      // Call the event handler
      await eventHandler(mockContext)
      
      // Verify VitePressRenderer was created and renderProject was called
      expect(VitePressRenderer).toHaveBeenCalledWith(mockOptions)
      expect(VitePressRenderer).toHaveBeenCalledTimes(1)
    })

    it('should handle rendering errors', async () => {
      // Mock console.error to verify error handling
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock VitePressRenderer to throw error
      const mockRenderProject = vi.fn().mockRejectedValue(new Error('Render failed'))
      vi.mocked(VitePressRenderer).mockImplementation(() => ({
        renderProject: mockRenderProject
      }))
      
      load(mockApp)
      
      const eventHandler = mockConverter.on.mock.calls[0][1]
      const mockContext = {
        project: { name: 'TestProject' }
      } as Context
      
      // Should throw the error
      await expect(eventHandler(mockContext)).rejects.toThrow('Render failed')
      
      consoleError.mockRestore()
    })
  })
})