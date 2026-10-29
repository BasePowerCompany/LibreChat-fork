import * as http from 'http';
import { logger } from '@librechat/data-schemas';
import { MCPConnection } from '~/mcp/connection';

jest.mock('@librechat/data-schemas', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('MCP connection failure logging', () => {
  it.each([
    { status: 401, listing: true, authenticated: false, level: 'debug' },
    { status: 500, listing: true, authenticated: false, level: 'error' },
    { status: 401, listing: false, authenticated: false, level: 'error' },
    { status: 401, listing: true, authenticated: true, level: 'error' },
  ] as const)(
    'logs $status with listing=$listing authenticated=$authenticated at $level',
    async ({ status, listing, authenticated, level }) => {
      jest.clearAllMocks();
      const server = http.createServer((_req, res) => {
        res.writeHead(status).end();
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected TCP address');
      }
      const connection = new MCPConnection({
        serverName: 'logging',
        userId: 'u1',
        serverConfig: { type: 'streamable-http', url: `http://127.0.0.1:${address.port}/mcp` },
        unauthenticatedToolListing: listing,
        oauthTokens: authenticated
          ? { access_token: 'test-token', token_type: 'Bearer', obtained_at: Date.now() }
          : null,
      });
      connection.on('oauthRequired', () =>
        connection.emit('oauthFailed', new Error('OAuth required')),
      );
      try {
        await expect(connection.connect()).rejects.toThrow();
        expect(logger[level]).toHaveBeenCalledWith(expect.stringContaining(' Connection failed'));
        if (status === 401) {
          expect(logger[level]).toHaveBeenCalledWith(
            expect.stringContaining(' OAuth handling failed'),
          );
        }
        if (level === 'debug') {
          expect(logger.error).not.toHaveBeenCalled();
        } else {
          expect(logger.debug).not.toHaveBeenCalledWith(
            expect.stringContaining(' Connection failed'),
          );
        }
      } finally {
        await connection.dispose();
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    },
  );
});
