// __tests__/services/netsuite/payments.test.js
import { 
    getCustomerPayments, 
    getPaymentDetails, 
    getPaymentSummary,
    getCustomerCredits,
    getCustomerPaymentMethods,
    exportPaymentsToCSV 
  } from '../../../services/netsuite/payments';
  
  global.fetch = jest.fn();
  
  // Mock window.URL for CSV export tests
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
  
  describe('NetSuite Payment Services', () => {
    beforeEach(() => {
      fetch.mockClear();
      jest.clearAllMocks();
    });
  
    describe('getCustomerPayments', () => {
      it('should fetch customer payments successfully', async () => {
        const mockResponse = {
          success: true,
          data: [
            {
              id: '264825',
              internalId: '264825',
              recordType: 'customerpayment',
              documentNumber: 'PYMT3630',
              date: '7/14/2024',
              amount: 660,
              status: 'Deposited',
              memo: '',
              currency: 'USA',
              account: '1080 Undeposited Funds',
              paymentMethod: 'Link to Pay',
              appliedTo: [
                {
                  transactionId: '252321',
                  transactionName: 'INV5148',
                  amount: 660
                }
              ],
              creditCard: null,
              unapplied: 0
            }
          ],
          count: 1,
          totalCount: 1,
          customerId: '4527',
          pagination: {
            offset: 0,
            limit: 50,
            hasMore: false
          }
        };
  
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
  
        const result = await getCustomerPayments('4527', { limit: 50 });
  
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/customers/4527/payments?limit=50&offset=0'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );
  
        expect(result.success).toBe(true);
        expect(result.payments).toHaveLength(1);
        expect(result.payments[0].amount).toBe(660);
        expect(result.payments[0].isFullyApplied).toBe(true);
        expect(result.customerId).toBe('4527');
      });
  
      it('should handle query parameters correctly', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] })
        });
  
        await getCustomerPayments('4527', {
          limit: 25,
          offset: 10,
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
          invoiceId: 'INV123'
        });
  
        const url = fetch.mock.calls[0][0];
        expect(url).toContain('limit=25');
        expect(url).toContain('offset=10');
        expect(url).toContain('dateFrom=2024-01-01');
        expect(url).toContain('dateTo=2024-12-31');
        expect(url).toContain('invoiceId=INV123');
      });
  
      it('should handle API errors gracefully', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' })
        });
  
        await expect(getCustomerPayments('4527')).rejects.toThrow('Internal server error');
      });
  
      it('should handle timeout errors', async () => {
        fetch.mockImplementationOnce(() => 
          new Promise((resolve) => setTimeout(resolve, 60000))
        );
  
        await expect(getCustomerPayments('4527')).rejects.toThrow('NetSuite request timed out');
      });
    });
  
    describe('getPaymentDetails', () => {
      it('should fetch payment details successfully', async () => {
        const mockPayment = {
          success: true,
          data: {
            id: '264825',
            documentNumber: 'PYMT3630',
            amount: 660,
            unapplied: 0,
            status: 'Deposited',
            appliedInvoices: [
              {
                invoiceId: '252321',
                invoiceNumber: 'INV5148',
                originalAmount: 660,
                amountDue: 0,
                amountApplied: 660
              }
            ]
          }
        };
  
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockPayment
        });
  
        const result = await getPaymentDetails('264825');
  
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/payments/264825'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );
  
        expect(result.success).toBe(true);
        expect(result.payment.amount).toBe(660);
        expect(result.payment.isFullyApplied).toBe(true);
        expect(result.payment.appliedInvoices).toHaveLength(1);
      });
    });
  
    describe('getPaymentSummary', () => {
      it('should fetch payment summary successfully', async () => {
        const mockSummary = {
          success: true,
          summary: {
            totalPayments: 10,
            totalAmount: 6600,
            totalUnapplied: 0,
            recentPayments: 3,
            yearPayments: 10,
            averagePaymentAmount: 660
          }
        };
  
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSummary
        });
  
        const result = await getPaymentSummary('4527');
  
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/customers/4527/payments/summary'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );
  
        expect(result.success).toBe(true);
        expect(result.summary.totalPayments).toBe(10);
        expect(result.summary.totalAmount).toBe(6600);
      });
  
      it('should fallback to calculating summary from payments on error', async () => {
        // First call fails
        fetch.mockRejectedValueOnce(new Error('Summary endpoint not available'));
  
        // Second call (getCustomerPayments) succeeds
        const mockPayments = {
          success: true,
          payments: [
            { id: '1', amount: 100, unapplied: 0, date: new Date().toISOString(), paymentMethod: 'Card' },
            { id: '2', amount: 200, unapplied: 50, date: new Date().toISOString(), paymentMethod: 'Check' }
          ]
        };
  
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockPayments
        });
  
        const result = await getPaymentSummary('4527');
  
        expect(result.success).toBe(true);
        expect(result.summary.totalPayments).toBe(2);
        expect(result.summary.totalAmount).toBe(300);
        expect(result.summary.totalUnapplied).toBe(50);
        expect(result.summary.averagePaymentAmount).toBe(150);
      });
    });
  
    describe('getCustomerCredits', () => {
      it('should fetch customer credits successfully', async () => {
        const mockCredits = {
          success: true,
          data: [
            {
              id: 'CM001',
              documentNumber: 'CM001',
              amount: 100,
              date: '2024-01-15'
            }
          ],
          count: 1
        };
  
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCredits
        });
  
        const result = await getCustomerCredits('4527');
  
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/customers/4527/credits'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );
  
        expect(result.success).toBe(true);
        expect(result.credits).toHaveLength(1);
        expect(result.customerId).toBe('4527');
      });
    });
  
    describe('getCustomerPaymentMethods', () => {
      it('should fetch customer payment methods successfully', async () => {
        const mockMethods = {
          success: true,
          data: [
            {
              paymentMethod: 'Link to Pay',
              usageCount: 5
            },
            {
              paymentMethod: 'Check',
              usageCount: 2
            }
          ],
          count: 2
        };
  
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMethods
        });
  
        const result = await getCustomerPaymentMethods('4527');
  
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/customers/4527/payment-methods'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );
  
        expect(result.success).toBe(true);
        expect(result.paymentMethods).toHaveLength(2);
        expect(result.customerId).toBe('4527');
      });
    });
  
    describe('exportPaymentsToCSV', () => {
      it('should export payments to CSV successfully', async () => {
        const mockBlob = new Blob(['payment,amount\nPYMT001,100'], { type: 'text/csv' });
        
        fetch.mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob
        });
  
        // Mock DOM elements
        const mockLink = {
          href: '',
          download: '',
          click: jest.fn()
        };
        document.createElement = jest.fn(() => mockLink);
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
  
        await exportPaymentsToCSV('4527', { dateFrom: '2024-01-01', dateTo: '2024-12-31' });
  
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/customers/4527/payments/export?format=csv&dateFrom=2024-01-01&dateTo=2024-12-31'),
          {
            method: 'GET',
            headers: {
              'Accept': 'text/csv'
            },
            credentials: 'include'
          }
        );
  
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toMatch(/^payments-4527-\d{4}-\d{2}-\d{2}\.csv$/);
      });
  
      it('should handle export errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error'
        });
  
        await expect(exportPaymentsToCSV('4527')).rejects.toThrow('Failed to export payments: Internal Server Error');
      });
    });
  });