package com.pharmacy.payment.service;

import java.math.BigDecimal;
import java.util.List;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.pharmacy.common.PaymentStatus;
import com.pharmacy.payment.dto.PaymentOrderRequest;
import com.pharmacy.payment.dto.PaymentOrderResponse;
import com.pharmacy.payment.dto.PaymentVerificationRequest;
import com.pharmacy.payment.entity.PaymentEntity;
import com.pharmacy.payment.repo.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private RazorpayClient razorpayClient;

    @Autowired
    private PaymentRepository repo;

    @Autowired
    @Qualifier("razorpayKeyId")
    private String keyId;

    @Autowired
    @Qualifier("razorpayKeySecret")
    private String keySecret;

    @org.springframework.beans.factory.annotation.Value("${app.auth-service-url:http://localhost:8089}")
    private String authServiceUrl;

    @org.springframework.beans.factory.annotation.Value("${app.product-service-url:http://localhost:8089}")
    private String productServiceUrl;

    // =========================================================================
    // Create a Razorpay Order + persist PaymentEntity
    // amount  : in paise (e.g. 49900 = ₹499)
    // receipt : unique string max 40 chars
    // =========================================================================
    public Order createRazorpayOrder(int amount, String receipt, String paymentMethod, String originalOrderId)
            throws RazorpayException {

        JSONObject options = new JSONObject();
        options.put("amount",   amount);    // in paise
        options.put("currency", "INR");
        options.put("receipt",  receipt);

        Order rzpOrder = razorpayClient.orders.create(options);
        String rzpOrderId = rzpOrder.get("id");

        // Persist payment record using the full untruncated originalOrderId
        PaymentEntity payment = new PaymentEntity();
        payment.setOrderId(originalOrderId);
        payment.setRazorpayOrderId(rzpOrderId);
        payment.setAmount(BigDecimal.valueOf(amount));
        payment.setCurrency("INR");
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setPaymentMethod(paymentMethod != null ? paymentMethod.toUpperCase() : "RAZORPAY");
        repo.save(payment);

        log.info("Razorpay Order Created | razorpayOrderId={} orderId={} amount={} method={}",
                rzpOrderId, originalOrderId, amount, paymentMethod);
        return rzpOrder;
    }

    // =========================================================================
    // COD — record order without calling Razorpay
    // =========================================================================
    public PaymentOrderResponse createCodOrder(PaymentOrderRequest request) {
        PaymentEntity payment = new PaymentEntity();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(BigDecimal.valueOf(request.getAmount()));
        payment.setCurrency("INR");
        payment.setPaymentStatus(PaymentStatus.PENDING); // collected on delivery
        payment.setPaymentMethod("COD");
        repo.save(payment);

        log.info("COD Order Recorded | orderId={} amount={}", request.getOrderId(), request.getAmount());

        // Return an empty razorpayOrderId — frontend knows COD needs no further action
        return new PaymentOrderResponse("COD_" + request.getOrderId(), keyId, request.getAmount(), "INR");
    }

    // =========================================================================
    // Online Payment — creates a Razorpay order and returns data for the modal
    // =========================================================================
    public PaymentOrderResponse createOrder(PaymentOrderRequest request) throws RazorpayException {
        String paymentMethod = request.getPaymentMethod();

        // COD shortcut — skip Razorpay entirely
        if ("COD".equalsIgnoreCase(paymentMethod)) {
            return createCodOrder(request);
        }

        // Build receipt ID — max 40 chars for Razorpay API
        String receiptId = request.getOrderId();
        if (receiptId.length() > 30) {
            receiptId = receiptId.substring(receiptId.length() - 30);
        }
        receiptId = "rcpt_" + receiptId;

        Order rzpOrder = createRazorpayOrder(
                (int) request.getAmount(),
                receiptId,
                paymentMethod,
                request.getOrderId()
        );

        String rzpOrderId = rzpOrder.get("id");
        log.info("PaymentOrderResponse built | razorpayOrderId={} keyId={} method={}",
                rzpOrderId, keyId, paymentMethod);

        return new PaymentOrderResponse(rzpOrderId, keyId, request.getAmount(), "INR");
    }

    @org.springframework.transaction.annotation.Transactional
    public PaymentStatus verifyPayment(PaymentVerificationRequest request) {

        PaymentEntity payment = repo.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Payment order not found: " + request.getRazorpayOrderId()));

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id",   request.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            attributes.put("razorpay_signature",  request.getRazorpaySignature());

            if ("WALLET".equalsIgnoreCase(payment.getPaymentMethod()) || "UPI".equalsIgnoreCase(payment.getPaymentMethod()) || "UPI_QR".equalsIgnoreCase(payment.getPaymentMethod())) {
                payment.setPaymentStatus(PaymentStatus.SUCCESS);
            } else {
                Utils.verifyPaymentSignature(attributes, keySecret);
                payment.setPaymentStatus(PaymentStatus.SUCCESS);
            }
            log.info("Payment Verified | paymentId={} orderId={}",
                    request.getRazorpayPaymentId(), payment.getOrderId());

            // RestTemplate to interact with other microservices
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            if (payment.getOrderId().startsWith("WLT_")) {
                // Wallet top-up transaction: atomically add to user's wallet in auth-service
                String[] parts = payment.getOrderId().split("_");
                if (parts.length >= 2) {
                    String userId = parts[1];
                    double amountRupees = payment.getAmount().doubleValue() / 100.0;
                    String authUrl = authServiceUrl + "/api/auth/wallet/" + userId + "/add";
                    
                    java.util.Map<String, Object> authReq = new java.util.HashMap<>();
                    authReq.put("amount", amountRupees);
                    
                    log.info("Wallet Update | Sending ₹{} to auth-service for user {}", amountRupees, userId);
                    restTemplate.postForObject(authUrl, authReq, java.util.Map.class);
                    log.info("Wallet Updated | Successfully topped up user {} with ₹{}", userId, amountRupees);
                }
            } else {
                // Regular product order: reduce product stock in product-service
                java.util.Map<String, Object> reqBody = new java.util.HashMap<>();
                reqBody.put("orderId", payment.getOrderId());
                String productStockUrl = productServiceUrl + "/api/products/update-stock";
                
                log.info("Inventory Updated | Triggering stock reduction for orderId={}", payment.getOrderId());
                restTemplate.postForObject(productStockUrl, reqBody, java.util.Map.class);
                log.info("Order Completed | Stock reduced successfully for orderId={}", payment.getOrderId());
            }

        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            log.warn("Payment/Inventory Failed | razorpayOrderId={} reason={}",
                    request.getRazorpayOrderId(), e.getMessage());
            throw new RuntimeException("Transaction rolled back: " + e.getMessage());
        }

        repo.save(payment);
        return payment.getPaymentStatus();
    }

    // =========================================================================
    // List all payment records (admin / debug)
    // =========================================================================
    public List<PaymentEntity> getAllPayments() {
        return repo.findAll();
    }

    public PaymentEntity getPaymentById(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found with ID: " + id));
    }

    public PaymentEntity getPaymentByOrderId(String orderId) {
        return repo.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found with order ID: " + orderId));
    }

    @org.springframework.transaction.annotation.Transactional
    public PaymentEntity updatePaymentStatus(String id, PaymentStatus newStatus) {
        PaymentEntity payment = getPaymentById(id);
        payment.setPaymentStatus(newStatus);
        
        // If updating a pending Wallet top-up to success, trigger balance update
        if (newStatus == PaymentStatus.SUCCESS && payment.getOrderId().startsWith("WLT_")) {
            String[] parts = payment.getOrderId().split("_");
            if (parts.length >= 2) {
                String userId = parts[1];
                double amountRupees = payment.getAmount().doubleValue() / 100.0;
                String authUrl = authServiceUrl + "/api/auth/wallet/" + userId + "/add";
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                java.util.Map<String, Object> authReq = new java.util.HashMap<>();
                authReq.put("amount", amountRupees);
                try {
                    restTemplate.postForObject(authUrl, authReq, java.util.Map.class);
                    log.info("Manual Wallet Update | Topped up user {} with ₹{}", userId, amountRupees);
                } catch (Exception e) {
                    log.warn("Manual Wallet Update Failed: {}", e.getMessage());
                }
            }
        }
        return repo.save(payment);
    }
}
