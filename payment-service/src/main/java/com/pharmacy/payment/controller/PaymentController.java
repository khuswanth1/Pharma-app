package com.pharmacy.payment.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import com.pharmacy.common.ApiResponse;
import com.pharmacy.common.PaymentStatus;
import com.pharmacy.payment.dto.PaymentOrderRequest;
import com.pharmacy.payment.dto.PaymentOrderResponse;
import com.pharmacy.payment.dto.PaymentVerificationRequest;
import com.pharmacy.payment.entity.PaymentEntity;
import com.pharmacy.payment.service.PaymentService;
import com.razorpay.RazorpayException;

/**
 * REST Controller — Payment Service
 *
 * Base path  : /api/payments
 * Routes via : API Gateway (port 8089) → Payment Service (port 8085)
 *
 * POST /api/payments/create-order   — create Razorpay order (UPI, Card, Wallet, PayLater)
 * POST /api/payments/verify         — verify HMAC-SHA256 signature → mark SUCCESS/FAILED
 * GET  /api/payments                — list all payment records (admin)
 */
@Tag(name = "Payment Service", description = "Razorpay payment gateway integration — supports UPI, Cards, Wallets, PayLater, and COD")
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    // =========================================================================
    // POST /api/payments/create-order
    //
    // Body     : { "orderId": "101", "amount": 49900, "paymentMethod": "UPI" }
    //            amount is in paise. paymentMethod is optional (default RAZORPAY).
    //            Use paymentMethod=COD to skip Razorpay and record a COD payment.
    // Response : ApiResponse<{ razorpayOrderId, keyId, amount, currency }>
    // =========================================================================
    @Operation(
        summary = "Create Payment Order",
        description = "Creates a Razorpay order for online payments (UPI/Card/Wallet/PayLater). " +
                      "Pass paymentMethod=COD to record a Cash on Delivery order without Razorpay."
    )
    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> createOrder(
            @Valid @RequestBody PaymentOrderRequest request) throws RazorpayException {

        log.info("create-order | orderId={} amount={} method={}",
                request.getOrderId(), request.getAmount(), request.getPaymentMethod());

        PaymentOrderResponse resp = paymentService.createOrder(request);

        return ResponseEntity.ok(ApiResponse.ok("Razorpay order created", resp));
    }

    // =========================================================================
    // POST /api/payments/verify
    //
    // Body     : { "razorpayOrderId": "...", "razorpayPaymentId": "...", "razorpaySignature": "..." }
    // Response : ApiResponse<{ "status": "SUCCESS" | "FAILED" }>
    // =========================================================================
    @Operation(
        summary = "Verify Payment Signature",
        description = "Verifies the Razorpay HMAC-SHA256 signature returned after payment. " +
                      "Updates the payment record status to SUCCESS or FAILED."
    )
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyPayment(
            @Valid @RequestBody PaymentVerificationRequest request) {

        log.info("verify | razorpayOrderId={}", request.getRazorpayOrderId());

        PaymentStatus status = paymentService.verifyPayment(request);

        Map<String, String> result = new HashMap<>();
        result.put("status", status.name());   // "SUCCESS" or "FAILED"

        return ResponseEntity.ok(ApiResponse.ok("Payment verification complete", result));
    }

    // =========================================================================
    // GET /api/payments
    // Returns all payment records — useful for admin/debug via Swagger
    // =========================================================================
    @Operation(summary = "List All Payments", description = "Returns all payment records stored in the database.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentEntity>>> getAllPayments() {
        return ResponseEntity.ok(ApiResponse.ok("Payments", paymentService.getAllPayments()));
    }

    @Operation(summary = "Get Payment by ID", description = "Fetch a specific payment record by its system generated UUID.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentEntity>> getPaymentById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Payment found", paymentService.getPaymentById(id)));
    }

    @Operation(summary = "Get Payment by Order ID", description = "Fetch a specific payment record by its original order ID.")
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentEntity>> getPaymentByOrderId(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.ok("Payment found", paymentService.getPaymentByOrderId(orderId)));
    }

    @Operation(summary = "Update Payment Status", description = "Manually update the payment status (PENDING, SUCCESS, FAILED) of a transaction.")
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PaymentEntity>> updatePaymentStatus(
            @PathVariable String id,
            @RequestParam PaymentStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Payment status updated", paymentService.updatePaymentStatus(id, status)));
    }

    // =========================================================================
    // Validation error handler — returns 400 with field-level messages
    // =========================================================================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ApiResponse.fail("Validation failed: " + errors));
    }

    // =========================================================================
    // Razorpay-specific error handler
    // =========================================================================
    @ExceptionHandler(RazorpayException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleRazorpay(RazorpayException ex) {
        log.error("Razorpay error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiResponse.fail("Razorpay error: " + ex.getMessage()));
    }
}
