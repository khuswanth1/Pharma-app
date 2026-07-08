package com.pharmacy.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner updateDatabaseSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN picture LONGTEXT;");
                System.out.println("Database schema updated: users.picture column set to LONGTEXT.");
            } catch (Exception e) {
                System.err.println("Failed to modify users.picture column: " + e.getMessage());
            }
        };
    }
}
