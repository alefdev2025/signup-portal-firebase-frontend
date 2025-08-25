// PaymentHistoryList.js
import React from 'react';

const PaymentHistoryList = ({ 
  payments = [],
  filteredPayments = [],
  selectedYear = 'All',
  availableYears = [],
  expandedPayments = new Set(),
  onYearChange,
  onExportPayments,
  onTogglePaymentExpansion,
  formatDate,
  formatCurrency,
  renderInvoiceDetails
}) => {
  
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Payment History</h2>
        </div>
        <div className="hidden sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 md:gap-4">
          <select 
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-xs sm:text-sm 2xl:text-base border border-[#6b5b7e] focus:border-[#4a4266] bg-white appearance-none bg-no-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5b7e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              paddingRight: '2.5rem'
            }}
          >
            <option value="All">All Payments</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button 
            onClick={onExportPayments}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border border-[#6b5b7e] rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm 2xl:text-base font-medium"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="text-center py-6 sm:py-8 md:py-12 2xl:py-16">
          <p className="text-gray-700 text-sm sm:text-base md:text-lg 2xl:text-xl font-normal">
            No payments found {selectedYear !== 'All' ? `for ${selectedYear}` : ''}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile view - MATCHING INVOICE STYLE */}
          <div className="sm:hidden">
            {/* Mobile Table Header */}
            <div className="border-b border-gray-200 mx-2 rounded-t-lg">
              <div className="px-4 py-2">
                <div className="flex justify-between text-xs text-[#6b5b7e]" style={{ fontWeight: '700' }}>
                  <div className="w-[15%]" style={{ fontWeight: '700' }}>Status</div>
                  <div className="w-[20%] text-center" style={{ fontWeight: '700' }}>Pay #</div>
                  <div className="w-[30%] text-center" style={{ fontWeight: '700' }}>Date</div>
                  <div className="w-[35%] text-right" style={{ fontWeight: '700' }}>Amount</div>
                </div>
              </div>
            </div>

            {/* Mobile Payment List */}
            <div className="divide-y divide-gray-100 mx-2 mb-2">
              {filteredPayments.map((payment) => {
                const isExpanded = expandedPayments.has(payment.id);
                const hasAppliedInvoices = payment.appliedTo && payment.appliedTo.length > 0;
                
                return (
                  <div key={payment.id}>
                    <div 
                      className={`relative px-4 py-4 hover:bg-gray-50 transition-all duration-200 ${hasAppliedInvoices ? 'cursor-pointer' : ''}`}
                      onClick={() => hasAppliedInvoices && onTogglePaymentExpansion(payment.id)}
                    >
                      <div className="flex justify-between items-center">
                        {/* Status */}
                        <div className="w-[15%]">
                          <span className="text-xs text-gray-600">
                            {payment.status === 'Deposited' ? 'Done' : 
                             payment.status === 'Not Deposited' ? 'Proc' :
                             payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment' ? 'Sent' :
                             'Paid'}
                          </span>
                        </div>
                        
                        {/* Payment Number */}
                        <div className="w-[20%] text-center">
                          <span className="font-medium text-gray-900 text-xs">
                            {payment.documentNumber ? 'PYMT' + payment.documentNumber.slice(-2) : 'N/A'}
                          </span>
                        </div>
                        
                        {/* Date */}
                        <div className="w-[30%] text-center">
                          <span className="text-gray-600 text-xs">
                            {payment.date}
                          </span>
                        </div>
                        
                        {/* Amount */}
                        <div className="w-[35%] text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasAppliedInvoices && (
                              <svg 
                                className={`w-3 h-3 transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                ${payment.amount.toFixed(2)}
                              </div>
                              {payment.appliedTo && payment.appliedTo.length > 0 && (
                                <div className="text-[0.5rem] text-gray-500">
                                  {payment.appliedTo.length === 1 
                                    ? payment.appliedTo[0].transactionName
                                    : `${payment.appliedTo.length} invoices`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded payment details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                        <div className="mt-3">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-medium text-xs text-gray-900 mb-1">Payment Details</h4>
                              <div className="space-y-0.5 text-[10px]">
                                <div>
                                  <span className="text-gray-600">Payment #:</span> 
                                  <span className="text-gray-900 ml-1">{payment.documentNumber || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Description:</span> 
                                  <span className="text-gray-900 ml-1">{payment.description || 'Payment'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Method:</span> 
                                  <span className="text-gray-900 ml-1">{payment.method}</span>
                                </div>
                                {payment.unapplied > 0 && (
                                  <div>
                                    <span className="text-gray-600">Unapplied:</span> 
                                    <span className="text-gray-900 ml-1">${payment.unapplied.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {hasAppliedInvoices && (
                              <div>
                                <div className="font-medium text-xs mb-1 pt-1 border-t">Applied Invoices:</div>
                                {payment.appliedTo.map((applied, idx) => (
                                  <div key={idx} className="mb-2 last:mb-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                      <span className="font-medium text-xs">{applied.transactionName}</span>
                                      <span className="font-medium text-xs">${parseFloat(applied.amount || 0).toFixed(2)}</span>
                                    </div>
                                    {renderInvoiceDetails(applied)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Mobile buttons */}
            <div className="flex flex-col gap-2.5 mt-5 px-2">
              <select 
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-xs border border-[#6b5b7e] focus:border-[#4a4266] bg-white text-center appearance-none bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b5b7e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2rem'
                }}
              >
                <option value="All">All Payments</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button 
                onClick={onExportPayments}
                className="w-full px-2.5 py-1.5 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border border-[#6b5b7e] rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Payments</span>
              </button>
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden sm:block overflow-x-auto -mx-6 md:mx-0">
            <div className="min-w-[600px] px-6 md:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Payment #</th>
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                    <th className="text-center py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, index) => {
                    const isExpanded = expandedPayments.has(payment.id);
                    const hasAppliedInvoices = payment.appliedTo && payment.appliedTo.length > 0;
                    
                    return (
                      <React.Fragment key={payment.id}>
                        <tr 
                          className={`border-b border-gray-100 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          } ${hasAppliedInvoices ? 'payment-expandable hover:bg-gray-50' : ''}`}
                          onClick={() => hasAppliedInvoices && onTogglePaymentExpansion(payment.id)}
                        >
                          <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">{payment.date}</td>
                          <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-[#6b5b7e]">
                            {payment.documentNumber}
                          </td>
                          <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                                {payment.appliedTo && payment.appliedTo.length > 0 
                                  ? payment.appliedTo.length === 1 
                                    ? payment.appliedTo[0].transactionName 
                                    : `${payment.appliedTo.length} invoices`
                                  : 'Unapplied'}
                              </span>
                              {hasAppliedInvoices && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePaymentExpansion(payment.id);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <svg 
                                    className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-center">
                            <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                              {payment.status === 'Deposited' ? 'Completed' : 
                               payment.status === 'Not Deposited' ? 'Processing' :
                               payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment' ? 'Payment Submitted' :
                               payment.status}
                            </span>
                          </td>
                          <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-gray-900 text-right">
                            ${payment.amount.toFixed(2)}
                          </td>
                        </tr>
                        
                        {/* Expanded invoice details row */}
                        {isExpanded && hasAppliedInvoices && (
                          <tr>
                            <td colSpan="5" className="px-4 sm:px-5 md:px-6 pb-5 sm:pb-6 bg-gray-50/50">
                              <div className="mt-2.5 sm:mt-3 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                  <div>
                                    <h4 className="font-medium text-xs sm:text-sm 2xl:text-base text-gray-900 mb-1.5 sm:mb-2">Payment Details</h4>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm 2xl:text-base">
                                      <div>
                                        <span className="text-gray-600">Payment #:</span> 
                                        <span className="text-gray-900 ml-1">{payment.documentNumber || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Description:</span> 
                                        <span className="text-gray-900 ml-1">{payment.description || 'Payment'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Payment ID:</span> 
                                        <span className="text-gray-900 font-mono text-[10px] sm:text-xs 2xl:text-sm ml-1">{payment.internalId || payment.id}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Method:</span> 
                                        <span className="text-gray-900 ml-1">{payment.method}</span>
                                      </div>
                                      {payment.unapplied > 0 && (
                                        <div>
                                          <span className="text-gray-600">Unapplied:</span> 
                                          <span className="text-gray-900 ml-1">${payment.unapplied.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {hasAppliedInvoices && (
                                    <div>
                                      <h4 className="font-medium text-xs sm:text-sm 2xl:text-base text-gray-900 mb-1.5 sm:mb-2">Applied to Invoices</h4>
                                      <div className="text-xs sm:text-sm 2xl:text-base text-gray-600">
                                        {payment.appliedTo.length} invoice{payment.appliedTo.length !== 1 ? 's' : ''} totaling ${payment.appliedTo.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0).toFixed(2)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {hasAppliedInvoices && (
                                  <div>
                                    <div className="font-medium text-xs sm:text-sm 2xl:text-base mb-2.5 sm:mb-3 border-t pt-2.5 sm:pt-3">Invoice Applications:</div>
                                    {payment.appliedTo.map((applied, idx) => (
                                      <div key={idx} className="mb-3 sm:mb-4 last:mb-0 p-2.5 sm:p-3 bg-gray-50 rounded">
                                        <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                          <span className="font-medium text-xs sm:text-sm 2xl:text-base">{applied.transactionName}</span>
                                          <span className="font-medium text-xs sm:text-sm 2xl:text-base">${parseFloat(applied.amount || 0).toFixed(2)}</span>
                                        </div>
                                        {renderInvoiceDetails(applied)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentHistoryList;