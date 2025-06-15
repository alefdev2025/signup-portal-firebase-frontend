// __tests__/services/netsuite/invoices.test.js
import { getCustomerInvoices, getInvoiceDetails, searchInvoices } from '../../../services/netsuite/invoices';

// Mock fetch globally
global.fetch = jest.fn();

describe('NetSuite Invoice Services', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getCustomerInvoices', () => {
    it('should fetch customer invoices successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            documentNumber: 'INV3453',
            date: '9/17/2023',
            total: '60.00',
            merchantELink: 'https://example.com/invoice/INV3453'
          }
        ],
        count: 1,
        customerId: '4666'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getCustomerInvoices('4666', { limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/netsuite/customers/4666/invoices?limit=10',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        invoices: mockResponse.data,
        count: 1,
        customerId: '4666'
      });
    });

    it('should handle errors when fetching invoices', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      await expect(getCustomerInvoices('4666')).rejects.toThrow('Internal server error');
    });

    it('should handle timeout errors', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 35000))
      );

      await expect(getCustomerInvoices('4666')).rejects.toThrow('NetSuite request timed out');
    });
  });

  describe('getInvoiceDetails', () => {
    it('should fetch invoice details successfully', async () => {
      const mockInvoice = {
        documentNumber: 'INV3453',
        date: '9/17/2023',
        total: '60.00',
        items: [
          { description: 'Membership Fee', amount: '60.00' }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockInvoice
        })
      });

      const result = await getInvoiceDetails('12345');

      expect(fetch).toHaveBeenCalledWith(
        'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/netsuite/invoices/12345',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        invoice: mockInvoice
      });
    });
  });

  describe('searchInvoices', () => {
    it('should search invoices with criteria', async () => {
      const searchCriteria = {
        status: 'open',
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31'
      };

      const mockResults = {
        success: true,
        data: [
          { documentNumber: 'INV001', total: '100.00' },
          { documentNumber: 'INV002', total: '200.00' }
        ],
        count: 2
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const result = await searchInvoices(searchCriteria);

      expect(fetch).toHaveBeenCalledWith(
        'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/netsuite/invoices/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchCriteria)
        }
      );

      expect(result).toEqual({
        success: true,
        invoices: mockResults.data,
        count: 2
      });
    });
  });
});
