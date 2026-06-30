package com.anandpharmacy.payment.dto;

public class PaymentOrderResponse {

    private String razorpayOrderId;
    private String keyId;
    private long amount;
    private String currency;

    public PaymentOrderResponse(String razorpayOrderId, String keyId, long amount, String currency) {
        this.razorpayOrderId = razorpayOrderId;
        this.keyId = keyId;
        this.amount = amount;
        this.currency = currency;
    }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getKeyId() { return keyId; }
    public long getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
