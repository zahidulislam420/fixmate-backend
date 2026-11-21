import { Request } from 'express';

export function getParamId(req: Request, paramName = 'id'): string {
  const val = req.params[paramName];
  if (Array.isArray(val)) {
    return val[0] || '';
  }
  return typeof val === 'string' ? val : '';
}
