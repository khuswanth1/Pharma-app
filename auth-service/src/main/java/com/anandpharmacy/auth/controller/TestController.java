package com.anandpharmacy.auth.controller;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/hello")
@Tag(name = "hello", description = "Sample hello world application")
public class TestController {

    @Operation(summary = "Just to test the sample test api of My App Service")
    @RequestMapping(method = RequestMethod.GET, value = "/test")
    public String test() {
        return "Hello to check Swagger UI";
    }

    @ResponseStatus(HttpStatus.OK)
    @RequestMapping(value = "/test1", method = GET)
    @Operation(summary = "My App Service get test1 API")
    public String test1() {
        System.out.println("Testing");
        if (true) {
            return "Tanuj";
        }
        return "Gupta";
    }
}
