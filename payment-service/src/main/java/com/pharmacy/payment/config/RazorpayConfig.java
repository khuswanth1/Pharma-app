package com.pharmacy.payment.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Razorpay configuration.
 *
 * Keys are read from application.yml:
 *   razorpay:
 *     key-id:     rzp_test_...
 *     key-secret: ...
 *
 * Spring maps YAML dashes to camelCase so both
 *   @Value("${razorpay.key-id}")   and
 *   @Value("${razorpay.keyId}")    work.
 */
@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    /**
     * Exposes a singleton {@link RazorpayClient} bean so every service
     * can inject it instead of constructing a new instance per request.
     */
    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        String maskedKeyId = keyId != null ? (keyId.substring(0, Math.min(keyId.length(), 12)) + "...") : "null";
        String maskedSecret = keySecret != null ? (keySecret.substring(0, Math.min(keySecret.length(), 4)) + "..." + keySecret.substring(Math.max(0, keySecret.length() - 4))) : "null";
        log.info("Initializing RazorpayClient | keyId={} | keySecret={} (length={})", maskedKeyId, maskedSecret, keySecret != null ? keySecret.length() : 0);
        return new RazorpayClient(keyId, keySecret);
    }

    /** Exposes the key-id so PaymentService can return it in responses. */
    @Bean(name = "razorpayKeyId")
    public String razorpayKeyId() {
        return keyId;
    }

    /** Exposes the key-secret so PaymentService can verify HMAC signatures. */
    @Bean(name = "razorpayKeySecret")
    public String razorpayKeySecret() {
        return keySecret;
    }
}
