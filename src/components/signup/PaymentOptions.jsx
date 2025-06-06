import React from "react";
import PaymentCard from "./PaymentCard";

export default function PaymentOptions({
  paymentFrequency,
  onPaymentFrequencyChange,
  costs,
  formatCurrency,
  getMonthlyCost,
  getQuarterlyCost,
  getAnnualCost,
  iceCodeValid,
  marcellusStyle
}) {
  // Payment options configuration
  const paymentOptions = [
    {
      frequency: "monthly",
      title: "Monthly",
      price: costs ? costs.finalMonthlyCost : getMonthlyCost(),
      period: "per month",
      discountAmount: costs?.discountAmount || 0,
      hasDiscount: costs && costs.discountAmount > 0 && iceCodeValid
    },
    {
      frequency: "quarterly",
      title: "Quarterly",
      price: costs ? costs.finalQuarterlyCost : getQuarterlyCost(),
      period: "every 3 months",
      discountAmount: costs?.discountAmount || 0,
      hasDiscount: costs && costs.discountAmount > 0 && iceCodeValid
    },
    {
      frequency: "annually",
      title: "Annual",
      price: costs ? costs.finalAnnualCost : getAnnualCost(),
      period: "per year",
      discountAmount: costs?.discountAmount || 0,
      hasDiscount: costs && costs.discountAmount > 0 && iceCodeValid
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {paymentOptions.map((option) => (
        <PaymentCard
          key={option.frequency}
          frequency={option.frequency}
          title={option.title}
          price={option.price}
          period={option.period}
          isSelected={paymentFrequency === option.frequency}
          discountAmount={option.discountAmount}
          hasDiscount={option.hasDiscount}
          onClick={() => onPaymentFrequencyChange(option.frequency)}
          marcellusStyle={marcellusStyle}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
}