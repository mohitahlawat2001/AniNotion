const {
  requireRole,
  requireAdmin,
  requireEditor,
  requireAnyUser,
} = require('@middleware/roleAuth');

// Helper to create mock request and response objects
const createMockReqRes = () => {
  const req = {
    path: '/test',
    method: 'GET',
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

describe('requireRole Middleware', () => {
  describe('Basic functionality', () => {
    test('should allow user with correct role', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'admin' };

      const middleware = requireRole(['admin', 'editor']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow user with one of multiple allowed roles', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'editor' };

      const middleware = requireRole(['admin', 'editor']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject user without required role', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'viewer' };

      const middleware = requireRole(['admin', 'editor']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Required role: admin or editor. Your role: viewer',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request without user object', () => {
      const { req, res, next } = createMockReqRes();
      // No req.user set

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should work with single role', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'admin' };

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Role hierarchy', () => {
    test('should allow admin for admin-only endpoint', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'admin' };

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject editor for admin-only endpoint', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'editor' };

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject viewer for admin-only endpoint', () => {
      const { req, res, next } = createMockReqRes();
      req.user = { _id: 'user123', role: 'viewer' };

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('should handle missing user gracefully', () => {
      const { req, res, next } = createMockReqRes();
      req.user = null;

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle undefined user gracefully', () => {
      const { req, res, next } = createMockReqRes();
      // req.user is undefined

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe('requireAdmin Helper', () => {
  test('should allow admin users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'admin' };

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject editor users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'editor' };

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject viewer users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'viewer' };

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireEditor Helper', () => {
  test('should allow admin users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'admin' };

    requireEditor(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should allow editor users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'editor' };

    requireEditor(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject viewer users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'viewer' };

    requireEditor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireAnyUser Helper', () => {
  test('should allow admin users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'admin' };

    requireAnyUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should allow editor users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'editor' };

    requireAnyUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should allow viewer users', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'viewer' };

    requireAnyUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject unauthenticated requests', () => {
    const { req, res, next } = createMockReqRes();
    // No req.user

    requireAnyUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Multiple role checks', () => {
  test('should handle three allowed roles', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'viewer' };

    const middleware = requireRole(['admin', 'editor', 'viewer']);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject role not in allowed list', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'guest' };

    const middleware = requireRole(['admin', 'editor', 'viewer']);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Access denied. Required role: admin or editor or viewer. Your role: guest',
    });
    expect(next).not.toHaveBeenCalled();
  });
});