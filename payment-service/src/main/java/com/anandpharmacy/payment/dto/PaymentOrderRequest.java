package com.anandpharmacy.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request body for POST /api/payments/create-order
 *
 * paymentMethod : UPI | CARD | WALLET | PAYLATER | COD | RAZORPAY
 *                 Defaults to RAZORPAY when not supplied.
 */
public class PaymentOrderRequest {

    @NotBlank(message = "orderId is required")
    private String orderId;

    @Positive(message = "amount must be positive")
    private long amount; // in paise (e.g. 49900 = ₹499)

    /** Optional – client passes the chosen payment method for record keeping. */
    private String paymentMethod = "RAZORPAY";

    public String getOrderId()               { return orderId; }
    public void   setOrderId(String orderId) { this.orderId = orderId; }

    public long   getAmount()                { return amount; }
    public void   setAmount(long amount)     { this.amount = amount; }

    public String getPaymentMethod()                     { return paymentMethod; }
    public void   setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
