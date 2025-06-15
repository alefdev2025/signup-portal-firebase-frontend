// __tests__/services/netsuite/payments.test.js
import { postPayment, getPaymentStatus } from '../../../services/netsuite/payments';

global.fetch = jest.fn();

describe('NetSuite Payment Services', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('postPayment', () => {
    it('should post payment successfully', async () => {
      const paymentData = {
        customerId: '4666',
        invoiceId: '12345',
        amount: 100.00,
        paymentMethod: 'credit_card'
      };

      const mockResponse = {
        success: true,
        data: {
          paymentId: 'PAY001',
          status: 'completed',
          amount: 100.00
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await postPayment(paymentData);

      expect(fetch).toHaveBeenCalledWith(
        'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/netsuite/payments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        }
      );

      expect(result).toEqual({
        success: true,
        payment: mockResponse.data
      });
    });

    it('should handle payment errors', async () => {
      const paymentData = {
        customerId: '4666',
        invoiceId: '12345',
        amount: 100.00
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid payment data' })
      });

      await expect(postPayment(paymentData)).rejects.toThrow('Invalid payment data');
    });
  });

  describe('getPaymentStatus', () => {
    it('should fetch payment status successfully', async () => {
      const mockStatus = {
        success: true,
        data: {
          paymentId: 'PAY001',
          status: 'completed',
          completedAt: '2023-12-01T10:00:00Z'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });

      const result = await getPaymentStatus('PAY001');

      expect(fetch).toHaveBeenCalledWith(
        'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/netsuite/payments/PAY001/status',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        status: mockStatus.data
      });
    });
  });
});