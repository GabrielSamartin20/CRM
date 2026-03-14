import { createHmac, timingSafeEqual } from 'node:crypto';

export const computeMetaSignature = (rawBody: string, appSecret: string): string => {
  return `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
};

export const verifyMetaSignature = (rawBody: string, signatureHeader: string | undefined, appSecret: string): boolean => {
  if (!signatureHeader) {
    return false;
  }
  const expected = computeMetaSignature(rawBody, appSecret);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};
