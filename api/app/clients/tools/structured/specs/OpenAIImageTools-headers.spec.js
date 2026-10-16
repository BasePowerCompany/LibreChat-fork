const axios = require('axios');
const OpenAI = require('openai');
const { Readable } = require('stream');
const createOpenAIImageTools = require('../OpenAIImageTools');

jest.mock('axios');
jest.mock('openai');
jest.mock('@librechat/data-schemas', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));
const mockGetDownloadStream = jest.fn();
jest.mock('~/server/services/Files/strategies', () => ({
  getStrategyFunctions: () => ({ getDownloadStream: mockGetDownloadStream }),
}));
jest.mock('~/models', () => ({ getFiles: jest.fn() }));

const FAKE_BASE64 = 'aGVsbG8=';
const headers = { 'X-LibreChat-User-Email': 'user@example.com' };

const makeToolCall = (name, args) => ({
  id: 'call_test_123',
  name,
  args,
  type: 'tool_call',
});

describe('OpenAI image tools - request headers', () => {
  const ENV_KEYS = [
    'IMAGE_GEN_OAI_API_KEY',
    'IMAGE_GEN_OAI_BASEURL',
    'IMAGE_GEN_OAI_AZURE_API_VERSION',
    'PROXY',
  ];
  let savedEnv = {};
  const generate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    process.env.IMAGE_GEN_OAI_API_KEY = 'test-oai-key';
    process.env.IMAGE_GEN_OAI_BASEURL = 'http://litellm:4000/v1';
    generate.mockResolvedValue({ data: [{ b64_json: FAKE_BASE64 }] });
    OpenAI.mockImplementation(() => ({ images: { generate } }));
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    savedEnv = {};
  });

  it('sends the provided headers with image generation requests', async () => {
    const [imageGen] = createOpenAIImageTools({ isAgent: true, headers });

    const result = await imageGen.invoke(makeToolCall('image_gen_oai', { prompt: 'a cat' }));

    expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ defaultHeaders: headers }));
    expect(result.artifact.content[0].image_url.url).toBe(`data:image/png;base64,${FAKE_BASE64}`);
  });

  it('sends the provided headers with image edit requests', async () => {
    axios.post.mockResolvedValue({ data: { data: [{ b64_json: FAKE_BASE64 }] } });
    mockGetDownloadStream.mockResolvedValue(Readable.from([Buffer.from('image')]));
    const imageFiles = [
      {
        file_id: 'file-1',
        filepath: '/uploads/cat.png',
        filename: 'cat.png',
        type: 'image/png',
        source: 'local',
      },
    ];
    const [, imageEdit] = createOpenAIImageTools({
      isAgent: true,
      headers,
      imageFiles,
      req: { user: { id: 'user-1' } },
    });

    await imageEdit.invoke(
      makeToolCall('image_edit_oai', { prompt: 'make it orange', image_ids: ['file-1'] }),
    );

    expect(axios.post).toHaveBeenCalledWith(
      '/images/edits',
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          ...headers,
          Authorization: 'Bearer test-oai-key',
        }),
      }),
    );
  });

  it('does not set default headers when none are provided', async () => {
    const [imageGen] = createOpenAIImageTools({ isAgent: true });

    await imageGen.invoke(makeToolCall('image_gen_oai', { prompt: 'a cat' }));

    expect(OpenAI.mock.calls[0][0]).not.toHaveProperty('defaultHeaders');
  });
});
