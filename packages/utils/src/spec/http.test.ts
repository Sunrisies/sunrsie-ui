import { afterEach, beforeEach, describe, expect, it, vi, test } from 'vitest';
import { ApiResponse, downloadFile, Http, URLSearchParamsUtils } from '../browser/index';

// 模拟全局对象和方法
global.URL.createObjectURL = vi.fn()
global.URL.revokeObjectURL = vi.fn()
global.document = {
  createElement: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as unknown as Document

describe('downloadFile', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => ({
      ok: true,
      headers: new Headers({ 'Content-Type': 'image/png' }),
      blob: async () => new Blob(['mock-data']),
      clone() { return this }
    }) as Response);
    // 每个测试之前重置模拟
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'mocked-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { })
    vi.spyOn(document, 'createElement').mockImplementation(() => ({
      href: '',
      download: '',
      click: vi.fn()
    }) as unknown as HTMLAnchorElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('div'))
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('div'))
  })


  it('下载图片', async () => {
    // 模拟 fetch 响应
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'content-type': 'image/png', // 明确测试图片类型
        'content-disposition': 'attachment'
      }),
      blob: vi.fn().mockResolvedValue(new Blob(['test content'])),
      clone: function () { return this }
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    await downloadFile('https://vip.chaoyang1024.top/img/js.png', 'js.png')

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(document.createElement).toHaveBeenCalled()
    expect(document.body.appendChild).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('当fetch失败时应该抛出错误', async () => {
    // 模拟 fetch 失败
    const mockResponse = {
      ok: false,
      statusText: 'Not Found'
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    await expect(downloadFile('http://example.com/file', 'test.txt')).rejects.toThrow('无法获取文件: Not Found')
  })

  it('fetch抛出时应该抛出错误', async () => {
    // 模拟 fetch 抛出异常
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')))

    await expect(downloadFile('http://example.com/file', 'test.txt')).rejects.toThrow('Network Error')
  })

  // 测试完成后恢复全局对象和方法
  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
// 模拟全局 fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Http 类', () => {
  const baseURL = 'https://api.example.com';
  const http = new Http(baseURL);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('GET 请求成功', async () => {
    // 模拟成功响应
    const mockResponse: ApiResponse<string> = {
      code: 200,
      data: 'success',
      message: 'OK'
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await http.get<string>('/test');
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/test`,
      expect.objectContaining({ method: 'GET' })
    );
  });
  test('GET 请求应正确处理查询参数', async () => {
    const mockResponse: ApiResponse<string> = { code: 200, data: 'success', message: 'OK' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const params = { search: 'test', page: '1' };
    await http.get<string>('/search', { params });

    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/search?search=test&page=1`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('POST 请求正确处理请求体', async () => {
    const testData = { name: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 201, data: testData, message: 'Created' })
    });

    await http.post('/create', testData);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testData),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('处理 HTTP 错误状态', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ code: 404, message: 'Not Found' })
    });

    await expect(http.get('/not-found'))
      .rejects
      .toThrow('HTTP error! status: 404');
  });

  test('处理网络错误', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(http.get('/network-error'))
      .rejects
      .toThrow('Network error');
  });
  test('PUT 请求正确发送数据', async () => {
    const updateData = { id: 1, name: 'updated' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 200, data: updateData, message: 'Updated' })
    });

    await http.put('/update', updateData);
    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/update`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('DELETE 请求正确发送', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 204, message: 'Deleted' })
    });

    await http.delete('/resource/1');
    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/resource/1`,
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });
});


describe('URLSearchParamsUtils', () => {
  test('转换普通对象', () => {
    const params = { name: 'John', age: '30' };
    expect(URLSearchParamsUtils(params)).toBe('name=John&age=30');
  });

  test('处理空对象', () => {
    expect(URLSearchParamsUtils({})).toBe('');
  });

  test('处理特殊字符', () => {
    const params = { q: 'vue&react', token: 'a=1&b=2' };
    expect(URLSearchParamsUtils(params))
      .toBe('q=vue%26react&token=a%3D1%26b%3D2');
  });

  test('处理数字和布尔值', () => {
    const params = { id: 123, active: true };
    expect(URLSearchParamsUtils(params))
      .toBe('id=123&active=true');
  });

  test('处理数组值', () => {
    const params = {
      tags: ['vue', 'react'],
      ids: [1, 2, 3],
    };

    expect(URLSearchParamsUtils(params))
      .toBe('tags=vue&tags=react&ids=1&ids=2&ids=3');
  });
});