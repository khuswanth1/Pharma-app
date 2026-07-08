package com.pharmacy.auth.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.pharmacy.auth.entity.Address;
import com.pharmacy.auth.repo.AddressRepository;
import com.pharmacy.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth/addresses")
@Tag(name = "Address Management", description = "Manage delivery addresses for users")
public class AddressController {

    private final AddressRepository addressRepository;

    public AddressController(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "List all addresses for a user")
    public ApiResponse<List<Address>> getAddressesByUserId(@PathVariable String userId) {
        return ApiResponse.ok("User addresses retrieved successfully", addressRepository.findByUserId(userId));
    }

    @PostMapping
    @Operation(summary = "Add a new address")
    public ApiResponse<Address> createAddress(@RequestBody Address address) {
        List<Address> existing = addressRepository.findByUserId(address.getUserId());
        if (existing.isEmpty()) {
            address.setPrimary(true);
        } else if (address.isPrimary()) {
            for (Address old : existing) {
                if (old.isPrimary()) {
                    old.setPrimary(false);
                    addressRepository.save(old);
                }
            }
        }
        return ApiResponse.ok("Address added successfully", addressRepository.save(address));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an address")
    public ApiResponse<Address> updateAddress(@PathVariable Long id, @RequestBody Address details) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Address not found with id: " + id));

        address.setTypeTag(details.getTypeTag());
        address.setFlat(details.getFlat());
        address.setBuilding(details.getBuilding());
        address.setLandmark(details.getLandmark());
        address.setFullText(details.getFullText());
        address.setReceiverName(details.getReceiverName());
        address.setPhone(details.getPhone());
        address.setLat(details.getLat());
        address.setLng(details.getLng());

        if (details.isPrimary() && !address.isPrimary()) {
            List<Address> existing = addressRepository.findByUserId(address.getUserId());
            for (Address old : existing) {
                if (old.isPrimary()) {
                    old.setPrimary(false);
                    addressRepository.save(old);
                }
            }
            address.setPrimary(true);
        }

        return ApiResponse.ok("Address updated successfully", addressRepository.save(address));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an address")
    public ApiResponse<Void> deleteAddress(@PathVariable Long id) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Address not found with id: " + id));

        boolean wasPrimary = address.isPrimary();
        String userId = address.getUserId();

        addressRepository.delete(address);

        if (wasPrimary) {
            List<Address> remaining = addressRepository.findByUserId(userId);
            if (!remaining.isEmpty()) {
                Address nextPrimary = remaining.get(0);
                nextPrimary.setPrimary(true);
                addressRepository.save(nextPrimary);
            }
        }

        return ApiResponse.ok("Address deleted successfully", null);
    }

    @PutMapping("/primary/{id}/user/{userId}")
    @Operation(summary = "Set primary address for a user")
    public ApiResponse<Void> setPrimaryAddress(@PathVariable Long id, @PathVariable String userId) {
        List<Address> existing = addressRepository.findByUserId(userId);
        boolean found = false;

        for (Address addr : existing) {
            if (addr.getId().equals(id)) {
                addr.setPrimary(true);
                found = true;
            } else {
                addr.setPrimary(false);
            }
            addressRepository.save(addr);
        }

        if (!found) {
            throw new IllegalArgumentException("Address not found with id: " + id + " for user: " + userId);
        }

        return ApiResponse.ok("Primary address set successfully", null);
    }
}
